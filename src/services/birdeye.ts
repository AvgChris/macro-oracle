// Birdeye Data Services Integration
// Solana-native token data: prices, trending, DEX volume, on-chain analytics

import axios from 'axios';

const BIRDEYE_API = 'https://public-api.birdeye.so';
const API_KEY = process.env.BIRDEYE_API_KEY || '4c5bd781d0c448a7a3852f2df1c8c7ec';
const CACHE_TTL = 60000; // 1 minute cache (free tier = 1 rps)

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

// Rate limiter: 1 request per second for free tier
let lastRequestTime = 0;
async function rateLimitedRequest(url: string, params?: Record<string, any>) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < 1100) {
    await new Promise(resolve => setTimeout(resolve, 1100 - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
  
  const response = await axios.get(url, {
    headers: { 'X-API-KEY': API_KEY },
    params,
    timeout: 10000,
  });
  return response.data;
}

// Well-known Solana token addresses
export const SOLANA_TOKENS: Record<string, string> = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  ORCA: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  MNDE: 'MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey',
  PYTH: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
  W: '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ',
  JTO: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
  RENDER: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
  HNT: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux',
};

export interface TokenPrice {
  address: string;
  symbol?: string;
  price: number;
  priceChange24h: number;
  updateTime: string;
}

export interface TokenOverview {
  address: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  logoURI?: string;
}

export interface TopToken {
  address: string;
  symbol: string;
  name: string;
  price: number;
  volume24h: number;
  priceChange24h: number;
  liquidity: number;
  marketCap: number;
  rank: number;
}

// Get price for a single token
export async function getTokenPrice(addressOrSymbol: string): Promise<TokenPrice> {
  const address = SOLANA_TOKENS[addressOrSymbol.toUpperCase()] || addressOrSymbol;
  const cacheKey = `price:${address}`;
  const cached = getCached<TokenPrice>(cacheKey);
  if (cached) return cached;

  const data = await rateLimitedRequest(`${BIRDEYE_API}/defi/price`, { address });
  
  if (!data.success) throw new Error(data.message || 'Failed to get price');
  
  const result: TokenPrice = {
    address,
    symbol: Object.entries(SOLANA_TOKENS).find(([, v]) => v === address)?.[0],
    price: data.data.value,
    priceChange24h: data.data.priceChange24h || 0,
    updateTime: data.data.updateHumanTime,
  };
  
  setCache(cacheKey, result);
  return result;
}

// Get multiple token prices
export async function getMultipleTokenPrices(symbols: string[]): Promise<TokenPrice[]> {
  const results: TokenPrice[] = [];
  for (const symbol of symbols) {
    try {
      const price = await getTokenPrice(symbol);
      results.push(price);
    } catch (e: any) {
      results.push({
        address: SOLANA_TOKENS[symbol.toUpperCase()] || symbol,
        symbol,
        price: 0,
        priceChange24h: 0,
        updateTime: new Date().toISOString(),
      });
    }
  }
  return results;
}

// Get token overview with full details
export async function getTokenOverview(addressOrSymbol: string): Promise<TokenOverview> {
  const address = SOLANA_TOKENS[addressOrSymbol.toUpperCase()] || addressOrSymbol;
  const cacheKey = `overview:${address}`;
  const cached = getCached<TokenOverview>(cacheKey);
  if (cached) return cached;

  const data = await rateLimitedRequest(`${BIRDEYE_API}/defi/token_overview`, { address });
  
  if (!data.success) throw new Error(data.message || 'Failed to get overview');
  
  const d = data.data;
  const result: TokenOverview = {
    address,
    symbol: d.symbol || '',
    name: d.name || '',
    price: d.price || 0,
    priceChange24h: d.priceChange24hPercent || 0,
    volume24h: d.v24hUSD || 0,
    liquidity: d.liquidity || 0,
    marketCap: d.mc || 0,
    logoURI: d.logoURI,
  };
  
  setCache(cacheKey, result);
  return result;
}

// Get top tokens by volume
export async function getTopTokens(limit: number = 20): Promise<TopToken[]> {
  const cacheKey = `topTokens:${limit}`;
  const cached = getCached<TopToken[]>(cacheKey);
  if (cached) return cached;

  const data = await rateLimitedRequest(`${BIRDEYE_API}/defi/tokenlist`, {
    sort_by: 'v24hUSD',
    sort_type: 'desc',
    offset: 0,
    limit: Math.min(limit, 50),
  });
  
  if (!data.success) throw new Error(data.message || 'Failed to get token list');
  
  const tokens: TopToken[] = data.data.tokens.map((t: any, i: number) => ({
    address: t.address,
    symbol: t.symbol,
    name: t.name,
    price: t.price || 0,
    volume24h: t.v24hUSD || 0,
    priceChange24h: t.v24hChangePercent || 0,
    liquidity: t.liquidity || 0,
    marketCap: t.mc || 0,
    rank: i + 1,
  }));
  
  setCache(cacheKey, tokens);
  return tokens;
}

// Get OHLCV candle data for a token
export async function getTokenOHLCV(
  addressOrSymbol: string, 
  timeframe: '1m' | '5m' | '15m' | '30m' | '1H' | '4H' | '1D' = '1H',
  limit: number = 24
): Promise<any[]> {
  const address = SOLANA_TOKENS[addressOrSymbol.toUpperCase()] || addressOrSymbol;
  const cacheKey = `ohlcv:${address}:${timeframe}:${limit}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  const now = Math.floor(Date.now() / 1000);
  const timeMap: Record<string, number> = {
    '1m': 60, '5m': 300, '15m': 900, '30m': 1800,
    '1H': 3600, '4H': 14400, '1D': 86400,
  };
  const timeFrom = now - (timeMap[timeframe] || 3600) * limit;

  const data = await rateLimitedRequest(`${BIRDEYE_API}/defi/ohlcv`, {
    address,
    type: timeframe,
    time_from: timeFrom,
    time_to: now,
  });
  
  if (!data.success) throw new Error(data.message || 'Failed to get OHLCV');
  
  const result = data.data?.items || [];
  setCache(cacheKey, result);
  return result;
}

// Get trade history for a token
export async function getTokenTrades(
  addressOrSymbol: string,
  limit: number = 20
): Promise<any[]> {
  const address = SOLANA_TOKENS[addressOrSymbol.toUpperCase()] || addressOrSymbol;
  const cacheKey = `trades:${address}:${limit}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  const data = await rateLimitedRequest(`${BIRDEYE_API}/defi/txs/token`, {
    address,
    offset: 0,
    limit: Math.min(limit, 50),
    tx_type: 'swap',
  });
  
  if (!data.success) throw new Error(data.message || 'Failed to get trades');
  
  const result = data.data?.items || [];
  setCache(cacheKey, result);
  return result;
}

// Market summary - SOL ecosystem health check
export async function getSolanaMarketSummary(): Promise<{
  solPrice: number;
  solChange24h: number;
  topGainers: TopToken[];
  topLosers: TopToken[];
  topVolume: TopToken[];
  totalVolume24h: number;
}> {
  const cacheKey = 'marketSummary';
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  const tokens = await getTopTokens(30);
  
  const sol = tokens.find(t => t.symbol === 'SOL');
  const sorted = [...tokens].sort((a, b) => b.priceChange24h - a.priceChange24h);
  
  const result = {
    solPrice: sol?.price || 0,
    solChange24h: sol?.priceChange24h || 0,
    topGainers: sorted.slice(0, 5),
    topLosers: sorted.slice(-5).reverse(),
    topVolume: tokens.slice(0, 5),
    totalVolume24h: tokens.reduce((sum, t) => sum + t.volume24h, 0),
  };
  
  setCache(cacheKey, result);
  return result;
}

export function isConfigured(): boolean {
  return !!API_KEY;
}
