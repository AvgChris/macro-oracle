import { Hyperliquid } from "hyperliquid";
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
}

export interface OpenPerpParams {
  symbol: string;
  direction: "LONG" | "SHORT";
  sizeUsd: number;
  leverage: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;
  slippage?: number;
}

export interface ClosePerpParams {
  symbol: string;
  sizePercent?: number; // 100 = full close, 50 = half, etc.
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

// ─── Client ──────────────────────────────────────────────────────────

export class HyperliquidPerpsClient {
  private sdk: Hyperliquid;
  private isTestnet: boolean;
  private initialized: boolean = false;

  constructor(privateKey: string, testnet: boolean = true) {
    this.isTestnet = testnet;
    this.sdk = new Hyperliquid({
      privateKey,
      testnet,
      walletAddress: undefined,
    });
  }

  /**
   * Initialize the SDK connection
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.sdk.connect();
      this.initialized = true;
      console.log(
        `[HyperliquidPerps] 🐔 Connected to ${this.isTestnet ? "TESTNET" : "MAINNET"}`
      );
    } catch (error) {
      console.error(
        "[HyperliquidPerps] 🐔 Failed to connect:",
        (error as Error).message
      );
      throw error;
    }
  }

  /**
   * Ensure SDK is ready
   */
  private async ensureConnected(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Open a perpetual futures position
   */
  async openPosition(params: OpenPerpParams): Promise<PerpOrderResult> {
    await this.ensureConnected();

    try {
      const { symbol, direction, sizeUsd, leverage, stopLossPercent, takeProfitPercent } = params;
      const isBuy = direction === "LONG";

      console.log(
        `[HyperliquidPerps] 🐔 Opening ${direction} on ${symbol}: $${sizeUsd} @ ${leverage}x`
      );

      // Set leverage for the symbol
      await this.setLeverage(symbol, leverage);

      // Get current price for the symbol
      const price = await this.getMarkPrice(symbol);
      if (!price) {
        return {
          success: false,
          symbol,
          direction,
          size: 0,
          price: 0,
          leverage,
          error: `Could not fetch mark price for ${symbol}`,
        };
      }

      // Calculate position size in asset units
      const sizeInAsset = sizeUsd / price;

      // Place market order
      const orderResult = await this.sdk.exchange.placeOrder({
        coin: symbol,
        is_buy: isBuy,
        sz: parseFloat(sizeInAsset.toFixed(6)),
        limit_px: isBuy
          ? parseFloat((price * 1.005).toFixed(6)) // 0.5% slippage for buy
          : parseFloat((price * 0.995).toFixed(6)), // 0.5% slippage for sell
        order_type: { limit: { tif: "Ioc" } }, // Immediate-or-cancel (market-like)
        reduce_only: false,
      });

      console.log(
        `[HyperliquidPerps] 🐔 Order placed:`,
        JSON.stringify(orderResult)
      );

      // Place stop loss if specified
      if (stopLossPercent && stopLossPercent > 0) {
        const slPrice = isBuy
          ? price * (1 - stopLossPercent / 100)
          : price * (1 + stopLossPercent / 100);

        await this.sdk.exchange.placeOrder({
          coin: symbol,
          is_buy: !isBuy, // Opposite direction to close
          sz: parseFloat(sizeInAsset.toFixed(6)),
          limit_px: parseFloat(slPrice.toFixed(6)),
          order_type: {
            trigger: {
              triggerPx: parseFloat(slPrice.toFixed(6)),
              isMarket: true,
              tpsl: "sl",
            },
          },
          reduce_only: true,
        });

        console.log(
          `[HyperliquidPerps] 🐔 Stop loss set at $${slPrice.toFixed(2)} (${stopLossPercent}%)`
        );
      }

      // Place take profit if specified
      if (takeProfitPercent && takeProfitPercent > 0) {
        const tpPrice = isBuy
          ? price * (1 + takeProfitPercent / 100)
          : price * (1 - takeProfitPercent / 100);

        await this.sdk.exchange.placeOrder({
          coin: symbol,
          is_buy: !isBuy,
          sz: parseFloat(sizeInAsset.toFixed(6)),
          limit_px: parseFloat(tpPrice.toFixed(6)),
          order_type: {
            trigger: {
              triggerPx: parseFloat(tpPrice.toFixed(6)),
              isMarket: true,
              tpsl: "tp",
            },
          },
          reduce_only: true,
        });

        console.log(
          `[HyperliquidPerps] 🐔 Take profit set at $${tpPrice.toFixed(2)} (${takeProfitPercent}%)`
        );
      }

      return {
        success: true,
        orderId:
          (orderResult as any)?.response?.data?.statuses?.[0]?.resting?.oid ??
          `order-${Date.now()}`,
        symbol,
        direction,
        size: sizeInAsset,
        price,
        leverage,
      };
    } catch (error) {
      const errMsg = (error as Error).message;
      console.error(
        `[HyperliquidPerps] 🐔 Error opening position:`,
        errMsg
      );
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
    await this.ensureConnected();

    try {
      const { symbol, sizePercent = 100 } = params;

      // Get current position
      const positions = await this.getPositions();
      const position = positions.find(
        (p) => p.symbol.toUpperCase() === symbol.toUpperCase()
      );

      if (!position) {
        return {
          success: false,
          symbol,
          direction: "N/A",
          size: 0,
          price: 0,
          leverage: 0,
          error: `No open position found for ${symbol}`,
        };
      }

      const closeSize =
        sizePercent === 100
          ? position.size
          : position.size * (sizePercent / 100);

      const isBuy = position.side === "short"; // Opposite to close
      const price = position.markPrice;

      console.log(
        `[HyperliquidPerps] 🐔 Closing ${sizePercent}% of ${symbol} position (${closeSize} units)`
      );

      const orderResult = await this.sdk.exchange.placeOrder({
        coin: symbol,
        is_buy: isBuy,
        sz: parseFloat(Math.abs(closeSize).toFixed(6)),
        limit_px: isBuy
          ? parseFloat((price * 1.005).toFixed(6))
          : parseFloat((price * 0.995).toFixed(6)),
        order_type: { limit: { tif: "Ioc" } },
        reduce_only: true,
      });

      console.log(
        `[HyperliquidPerps] 🐔 Close order placed:`,
        JSON.stringify(orderResult)
      );

      return {
        success: true,
        orderId: `close-${Date.now()}`,
        symbol,
        direction: isBuy ? "BUY_TO_CLOSE" : "SELL_TO_CLOSE",
        size: closeSize,
        price,
        leverage: position.leverage,
      };
    } catch (error) {
      const errMsg = (error as Error).message;
      console.error(
        `[HyperliquidPerps] 🐔 Error closing position:`,
        errMsg
      );
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
    await this.ensureConnected();

    try {
      const userState = await this.sdk.info.perpetuals.getClearinghouseState(
        await this.getWalletAddress()
      );

      if (!userState?.assetPositions) {
        return [];
      }

      return userState.assetPositions
        .filter((ap: Record<string, unknown>) => {
          const pos = ap.position as Record<string, unknown>;
          return pos && parseFloat(String(pos.szi || "0")) !== 0;
        })
        .map((ap: Record<string, unknown>) => {
          const pos = ap.position as Record<string, unknown>;
          const size = parseFloat(String(pos.szi || "0"));
          const entryPrice = parseFloat(String(pos.entryPx || "0"));
          const markPrice = parseFloat(String(pos.positionValue || "0")) / Math.abs(size || 1);
          const unrealizedPnl = parseFloat(String(pos.unrealizedPnl || "0"));
          const leverage = parseFloat(String(((pos as any).leverage as any)?.value || "1"));

          return {
            symbol: String(pos.coin || ""),
            side: size > 0 ? ("long" as const) : ("short" as const),
            size: Math.abs(size),
            entryPrice,
            markPrice,
            unrealizedPnl,
            unrealizedPnlPercent:
              entryPrice > 0
                ? ((markPrice - entryPrice) / entryPrice) *
                  100 *
                  (size > 0 ? 1 : -1)
                : 0,
            leverage,
            liquidationPrice: parseFloat(String(pos.liquidationPx || "0")),
            marginUsed: parseFloat(String(pos.marginUsed || "0")),
          };
        });
    } catch (error) {
      console.error(
        "[HyperliquidPerps] 🐔 Error fetching positions:",
        (error as Error).message
      );
      return [];
    }
  }

  /**
   * Get the mark price for a symbol
   */
  async getMarkPrice(symbol: string): Promise<number | null> {
    await this.ensureConnected();

    try {
      const allMids = await (this.sdk.info.perpetuals as any).getAllMids();
      const price = allMids[symbol.toUpperCase()];
      return price ? parseFloat(String(price)) : null;
    } catch (error) {
      console.error(
        `[HyperliquidPerps] 🐔 Error fetching price for ${symbol}:`,
        (error as Error).message
      );
      return null;
    }
  }

  /**
   * Set leverage for a symbol
   */
  async setLeverage(symbol: string, leverage: number): Promise<void> {
    await this.ensureConnected();

    try {
      await (this.sdk.exchange as any).updateLeverage({
        coin: symbol,
        leverage,
        is_cross: true, // Use cross margin
      });
      console.log(
        `[HyperliquidPerps] 🐔 Leverage set to ${leverage}x for ${symbol}`
      );
    } catch (error) {
      console.error(
        `[HyperliquidPerps] 🐔 Error setting leverage:`,
        (error as Error).message
      );
    }
  }

  /**
   * Get the wallet address from the SDK
   */
  private async getWalletAddress(): Promise<string> {
    // The SDK derives the wallet address from the private key
    return (this.sdk as unknown as Record<string, unknown>).walletAddress as string || "";
  }

  /**
   * Get account summary (balance, margin, etc.)
   */
  async getAccountSummary(): Promise<Record<string, unknown>> {
    await this.ensureConnected();

    try {
      const walletAddress = await this.getWalletAddress();
      const state = await this.sdk.info.perpetuals.getClearinghouseState(walletAddress);
      return {
        accountValue: state?.marginSummary?.accountValue,
        totalMarginUsed: state?.marginSummary?.totalMarginUsed,
        totalNtlPos: state?.marginSummary?.totalNtlPos,
        withdrawable: state?.withdrawable,
      };
    } catch (error) {
      console.error(
        "[HyperliquidPerps] 🐔 Error fetching account summary:",
        (error as Error).message
      );
      return {};
    }
  }
}

// ─── Factory ─────────────────────────────────────────────────────────

let clientInstance: HyperliquidPerpsClient | null = null;

export function getHyperliquidClient(
  runtime: IAgentRuntime
): HyperliquidPerpsClient | null {
  if (clientInstance) return clientInstance;

  const privateKey = runtime.getSetting("HYPERLIQUID_PRIVATE_KEY") || process.env.HYPERLIQUID_PRIVATE_KEY;
  if (!privateKey) {
    console.warn(
      "[HyperliquidPerps] 🐔 No HYPERLIQUID_PRIVATE_KEY set — trading disabled"
    );
    return null;
  }

  const testnet = String(runtime.getSetting("HYPERLIQUID_TESTNET") ?? process.env.HYPERLIQUID_TESTNET ?? "true") !== "false";
  clientInstance = new HyperliquidPerpsClient(String(privateKey), testnet);
  return clientInstance;
}
