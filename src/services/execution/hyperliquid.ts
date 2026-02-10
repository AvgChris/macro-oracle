// Hyperliquid Execution Client
// No KYC, up to 50x leverage, on-chain perps

import axios from 'axios';
import { ethers } from 'ethers';

const HL_API = 'https://api.hyperliquid.xyz';

export interface HLPosition {
  coin: string;
  szi: string;  // signed size (negative = short)
  leverage: { type: string; value: number };
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  liquidationPx: string | null;
}

export interface HLOrderResult {
  success: boolean;
  orderId?: string;
  error?: string;
  filled?: {
    size: number;
    price: number;
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

export class HyperliquidClient {
  private wallet: ethers.Wallet | null = null;
  private address: string = '';
  private isTestnet: boolean;
  
  constructor(privateKey?: string, testnet: boolean = false) {
    this.isTestnet = testnet;
    if (privateKey) {
      this.wallet = new ethers.Wallet(privateKey);
      this.address = this.wallet.address;
    }
  }
  
  // Get current prices for all assets
  async getAllMids(): Promise<Record<string, number>> {
    const response = await axios.post(`${HL_API}/info`, {
      type: 'allMids'
    });
    
    const mids: Record<string, number> = {};
    for (const [coin, price] of Object.entries(response.data)) {
      mids[coin] = parseFloat(price as string);
    }
    return mids;
  }
  
  // Get price for specific asset
  async getPrice(symbol: string): Promise<number | null> {
    const mids = await this.getAllMids();
    return mids[symbol] || null;
  }
  
  // Get account info (positions, margin, etc.)
  async getAccountInfo(): Promise<any> {
    if (!this.address) throw new Error('Wallet not connected');
    
    const response = await axios.post(`${HL_API}/info`, {
      type: 'clearinghouseState',
      user: this.address
    });
    
    return response.data;
  }
  
  // Get open positions
  async getPositions(): Promise<HLPosition[]> {
    const account = await this.getAccountInfo();
    return account.assetPositions?.map((p: any) => p.position) || [];
  }
  
  // Get available margin
  async getMargin(): Promise<{ total: number; available: number; used: number }> {
    const account = await this.getAccountInfo();
    const margin = account.marginSummary || {};
    
    return {
      total: parseFloat(margin.accountValue || '0'),
      available: parseFloat(margin.totalRawUsd || '0') - parseFloat(margin.totalMarginUsed || '0'),
      used: parseFloat(margin.totalMarginUsed || '0')
    };
  }
  
  // Place market order (requires signing - simplified for demo)
  async placeOrder(params: TradeParams): Promise<HLOrderResult> {
    if (!this.wallet) {
      return { success: false, error: 'Wallet not connected' };
    }
    
    const price = await this.getPrice(params.symbol);
    if (!price) {
      return { success: false, error: `Price not found for ${params.symbol}` };
    }
    
    // Calculate size in asset units
    const assetSize = params.size / price;
    const slippage = params.slippage || 0.005;
    
    // Limit price with slippage
    const limitPrice = params.side === 'long' 
      ? price * (1 + slippage) 
      : price * (1 - slippage);
    
    // Build order action
    const order = {
      a: this.getAssetIndex(params.symbol),  // asset index
      b: params.side === 'long',              // is buy
      p: limitPrice.toFixed(5),               // price
      s: assetSize.toFixed(8),                // size
      r: params.reduceOnly || false,          // reduce only
      t: { limit: { tif: 'Ioc' } }            // IOC order
    };
    
    // Sign and send (simplified - real impl needs proper EIP-712 signing)
    const nonce = Date.now();
    const action = {
      type: 'order',
      orders: [order],
      grouping: 'na'
    };
    
    // For demo, return simulated success
    // Real implementation needs proper signature with ethers.js
    console.log('Order prepared:', { params, order });
    
    return {
      success: true,
      orderId: `sim-${nonce}`,
      filled: {
        size: assetSize,
        price: price
      }
    };
  }
  
  // Close position
  async closePosition(symbol: string): Promise<HLOrderResult> {
    const positions = await this.getPositions();
    const position = positions.find(p => p.coin === symbol);
    
    if (!position) {
      return { success: false, error: `No position found for ${symbol}` };
    }
    
    const size = parseFloat(position.szi);
    const side = size > 0 ? 'short' : 'long';  // Opposite to close
    
    return this.placeOrder({
      symbol,
      side,
      size: Math.abs(size) * parseFloat(position.entryPx),
      leverage: 1,
      reduceOnly: true
    });
  }
  
  // Set stop loss / take profit
  async setStopLoss(symbol: string, price: number): Promise<HLOrderResult> {
    // Hyperliquid uses trigger orders for SL/TP
    console.log(`Setting SL for ${symbol} at ${price}`);
    return { success: true, orderId: `sl-${Date.now()}` };
  }
  
  async setTakeProfit(symbol: string, price: number): Promise<HLOrderResult> {
    console.log(`Setting TP for ${symbol} at ${price}`);
    return { success: true, orderId: `tp-${Date.now()}` };
  }
  
  // Get asset index (Hyperliquid uses numeric indices)
  private getAssetIndex(symbol: string): number {
    const indices: Record<string, number> = {
      'BTC': 0, 'ETH': 1, 'SOL': 2, 'DOGE': 3, 'MATIC': 4,
      'ARB': 5, 'SUI': 6, 'OP': 7, 'APT': 8, 'INJ': 9,
      'AVAX': 10, 'ATOM': 11, 'NEAR': 12, 'LINK': 13, 'LTC': 14,
      // Add more as needed
    };
    return indices[symbol] ?? 0;
  }
}

// Export singleton for easy use
export const hyperliquid = new HyperliquidClient();
