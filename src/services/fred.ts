// FRED API Service - Federal Reserve Economic Data
// Official Fed data for macro analysis

import axios from 'axios';

const FRED_API_BASE = 'https://api.stlouisfed.org/fred/series/observations';
const FRED_API_KEY = process.env.FRED_API_KEY || '19d578bce7afde20288efe50aa08ff25';
const CACHE_TTL = 300000; // 5 minute cache (FRED updates daily)

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

// FRED series IDs
const FRED_SERIES = {
  FED_FUNDS: 'FEDFUNDS',        // Federal Funds Effective Rate
  CPI: 'CPIAUCSL',              // Consumer Price Index
  YIELD_CURVE: 'T10Y2Y',        // 10Y-2Y Spread (inversion indicator)
  TREASURY_10Y: 'DGS10',        // 10-Year Treasury Yield
  TREASURY_2Y: 'DGS2',          // 2-Year Treasury Yield
  UNEMPLOYMENT: 'UNRATE',       // Unemployment Rate
  INFLATION_EXPECT: 'T5YIE',    // 5-Year Breakeven Inflation
};

interface FredObservation {
  date: string;
  value: string;
}

async function fetchFredSeries(seriesId: string, limit: number = 1): Promise<FredObservation[] | null> {
  const cacheKey = `fred_${seriesId}`;
  const cached = getCached<FredObservation[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await axios.get(FRED_API_BASE, {
      params: {
        series_id: seriesId,
        api_key: FRED_API_KEY,
        file_type: 'json',
        sort_order: 'desc',
        limit: limit
      },
      timeout: 10000
    });

    const observations = res.data.observations?.filter(
      (obs: FredObservation) => obs.value !== '.'
    ) || [];

    setCache(cacheKey, observations);
    return observations;
  } catch (error) {
    console.error(`Failed to fetch FRED series ${seriesId}:`, error);
    return null;
  }
}

export interface FedFundsData {
  rate: number;
  date: string;
  trend: 'rising' | 'stable' | 'falling';
}

export async function fetchFedFundsRate(): Promise<FedFundsData | null> {
  const observations = await fetchFredSeries(FRED_SERIES.FED_FUNDS, 3);
  if (!observations || observations.length === 0) return null;

  const current = parseFloat(observations[0].value);
  const previous = observations[1] ? parseFloat(observations[1].value) : current;

  let trend: 'rising' | 'stable' | 'falling' = 'stable';
  if (current > previous + 0.1) trend = 'rising';
  else if (current < previous - 0.1) trend = 'falling';

  return {
    rate: current,
    date: observations[0].date,
    trend
  };
}

export interface CpiData {
  value: number;
  date: string;
  yoyChange: number | null;
}

export async function fetchCpi(): Promise<CpiData | null> {
  const observations = await fetchFredSeries(FRED_SERIES.CPI, 13); // 13 months for YoY
  if (!observations || observations.length === 0) return null;

  const current = parseFloat(observations[0].value);
  const yearAgo = observations[12] ? parseFloat(observations[12].value) : null;
  
  const yoyChange = yearAgo ? ((current - yearAgo) / yearAgo) * 100 : null;

  return {
    value: current,
    date: observations[0].date,
    yoyChange: yoyChange ? Math.round(yoyChange * 100) / 100 : null
  };
}

export interface TreasuryData {
  yield10y: number;
  yield2y: number;
  spread: number;
  inverted: boolean;
  date: string;
}

export async function fetchTreasuryYields(): Promise<TreasuryData | null> {
  const [y10, y2, spread] = await Promise.all([
    fetchFredSeries(FRED_SERIES.TREASURY_10Y, 1),
    fetchFredSeries(FRED_SERIES.TREASURY_2Y, 1),
    fetchFredSeries(FRED_SERIES.YIELD_CURVE, 1)
  ]);

  if (!y10 || !y2 || y10.length === 0 || y2.length === 0) return null;

  const yield10y = parseFloat(y10[0].value);
  const yield2y = parseFloat(y2[0].value);
  const curveSpread = spread?.[0] ? parseFloat(spread[0].value) : yield10y - yield2y;

  return {
    yield10y,
    yield2y,
    spread: Math.round(curveSpread * 100) / 100,
    inverted: curveSpread < 0,
    date: y10[0].date
  };
}

export interface UnemploymentData {
  rate: number;
  date: string;
  trend: 'rising' | 'stable' | 'falling';
}

export async function fetchUnemployment(): Promise<UnemploymentData | null> {
  const observations = await fetchFredSeries(FRED_SERIES.UNEMPLOYMENT, 3);
  if (!observations || observations.length === 0) return null;

  const current = parseFloat(observations[0].value);
  const previous = observations[1] ? parseFloat(observations[1].value) : current;

  let trend: 'rising' | 'stable' | 'falling' = 'stable';
  if (current > previous + 0.1) trend = 'rising';
  else if (current < previous - 0.1) trend = 'falling';

  return {
    rate: current,
    date: observations[0].date,
    trend
  };
}

export interface InflationExpectationsData {
  rate: number;
  date: string;
  elevated: boolean;
}

export async function fetchInflationExpectations(): Promise<InflationExpectationsData | null> {
  const observations = await fetchFredSeries(FRED_SERIES.INFLATION_EXPECT, 1);
  if (!observations || observations.length === 0) return null;

  const rate = parseFloat(observations[0].value);

  return {
    rate,
    date: observations[0].date,
    elevated: rate > 2.5 // Fed target is 2%
  };
}

export interface FredMacroSnapshot {
  fedFunds: FedFundsData | null;
  cpi: CpiData | null;
  treasury: TreasuryData | null;
  unemployment: UnemploymentData | null;
  inflationExpectations: InflationExpectationsData | null;
  fetchedAt: number;
  summary: {
    monetaryPolicy: 'tight' | 'neutral' | 'loose';
    yieldCurve: 'normal' | 'flat' | 'inverted';
    laborMarket: 'strong' | 'moderate' | 'weak';
    inflationRisk: 'high' | 'moderate' | 'low';
  };
}

export async function fetchFredSnapshot(): Promise<FredMacroSnapshot> {
  const [fedFunds, cpi, treasury, unemployment, inflationExpect] = await Promise.all([
    fetchFedFundsRate(),
    fetchCpi(),
    fetchTreasuryYields(),
    fetchUnemployment(),
    fetchInflationExpectations()
  ]);

  // Derive summary
  let monetaryPolicy: 'tight' | 'neutral' | 'loose' = 'neutral';
  if (fedFunds) {
    if (fedFunds.rate > 4.5) monetaryPolicy = 'tight';
    else if (fedFunds.rate < 2.0) monetaryPolicy = 'loose';
  }

  let yieldCurve: 'normal' | 'flat' | 'inverted' = 'normal';
  if (treasury) {
    if (treasury.inverted) yieldCurve = 'inverted';
    else if (Math.abs(treasury.spread) < 0.3) yieldCurve = 'flat';
  }

  let laborMarket: 'strong' | 'moderate' | 'weak' = 'moderate';
  if (unemployment) {
    if (unemployment.rate < 4.0) laborMarket = 'strong';
    else if (unemployment.rate > 5.5) laborMarket = 'weak';
  }

  let inflationRisk: 'high' | 'moderate' | 'low' = 'moderate';
  if (cpi?.yoyChange) {
    if (cpi.yoyChange > 4.0) inflationRisk = 'high';
    else if (cpi.yoyChange < 2.5) inflationRisk = 'low';
  }

  return {
    fedFunds,
    cpi,
    treasury,
    unemployment,
    inflationExpectations: inflationExpect,
    fetchedAt: Date.now(),
    summary: {
      monetaryPolicy,
      yieldCurve,
      laborMarket,
      inflationRisk
    }
  };
}

// Crypto impact analysis based on FRED data
export function analyzeCryptoImpact(snapshot: FredMacroSnapshot): {
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  factors: string[];
} {
  const factors: string[] = [];
  let score = 0; // Positive = bullish, negative = bearish

  // Fed Funds Rate impact
  if (snapshot.fedFunds) {
    if (snapshot.fedFunds.trend === 'falling') {
      score += 2;
      factors.push('Fed cutting rates → risk-on');
    } else if (snapshot.fedFunds.trend === 'rising') {
      score -= 2;
      factors.push('Fed hiking rates → risk-off');
    }
    if (snapshot.fedFunds.rate > 5.0) {
      score -= 1;
      factors.push('High rates pressuring risk assets');
    }
  }

  // Yield curve impact
  if (snapshot.treasury) {
    if (snapshot.treasury.inverted) {
      score -= 1;
      factors.push('Inverted yield curve → recession signal');
    }
  }

  // Inflation impact
  if (snapshot.cpi?.yoyChange) {
    if (snapshot.cpi.yoyChange > 4.0) {
      score -= 1;
      factors.push('High inflation → Fed stays hawkish');
    } else if (snapshot.cpi.yoyChange < 2.5) {
      score += 1;
      factors.push('Cooling inflation → Fed may ease');
    }
  }

  // Labor market
  if (snapshot.unemployment) {
    if (snapshot.unemployment.trend === 'rising') {
      score += 1; // Counterintuitive but bad employment = Fed eases
      factors.push('Rising unemployment → Fed may pivot');
    }
  }

  // Calculate direction and confidence
  let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (score >= 2) direction = 'bullish';
  else if (score <= -2) direction = 'bearish';

  const confidence = Math.min(Math.abs(score) * 20 + 30, 90);

  return { direction, confidence, factors };
}
