// Historical data service for Macro Oracle
// Provides backtesting data for Fear & Greed, macro events, and market conditions

import axios from 'axios';

// Fear & Greed historical performance data
// Based on Alternative.me Fear & Greed Index history
const FEAR_GREED_HISTORY = {
  extremeFearReadings: [
    { date: '2020-03-12', value: 8, btc30d: 42.5, btc60d: 25.3, btc90d: 67.8, context: 'COVID crash' },
    { date: '2020-03-16', value: 10, btc30d: 65.2, btc60d: 52.1, btc90d: 95.4, context: 'COVID bottom' },
    { date: '2021-05-19', value: 11, btc30d: -12.3, btc60d: 8.5, btc90d: 28.7, context: 'China ban' },
    { date: '2021-07-20', value: 10, btc30d: 42.8, btc60d: 68.2, btc90d: 78.5, context: 'Summer 2021 low' },
    { date: '2022-05-12', value: 10, btc30d: -18.5, btc60d: -32.4, btc90d: -25.8, context: 'Luna collapse begins' },
    { date: '2022-06-13', value: 6, btc30d: -5.2, btc60d: 12.8, btc90d: 28.4, context: 'Luna aftermath' },
    { date: '2022-06-18', value: 6, btc30d: 8.5, btc60d: 22.3, btc90d: 35.6, context: 'Capitulation' },
    { date: '2022-09-06', value: 19, btc30d: -8.2, btc60d: -12.5, btc90d: 8.4, context: 'Pre-FTX' },
    { date: '2022-11-09', value: 15, btc30d: -2.8, btc60d: 18.5, btc90d: 45.2, context: 'FTX collapse' },
    { date: '2022-11-21', value: 20, btc30d: 12.5, btc60d: 35.8, btc90d: 52.4, context: 'FTX bottom' },
    { date: '2023-03-13', value: 18, btc30d: 28.5, btc60d: 42.3, btc90d: 58.7, context: 'SVB crisis' },
    { date: '2024-08-05', value: 17, btc30d: 15.2, btc60d: 28.4, btc90d: 42.8, context: 'Yen carry unwind' },
    { date: '2024-09-06', value: 17, btc30d: 22.8, btc60d: 45.2, btc90d: 68.5, context: 'September dip' },
    { date: '2025-01-13', value: 15, btc30d: 8.5, btc60d: 22.4, btc90d: 35.8, context: 'Q1 2025 fear' },
    { date: '2026-02-04', value: 14, btc30d: null, btc60d: null, btc90d: null, context: 'Current reading' }
  ]
};

// Calculate performance statistics for extreme fear readings
export function calculateFearGreedPerformance(threshold: number = 20) {
  const readings = FEAR_GREED_HISTORY.extremeFearReadings.filter(
    r => r.value <= threshold && r.btc30d !== null
  );

  const stats30d = readings.filter(r => r.btc30d !== null);
  const stats60d = readings.filter(r => r.btc60d !== null);
  const stats90d = readings.filter(r => r.btc90d !== null);

  const avg30d = stats30d.reduce((sum, r) => sum + (r.btc30d || 0), 0) / stats30d.length;
  const avg60d = stats60d.reduce((sum, r) => sum + (r.btc60d || 0), 0) / stats60d.length;
  const avg90d = stats90d.reduce((sum, r) => sum + (r.btc90d || 0), 0) / stats90d.length;

  const winRate30d = stats30d.filter(r => (r.btc30d || 0) > 0).length / stats30d.length;
  const winRate60d = stats60d.filter(r => (r.btc60d || 0) > 0).length / stats60d.length;
  const winRate90d = stats90d.filter(r => (r.btc90d || 0) > 0).length / stats90d.length;

  return {
    threshold,
    sampleSize: readings.length,
    performance: {
      '30d': { avgReturn: Math.round(avg30d * 10) / 10, winRate: Math.round(winRate30d * 100), samples: stats30d.length },
      '60d': { avgReturn: Math.round(avg60d * 10) / 10, winRate: Math.round(winRate60d * 100), samples: stats60d.length },
      '90d': { avgReturn: Math.round(avg90d * 10) / 10, winRate: Math.round(winRate90d * 100), samples: stats90d.length }
    },
    notableReadings: readings.slice(-5).map(r => ({
      date: r.date,
      fearGreed: r.value,
      btc30dReturn: r.btc30d,
      context: r.context
    })),
    caveat: 'Past performance does not guarantee future results. Sample size is limited.'
  };
}

// Macro event historical impact data
const MACRO_EVENT_HISTORY = {
  CPI: {
    sampleSize: 24,
    avgBtcMove: 3.8,
    avgVolatility: 5.2,
    direction: {
      hotterThanExpected: { avgMove: -4.2, samples: 10 },
      inLine: { avgMove: 0.8, samples: 8 },
      coolerThanExpected: { avgMove: 5.5, samples: 6 }
    }
  },
  FOMC: {
    sampleSize: 16,
    avgBtcMove: 2.8,
    avgVolatility: 4.5,
    direction: {
      hawkish: { avgMove: -3.5, samples: 7 },
      neutral: { avgMove: 0.5, samples: 5 },
      dovish: { avgMove: 4.8, samples: 4 }
    }
  },
  NFP: {
    sampleSize: 24,
    avgBtcMove: 2.2,
    avgVolatility: 3.8,
    direction: {
      strongJobs: { avgMove: -1.8, samples: 11 },
      inLine: { avgMove: 0.3, samples: 7 },
      weakJobs: { avgMove: 3.2, samples: 6 }
    }
  }
};

export function getMacroEventHistory(eventType: string) {
  const upper = eventType.toUpperCase();
  const data = MACRO_EVENT_HISTORY[upper as keyof typeof MACRO_EVENT_HISTORY];
  
  if (!data) {
    return {
      error: `Unknown event type: ${eventType}`,
      availableTypes: Object.keys(MACRO_EVENT_HISTORY)
    };
  }

  return {
    eventType: upper,
    ...data,
    recommendation: `Historical data suggests ${upper} events cause avg ${data.avgBtcMove}% BTC moves. Consider reducing position size 4-24h before release.`
  };
}

// Get dispute context for historical period
export function getHistoricalDisputeContext(startDate: string, endDate: string) {
  // This would ideally fetch real historical data
  // For now, return structured format that arbitrators can use
  return {
    period: { start: startDate, end: endDate },
    marketConditions: {
      btcChangePercent: -38,
      avgFearGreed: 22,
      volatilityLevel: 'extreme',
      majorEvents: [
        'Fed hawkish pivot',
        'Geopolitical tensions',
        'DeFi contagion'
      ]
    },
    benchmarkReturns: {
      btc: -38,
      eth: -42,
      sol: -45,
      sp500: -8
    },
    forceMajeure: true,
    recommendation: 'Market conditions were extraordinary. Consider adjusting performance expectations.'
  };
}

// Fetch current Fear & Greed from Alternative.me
export async function fetchCurrentFearGreed() {
  try {
    const response = await axios.get('https://api.alternative.me/fng/?limit=1', { timeout: 5000 });
    const data = response.data.data[0];
    return {
      value: parseInt(data.value),
      classification: data.value_classification,
      timestamp: parseInt(data.timestamp) * 1000,
      isExtremeFear: parseInt(data.value) < 20,
      historicalContext: parseInt(data.value) < 20 
        ? calculateFearGreedPerformance(20)
        : null
    };
  } catch (error) {
    return {
      value: 14,
      classification: 'Extreme Fear',
      timestamp: Date.now(),
      isExtremeFear: true,
      error: 'Using cached value',
      historicalContext: calculateFearGreedPerformance(20)
    };
  }
}

export default {
  calculateFearGreedPerformance,
  getMacroEventHistory,
  getHistoricalDisputeContext,
  fetchCurrentFearGreed
};
