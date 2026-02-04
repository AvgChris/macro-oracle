// Stablecoin Supply Service - DeFiLlama
// Track stablecoin flows as crypto liquidity indicator

import axios from 'axios';

const DEFILLAMA_API = 'https://stablecoins.llama.fi';
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

export interface StablecoinData {
  name: string;
  symbol: string;
  currentSupply: number;
  supplyChange24h: number;
  supplyChange7d: number;
  supplyChange30d: number;
}

export interface StablecoinSnapshot {
  totalSupply: number;
  totalChange24h: number;
  totalChange7d: number;
  stablecoins: StablecoinData[];
  flowDirection: 'inflow' | 'outflow' | 'stable';
  interpretation: string;
  fetchedAt: number;
  cryptoImplication: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    reasoning: string;
  };
}

async function fetchStablecoinList(): Promise<any[] | null> {
  const cached = getCached<any[]>('stablecoin_list');
  if (cached) return cached;

  try {
    const res = await axios.get(`${DEFILLAMA_API}/stablecoins?includePrices=false`, {
      timeout: 15000
    });

    const data = res.data.peggedAssets || [];
    setCache('stablecoin_list', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch stablecoin list:', error);
    return null;
  }
}

export async function fetchStablecoinSnapshot(): Promise<StablecoinSnapshot | null> {
  const cached = getCached<StablecoinSnapshot>('stablecoin_snapshot');
  if (cached) return cached;

  const stablecoins = await fetchStablecoinList();
  if (!stablecoins) return null;

  try {
    // Focus on major stablecoins
    const majorSymbols = ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'FRAX', 'USDP'];
    
    const majorStables: StablecoinData[] = stablecoins
      .filter((s: any) => majorSymbols.includes(s.symbol))
      .map((s: any) => {
        const current = s.circulating?.peggedUSD || 0;
        const d1 = s.circulatingPrevDay?.peggedUSD || current;
        const d7 = s.circulatingPrevWeek?.peggedUSD || current;
        const d30 = s.circulatingPrevMonth?.peggedUSD || current;

        return {
          name: s.name,
          symbol: s.symbol,
          currentSupply: Math.round(current / 1e6), // In millions
          supplyChange24h: Math.round((current - d1) / 1e6),
          supplyChange7d: Math.round((current - d7) / 1e6),
          supplyChange30d: Math.round((current - d30) / 1e6)
        };
      })
      .sort((a: StablecoinData, b: StablecoinData) => b.currentSupply - a.currentSupply);

    const totalSupply = majorStables.reduce((sum, s) => sum + s.currentSupply, 0);
    const totalChange24h = majorStables.reduce((sum, s) => sum + s.supplyChange24h, 0);
    const totalChange7d = majorStables.reduce((sum, s) => sum + s.supplyChange7d, 0);

    // Determine flow direction
    let flowDirection: 'inflow' | 'outflow' | 'stable' = 'stable';
    if (totalChange7d > 1000) flowDirection = 'inflow'; // >$1B inflow
    else if (totalChange7d < -1000) flowDirection = 'outflow'; // >$1B outflow

    // Interpretation
    let interpretation = 'Stablecoin supply stable — sideways market expected';
    if (flowDirection === 'inflow') {
      interpretation = 'Stablecoin supply growing — dry powder entering crypto';
    } else if (flowDirection === 'outflow') {
      interpretation = 'Stablecoin supply shrinking — capital exiting crypto';
    }

    // Crypto implication
    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let confidence = 40;
    let reasoning = 'Stablecoin flows neutral';

    if (totalChange7d > 2000) {
      direction = 'bullish';
      confidence = 65;
      reasoning = `$${Math.abs(totalChange7d / 1000).toFixed(1)}B stablecoin inflow in 7d — capital ready to deploy`;
    } else if (totalChange7d > 500) {
      direction = 'bullish';
      confidence = 50;
      reasoning = `$${totalChange7d}M stablecoin inflow — moderate buying pressure`;
    } else if (totalChange7d < -2000) {
      direction = 'bearish';
      confidence = 65;
      reasoning = `$${Math.abs(totalChange7d / 1000).toFixed(1)}B stablecoin outflow in 7d — capital fleeing`;
    } else if (totalChange7d < -500) {
      direction = 'bearish';
      confidence = 50;
      reasoning = `$${Math.abs(totalChange7d)}M stablecoin outflow — selling pressure`;
    }

    const snapshot: StablecoinSnapshot = {
      totalSupply,
      totalChange24h,
      totalChange7d,
      stablecoins: majorStables.slice(0, 5), // Top 5
      flowDirection,
      interpretation,
      fetchedAt: Date.now(),
      cryptoImplication: {
        direction,
        confidence,
        reasoning
      }
    };

    setCache('stablecoin_snapshot', snapshot);
    return snapshot;
  } catch (error) {
    console.error('Failed to process stablecoin data:', error);
    return null;
  }
}
