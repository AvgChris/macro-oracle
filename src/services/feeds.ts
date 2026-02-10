// Live Data Feeds Service
// Fetches real-time market data from free APIs

import axios from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CACHE_TTL = 60000; // 1 minute cache

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

// Fetch crypto prices from OKX (consistent with scanner)
export async function fetchCryptoPrices(): Promise<{
  btc: number;
  eth: number;
  sol: number;
  totalMcap: number;
} | null> {
  const cached = getCached<any>('crypto_prices');
  if (cached) return cached;

  try {
    // Fetch from OKX for accurate, consistent pricing
    const [btcRes, ethRes, solRes, globalRes] = await Promise.all([
      axios.get('https://www.okx.com/api/v5/market/ticker', {
        params: { instId: 'BTC-USDT' },
        timeout: 5000,
        headers: { 'User-Agent': 'MacroOracle/2.0' }
      }),
      axios.get('https://www.okx.com/api/v5/market/ticker', {
        params: { instId: 'ETH-USDT' },
        timeout: 5000,
        headers: { 'User-Agent': 'MacroOracle/2.0' }
      }),
      axios.get('https://www.okx.com/api/v5/market/ticker', {
        params: { instId: 'SOL-USDT' },
        timeout: 5000,
        headers: { 'User-Agent': 'MacroOracle/2.0' }
      }),
      axios.get(`${COINGECKO_API}/global`, { timeout: 5000 }).catch(() => null)
    ]);

    const data = {
      btc: parseFloat(btcRes.data.data?.[0]?.last) || 0,
      eth: parseFloat(ethRes.data.data?.[0]?.last) || 0,
      sol: parseFloat(solRes.data.data?.[0]?.last) || 0,
      totalMcap: globalRes?.data?.data?.total_market_cap?.usd || 2.4e12
    };

    console.log('Fetched crypto prices from OKX:', data);
    setCache('crypto_prices', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error);
    return null;
  }
}

// Fetch fear & greed index (alternative sentiment)
export async function fetchFearGreedIndex(): Promise<{
  value: number;
  classification: string;
} | null> {
  const cached = getCached<any>('fear_greed');
  if (cached) return cached;

  try {
    const res = await axios.get('https://api.alternative.me/fng/', {
      timeout: 5000
    });
    
    const data = {
      value: parseInt(res.data.data[0]?.value || '50'),
      classification: res.data.data[0]?.value_classification || 'Neutral'
    };

    setCache('fear_greed', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch fear/greed:', error);
    return null;
  }
}

// Fetch DXY approximation using EUR/USD inverse
// (DXY is ~57% EUR weighted, so EUR/USD is a decent proxy)
export async function fetchDxyProxy(): Promise<number | null> {
  const cached = getCached<number>('dxy_proxy');
  if (cached) return cached;

  try {
    // Using exchangerate.host (free, no key)
    const res = await axios.get('https://api.exchangerate.host/latest', {
      params: { base: 'USD', symbols: 'EUR' },
      timeout: 5000
    });

    // Approximate DXY from EUR/USD
    // When EUR/USD is 1.05, DXY is roughly 105
    // When EUR/USD is 1.10, DXY is roughly 100
    const eurusd = 1 / (res.data.rates?.EUR || 1);
    const dxyApprox = 100 / eurusd * 1.05; // Rough approximation

    setCache('dxy_proxy', dxyApprox);
    return Math.round(dxyApprox * 100) / 100;
  } catch (error) {
    console.error('Failed to fetch DXY proxy:', error);
    return null;
  }
}

// Combined market data fetch
export async function fetchAllMarketData(): Promise<{
  crypto: { btc: number; eth: number; sol: number; totalMcap: number } | null;
  dxy: number | null;
  fearGreed: { value: number; classification: string } | null;
  fetchedAt: number;
}> {
  const [crypto, dxy, fearGreed] = await Promise.all([
    fetchCryptoPrices(),
    fetchDxyProxy(),
    fetchFearGreedIndex()
  ]);

  return {
    crypto,
    dxy,
    fearGreed,
    fetchedAt: Date.now()
  };
}

// Update interval for background refresh
let updateInterval: NodeJS.Timeout | null = null;

export function startLiveFeeds(intervalMs: number = 60000): void {
  if (updateInterval) return;
  
  console.log('Starting live data feeds...');
  
  // Initial fetch
  fetchAllMarketData().then(data => {
    console.log('Initial market data fetched:', {
      btc: data.crypto?.btc,
      dxy: data.dxy,
      fearGreed: data.fearGreed?.value
    });
  });

  // Periodic updates
  updateInterval = setInterval(() => {
    fetchAllMarketData().catch(console.error);
  }, intervalMs);
}

export function stopLiveFeeds(): void {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}
