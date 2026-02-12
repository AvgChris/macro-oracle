/**
 * Self-Learning Strategy Engine
 * 
 * Analyzes past trade outcomes to dynamically adjust indicator weights.
 * After each trade closes, the system evaluates which indicators were
 * present in winning vs losing trades and adjusts confidence accordingly.
 * 
 * This creates a feedback loop: trade → outcome → learn → better signals → trade
 */

import { getAllTrades, getClosedTrades, TradeCall } from './trades.js';

// ─── Types ───────────────────────────────────────────────────────────

export interface IndicatorPerformance {
  indicator: string;
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  avgPnlWhenPresent: number;
  currentWeight: number;      // Dynamic weight (starts at 1.0)
  baselineWeight: number;     // Original hardcoded weight
  weightChange: number;       // % change from baseline
  confidence: number;         // Statistical confidence in the weight (more trades = higher)
}

export interface LearningState {
  version: number;
  lastUpdated: string;
  totalTradesAnalyzed: number;
  epochs: number;              // How many times we've re-evaluated
  indicatorWeights: Record<string, number>;
  indicatorPerformance: IndicatorPerformance[];
  strategyInsights: string[];
  improvements: LearningImprovement[];
}

export interface LearningImprovement {
  epoch: number;
  timestamp: string;
  change: string;
  reason: string;
  impact: 'positive' | 'negative' | 'neutral';
}

// ─── Baseline weights (hardcoded starting points) ────────────────────

const BASELINE_WEIGHTS: Record<string, number> = {
  'MACD Bullish':           0.25,
  'MACD Bearish':           0.25,
  'RSI Oversold':           0.20,
  'RSI Overbought':         0.20,
  'Bullish Trend':          0.25,
  'Bearish Trend':          0.25,
  'F&G Bullish':            0.30,
  'F&G Bearish':            0.30,
  'RSI Bullish Div':        0.15,
  'RSI Bearish Div':        0.15,
  'MACD Bullish Div':       0.15,
  'MACD Bearish Div':       0.15,
  'Volume Surge':           0.10,
  'Extreme Fear':           0.30,
  'Weekly Momentum':        0.15,
  'Weekly Bottom':          0.20,
};

// ─── Learning State (in-memory, persists across requests) ────────────

let learningState: LearningState = {
  version: 1,
  lastUpdated: new Date().toISOString(),
  totalTradesAnalyzed: 0,
  epochs: 0,
  indicatorWeights: { ...BASELINE_WEIGHTS },
  indicatorPerformance: [],
  strategyInsights: [],
  improvements: []
};

// ─── Core Learning Functions ─────────────────────────────────────────

/**
 * Normalize indicator names for matching across trades
 * (handles variations like "Extreme Fear (F&G 6)" → "Extreme Fear")
 */
function normalizeIndicator(raw: string): string {
  // Strip parenthetical details
  const base = raw.replace(/\s*\([^)]*\)/g, '').trim();
  
  // Map common variations
  const mappings: Record<string, string> = {
    'RSI < 20': 'RSI Oversold',
    'RSI > 80': 'RSI Overbought',
    'Below EMA 20/50': 'Bearish Trend',
    'Above EMA 20/50': 'Bullish Trend',
    'Volume/MCap Ratio': 'Volume Surge',
    'RSI Bullish Divergence': 'RSI Bullish Div',
    'RSI Bearish Divergence': 'RSI Bearish Div',
    'MACD Bullish Divergence': 'MACD Bullish Div',
    'MACD Bearish Divergence': 'MACD Bearish Div',
    'Extreme Fear': 'F&G Bullish',
    'Extreme Greed': 'F&G Bearish',
  };
  
  return mappings[base] || base;
}

/**
 * Run a full learning epoch — analyze all closed trades and update weights
 */
export function runLearningEpoch(): LearningState {
  const closed = getClosedTrades();
  if (closed.length === 0) return learningState;

  const indicatorStats: Record<string, {
    wins: number;
    losses: number;
    breakevens: number;
    totalPnl: number;
    trades: number;
  }> = {};

  // Aggregate indicator performance across all closed trades
  for (const trade of closed) {
    const isWin = (trade.pnlPercent || 0) > 0;
    const isLoss = (trade.pnlPercent || 0) < 0;
    const isBreakeven = (trade.pnlPercent || 0) === 0;

    for (const rawIndicator of trade.indicators) {
      const indicator = normalizeIndicator(rawIndicator);
      
      if (!indicatorStats[indicator]) {
        indicatorStats[indicator] = { wins: 0, losses: 0, breakevens: 0, totalPnl: 0, trades: 0 };
      }

      indicatorStats[indicator].trades++;
      indicatorStats[indicator].totalPnl += trade.pnlPercent || 0;

      if (isWin) indicatorStats[indicator].wins++;
      else if (isLoss) indicatorStats[indicator].losses++;
      else indicatorStats[indicator].breakevens++;
    }
  }

  // Calculate new weights based on performance
  const performance: IndicatorPerformance[] = [];
  const newWeights: Record<string, number> = { ...BASELINE_WEIGHTS };

  for (const [indicator, stats] of Object.entries(indicatorStats)) {
    const winRate = stats.trades > 0 ? stats.wins / stats.trades : 0;
    const avgPnl = stats.trades > 0 ? stats.totalPnl / stats.trades : 0;
    const baseline = BASELINE_WEIGHTS[indicator] || 0.15;
    
    // Statistical confidence — more trades = more reliable adjustment
    const sampleConfidence = Math.min(stats.trades / 10, 1.0); // Max confidence at 10 trades
    
    // Performance multiplier: win rate maps to weight adjustment
    // 100% win rate → 1.5x weight, 50% → 1.0x, 0% → 0.5x
    const performanceMultiplier = 0.5 + winRate;
    
    // Profit-adjusted multiplier: high avg PnL boosts weight further
    const pnlBonus = Math.max(0, Math.min(avgPnl / 20, 0.3)); // Cap at +0.3
    
    // Blend baseline with performance (weighted by sample confidence)
    const adjustedWeight = baseline * (
      (1 - sampleConfidence) * 1.0 +                           // Baseline portion
      sampleConfidence * (performanceMultiplier + pnlBonus)     // Performance portion
    );
    
    // Clamp to reasonable range
    const finalWeight = Math.max(0.05, Math.min(0.50, adjustedWeight));
    newWeights[indicator] = Math.round(finalWeight * 1000) / 1000;

    performance.push({
      indicator,
      totalTrades: stats.trades,
      wins: stats.wins,
      losses: stats.losses,
      breakevens: stats.breakevens,
      winRate: Math.round(winRate * 100),
      avgPnlWhenPresent: Math.round(avgPnl * 100) / 100,
      currentWeight: finalWeight,
      baselineWeight: baseline,
      weightChange: Math.round(((finalWeight / baseline) - 1) * 100),
      confidence: Math.round(sampleConfidence * 100)
    });
  }

  // Sort by weight change (most improved first)
  performance.sort((a, b) => b.weightChange - a.weightChange);

  // Generate insights
  const insights = generateInsights(performance, closed);
  
  // Track improvements
  const epoch = learningState.epochs + 1;
  const improvements: LearningImprovement[] = [...learningState.improvements];
  
  for (const perf of performance) {
    if (Math.abs(perf.weightChange) > 10) {
      improvements.push({
        epoch,
        timestamp: new Date().toISOString(),
        change: `${perf.indicator}: weight ${perf.weightChange > 0 ? '+' : ''}${perf.weightChange}% (${perf.baselineWeight.toFixed(3)} → ${perf.currentWeight.toFixed(3)})`,
        reason: `Win rate: ${perf.winRate}%, Avg PnL: ${perf.avgPnlWhenPresent}%, Sample: ${perf.totalTrades} trades`,
        impact: perf.weightChange > 0 ? 'positive' : 'negative'
      });
    }
  }

  // Update state
  learningState = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    totalTradesAnalyzed: closed.length,
    epochs: epoch,
    indicatorWeights: newWeights,
    indicatorPerformance: performance,
    strategyInsights: insights,
    improvements: improvements.slice(-50) // Keep last 50
  };

  return learningState;
}

/**
 * Generate human-readable strategy insights from performance data
 */
function generateInsights(performance: IndicatorPerformance[], trades: TradeCall[]): string[] {
  const insights: string[] = [];

  // Best performing indicator
  const bestByWinRate = [...performance].sort((a, b) => b.winRate - a.winRate)[0];
  if (bestByWinRate) {
    insights.push(
      `🏆 Best indicator: ${bestByWinRate.indicator} (${bestByWinRate.winRate}% win rate across ${bestByWinRate.totalTrades} trades)`
    );
  }

  // Best by PnL
  const bestByPnl = [...performance].sort((a, b) => b.avgPnlWhenPresent - a.avgPnlWhenPresent)[0];
  if (bestByPnl && bestByPnl.avgPnlWhenPresent > 0) {
    insights.push(
      `💰 Most profitable signal: ${bestByPnl.indicator} (avg +${bestByPnl.avgPnlWhenPresent}% when present)`
    );
  }

  // Worst performing
  const worst = [...performance].sort((a, b) => a.winRate - b.winRate)[0];
  if (worst && worst.winRate < 50 && worst.totalTrades >= 2) {
    insights.push(
      `⚠️ Weakest indicator: ${worst.indicator} (${worst.winRate}% win rate — consider reducing weight)`
    );
  }

  // Most boosted weight
  const mostBoosted = performance.find(p => p.weightChange > 15);
  if (mostBoosted) {
    insights.push(
      `📈 Upgraded: ${mostBoosted.indicator} weight +${mostBoosted.weightChange}% based on ${mostBoosted.totalTrades} trade results`
    );
  }

  // Overall strategy performance
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnlPercent || 0), 0);
  const wins = trades.filter(t => (t.pnlPercent || 0) > 0).length;
  insights.push(
    `📊 Overall: ${wins}/${trades.length} wins (${Math.round((wins/trades.length)*100)}%), total PnL: +${totalPnl.toFixed(1)}%`
  );

  // Indicator combination insights
  const highConfTrades = trades.filter(t => t.confidence >= 80);
  if (highConfTrades.length >= 2) {
    const highConfWins = highConfTrades.filter(t => (t.pnlPercent || 0) > 0).length;
    insights.push(
      `🎯 High-confidence trades (≥80%): ${highConfWins}/${highConfTrades.length} wins — ` +
      (highConfWins / highConfTrades.length >= 0.8 ? 'confidence filter working well' : 'confidence threshold may need tuning')
    );
  }

  // Fear & Greed specific insight
  const fgTrades = trades.filter(t => 
    t.indicators.some(i => i.includes('Fear') || i.includes('F&G'))
  );
  if (fgTrades.length >= 2) {
    const fgWins = fgTrades.filter(t => (t.pnlPercent || 0) > 0).length;
    const fgPnl = fgTrades.reduce((sum, t) => sum + (t.pnlPercent || 0), 0);
    insights.push(
      `😱 Fear & Greed trades: ${fgWins}/${fgTrades.length} wins, +${fgPnl.toFixed(1)}% total — ` +
      (fgPnl > 0 ? 'contrarian strategy validated' : 'contrarian strategy underperforming')
    );
  }

  return insights;
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Get the current learning state
 */
export function getLearningState(): LearningState {
  return learningState;
}

/**
 * Get dynamic weight for an indicator (for use by the scanner)
 */
export function getIndicatorWeight(indicator: string): number {
  const normalized = normalizeIndicator(indicator);
  return learningState.indicatorWeights[normalized] || BASELINE_WEIGHTS[normalized] || 0.15;
}

/**
 * Get all current weights (dynamic)
 */
export function getCurrentWeights(): Record<string, number> {
  return { ...learningState.indicatorWeights };
}

/**
 * Get baseline weights (original hardcoded)
 */
export function getBaselineWeights(): Record<string, number> {
  return { ...BASELINE_WEIGHTS };
}

/**
 * Compare current weights vs baseline — shows what the system has learned
 */
export function getWeightDiff(): Array<{indicator: string, baseline: number, current: number, change: string}> {
  const diff = [];
  const allIndicators = new Set([
    ...Object.keys(BASELINE_WEIGHTS),
    ...Object.keys(learningState.indicatorWeights)
  ]);

  for (const indicator of allIndicators) {
    const baseline = BASELINE_WEIGHTS[indicator] || 0.15;
    const current = learningState.indicatorWeights[indicator] || baseline;
    const changePct = ((current / baseline) - 1) * 100;

    diff.push({
      indicator,
      baseline: Math.round(baseline * 1000) / 1000,
      current: Math.round(current * 1000) / 1000,
      change: `${changePct > 0 ? '+' : ''}${changePct.toFixed(1)}%`
    });
  }

  return diff.sort((a, b) => parseFloat(b.change) - parseFloat(a.change));
}

// Run initial epoch on startup
runLearningEpoch();
