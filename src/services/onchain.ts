// On-Chain Metrics Service
// Bitcoin network health and activity indicators

import axios from 'axios';

const BLOCKCHAIN_INFO_API = 'https://api.blockchain.info';
const CACHE_TTL = 300000; // 5 minute cache

interface CachedData<T> {
  data: T;
  timestamp: number;
}

const cache: Map<string, CachedData<any>> = new Map();

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export interface NetworkStats {
  hashRate: number; // EH/s
  difficulty: number;
  blockHeight: number;
  avgBlockTime: number; // seconds
  mempoolSize: number;
  mempoolTxCount: number;
}

export interface MarketMetrics {
  price: number;
  volume24h: number;
  marketCap: number;
  circulatingSupply: number;
}

export interface OnChainSnapshot {
  network: NetworkStats;
  market: MarketMetrics;
  health: {
    networkStatus: 'healthy' | 'congested' | 'slow';
    hashRateTrend: 'rising' | 'stable' | 'falling';
    mempoolStatus: 'clear' | 'normal' | 'congested';
  };
  interpretation: string;
  cryptoImplication: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    reasoning: string;
  };
  fetchedAt: number;
}

// Fetch blockchain.info stats
async function fetchBlockchainStats(): Promise<any> {
  const cached = getCached<any>('blockchain_stats');
  if (cached) return cached;

  try {
    const res = await axios.get('https://blockchain.info/stats', {
      params: { format: 'json' },
      timeout: 10000
    });
    setCache('blockchain_stats', res.data);
    return res.data;
  } catch (error: any) {
    console.error('Failed to fetch blockchain stats:', error.message);
    return null;
  }
}

// Fetch ticker data
async function fetchTicker(): Promise<any> {
  const cached = getCached<any>('btc_ticker');
  if (cached) return cached;

  try {
    const res = await axios.get('https://blockchain.info/ticker', {
      timeout: 5000
    });
    setCache('btc_ticker', res.data);
    return res.data;
  } catch (error: any) {
    console.error('Failed to fetch ticker:', error.message);
    return null;
  }
}

export async function fetchOnChainSnapshot(): Promise<OnChainSnapshot> {
  const [stats, ticker] = await Promise.all([
    fetchBlockchainStats(),
    fetchTicker()
  ]);

  const price = ticker?.USD?.last || 75000;
  
  // Network stats
  const hashRate = stats?.hash_rate ? stats.hash_rate / 1e18 : 0; // Convert to EH/s
  const difficulty = stats?.difficulty || 0;
  const blockHeight = stats?.n_blocks_total || 0;
  const avgBlockTime = stats?.minutes_between_blocks ? stats.minutes_between_blocks * 60 : 600;
  const mempoolSize = stats?.mempool_size || 0;
  const mempoolTxCount = stats?.n_tx || 0;

  // Market metrics
  const marketCap = stats?.market_price_usd ? stats.market_price_usd * (stats.totalbc / 1e8) : 0;
  const volume24h = stats?.trade_volume_usd || 0;
  const circulatingSupply = stats?.totalbc ? stats.totalbc / 1e8 : 21000000 * 0.93;

  // Health assessment
  let networkStatus: 'healthy' | 'congested' | 'slow' = 'healthy';
  if (avgBlockTime > 720) networkStatus = 'slow'; // > 12 min
  else if (mempoolSize > 100000000) networkStatus = 'congested'; // > 100MB mempool

  let hashRateTrend: 'rising' | 'stable' | 'falling' = 'stable';
  // Would need historical data for trend - default to stable

  let mempoolStatus: 'clear' | 'normal' | 'congested' = 'normal';
  if (mempoolSize < 10000000) mempoolStatus = 'clear'; // < 10MB
  else if (mempoolSize > 50000000) mempoolStatus = 'congested'; // > 50MB

  // Interpretation
  let interpretation = 'Bitcoin network operating normally';
  if (networkStatus === 'congested') {
    interpretation = 'Network congested — high transaction fees expected';
  } else if (networkStatus === 'slow') {
    interpretation = 'Block times slower than usual — possible mining disruption';
  } else if (mempoolStatus === 'clear') {
    interpretation = 'Low network activity — mempool nearly empty';
  }

  // Crypto implication
  let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let confidence = 30;
  let reasoning = 'Network metrics within normal range';

  if (networkStatus === 'healthy' && hashRate > 500) { // > 500 EH/s
    direction = 'bullish';
    confidence = 40;
    reasoning = `Strong network health: ${hashRate.toFixed(0)} EH/s hash rate, healthy block times`;
  } else if (networkStatus === 'congested') {
    direction = 'neutral';
    confidence = 35;
    reasoning = 'Network congestion may slow transactions — watch for fee spikes';
  }

  return {
    network: {
      hashRate: Math.round(hashRate * 100) / 100,
      difficulty,
      blockHeight,
      avgBlockTime: Math.round(avgBlockTime),
      mempoolSize,
      mempoolTxCount
    },
    market: {
      price,
      volume24h,
      marketCap,
      circulatingSupply
    },
    health: {
      networkStatus,
      hashRateTrend,
      mempoolStatus
    },
    interpretation,
    cryptoImplication: {
      direction,
      confidence,
      reasoning
    },
    fetchedAt: Date.now()
  };
}
