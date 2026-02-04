// Market Data Service
// Fetches and caches market data for correlation analysis

import { MarketSnapshot, CorrelationData } from '../types.js';

// Simulated current market data
// In production, this would fetch from CoinGecko, Yahoo Finance, TradingView, etc.
let currentSnapshot: MarketSnapshot = {
  timestamp: Date.now(),
  dxy: 109.45,        // Dollar index elevated
  us10y: 4.52,        // 10Y yield
  spx: 5890,          // S&P 500
  vix: 22.5,          // Elevated volatility
  gold: 2865,         // Gold price
  btc: 76350,         // BTC price
  eth: 2680,          // ETH price
  totalCryptoMcap: 2.45e12  // $2.45T
};

// Historical correlation data (pre-computed from historical analysis)
const CORRELATIONS: CorrelationData[] = [
  { pair: 'DXY-BTC', correlation: -0.72, period: '30d', sampleSize: 30, updatedAt: Date.now() },
  { pair: 'DXY-ETH', correlation: -0.68, period: '30d', sampleSize: 30, updatedAt: Date.now() },
  { pair: 'SPX-BTC', correlation: 0.65, period: '30d', sampleSize: 30, updatedAt: Date.now() },
  { pair: 'US10Y-BTC', correlation: -0.58, period: '30d', sampleSize: 30, updatedAt: Date.now() },
  { pair: 'VIX-BTC', correlation: -0.71, period: '30d', sampleSize: 30, updatedAt: Date.now() },
  { pair: 'GOLD-BTC', correlation: 0.42, period: '30d', sampleSize: 30, updatedAt: Date.now() },
  { pair: 'BTC-ETH', correlation: 0.94, period: '30d', sampleSize: 30, updatedAt: Date.now() },
];

// DXY regime thresholds
const DXY_REGIMES = {
  weak: { max: 100, sentiment: 'risk_on', cryptoImpact: 'bullish' },
  neutral: { min: 100, max: 105, sentiment: 'neutral', cryptoImpact: 'neutral' },
  strong: { min: 105, max: 110, sentiment: 'risk_off', cryptoImpact: 'bearish' },
  extreme: { min: 110, sentiment: 'risk_off', cryptoImpact: 'very_bearish' }
} as const;

export function getMarketSnapshot(): MarketSnapshot {
  // Update timestamp
  currentSnapshot.timestamp = Date.now();
  return { ...currentSnapshot };
}

export function updateMarketData(partial: Partial<MarketSnapshot>): MarketSnapshot {
  currentSnapshot = {
    ...currentSnapshot,
    ...partial,
    timestamp: Date.now()
  };
  return { ...currentSnapshot };
}

export function getCorrelations(): CorrelationData[] {
  return [...CORRELATIONS];
}

export function getCorrelation(pair: string): CorrelationData | undefined {
  return CORRELATIONS.find(c => c.pair === pair);
}

export function getDxyRegime(): { 
  regime: string; 
  dxy: number;
  sentiment: string; 
  cryptoImpact: string;
  analysis: string;
} {
  const dxy = currentSnapshot.dxy;
  
  if (dxy < DXY_REGIMES.weak.max) {
    return {
      regime: 'weak',
      dxy,
      sentiment: 'risk_on',
      cryptoImpact: 'bullish',
      analysis: 'Weak dollar environment. Historically favorable for crypto and risk assets.'
    };
  } else if (dxy < DXY_REGIMES.neutral.max) {
    return {
      regime: 'neutral',
      dxy,
      sentiment: 'neutral',
      cryptoImpact: 'neutral',
      analysis: 'Dollar in neutral range. Watch for breakout direction.'
    };
  } else if (dxy < DXY_REGIMES.strong.max) {
    return {
      regime: 'strong',
      dxy,
      sentiment: 'risk_off',
      cryptoImpact: 'bearish',
      analysis: 'Strong dollar pressuring risk assets. Expect crypto headwinds.'
    };
  } else {
    return {
      regime: 'extreme',
      dxy,
      sentiment: 'risk_off',
      cryptoImpact: 'very_bearish',
      analysis: 'Extreme dollar strength. Major headwind for crypto. Watch for reversal signals.'
    };
  }
}

export function getRiskEnvironment(): {
  overall: 'risk_on' | 'risk_off' | 'mixed';
  factors: { name: string; signal: string; weight: number }[];
  score: number;  // -100 (risk off) to +100 (risk on)
} {
  const snapshot = currentSnapshot;
  const factors: { name: string; signal: string; weight: number }[] = [];
  let score = 0;
  
  // DXY factor (weight: 30)
  if (snapshot.dxy > 108) {
    factors.push({ name: 'DXY', signal: 'bearish', weight: -30 });
    score -= 30;
  } else if (snapshot.dxy < 102) {
    factors.push({ name: 'DXY', signal: 'bullish', weight: 30 });
    score += 30;
  } else {
    factors.push({ name: 'DXY', signal: 'neutral', weight: 0 });
  }
  
  // VIX factor (weight: 25)
  if (snapshot.vix > 25) {
    factors.push({ name: 'VIX', signal: 'bearish', weight: -25 });
    score -= 25;
  } else if (snapshot.vix < 15) {
    factors.push({ name: 'VIX', signal: 'bullish', weight: 25 });
    score += 25;
  } else {
    factors.push({ name: 'VIX', signal: 'neutral', weight: 0 });
  }
  
  // 10Y yield factor (weight: 20)
  if (snapshot.us10y > 4.5) {
    factors.push({ name: 'US10Y', signal: 'bearish', weight: -20 });
    score -= 20;
  } else if (snapshot.us10y < 3.5) {
    factors.push({ name: 'US10Y', signal: 'bullish', weight: 20 });
    score += 20;
  } else {
    factors.push({ name: 'US10Y', signal: 'neutral', weight: 0 });
  }
  
  // Equity factor (weight: 25)
  // Simplified: check if SPX is near highs or lows
  if (snapshot.spx > 5800) {
    factors.push({ name: 'SPX', signal: 'bullish', weight: 15 });
    score += 15;
  } else if (snapshot.spx < 5200) {
    factors.push({ name: 'SPX', signal: 'bearish', weight: -25 });
    score -= 25;
  } else {
    factors.push({ name: 'SPX', signal: 'neutral', weight: 0 });
  }
  
  let overall: 'risk_on' | 'risk_off' | 'mixed';
  if (score > 20) overall = 'risk_on';
  else if (score < -20) overall = 'risk_off';
  else overall = 'mixed';
  
  return { overall, factors, score };
}

export function getCryptoMarketState(): {
  btcPrice: number;
  ethPrice: number;
  totalMcap: number;
  btcDominance: number;
  trend: 'uptrend' | 'downtrend' | 'sideways';
  support: number;
  resistance: number;
} {
  const snapshot = currentSnapshot;
  const btcMcap = snapshot.btc * 19.5e6; // ~19.5M BTC supply
  const btcDominance = (btcMcap / snapshot.totalCryptoMcap) * 100;
  
  return {
    btcPrice: snapshot.btc,
    ethPrice: snapshot.eth,
    totalMcap: snapshot.totalCryptoMcap,
    btcDominance: Math.round(btcDominance * 10) / 10,
    trend: 'downtrend',  // Based on recent price action
    support: 73000,      // Recent lows
    resistance: 80000    // Recent highs
  };
}
