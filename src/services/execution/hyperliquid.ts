// Hyperliquid Execution Client — Real testnet/mainnet implementation
// Uses EIP-712 phantom agent signing per official Python SDK spec

import axios from 'axios';
import { ethers } from 'ethers';
import { encode as msgpackEncode } from '@msgpack/msgpack';

const HL_MAINNET = 'https://api.hyperliquid.xyz';
const HL_TESTNET = 'https://api.hyperliquid-testnet.xyz';

export interface HLPosition {
  coin: string;
  szi: string;
  leverage: { type: string; value: number };
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  liquidationPx: string | null;
}

export interface HLOrderResult {
  success: boolean;
  orderId?: number;
  error?: string;
  filled?: {
    totalSz: string;
    avgPx: string;
  };
}

export interface TradeParams {
  symbol: string;
  side: 'long' | 'short';
  size: number;        // in USD
  leverage: number;
  slippage?: number;   // default 0.5%
  reduceOnly?: boolean;
}

interface AssetMeta {
  name: string;
  szDecimals: number;
  maxLeverage: number;
}

// ─── Signing utilities ───────────────────────────────────────────────

function actionHash(action: any, vaultAddress: string | null, nonce: number, expiresAfter: number | null): string {
  const actionBytes = Buffer.from(msgpackEncode(action));
  const nonceBuf = Buffer.alloc(8);
  nonceBuf.writeBigUInt64BE(BigInt(nonce));

  let vaultBuf: Buffer;
  if (!vaultAddress) {
    vaultBuf = Buffer.from([0x00]);
  } else {
    vaultBuf = Buffer.concat([Buffer.from([0x01]), Buffer.from(vaultAddress.slice(2), 'hex')]);
  }

  let expiresBuf = Buffer.alloc(0);
  if (expiresAfter != null) {
    const eb = Buffer.alloc(9);
    eb[0] = 0x00;
    eb.writeBigUInt64BE(BigInt(expiresAfter), 1);
    expiresBuf = eb;
  }

  return ethers.keccak256(Buffer.concat([actionBytes, nonceBuf, vaultBuf, expiresBuf]));
}

async function signL1Action(
  wallet: ethers.Wallet,
  action: any,
  vaultAddress: string | null,
  nonce: number,
  isMainnet: boolean
): Promise<{ r: string; s: string; v: number }> {
  const hash = actionHash(action, vaultAddress, nonce, null);

  const domain = {
    name: 'Exchange',
    version: '1',
    chainId: 1337,
    verifyingContract: '0x0000000000000000000000000000000000000000'
  };

  const types = {
    Agent: [
      { name: 'source', type: 'string' },
      { name: 'connectionId', type: 'bytes32' }
    ]
  };

  const phantomAgent = {
    source: isMainnet ? 'a' : 'b',
    connectionId: hash
  };

  const sig = await wallet.signTypedData(domain, types, phantomAgent);
  const parsed = ethers.Signature.from(sig);
  return { r: parsed.r, s: parsed.s, v: Number(parsed.v) };
}

// ─── Price/size formatting ───────────────────────────────────────────

function roundToTickSize(price: number, tickSize: number): string {
  // Tick size for most assets: significant figures based on price magnitude
  // BTC = $1, ETH = $0.1, SOL = $0.01, etc.
  const rounded = Math.round(price / tickSize) * tickSize;
  // Determine decimal places from tickSize
  const decimals = tickSize < 1 ? Math.ceil(-Math.log10(tickSize)) : 0;
  return rounded.toFixed(decimals);
}

function roundSz(sz: number, szDecimals: number): string {
  return sz.toFixed(szDecimals);
}

// ─── Client ──────────────────────────────────────────────────────────

export class HyperliquidClient {
  private wallet: ethers.Wallet | null = null;
  private address: string = '';
  private isTestnet: boolean;
  private baseUrl: string;
  private assetMap: Map<string, number> = new Map();
  private assetMeta: AssetMeta[] = [];
  private tickSizes: Map<string, number> = new Map();
  private metaLoaded = false;

  constructor(privateKey?: string, testnet: boolean = true) {
    this.isTestnet = testnet;
    this.baseUrl = testnet ? HL_TESTNET : HL_MAINNET;
    if (privateKey) {
      this.wallet = new ethers.Wallet(privateKey);
      this.address = this.wallet.address;
    }
  }

  private async loadMeta(): Promise<void> {
    if (this.metaLoaded) return;
    const response = await axios.post(`${this.baseUrl}/info`, { type: 'meta' });
    this.assetMeta = response.data.universe;
    this.assetMeta.forEach((asset: AssetMeta, index: number) => {
      this.assetMap.set(asset.name, index);
    });
    this.metaLoaded = true;
  }

  getAssetIndex(symbol: string): number {
    return this.assetMap.get(symbol) ?? -1;
  }

  // Infer tick size from mid price (HL convention: 5 significant figures)
  private inferTickSize(price: number): number {
    if (price >= 10000) return 1;       // BTC
    if (price >= 1000) return 0.1;      // ETH
    if (price >= 100) return 0.01;      // SOL, BNB
    if (price >= 10) return 0.001;
    if (price >= 1) return 0.0001;
    if (price >= 0.1) return 0.00001;
    if (price >= 0.01) return 0.000001;
    if (price >= 0.001) return 0.0000001;
    return 0.00000001;
  }

  async getAllMids(): Promise<Record<string, number>> {
    const response = await axios.post(`${this.baseUrl}/info`, { type: 'allMids' });
    const mids: Record<string, number> = {};
    for (const [coin, price] of Object.entries(response.data)) {
      mids[coin] = parseFloat(price as string);
    }
    return mids;
  }

  async getPrice(symbol: string): Promise<number | null> {
    const mids = await this.getAllMids();
    return mids[symbol] || null;
  }

  async getAccountInfo(): Promise<any> {
    if (!this.address) throw new Error('Wallet not connected');
    const response = await axios.post(`${this.baseUrl}/info`, {
      type: 'clearinghouseState',
      user: this.address
    });
    return response.data;
  }

  async getPositions(): Promise<HLPosition[]> {
    const account = await this.getAccountInfo();
    return account.assetPositions?.map((p: any) => p.position) || [];
  }

  async getMargin(): Promise<{ total: number; available: number; used: number }> {
    const account = await this.getAccountInfo();
    const margin = account.marginSummary || {};
    return {
      total: parseFloat(margin.accountValue || '0'),
      available: parseFloat(margin.accountValue || '0') - parseFloat(margin.totalMarginUsed || '0'),
      used: parseFloat(margin.totalMarginUsed || '0')
    };
  }

  async getSpotBalance(): Promise<number> {
    const response = await axios.post(`${this.baseUrl}/info`, {
      type: 'spotClearinghouseState',
      user: this.address
    });
    const usdc = response.data.balances?.find((b: any) => b.coin === 'USDC');
    return usdc ? parseFloat(usdc.total) : 0;
  }

  // Set leverage for an asset
  async setLeverage(symbol: string, leverage: number, isCross: boolean = true): Promise<any> {
    await this.loadMeta();
    if (!this.wallet) throw new Error('Wallet not connected');

    const assetIndex = this.getAssetIndex(symbol);
    if (assetIndex < 0) throw new Error(`Unknown asset: ${symbol}`);

    const nonce = Date.now();
    const action = {
      type: 'updateLeverage',
      asset: assetIndex,
      isCross,
      leverage
    };

    const sig = await signL1Action(this.wallet, action, null, nonce, !this.isTestnet);

    const response = await axios.post(`${this.baseUrl}/exchange`, {
      action, nonce, signature: sig
    });

    return response.data;
  }

  // Place a market order
  async placeOrder(params: TradeParams): Promise<HLOrderResult> {
    await this.loadMeta();
    if (!this.wallet) {
      return { success: false, error: 'Wallet not connected' };
    }

    const assetIndex = this.getAssetIndex(params.symbol);
    if (assetIndex < 0) {
      return { success: false, error: `Unknown asset: ${params.symbol}` };
    }

    const price = await this.getPrice(params.symbol);
    if (!price) {
      return { success: false, error: `Price not found for ${params.symbol}` };
    }

    const meta = this.assetMeta[assetIndex];
    const slippage = params.slippage || 0.005; // 0.5%

    // Calculate size in asset units
    const assetSize = params.size / price;
    const sizeStr = roundSz(assetSize, meta.szDecimals);

    // Calculate limit price with slippage
    const tickSize = this.inferTickSize(price);
    const rawLimitPrice = params.side === 'long'
      ? price * (1 + slippage)
      : price * (1 - slippage);
    const limitPrice = roundToTickSize(rawLimitPrice, tickSize);

    const nonce = Date.now();
    const action = {
      type: 'order' as const,
      orders: [{
        a: assetIndex,
        b: params.side === 'long',
        p: limitPrice,
        s: sizeStr,
        r: params.reduceOnly || false,
        t: { limit: { tif: 'Ioc' as const } }
      }],
      grouping: 'na' as const
    };

    try {
      const sig = await signL1Action(this.wallet, action, null, nonce, !this.isTestnet);

      const response = await axios.post(`${this.baseUrl}/exchange`, {
        action, nonce, signature: sig
      });

      const data = response.data;
      if (data.status === 'ok') {
        const status = data.response?.data?.statuses?.[0];
        if (status?.filled) {
          return {
            success: true,
            orderId: status.filled.oid,
            filled: {
              totalSz: status.filled.totalSz,
              avgPx: status.filled.avgPx
            }
          };
        } else if (status?.error) {
          return { success: false, error: status.error };
        } else if (status?.resting) {
          return {
            success: true,
            orderId: status.resting.oid
          };
        }
      }

      return { success: false, error: data.response || JSON.stringify(data) };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  // Close a position
  async closePosition(symbol: string): Promise<HLOrderResult> {
    const positions = await this.getPositions();
    const position = positions.find(p => p.coin === symbol);

    if (!position) {
      return { success: false, error: `No position found for ${symbol}` };
    }

    const size = parseFloat(position.szi);
    const price = parseFloat(position.entryPx);
    const side = size > 0 ? 'short' : 'long';

    return this.placeOrder({
      symbol,
      side: side as 'long' | 'short',
      size: Math.abs(size) * price,
      leverage: 1,
      reduceOnly: true,
      slippage: 0.01 // 1% slippage for close
    });
  }

  // Set stop loss using trigger order
  async setStopLoss(symbol: string, triggerPrice: number): Promise<HLOrderResult> {
    await this.loadMeta();
    if (!this.wallet) return { success: false, error: 'Wallet not connected' };

    const positions = await this.getPositions();
    const position = positions.find(p => p.coin === symbol);
    if (!position) return { success: false, error: `No position for ${symbol}` };

    const assetIndex = this.getAssetIndex(symbol);
    const size = Math.abs(parseFloat(position.szi));
    const meta = this.assetMeta[assetIndex];
    const isLong = parseFloat(position.szi) > 0;
    const tickSize = this.inferTickSize(triggerPrice);

    // SL: sell if long, buy if short. Trigger price slightly worse to ensure fill.
    const slPrice = isLong
      ? roundToTickSize(triggerPrice * 0.99, tickSize)   // sell below trigger
      : roundToTickSize(triggerPrice * 1.01, tickSize);  // buy above trigger

    const nonce = Date.now();
    const action = {
      type: 'order' as const,
      orders: [{
        a: assetIndex,
        b: !isLong,  // opposite side to close
        p: slPrice,
        s: roundSz(size, meta.szDecimals),
        r: true,     // reduce only
        t: {
          trigger: {
            isMarket: true,
            triggerPx: roundToTickSize(triggerPrice, tickSize),
            tpsl: 'sl' as const
          }
        }
      }],
      grouping: 'na' as const
    };

    try {
      const sig = await signL1Action(this.wallet, action, null, nonce, !this.isTestnet);
      const response = await axios.post(`${this.baseUrl}/exchange`, {
        action, nonce, signature: sig
      });

      const status = response.data.response?.data?.statuses?.[0];
      if (status?.resting || status?.filled) {
        return { success: true, orderId: (status.resting || status.filled).oid };
      }
      return { success: false, error: status?.error || JSON.stringify(response.data) };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  // Set take profit using trigger order
  async setTakeProfit(symbol: string, triggerPrice: number): Promise<HLOrderResult> {
    await this.loadMeta();
    if (!this.wallet) return { success: false, error: 'Wallet not connected' };

    const positions = await this.getPositions();
    const position = positions.find(p => p.coin === symbol);
    if (!position) return { success: false, error: `No position for ${symbol}` };

    const assetIndex = this.getAssetIndex(symbol);
    const size = Math.abs(parseFloat(position.szi));
    const meta = this.assetMeta[assetIndex];
    const isLong = parseFloat(position.szi) > 0;
    const tickSize = this.inferTickSize(triggerPrice);

    const tpPrice = isLong
      ? roundToTickSize(triggerPrice * 0.99, tickSize)
      : roundToTickSize(triggerPrice * 1.01, tickSize);

    const nonce = Date.now();
    const action = {
      type: 'order' as const,
      orders: [{
        a: assetIndex,
        b: !isLong,
        p: tpPrice,
        s: roundSz(size, meta.szDecimals),
        r: true,
        t: {
          trigger: {
            isMarket: true,
            triggerPx: roundToTickSize(triggerPrice, tickSize),
            tpsl: 'tp' as const
          }
        }
      }],
      grouping: 'na' as const
    };

    try {
      const sig = await signL1Action(this.wallet, action, null, nonce, !this.isTestnet);
      const response = await axios.post(`${this.baseUrl}/exchange`, {
        action, nonce, signature: sig
      });

      const status = response.data.response?.data?.statuses?.[0];
      if (status?.resting || status?.filled) {
        return { success: true, orderId: (status.resting || status.filled).oid };
      }
      return { success: false, error: status?.error || JSON.stringify(response.data) };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }
}

// Export singleton configured for testnet
export const hyperliquid = new HyperliquidClient(
  process.env.HL_PRIVATE_KEY,
  true // testnet
);
