// Coinglass Service - Derivatives Data
// Funding rates, open interest, liquidations

import axios from 'axios';

const COINGLASS_API = 'https://open-api.coinglass.com/public/v2';
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

// === FUNDING RATES ===

export interface FundingRate {
  symbol: string;
  rate: number;
  predictedRate: number;
  exchange: string;
}

export interface FundingSnapshot {
  btc: { avgRate: number; rates: FundingRate[] };
  eth: { avgRate: number; rates: FundingRate[] };
  sentiment: 'overleveraged_long' | 'overleveraged_short' | 'neutral';
  interpretation: string;
  fetchedAt: number;
}

async function fetchFundingRates(symbol: string): Promise<FundingRate[]> {
  const cacheKey = `funding_${symbol}`;
  const cached = getCached<FundingRate[]>(cacheKey);
  if (cached) return cached;

  const rates: FundingRate[] = [];

  // Try Bybit (reliable, no geo-restrictions)
  try {
    const bybitRes = await axios.get('https://api.bybit.com/v5/market/funding/history', {
      params: { category: 'linear', symbol: `${symbol}USDT`, limit: 1 },
      timeout: 8000,
      headers: { 'User-Agent': 'MacroOracle/1.0' }
    });
    
    console.log(`Bybit funding response for ${symbol}:`, JSON.stringify(bybitRes.data).slice(0, 200));
    
    if (bybitRes.data?.result?.list?.[0]) {
      const rate = parseFloat(bybitRes.data.result.list[0].fundingRate) * 100;
      rates.push({ symbol, rate, predictedRate: rate, exchange: 'Bybit' });
      console.log(`Bybit ${symbol} funding rate: ${rate}%`);
    }
  } catch (error: any) {
    console.error(`Bybit funding failed for ${symbol}:`, error.message);
  }

  // Try Binance as backup
  try {
    const binanceRes = await axios.get('https://fapi.binance.com/fapi/v1/fundingRate', {
      params: { symbol: `${symbol}USDT`, limit: 1 },
      timeout: 5000
    });
    
    if (binanceRes.data && binanceRes.data[0]) {
      const rate = parseFloat(binanceRes.data[0].fundingRate) * 100;
      rates.push({ symbol, rate, predictedRate: rate, exchange: 'Binance' });
    }
  } catch (error) {
    console.error(`Binance funding failed for ${symbol}:`, error);
  }

  if (rates.length > 0) {
    setCache(cacheKey, rates);
  }
  return rates;
}

export async function fetchFundingSnapshot(): Promise<FundingSnapshot> {
  const [btcRates, ethRates] = await Promise.all([
    fetchFundingRates('BTC'),
    fetchFundingRates('ETH')
  ]);

  const btcAvg = btcRates.length > 0 
    ? btcRates.reduce((sum, r) => sum + r.rate, 0) / btcRates.length 
    : 0;
  const ethAvg = ethRates.length > 0 
    ? ethRates.reduce((sum, r) => sum + r.rate, 0) / ethRates.length 
    : 0;

  const avgRate = (btcAvg + ethAvg) / 2;

  let sentiment: 'overleveraged_long' | 'overleveraged_short' | 'neutral' = 'neutral';
  let interpretation = 'Funding rates neutral — balanced market';

  if (avgRate > 0.03) {
    sentiment = 'overleveraged_long';
    interpretation = `High positive funding (${avgRate.toFixed(3)}%) — longs paying shorts, potential long squeeze`;
  } else if (avgRate > 0.01) {
    sentiment = 'overleveraged_long';
    interpretation = `Elevated funding (${avgRate.toFixed(3)}%) — bullish but watch for correction`;
  } else if (avgRate < -0.03) {
    sentiment = 'overleveraged_short';
    interpretation = `Negative funding (${avgRate.toFixed(3)}%) — shorts paying longs, potential short squeeze`;
  } else if (avgRate < -0.01) {
    sentiment = 'overleveraged_short';
    interpretation = `Low funding (${avgRate.toFixed(3)}%) — bearish sentiment, squeeze risk`;
  }

  return {
    btc: { avgRate: Math.round(btcAvg * 10000) / 10000, rates: btcRates.slice(0, 5) },
    eth: { avgRate: Math.round(ethAvg * 10000) / 10000, rates: ethRates.slice(0, 5) },
    sentiment,
    interpretation,
    fetchedAt: Date.now()
  };
}

// === OPEN INTEREST ===

export interface OpenInterestData {
  symbol: string;
  openInterest: number; // in USD
  change24h: number; // percentage
  change7d: number;
}

export interface OISnapshot {
  btc: OpenInterestData | null;
  eth: OpenInterestData | null;
  totalOI: number;
  trend: 'rising' | 'falling' | 'stable';
  interpretation: string;
  fetchedAt: number;
}

async function fetchOpenInterest(symbol: string): Promise<OpenInterestData | null> {
  const cacheKey = `oi_${symbol}`;
  const cached = getCached<OpenInterestData>(cacheKey);
  if (cached) return cached;

  // Try Bybit first (more reliable)
  try {
    const res = await axios.get('https://api.bybit.com/v5/market/open-interest', {
      params: { category: 'linear', symbol: `${symbol}USDT`, intervalTime: '1h', limit: 1 },
      timeout: 5000
    });

    if (res.data?.result?.list?.[0]) {
      const oiValue = parseFloat(res.data.result.list[0].openInterest);
      
      // Get price for USD conversion
      const priceRes = await axios.get('https://api.bybit.com/v5/market/tickers', {
        params: { category: 'linear', symbol: `${symbol}USDT` },
        timeout: 5000
      });
      
      const price = parseFloat(priceRes.data?.result?.list?.[0]?.lastPrice || '0');
      const oiUsd = oiValue * price;

      const data: OpenInterestData = {
        symbol,
        openInterest: Math.round(oiUsd),
        change24h: 0,
        change7d: 0
      };
      
      setCache(cacheKey, data);
      return data;
    }
  } catch (error) {
    console.error(`Bybit OI failed for ${symbol}:`, error);
  }

  // Fallback to Binance
  try {
    const res = await axios.get('https://fapi.binance.com/fapi/v1/openInterest', {
      params: { symbol: `${symbol}USDT` },
      timeout: 5000
    });

    if (res.data && res.data.openInterest) {
      const priceRes = await axios.get('https://fapi.binance.com/fapi/v1/ticker/price', {
        params: { symbol: `${symbol}USDT` },
        timeout: 5000
      });
      
      const oi = parseFloat(res.data.openInterest);
      const price = parseFloat(priceRes.data.price);
      const oiUsd = oi * price;

      const data: OpenInterestData = {
        symbol,
        openInterest: Math.round(oiUsd),
        change24h: 0,
        change7d: 0
      };
      
      setCache(cacheKey, data);
      return data;
    }
  } catch (error) {
    console.error(`Binance OI failed for ${symbol}:`, error);
  }

  return null;
}

export async function fetchOISnapshot(): Promise<OISnapshot> {
  const [btc, eth] = await Promise.all([
    fetchOpenInterest('BTC'),
    fetchOpenInterest('ETH')
  ]);

  const totalOI = (btc?.openInterest || 0) + (eth?.openInterest || 0);
  
  // Determine trend based on 24h change
  let trend: 'rising' | 'falling' | 'stable' = 'stable';
  const avgChange = ((btc?.change24h || 0) + (eth?.change24h || 0)) / 2;
  if (avgChange > 5) trend = 'rising';
  else if (avgChange < -5) trend = 'falling';

  let interpretation = 'Open interest stable — no major positioning changes';
  if (trend === 'rising') {
    interpretation = 'Rising OI — new positions entering, trend strengthening';
  } else if (trend === 'falling') {
    interpretation = 'Falling OI — positions closing, potential reversal';
  }

  return {
    btc,
    eth,
    totalOI,
    trend,
    interpretation,
    fetchedAt: Date.now()
  };
}

// === LIQUIDATIONS ===

export interface LiquidationData {
  symbol: string;
  longLiquidations24h: number;
  shortLiquidations24h: number;
  totalLiquidations24h: number;
  dominantSide: 'longs' | 'shorts' | 'balanced';
}

export interface LiquidationSnapshot {
  btc: LiquidationData | null;
  eth: LiquidationData | null;
  total24h: number;
  dominantSide: 'longs' | 'shorts' | 'balanced';
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  interpretation: string;
  fetchedAt: number;
}

async function fetchLiquidations(): Promise<{ btc: LiquidationData | null; eth: LiquidationData | null }> {
  const cached = getCached<{ btc: LiquidationData | null; eth: LiquidationData | null }>('liquidations');
  if (cached) return cached;

  try {
    // Use Coinglass liquidation endpoint
    const res = await axios.get(`${COINGLASS_API}/liquidation_chart`, {
      params: { symbol: 'BTC', interval: '24h' },
      timeout: 10000,
      headers: { 'User-Agent': 'MacroOracle/1.0' }
    });

    if (res.data.success && res.data.data) {
      const data = res.data.data;
      const longLiq = data.longLiquidationUsd || 0;
      const shortLiq = data.shortLiquidationUsd || 0;
      
      const btc: LiquidationData = {
        symbol: 'BTC',
        longLiquidations24h: longLiq,
        shortLiquidations24h: shortLiq,
        totalLiquidations24h: longLiq + shortLiq,
        dominantSide: longLiq > shortLiq * 1.5 ? 'longs' : 
                      shortLiq > longLiq * 1.5 ? 'shorts' : 'balanced'
      };

      const result = { btc, eth: null };
      setCache('liquidations', result);
      return result;
    }
  } catch (error) {
    console.error('Failed to fetch liquidations:', error);
  }

  // Return estimated data if API fails
  return {
    btc: {
      symbol: 'BTC',
      longLiquidations24h: 0,
      shortLiquidations24h: 0,
      totalLiquidations24h: 0,
      dominantSide: 'balanced'
    },
    eth: null
  };
}

export async function fetchLiquidationSnapshot(): Promise<LiquidationSnapshot> {
  const { btc, eth } = await fetchLiquidations();

  const total24h = (btc?.totalLiquidations24h || 0) + (eth?.totalLiquidations24h || 0);
  
  const longTotal = (btc?.longLiquidations24h || 0) + (eth?.longLiquidations24h || 0);
  const shortTotal = (btc?.shortLiquidations24h || 0) + (eth?.shortLiquidations24h || 0);
  
  let dominantSide: 'longs' | 'shorts' | 'balanced' = 'balanced';
  if (longTotal > shortTotal * 1.5) dominantSide = 'longs';
  else if (shortTotal > longTotal * 1.5) dominantSide = 'shorts';

  let riskLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';
  let interpretation = 'Low liquidation volume — stable market';

  if (total24h > 500000000) { // > $500M
    riskLevel = 'extreme';
    interpretation = `Extreme liquidations ($${(total24h / 1e6).toFixed(0)}M) — high volatility, cascades possible`;
  } else if (total24h > 200000000) { // > $200M
    riskLevel = 'high';
    interpretation = `High liquidations ($${(total24h / 1e6).toFixed(0)}M) — significant forced selling`;
  } else if (total24h > 50000000) { // > $50M
    riskLevel = 'medium';
    interpretation = `Moderate liquidations ($${(total24h / 1e6).toFixed(0)}M) — normal volatility`;
  }

  if (dominantSide !== 'balanced') {
    interpretation += ` ${dominantSide === 'longs' ? 'Longs' : 'Shorts'} getting rekt.`;
  }

  return {
    btc,
    eth,
    total24h,
    dominantSide,
    riskLevel,
    interpretation,
    fetchedAt: Date.now()
  };
}

// === COMBINED DERIVATIVES SNAPSHOT ===

export interface DerivativesSnapshot {
  funding: FundingSnapshot;
  openInterest: OISnapshot;
  liquidations: LiquidationSnapshot;
  fetchedAt: number;
  cryptoImplication: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    factors: string[];
  };
}

export async function fetchDerivativesSnapshot(): Promise<DerivativesSnapshot> {
  const [funding, openInterest, liquidations] = await Promise.all([
    fetchFundingSnapshot(),
    fetchOISnapshot(),
    fetchLiquidationSnapshot()
  ]);

  // Analyze for crypto implication
  const factors: string[] = [];
  let score = 0; // Positive = bullish, negative = bearish

  // Funding analysis
  if (funding.sentiment === 'overleveraged_long') {
    score -= 1;
    factors.push('High funding → long squeeze risk');
  } else if (funding.sentiment === 'overleveraged_short') {
    score += 1;
    factors.push('Negative funding → short squeeze potential');
  }

  // Liquidation analysis
  if (liquidations.riskLevel === 'high' || liquidations.riskLevel === 'extreme') {
    if (liquidations.dominantSide === 'longs') {
      score -= 1;
      factors.push('Longs liquidated → more downside possible');
    } else if (liquidations.dominantSide === 'shorts') {
      score += 1;
      factors.push('Shorts liquidated → bounce likely');
    }
  }

  // OI analysis
  if (openInterest.trend === 'rising') {
    factors.push('Rising OI → trend conviction');
  } else if (openInterest.trend === 'falling') {
    factors.push('Falling OI → deleveraging');
  }

  let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (score >= 1) direction = 'bullish';
  else if (score <= -1) direction = 'bearish';

  const confidence = Math.min(Math.abs(score) * 20 + 35, 75);

  return {
    funding,
    openInterest,
    liquidations,
    fetchedAt: Date.now(),
    cryptoImplication: {
      direction,
      confidence,
      factors
    }
  };
}
