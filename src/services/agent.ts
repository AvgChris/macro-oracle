// Agent-Focused Services
// Simple, actionable endpoints for AI agent decision-making

import { getNextCriticalEvent, getHistoricalImpact } from './calendar.js';
import { fetchCurrentFearGreed } from './historical.js';
import { fetchVix } from './yahoo.js';
import axios from 'axios';

interface TransactionDecision {
  shouldTransact: boolean;
  confidence: number;  // 0-100
  reasoning: string;
  factors: {
    name: string;
    signal: 'green' | 'yellow' | 'red';
    weight: number;
    detail: string;
  }[];
  recommendation: string;
  waitUntil?: string;  // ISO timestamp if should wait
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
}

interface SolanaMetrics {
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  tvl: number;
  tvlChange24h: number;
  dexVolume24h: number;
  activeAddresses24h: number;
  tps: number;
  stakingYield: number;
  macroContext: {
    fearGreed: number;
    correlation: {
      btc: number;
      eth: number;
      spy: number;
    };
    trend: 'bullish' | 'bearish' | 'neutral';
  };
  fetchedAt: number;
}

/**
 * Simple yes/no decision: Should an agent execute a USDC transaction now?
 * Considers: upcoming events, fear/greed, volatility, time of day
 */
export async function shouldTransact(
  amount?: number,
  urgency: 'low' | 'medium' | 'high' = 'medium'
): Promise<TransactionDecision> {
  const factors: TransactionDecision['factors'] = [];
  let score = 50; // Start neutral
  
  // 1. Check Fear & Greed
  const fearGreed = await fetchCurrentFearGreed();
  if (fearGreed.value < 20) {
    factors.push({
      name: 'Fear & Greed',
      signal: 'red',
      weight: -20,
      detail: `Extreme fear (${fearGreed.value}) - high volatility expected`
    });
    score -= 20;
  } else if (fearGreed.value < 35) {
    factors.push({
      name: 'Fear & Greed',
      signal: 'yellow',
      weight: -10,
      detail: `Fear territory (${fearGreed.value}) - elevated volatility`
    });
    score -= 10;
  } else if (fearGreed.value > 75) {
    factors.push({
      name: 'Fear & Greed',
      signal: 'yellow',
      weight: -5,
      detail: `Greed territory (${fearGreed.value}) - potential reversal risk`
    });
    score -= 5;
  } else {
    factors.push({
      name: 'Fear & Greed',
      signal: 'green',
      weight: 10,
      detail: `Neutral sentiment (${fearGreed.value}) - stable conditions`
    });
    score += 10;
  }

  // 2. Check upcoming critical events
  const nextEvent = getNextCriticalEvent();
  if (nextEvent) {
    const eventTime = new Date(`${nextEvent.date}T${nextEvent.time}:00Z`).getTime();
    const hoursUntil = (eventTime - Date.now()) / (1000 * 60 * 60);
    
    if (hoursUntil < 2) {
      factors.push({
        name: 'Upcoming Event',
        signal: 'red',
        weight: -30,
        detail: `${nextEvent.name} in ${hoursUntil.toFixed(1)}h - expect volatility`
      });
      score -= 30;
    } else if (hoursUntil < 6) {
      factors.push({
        name: 'Upcoming Event',
        signal: 'yellow',
        weight: -15,
        detail: `${nextEvent.name} in ${hoursUntil.toFixed(1)}h - caution advised`
      });
      score -= 15;
    } else if (hoursUntil < 24) {
      factors.push({
        name: 'Upcoming Event',
        signal: 'yellow',
        weight: -5,
        detail: `${nextEvent.name} in ${hoursUntil.toFixed(1)}h - monitor conditions`
      });
      score -= 5;
    } else {
      factors.push({
        name: 'Upcoming Event',
        signal: 'green',
        weight: 5,
        detail: `Next critical event (${nextEvent.name}) is ${hoursUntil.toFixed(0)}h away`
      });
      score += 5;
    }
  } else {
    factors.push({
      name: 'Upcoming Event',
      signal: 'green',
      weight: 10,
      detail: 'No critical events in the near term'
    });
    score += 10;
  }

  // 3. Check VIX
  try {
    const vix = await fetchVix();
    if (vix && vix.value) {
      if (vix.value > 30) {
        factors.push({
          name: 'VIX',
          signal: 'red',
          weight: -20,
          detail: `VIX at ${vix.value.toFixed(1)} - extreme market fear`
        });
        score -= 20;
      } else if (vix.value > 25) {
        factors.push({
          name: 'VIX',
          signal: 'yellow',
          weight: -10,
          detail: `VIX at ${vix.value.toFixed(1)} - elevated volatility`
        });
        score -= 10;
      } else if (vix.value > 20) {
        factors.push({
          name: 'VIX',
          signal: 'yellow',
          weight: -5,
          detail: `VIX at ${vix.value.toFixed(1)} - above normal`
        });
        score -= 5;
      } else {
        factors.push({
          name: 'VIX',
          signal: 'green',
          weight: 5,
          detail: `VIX at ${vix.value.toFixed(1)} - calm markets`
        });
        score += 5;
      }
    }
  } catch (e) {
    // VIX fetch failed, continue without it
  }

  // 4. Check time of day (market hours vs off-hours)
  const hour = new Date().getUTCHours();
  const isUSMarketHours = hour >= 14 && hour < 21; // 9 AM - 4 PM ET
  const isAsiaHours = hour >= 0 && hour < 8;
  
  if (isUSMarketHours) {
    factors.push({
      name: 'Market Hours',
      signal: 'green',
      weight: 5,
      detail: 'US market hours - higher liquidity'
    });
    score += 5;
  } else if (isAsiaHours) {
    factors.push({
      name: 'Market Hours',
      signal: 'yellow',
      weight: 0,
      detail: 'Asia hours - moderate liquidity'
    });
  } else {
    factors.push({
      name: 'Market Hours',
      signal: 'yellow',
      weight: -5,
      detail: 'Off-peak hours - lower liquidity'
    });
    score -= 5;
  }

  // 5. Adjust for urgency
  if (urgency === 'high') {
    score += 20; // More willing to transact if urgent
  } else if (urgency === 'low') {
    score -= 10; // More conservative if not urgent
  }

  // 6. Adjust for amount (larger amounts = more conservative)
  if (amount && amount > 10000) {
    score -= 10;
    factors.push({
      name: 'Amount',
      signal: 'yellow',
      weight: -10,
      detail: `Large transaction ($${amount.toLocaleString()}) - extra caution`
    });
  }

  // Calculate final decision
  const shouldTransact = score >= 40;
  const confidence = Math.min(100, Math.max(0, Math.abs(score - 50) * 2));
  
  // Determine risk level
  let riskLevel: TransactionDecision['riskLevel'] = 'low';
  if (score < 20) riskLevel = 'extreme';
  else if (score < 35) riskLevel = 'high';
  else if (score < 50) riskLevel = 'medium';

  // Generate recommendation
  let recommendation = '';
  let waitUntil: string | undefined;
  
  if (shouldTransact) {
    if (score >= 70) {
      recommendation = 'Excellent conditions for transaction. Proceed with confidence.';
    } else if (score >= 55) {
      recommendation = 'Good conditions. Safe to proceed.';
    } else {
      recommendation = 'Acceptable conditions. Proceed with normal caution.';
    }
  } else {
    if (nextEvent) {
      const eventTime = new Date(`${nextEvent.date}T${nextEvent.time}:00Z`);
      const waitTime = new Date(eventTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours after event
      waitUntil = waitTime.toISOString();
      recommendation = `Wait until after ${nextEvent.name}. Suggested: ${waitTime.toISOString()}`;
    } else if (fearGreed.value < 20) {
      recommendation = 'Extreme fear conditions. Wait for sentiment to stabilize (F&G > 25).';
    } else {
      recommendation = 'Conditions unfavorable. Consider waiting 4-6 hours and re-checking.';
    }
  }

  return {
    shouldTransact,
    confidence,
    reasoning: `Score: ${score}/100. ${factors.filter(f => f.signal === 'red').length} red flags, ${factors.filter(f => f.signal === 'yellow').length} cautions.`,
    factors,
    recommendation,
    waitUntil,
    riskLevel
  };
}

/**
 * One-line market summary for quick agent consumption
 */
export async function getTldr(): Promise<{
  summary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  action: string;
  fearGreed: number;
  nextEvent: string | null;
}> {
  const fearGreed = await fetchCurrentFearGreed();
  const nextEvent = getNextCriticalEvent();
  
  let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let summary = '';
  let action = '';
  
  if (fearGreed.value < 20) {
    sentiment = 'bearish';
    summary = `Extreme fear (F&G: ${fearGreed.value}). Historically, this precedes +14% avg returns over 30d.`;
    action = 'Consider accumulating. DCA if bullish long-term.';
  } else if (fearGreed.value < 35) {
    sentiment = 'bearish';
    summary = `Fear territory (F&G: ${fearGreed.value}). Market stressed but not extreme.`;
    action = 'Cautious positioning. Wait for confirmation.';
  } else if (fearGreed.value > 75) {
    sentiment = 'bullish';
    summary = `Greed territory (F&G: ${fearGreed.value}). Potential for pullback.`;
    action = 'Consider taking profits. Avoid FOMO entries.';
  } else {
    sentiment = 'neutral';
    summary = `Neutral sentiment (F&G: ${fearGreed.value}). No extreme conditions.`;
    action = 'Normal operations. Follow your strategy.';
  }
  
  if (nextEvent) {
    const eventTime = new Date(`${nextEvent.date}T${nextEvent.time}:00Z`).getTime();
    const hoursUntil = (eventTime - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < 24) {
      summary += ` ${nextEvent.name} in ${hoursUntil.toFixed(0)}h.`;
    }
  }
  
  return {
    summary,
    sentiment,
    action,
    fearGreed: fearGreed.value,
    nextEvent: nextEvent ? `${nextEvent.name} on ${nextEvent.date}` : null
  };
}

/**
 * Fetch Solana-specific metrics
 */
export async function fetchSolanaMetrics(): Promise<SolanaMetrics> {
  const fearGreed = await fetchCurrentFearGreed();
  
  // Fetch SOL price from CoinGecko
  let solPrice = 0;
  let solChange24h = 0;
  let solVolume = 0;
  let solMcap = 0;
  
  try {
    const cgRes = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true',
      { timeout: 5000 }
    );
    solPrice = cgRes.data.solana.usd || 0;
    solChange24h = cgRes.data.solana.usd_24h_change || 0;
    solVolume = cgRes.data.solana.usd_24h_vol || 0;
    solMcap = cgRes.data.solana.usd_market_cap || 0;
  } catch (e) {
    // Use fallback
    solPrice = 95;
  }
  
  // Fetch Solana TVL from DeFiLlama
  let tvl = 0;
  let tvlChange24h = 0;
  
  try {
    const llamaRes = await axios.get(
      'https://api.llama.fi/v2/chains',
      { timeout: 5000 }
    );
    const solana = llamaRes.data.find((c: any) => c.name === 'Solana');
    if (solana) {
      tvl = solana.tvl || 0;
    }
  } catch (e) {
    tvl = 8000000000; // ~$8B fallback
  }
  
  // Fetch Solana network stats
  let tps = 0;
  
  try {
    const solanaRes = await axios.post(
      'https://api.mainnet-beta.solana.com',
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'getRecentPerformanceSamples',
        params: [1]
      },
      { timeout: 5000 }
    );
    if (solanaRes.data.result && solanaRes.data.result[0]) {
      const sample = solanaRes.data.result[0];
      tps = Math.round(sample.numTransactions / sample.samplePeriodSecs);
    }
  } catch (e) {
    tps = 2500; // Typical Solana TPS
  }
  
  // Determine trend
  let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (solChange24h > 3) trend = 'bullish';
  else if (solChange24h < -3) trend = 'bearish';
  
  return {
    price: solPrice,
    priceChange24h: solChange24h,
    volume24h: solVolume,
    marketCap: solMcap,
    tvl,
    tvlChange24h,
    dexVolume24h: solVolume * 0.3, // Estimate DEX is ~30% of volume
    activeAddresses24h: 0, // Would need Solscan API
    tps,
    stakingYield: 6.5, // ~6.5% current staking yield
    macroContext: {
      fearGreed: fearGreed.value,
      correlation: {
        btc: 0.85,  // SOL highly correlated with BTC
        eth: 0.82,
        spy: 0.45
      },
      trend
    },
    fetchedAt: Date.now()
  };
}

/**
 * Volatility forecast for the next 24 hours
 */
export async function forecastVolatility(): Promise<{
  forecast: 'low' | 'moderate' | 'high' | 'extreme';
  confidence: number;
  expectedRange: { btc: number; eth: number; sol: number };
  drivers: string[];
  recommendation: string;
}> {
  const fearGreed = await fetchCurrentFearGreed();
  const nextEvent = getNextCriticalEvent();
  const drivers: string[] = [];
  let volatilityScore = 0;
  
  // Factor 1: Fear & Greed
  if (fearGreed.value < 20 || fearGreed.value > 80) {
    volatilityScore += 30;
    drivers.push(`Extreme sentiment (F&G: ${fearGreed.value})`);
  } else if (fearGreed.value < 35 || fearGreed.value > 65) {
    volatilityScore += 15;
    drivers.push(`Elevated sentiment (F&G: ${fearGreed.value})`);
  }
  
  // Factor 2: Upcoming events
  if (nextEvent) {
    const eventTime = new Date(`${nextEvent.date}T${nextEvent.time}:00Z`).getTime();
    const hoursUntil = (eventTime - Date.now()) / (1000 * 60 * 60);
    const impact = getHistoricalImpact(nextEvent.type);
    
    if (hoursUntil < 24) {
      volatilityScore += Math.round(impact.avgBtcMove * 5);
      drivers.push(`${nextEvent.name} in ${hoursUntil.toFixed(0)}h (avg ${impact.avgBtcMove}% BTC move)`);
    }
  }
  
  // Factor 3: VIX
  try {
    const vix = await fetchVix();
    if (vix && vix.value > 25) {
      volatilityScore += 20;
      drivers.push(`Elevated VIX (${vix.value.toFixed(1)})`);
    }
  } catch (e) {}
  
  // Determine forecast
  let forecast: 'low' | 'moderate' | 'high' | 'extreme' = 'low';
  let expectedBtc = 2;
  let expectedEth = 2.5;
  let expectedSol = 3;
  
  if (volatilityScore >= 50) {
    forecast = 'extreme';
    expectedBtc = 8;
    expectedEth = 10;
    expectedSol = 12;
  } else if (volatilityScore >= 35) {
    forecast = 'high';
    expectedBtc = 5;
    expectedEth = 6;
    expectedSol = 7;
  } else if (volatilityScore >= 20) {
    forecast = 'moderate';
    expectedBtc = 3;
    expectedEth = 3.5;
    expectedSol = 4;
  }
  
  const recommendations: Record<string, string> = {
    low: 'Normal trading conditions. Standard position sizing appropriate.',
    moderate: 'Above-average volatility expected. Consider reducing position sizes by 25%.',
    high: 'High volatility expected. Reduce exposure and widen stop-losses.',
    extreme: 'Extreme volatility expected. Avoid new positions, consider hedging existing exposure.'
  };
  
  return {
    forecast,
    confidence: Math.min(85, 50 + drivers.length * 10),
    expectedRange: {
      btc: expectedBtc,
      eth: expectedEth,
      sol: expectedSol
    },
    drivers: drivers.length > 0 ? drivers : ['No significant volatility drivers identified'],
    recommendation: recommendations[forecast]
  };
}
