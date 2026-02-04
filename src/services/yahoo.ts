// Yahoo Finance Service - Stocks, VIX, Gold
// Free market data for macro context

import axios from 'axios';

const CACHE_TTL = 120000; // 2 minute cache

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

// Yahoo Finance API (unofficial but reliable)
const YAHOO_API = 'https://query1.finance.yahoo.com/v8/finance/chart';

interface YahooQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
}

async function fetchYahooQuote(symbol: string): Promise<YahooQuote | null> {
  const cacheKey = `yahoo_${symbol}`;
  const cached = getCached<YahooQuote>(cacheKey);
  if (cached) return cached;

  try {
    const res = await axios.get(`${YAHOO_API}/${symbol}`, {
      params: {
        interval: '1d',
        range: '1d'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MacroOracle/1.0)'
      },
      timeout: 10000
    });

    const meta = res.data.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price = meta.regularMarketPrice || meta.previousClose;
    const previousClose = meta.previousClose || price;
    const change = price - previousClose;
    const changePercent = (change / previousClose) * 100;

    const quote: YahooQuote = {
      symbol,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      previousClose
    };

    setCache(cacheKey, quote);
    return quote;
  } catch (error) {
    console.error(`Failed to fetch Yahoo quote for ${symbol}:`, error);
    return null;
  }
}

// Key symbols
const SYMBOLS = {
  SP500: '^GSPC',
  NASDAQ: '^IXIC',
  VIX: '^VIX',
  GOLD: 'GC=F',
  DXY: 'DX-Y.NYB',
  OIL: 'CL=F',
  TREASURY_10Y: '^TNX'
};

export interface EquityData {
  sp500: YahooQuote | null;
  nasdaq: YahooQuote | null;
  trend: 'bullish' | 'bearish' | 'mixed';
}

export async function fetchEquities(): Promise<EquityData> {
  const [sp500, nasdaq] = await Promise.all([
    fetchYahooQuote(SYMBOLS.SP500),
    fetchYahooQuote(SYMBOLS.NASDAQ)
  ]);

  let trend: 'bullish' | 'bearish' | 'mixed' = 'mixed';
  if (sp500 && nasdaq) {
    if (sp500.changePercent > 0.3 && nasdaq.changePercent > 0.3) {
      trend = 'bullish';
    } else if (sp500.changePercent < -0.3 && nasdaq.changePercent < -0.3) {
      trend = 'bearish';
    }
  }

  return { sp500, nasdaq, trend };
}

export interface VixData {
  value: number;
  change: number;
  changePercent: number;
  level: 'low' | 'normal' | 'elevated' | 'high' | 'extreme';
  interpretation: string;
}

export async function fetchVix(): Promise<VixData | null> {
  const quote = await fetchYahooQuote(SYMBOLS.VIX);
  if (!quote) return null;

  let level: 'low' | 'normal' | 'elevated' | 'high' | 'extreme' = 'normal';
  let interpretation = 'Normal volatility expectations';

  if (quote.price < 12) {
    level = 'low';
    interpretation = 'Extreme complacency — potential reversal setup';
  } else if (quote.price < 18) {
    level = 'normal';
    interpretation = 'Normal volatility — risk-on environment';
  } else if (quote.price < 25) {
    level = 'elevated';
    interpretation = 'Elevated fear — caution warranted';
  } else if (quote.price < 35) {
    level = 'high';
    interpretation = 'High fear — potential capitulation';
  } else {
    level = 'extreme';
    interpretation = 'Extreme fear — panic selling, possible bottom';
  }

  return {
    value: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    level,
    interpretation
  };
}

export interface GoldData {
  price: number;
  change: number;
  changePercent: number;
  trend: 'rising' | 'falling' | 'stable';
  safeHavenFlow: 'strong' | 'moderate' | 'weak';
}

export async function fetchGold(): Promise<GoldData | null> {
  const quote = await fetchYahooQuote(SYMBOLS.GOLD);
  if (!quote) return null;

  let trend: 'rising' | 'falling' | 'stable' = 'stable';
  if (quote.changePercent > 0.5) trend = 'rising';
  else if (quote.changePercent < -0.5) trend = 'falling';

  let safeHavenFlow: 'strong' | 'moderate' | 'weak' = 'moderate';
  if (quote.changePercent > 1.0) safeHavenFlow = 'strong';
  else if (quote.changePercent < -0.5) safeHavenFlow = 'weak';

  return {
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    trend,
    safeHavenFlow
  };
}

export interface TradFiSnapshot {
  equities: EquityData;
  vix: VixData | null;
  gold: GoldData | null;
  dxy: YahooQuote | null;
  oil: YahooQuote | null;
  fetchedAt: number;
  riskAppetite: 'risk-on' | 'risk-off' | 'neutral';
  cryptoImplication: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    factors: string[];
  };
}

export async function fetchTradFiSnapshot(): Promise<TradFiSnapshot> {
  const [equities, vix, gold, dxy, oil] = await Promise.all([
    fetchEquities(),
    fetchVix(),
    fetchGold(),
    fetchYahooQuote(SYMBOLS.DXY),
    fetchYahooQuote(SYMBOLS.OIL)
  ]);

  // Determine risk appetite
  let riskScore = 0;
  const factors: string[] = [];

  if (equities.trend === 'bullish') {
    riskScore += 2;
    factors.push('Equities rallying → risk-on');
  } else if (equities.trend === 'bearish') {
    riskScore -= 2;
    factors.push('Equities selling off → risk-off');
  }

  if (vix) {
    if (vix.level === 'low' || vix.level === 'normal') {
      riskScore += 1;
      factors.push(`VIX at ${vix.value} → low fear`);
    } else if (vix.level === 'high' || vix.level === 'extreme') {
      riskScore -= 2;
      factors.push(`VIX at ${vix.value} → high fear`);
    }
  }

  if (gold?.safeHavenFlow === 'strong') {
    riskScore -= 1;
    factors.push('Gold rising → safe haven bid');
  } else if (gold?.safeHavenFlow === 'weak') {
    riskScore += 1;
    factors.push('Gold weak → risk appetite');
  }

  if (dxy && dxy.changePercent > 0.5) {
    riskScore -= 1;
    factors.push('DXY strengthening → headwind for crypto');
  } else if (dxy && dxy.changePercent < -0.5) {
    riskScore += 1;
    factors.push('DXY weakening → tailwind for crypto');
  }

  let riskAppetite: 'risk-on' | 'risk-off' | 'neutral' = 'neutral';
  if (riskScore >= 2) riskAppetite = 'risk-on';
  else if (riskScore <= -2) riskAppetite = 'risk-off';

  let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (riskScore >= 2) direction = 'bullish';
  else if (riskScore <= -2) direction = 'bearish';

  const confidence = Math.min(Math.abs(riskScore) * 15 + 30, 85);

  return {
    equities,
    vix,
    gold,
    dxy,
    oil,
    fetchedAt: Date.now(),
    riskAppetite,
    cryptoImplication: {
      direction,
      confidence,
      factors
    }
  };
}
