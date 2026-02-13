import {
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import {
  DriftClient,
  Wallet,
  BulkAccountLoader,
  PositionDirection,
  BASE_PRECISION,
  QUOTE_PRECISION,
  getMarketOrderParams,
  MarketType,
  OrderType,
  OrderTriggerCondition,
  getTriggerMarketOrderParams,
  convertToNumber,
  PRICE_PRECISION,
  PerpMarkets,
  BN,
  isVariant,
  getMarketsAndOraclesForSubscription,
  calculateEntryPrice,
} from "@drift-labs/sdk";
import type { IAgentRuntime } from "@elizaos/core";

// ─── Types ───────────────────────────────────────────────────────────

export interface PerpPosition {
  symbol: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  leverage: number;
  liquidationPrice: number;
  marginUsed: number;
  marketIndex: number;
}

export interface OpenPerpParams {
  symbol: string;
  direction: "LONG" | "SHORT";
  sizeUsd: number;
  leverage: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;
}

export interface ClosePerpParams {
  symbol: string;
  sizePercent?: number;
}

export interface PerpOrderResult {
  success: boolean;
  orderId?: string;
  symbol: string;
  direction: string;
  size: number;
  price: number;
  leverage: number;
  error?: string;
}

// ─── Symbol → Market Index mapping ──────────────────────────────────

function resolveMarketIndex(symbol: string, env: "devnet" | "mainnet-beta"): number | null {
  const markets = PerpMarkets[env];
  if (!markets) return null;
  const upper = symbol.toUpperCase();
  const m = markets.find(
    (mkt) =>
      mkt.baseAssetSymbol.toUpperCase() === upper ||
      mkt.symbol.toUpperCase() === `${upper}-PERP`
  );
  return m ? m.marketIndex : null;
}

// ─── Client ──────────────────────────────────────────────────────────

export class DriftPerpsClient {
  private client: DriftClient | null = null;
  private connection: Connection;
  private wallet: Wallet;
  private env: "devnet" | "mainnet-beta";
  private initialized = false;

  constructor(secretKey: Uint8Array, rpcUrl: string, env: "devnet" | "mainnet-beta" = "devnet") {
    this.env = env;
    this.connection = new Connection(rpcUrl, "confirmed");
    const keypair = Keypair.fromSecretKey(secretKey);
    this.wallet = new Wallet(keypair);
    console.log(
      `[DriftPerps] 🐔 Wallet: ${keypair.publicKey.toBase58()} (${env})`
    );
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const { perpMarketIndexes, spotMarketIndexes, oracleInfos } =
        getMarketsAndOraclesForSubscription(this.env);

      const accountLoader = new BulkAccountLoader(this.connection, "confirmed", 1000);

      this.client = new DriftClient({
        connection: this.connection,
        wallet: this.wallet,
        env: this.env,
        accountSubscription: {
          type: "polling",
          accountLoader,
        },
        perpMarketIndexes,
        spotMarketIndexes,
        oracleInfos,
      });

      await this.client.subscribe();
      this.initialized = true;
      console.log(`[DriftPerps] 🐔 Connected to Drift ${this.env}`);
    } catch (error) {
      console.error("[DriftPerps] 🐔 Failed to connect:", (error as Error).message);
      throw error;
    }
  }

  private async ensureConnected(): Promise<DriftClient> {
    if (!this.initialized || !this.client) {
      await this.initialize();
    }
    return this.client!;
  }

  /**
   * Open a perpetual futures position
   */
  async openPosition(params: OpenPerpParams): Promise<PerpOrderResult> {
    const client = await this.ensureConnected();

    try {
      const { symbol, direction, sizeUsd, leverage, stopLossPercent, takeProfitPercent } = params;
      const marketIndex = resolveMarketIndex(symbol, this.env);

      if (marketIndex === null) {
        return {
          success: false,
          symbol,
          direction,
          size: 0,
          price: 0,
          leverage,
          error: `Symbol ${symbol} not available on Drift ${this.env}`,
        };
      }

      console.log(
        `[DriftPerps] 🐔 Opening ${direction} on ${symbol} (index ${marketIndex}): $${sizeUsd} @ ${leverage}x`
      );

      // Get oracle price
      const oracleData = client.getOracleDataForPerpMarket(marketIndex);
      const price = convertToNumber(oracleData.price, PRICE_PRECISION);

      if (!price || price <= 0) {
        return {
          success: false,
          symbol,
          direction,
          size: 0,
          price: 0,
          leverage,
          error: `Could not fetch oracle price for ${symbol}`,
        };
      }

      // Calculate base asset amount
      const baseAssetAmount = new BN(
        Math.floor((sizeUsd / price) * BASE_PRECISION.toNumber())
      );

      const isBuy = direction === "LONG";
      const posDir = isBuy ? PositionDirection.LONG : PositionDirection.SHORT;

      // Place market order
      const orderParams = getMarketOrderParams({
        marketIndex,
        direction: posDir,
        baseAssetAmount,
        marketType: MarketType.PERP,
      });

      const txSig = await client.placePerpOrder(orderParams);
      console.log(`[DriftPerps] 🐔 Order tx: ${txSig}`);

      // Place stop loss if specified
      if (stopLossPercent && stopLossPercent > 0) {
        const slPrice = isBuy
          ? price * (1 - stopLossPercent / 100)
          : price * (1 + stopLossPercent / 100);

        const triggerPrice = new BN(Math.floor(slPrice * PRICE_PRECISION.toNumber()));
        const triggerCondition = isBuy
          ? OrderTriggerCondition.BELOW
          : OrderTriggerCondition.ABOVE;

        const slParams = getTriggerMarketOrderParams({
          marketIndex,
          direction: isBuy ? PositionDirection.SHORT : PositionDirection.LONG,
          baseAssetAmount,
          marketType: MarketType.PERP,
          triggerPrice,
          triggerCondition,
          reduceOnly: true,
        });

        await client.placePerpOrder(slParams);
        console.log(`[DriftPerps] 🐔 SL set at $${slPrice.toFixed(4)} (${stopLossPercent}%)`);
      }

      // Place take profit if specified
      if (takeProfitPercent && takeProfitPercent > 0) {
        const tpPrice = isBuy
          ? price * (1 + takeProfitPercent / 100)
          : price * (1 - takeProfitPercent / 100);

        const triggerPrice = new BN(Math.floor(tpPrice * PRICE_PRECISION.toNumber()));
        const triggerCondition = isBuy
          ? OrderTriggerCondition.ABOVE
          : OrderTriggerCondition.BELOW;

        const tpParams = getTriggerMarketOrderParams({
          marketIndex,
          direction: isBuy ? PositionDirection.SHORT : PositionDirection.LONG,
          baseAssetAmount,
          marketType: MarketType.PERP,
          triggerPrice,
          triggerCondition,
          reduceOnly: true,
        });

        await client.placePerpOrder(tpParams);
        console.log(`[DriftPerps] 🐔 TP set at $${tpPrice.toFixed(4)} (${takeProfitPercent}%)`);
      }

      return {
        success: true,
        orderId: txSig,
        symbol,
        direction,
        size: sizeUsd / price,
        price,
        leverage,
      };
    } catch (error) {
      const errMsg = (error as Error).message;
      console.error(`[DriftPerps] 🐔 Error opening position:`, errMsg);
      return {
        success: false,
        symbol: params.symbol,
        direction: params.direction,
        size: 0,
        price: 0,
        leverage: params.leverage,
        error: errMsg,
      };
    }
  }

  /**
   * Close a perpetual futures position
   */
  async closePosition(params: ClosePerpParams): Promise<PerpOrderResult> {
    const client = await this.ensureConnected();

    try {
      const { symbol, sizePercent = 100 } = params;
      const positions = await this.getPositions();
      const position = positions.find(
        (p) => p.symbol.toUpperCase() === symbol.toUpperCase()
      );

      if (!position) {
        return {
          success: false,
          symbol,
          direction: "CLOSE",
          size: 0,
          price: 0,
          leverage: 0,
          error: `No open position found for ${symbol}`,
        };
      }

      const closeSize = sizePercent === 100
        ? position.size
        : position.size * (sizePercent / 100);

      const isBuy = position.side === "short";
      const baseAssetAmount = new BN(
        Math.floor(closeSize * BASE_PRECISION.toNumber())
      );

      console.log(
        `[DriftPerps] 🐔 Closing ${sizePercent}% of ${symbol} (${closeSize} units)`
      );

      const orderParams = getMarketOrderParams({
        marketIndex: position.marketIndex,
        direction: isBuy ? PositionDirection.LONG : PositionDirection.SHORT,
        baseAssetAmount,
        marketType: MarketType.PERP,
        reduceOnly: true,
      });

      const txSig = await client.placePerpOrder(orderParams);

      return {
        success: true,
        orderId: txSig,
        symbol,
        direction: isBuy ? "BUY_TO_CLOSE" : "SELL_TO_CLOSE",
        size: closeSize,
        price: position.markPrice,
        leverage: position.leverage,
      };
    } catch (error) {
      const errMsg = (error as Error).message;
      console.error(`[DriftPerps] 🐔 Error closing position:`, errMsg);
      return {
        success: false,
        symbol: params.symbol,
        direction: "CLOSE",
        size: 0,
        price: 0,
        leverage: 0,
        error: errMsg,
      };
    }
  }

  /**
   * Get all open perpetual positions
   */
  async getPositions(): Promise<PerpPosition[]> {
    const client = await this.ensureConnected();

    try {
      const user = client.getUser();
      const perpPositions = user.getActivePerpPositions();
      const markets = PerpMarkets[this.env];

      return perpPositions.map((pos) => {
        const marketConfig = markets.find((m) => m.marketIndex === pos.marketIndex);
        const size = convertToNumber(pos.baseAssetAmount, BASE_PRECISION);
        const entryPrice = convertToNumber(pos.entryPrice || new BN(0), PRICE_PRECISION);

        // Get oracle price for mark
        let markPrice = entryPrice;
        try {
          const oracleData = client.getOracleDataForPerpMarket(pos.marketIndex);
          markPrice = convertToNumber(oracleData.price, PRICE_PRECISION);
        } catch {}

        const unrealizedPnl = (markPrice - entryPrice) * size;
        const pnlPercent = entryPrice > 0
          ? ((markPrice - entryPrice) / entryPrice) * 100
          : 0;

        return {
          symbol: marketConfig?.baseAssetSymbol || `PERP-${pos.marketIndex}`,
          side: size >= 0 ? ("long" as const) : ("short" as const),
          size: Math.abs(size),
          entryPrice,
          markPrice,
          unrealizedPnl,
          unrealizedPnlPercent: pnlPercent * (size >= 0 ? 1 : -1),
          leverage: 1, // Drift uses account-level leverage
          liquidationPrice: 0, // Would need separate calc
          marginUsed: 0,
          marketIndex: pos.marketIndex,
        };
      });
    } catch (error) {
      console.error(
        "[DriftPerps] 🐔 Error fetching positions:",
        (error as Error).message
      );
      return [];
    }
  }

  /**
   * Get the mark price for a symbol
   */
  async getMarkPrice(symbol: string): Promise<number | null> {
    const client = await this.ensureConnected();

    try {
      const marketIndex = resolveMarketIndex(symbol, this.env);
      if (marketIndex === null) return null;

      const oracleData = client.getOracleDataForPerpMarket(marketIndex);
      return convertToNumber(oracleData.price, PRICE_PRECISION);
    } catch (error) {
      console.error(
        `[DriftPerps] 🐔 Error fetching price for ${symbol}:`,
        (error as Error).message
      );
      return null;
    }
  }

  /**
   * Get account summary
   */
  async getAccountSummary(): Promise<Record<string, unknown>> {
    const client = await this.ensureConnected();

    try {
      const user = client.getUser();
      return {
        accountValue: convertToNumber(user.getNetUsdValue(), QUOTE_PRECISION),
        freeCollateral: convertToNumber(user.getFreeCollateral(), QUOTE_PRECISION),
        totalCollateral: convertToNumber(user.getTotalCollateral(), QUOTE_PRECISION),
        unrealizedPnl: convertToNumber(user.getUnrealizedPNL(true), QUOTE_PRECISION),
        leverage: convertToNumber(user.getLeverage(), new BN(10000)),
      };
    } catch (error) {
      console.error(
        "[DriftPerps] 🐔 Error fetching account summary:",
        (error as Error).message
      );
      return {};
    }
  }

  /**
   * Initialize user account on Drift (first-time setup)
   */
  async initializeUserAccount(): Promise<string | null> {
    const client = await this.ensureConnected();
    try {
      const [txSig] = await client.initializeUserAccount(0, "ChickenBuffett");
      console.log(`[DriftPerps] 🐔 User account initialized: ${txSig}`);
      return txSig;
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes("already in use")) {
        console.log("[DriftPerps] 🐔 User account already exists");
        return null;
      }
      throw error;
    }
  }

  get walletPublicKey(): string {
    return this.wallet.publicKey.toBase58();
  }
}

// ─── Factory ─────────────────────────────────────────────────────────

let clientInstance: DriftPerpsClient | null = null;

export function getDriftClient(
  runtime: IAgentRuntime
): DriftPerpsClient | null {
  if (clientInstance) return clientInstance;

  const secretKeyStr =
    runtime.getSetting("DRIFT_PRIVATE_KEY") ||
    process.env.DRIFT_PRIVATE_KEY;

  if (!secretKeyStr) {
    console.warn("[DriftPerps] 🐔 No DRIFT_PRIVATE_KEY set — trading disabled");
    return null;
  }

  // Support both JSON array format and base58
  let secretKey: Uint8Array;
  try {
    if (secretKeyStr.startsWith("[")) {
      secretKey = new Uint8Array(JSON.parse(secretKeyStr));
    } else {
      // base58 encoded
      const bs58chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
      let num = BigInt(0);
      for (const c of secretKeyStr) {
        num = num * 58n + BigInt(bs58chars.indexOf(c));
      }
      const hex = num.toString(16).padStart(128, "0");
      secretKey = new Uint8Array(hex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
    }
  } catch {
    console.error("[DriftPerps] 🐔 Invalid DRIFT_PRIVATE_KEY format");
    return null;
  }

  const rpcUrl =
    runtime.getSetting("SOLANA_RPC_URL") ||
    process.env.SOLANA_RPC_URL ||
    "https://api.devnet.solana.com";

  const isDevnet =
    String(
      runtime.getSetting("DRIFT_DEVNET") ?? process.env.DRIFT_DEVNET ?? "true"
    ) !== "false";

  clientInstance = new DriftPerpsClient(
    secretKey,
    rpcUrl,
    isDevnet ? "devnet" : "mainnet-beta"
  );
  return clientInstance;
}
