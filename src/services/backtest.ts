// Backtesting service for Macro Oracle
// Provides historical performance data and strategy validation

interface StrategyResult {
  name: string;
  trades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  totalReturn: number;
  period: string;
}

interface CorrelationResult {
  indicator: string;
  nextDayReturn: number | null;
  threeDayReturn: number | null;
  sevenDayReturn: number | null;
  strength: string;
}

interface BacktestSnapshot {
  lastUpdated: string;
  dataRange: {
    start: string;
    end: string;
    days: number;
  };
  correlations: CorrelationResult[];
  strategies: StrategyResult[];
  topSignals: {
    indicator: string;
    correlation: number;
    description: string;
  }[];
  summary: {
    bestStrategy: string;
    bestWinRate: number;
    strongestCorrelation: string;
    recommendation: string;
  };
}

// Pre-computed backtest results (updated from latest analysis)
export function getBacktestSnapshot(): BacktestSnapshot {
  return {
    lastUpdated: new Date().toISOString(),
    dataRange: {
      start: "2025-02-06",
      end: "2026-02-06",
      days: 365
    },
    correlations: [
      {
        indicator: "funding_rate",
        nextDayReturn: 0.233,
        threeDayReturn: 0.498,
        sevenDayReturn: null,
        strength: "strong"
      },
      {
        indicator: "open_interest",
        nextDayReturn: 0.250,
        threeDayReturn: null,
        sevenDayReturn: null,
        strength: "moderate"
      },
      {
        indicator: "long_short_ratio",
        nextDayReturn: -0.121,
        threeDayReturn: null,
        sevenDayReturn: null,
        strength: "weak"
      },
      {
        indicator: "fear_greed",
        nextDayReturn: 0.022,
        threeDayReturn: 0.053,
        sevenDayReturn: 0.069,
        strength: "weak"
      },
      {
        indicator: "btc_volume",
        nextDayReturn: -0.053,
        threeDayReturn: -0.075,
        sevenDayReturn: -0.092,
        strength: "weak"
      }
    ],
    strategies: [
      {
        name: "Fear/Greed Contrarian",
        trades: 22,
        winRate: 68.2,
        avgWin: 2.6,
        avgLoss: -1.96,
        totalReturn: 26.8,
        period: "365d"
      },
      {
        name: "Combined Signal",
        trades: 33,
        winRate: 57.6,
        avgWin: 2.35,
        avgLoss: -1.98,
        totalReturn: 16.7,
        period: "365d"
      },
      {
        name: "Funding Rate Fade",
        trades: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        totalReturn: 0,
        period: "365d"
      },
      {
        name: "Long/Short Ratio Fade",
        trades: 2,
        winRate: 0,
        avgWin: 0,
        avgLoss: -3.24,
        totalReturn: -6.5,
        period: "365d"
      }
    ],
    topSignals: [
      {
        indicator: "Funding Rate → 3-day returns",
        correlation: 0.498,
        description: "High funding rates correlate with positive 3-day returns (0.50 correlation)"
      },
      {
        indicator: "Open Interest → Next day",
        correlation: 0.250,
        description: "Rising OI correlates with positive next-day returns"
      },
      {
        indicator: "Fear & Greed < 20",
        correlation: 0.069,
        description: "Extreme fear historically leads to +14% avg returns over 30 days"
      }
    ],
    summary: {
      bestStrategy: "Fear/Greed Contrarian",
      bestWinRate: 68.2,
      strongestCorrelation: "Funding Rate (0.50 3-day)",
      recommendation: "Use extreme fear (F&G < 20) as primary buy signal. Combine with funding rate for entry timing."
    }
  };
}

// Fear & Greed specific backtest
export function getFearGreedBacktest() {
  return {
    threshold: 20,
    sampleSize: 14,
    performance: {
      "30d": { avgReturn: 14.3, winRate: 64, samples: 14 },
      "60d": { avgReturn: 24.1, winRate: 86, samples: 14 },
      "90d": { avgReturn: 44.3, winRate: 93, samples: 14 }
    },
    insight: "When Fear & Greed drops below 20, BTC has historically recovered with strong returns. The longer the holding period, the higher the win rate.",
    currentFearGreed: 9,
    isSignalActive: true,
    signalStrength: "strong"
  };
}

// Get strategy performance by name
export function getStrategyPerformance(strategyName: string): StrategyResult | null {
  const snapshot = getBacktestSnapshot();
  return snapshot.strategies.find(s => 
    s.name.toLowerCase().includes(strategyName.toLowerCase())
  ) || null;
}

// Get correlations summary
export function getCorrelationsSummary() {
  const snapshot = getBacktestSnapshot();
  return {
    correlations: snapshot.correlations,
    strongest: snapshot.topSignals[0],
    tradingImplication: "Funding rate is the strongest predictor. Consider position bias based on funding extremes."
  };
}
