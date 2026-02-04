// Signal Generation Service
// Produces actionable macro signals for crypto agents

import { MacroSignal, MacroEvent, MarketSentiment, EconomicCalendarEntry } from '../types.js';
import { getHistoricalImpact, getNextCriticalEvent } from './calendar.js';
import { getDxyRegime, getRiskEnvironment, getCryptoMarketState, getMarketSnapshot } from './market.js';
import { randomUUID } from 'crypto';

// Store generated signals
const signalHistory: MacroSignal[] = [];

export function generateCurrentSignal(): MacroSignal {
  const dxyRegime = getDxyRegime();
  const riskEnv = getRiskEnvironment();
  const cryptoState = getCryptoMarketState();
  const nextEvent = getNextCriticalEvent();
  
  // Determine sentiment
  let sentiment: MarketSentiment;
  if (riskEnv.score > 20) sentiment = 'risk_on';
  else if (riskEnv.score < -20) sentiment = 'risk_off';
  else if (Math.abs(riskEnv.score) < 10) sentiment = 'neutral';
  else sentiment = 'uncertain';
  
  // Calculate crypto impact
  const direction = riskEnv.score > 0 ? 'bullish' : riskEnv.score < 0 ? 'bearish' : 'neutral';
  const confidence = Math.min(90, Math.abs(riskEnv.score) + 30);
  const magnitude = Math.abs(riskEnv.score) > 50 ? 'large' : Math.abs(riskEnv.score) > 25 ? 'medium' : 'small';
  
  // Build reasoning
  const reasons: string[] = [];
  if (dxyRegime.regime === 'strong' || dxyRegime.regime === 'extreme') {
    reasons.push(`DXY at ${dxyRegime.dxy} (${dxyRegime.regime} dollar) pressuring risk assets`);
  }
  riskEnv.factors.forEach(f => {
    if (f.signal !== 'neutral') {
      reasons.push(`${f.name}: ${f.signal}`);
    }
  });
  if (nextEvent) {
    reasons.push(`Upcoming: ${nextEvent.name} on ${nextEvent.date}`);
  }
  
  const signal: MacroSignal = {
    id: randomUUID(),
    timestamp: Date.now(),
    sentiment,
    cryptoImpact: {
      direction,
      confidence,
      magnitude,
      reasoning: reasons.join('. ') || 'No major signals.'
    },
    affectedAssets: ['BTC', 'ETH', 'SOL'],
    historicalContext: {
      similarEvents: 12,
      avgBtcMove: direction === 'bearish' ? -4.2 : 3.8,
      avgEthMove: direction === 'bearish' ? -5.1 : 4.5,
      winRate: 68
    }
  };
  
  // Store in history
  signalHistory.unshift(signal);
  if (signalHistory.length > 100) signalHistory.pop();
  
  return signal;
}

export function generateEventSignal(event: EconomicCalendarEntry): MacroSignal {
  const historical = getHistoricalImpact(event.type);
  const riskEnv = getRiskEnvironment();
  
  // Determine direction based on event type and historical patterns
  let direction: 'bullish' | 'bearish' | 'neutral';
  let confidence: number;
  
  if (historical.direction === 'negative_correlation') {
    // Events like CPI, rate decisions - beat expectations = bearish for crypto
    direction = 'bearish';
    confidence = 65;
  } else if (historical.direction === 'positive_correlation') {
    direction = 'bullish';
    confidence = 60;
  } else {
    direction = 'neutral';
    confidence = 50;
  }
  
  // Adjust confidence based on impact level
  if (event.impact === 'critical') confidence += 15;
  else if (event.impact === 'high') confidence += 10;
  
  const signal: MacroSignal = {
    id: randomUUID(),
    timestamp: Date.now(),
    event: {
      id: event.id,
      type: event.type,
      name: event.name,
      timestamp: new Date(`${event.date}T${event.time}:00Z`).getTime(),
      impact: event.impact,
      forecast: event.forecast,
      previous: event.previous,
      source: 'economic_calendar'
    },
    sentiment: riskEnv.overall === 'risk_on' ? 'risk_on' : riskEnv.overall === 'risk_off' ? 'risk_off' : 'uncertain',
    cryptoImpact: {
      direction,
      confidence,
      magnitude: event.impact === 'critical' ? 'large' : event.impact === 'high' ? 'medium' : 'small',
      reasoning: `${event.name}: ${historical.notes} Historical avg BTC move: ${historical.avgBtcMove}%`
    },
    affectedAssets: ['BTC', 'ETH', 'SOL'],
    historicalContext: {
      similarEvents: 24,
      avgBtcMove: historical.avgBtcMove * (direction === 'bearish' ? -1 : 1),
      avgEthMove: historical.avgEthMove * (direction === 'bearish' ? -1 : 1),
      winRate: 65
    }
  };
  
  signalHistory.unshift(signal);
  if (signalHistory.length > 100) signalHistory.pop();
  
  return signal;
}

export function getSignalHistory(limit: number = 20): MacroSignal[] {
  return signalHistory.slice(0, limit);
}

export function getLatestSignal(): MacroSignal | null {
  return signalHistory[0] || null;
}

export function generateSummary(): {
  currentState: string;
  outlook: string;
  keyRisks: string[];
  keyOpportunities: string[];
  actionItems: string[];
} {
  const dxyRegime = getDxyRegime();
  const riskEnv = getRiskEnvironment();
  const cryptoState = getCryptoMarketState();
  const nextEvent = getNextCriticalEvent();
  const snapshot = getMarketSnapshot();
  
  const keyRisks: string[] = [];
  const keyOpportunities: string[] = [];
  const actionItems: string[] = [];
  
  // Analyze risks
  if (dxyRegime.regime === 'strong' || dxyRegime.regime === 'extreme') {
    keyRisks.push(`Strong dollar (DXY ${dxyRegime.dxy}) creating headwinds`);
  }
  if (snapshot.vix > 20) {
    keyRisks.push(`Elevated volatility (VIX ${snapshot.vix})`);
  }
  if (snapshot.us10y > 4.5) {
    keyRisks.push(`High yields (10Y at ${snapshot.us10y}%) competing with risk assets`);
  }
  if (nextEvent) {
    keyRisks.push(`${nextEvent.name} on ${nextEvent.date} could drive volatility`);
  }
  
  // Analyze opportunities
  if (cryptoState.btcPrice < cryptoState.support * 1.1) {
    keyOpportunities.push(`BTC near support ($${cryptoState.support.toLocaleString()})`);
  }
  if (dxyRegime.regime === 'extreme') {
    keyOpportunities.push('Extreme DXY levels often precede reversals');
  }
  if (snapshot.vix > 25) {
    keyOpportunities.push('High VIX = potential for sharp reversals');
  }
  
  // Action items
  if (riskEnv.overall === 'risk_off') {
    actionItems.push('Consider reducing exposure');
    actionItems.push('Watch for capitulation signals');
  } else if (riskEnv.overall === 'risk_on') {
    actionItems.push('Favorable for adding positions');
    actionItems.push('Monitor for trend continuation');
  } else {
    actionItems.push('Wait for clearer signals');
    actionItems.push('Keep position sizes moderate');
  }
  if (nextEvent) {
    actionItems.push(`Position before ${nextEvent.name} (${nextEvent.date})`);
  }
  
  return {
    currentState: `${riskEnv.overall.toUpperCase()} environment. Risk score: ${riskEnv.score}/100. ${dxyRegime.analysis}`,
    outlook: cryptoState.trend === 'downtrend' 
      ? 'Bearish short-term. Watch for reversal signals at support.'
      : cryptoState.trend === 'uptrend'
        ? 'Bullish momentum. Trail stops, watch for resistance.'
        : 'Range-bound. Trade the range or wait for breakout.',
    keyRisks,
    keyOpportunities,
    actionItems
  };
}
