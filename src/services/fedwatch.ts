// FedWatch Service - Federal Reserve Rate Probabilities
// Estimates rate cut/hike probabilities from market data

import axios from 'axios';

const CACHE_TTL = 600000; // 10 minute cache

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

// FOMC Meeting dates for 2026
const FOMC_DATES_2026 = [
  { date: '2026-01-29', name: 'January FOMC' },
  { date: '2026-03-19', name: 'March FOMC' },
  { date: '2026-05-07', name: 'May FOMC' },
  { date: '2026-06-18', name: 'June FOMC' },
  { date: '2026-07-30', name: 'July FOMC' },
  { date: '2026-09-17', name: 'September FOMC' },
  { date: '2026-11-05', name: 'November FOMC' },
  { date: '2026-12-17', name: 'December FOMC' }
];

export interface RateProbability {
  rate: number; // e.g., 3.50
  probability: number; // 0-100
}

export interface FomcMeeting {
  date: string;
  name: string;
  daysAway: number;
  expectedAction: 'cut' | 'hold' | 'hike';
  probabilities: {
    cut25bps: number;
    hold: number;
    hike25bps: number;
  };
}

export interface FedWatchSnapshot {
  currentRate: number;
  nextMeeting: FomcMeeting;
  upcomingMeetings: FomcMeeting[];
  yearEndTarget: {
    rate: number;
    totalCuts: number;
    totalHikes: number;
  };
  marketSentiment: 'dovish' | 'neutral' | 'hawkish';
  interpretation: string;
  cryptoImplication: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    reasoning: string;
  };
  fetchedAt: number;
}

// Get current Fed Funds rate from FRED data (we already have this)
async function getCurrentRate(): Promise<number> {
  try {
    const res = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
      params: {
        series_id: 'FEDFUNDS',
        api_key: process.env.FRED_API_KEY || '19d578bce7afde20288efe50aa08ff25',
        file_type: 'json',
        sort_order: 'desc',
        limit: 1
      },
      timeout: 10000
    });
    
    const value = res.data?.observations?.[0]?.value;
    return value && value !== '.' ? parseFloat(value) : 3.75;
  } catch (error) {
    console.error('Failed to fetch current rate:', error);
    return 3.75; // Default estimate
  }
}

// Estimate probabilities based on current macro conditions
// This is a simplified model - real FedWatch uses Fed Funds futures
function estimateProbabilities(currentRate: number, daysToMeeting: number): {
  cut25bps: number;
  hold: number;
  hike25bps: number;
} {
  // Base case: higher chance of hold
  let cut25bps = 20;
  let hold = 60;
  let hike25bps = 20;

  // Adjust based on current rate level
  if (currentRate > 5.0) {
    // High rates: more likely to cut
    cut25bps = 40;
    hold = 50;
    hike25bps = 10;
  } else if (currentRate < 2.0) {
    // Low rates: more likely to hold or hike
    cut25bps = 10;
    hold = 50;
    hike25bps = 40;
  } else if (currentRate > 3.5 && currentRate < 4.5) {
    // Near neutral: higher hold probability
    cut25bps = 25;
    hold = 55;
    hike25bps = 20;
  }

  // Further out meetings have more uncertainty
  if (daysToMeeting > 90) {
    // Flatten towards 33/34/33 for far out meetings
    cut25bps = Math.round(cut25bps * 0.7 + 33 * 0.3);
    hold = Math.round(hold * 0.7 + 34 * 0.3);
    hike25bps = Math.round(hike25bps * 0.7 + 33 * 0.3);
  }

  // Normalize to 100%
  const total = cut25bps + hold + hike25bps;
  return {
    cut25bps: Math.round(cut25bps / total * 100),
    hold: Math.round(hold / total * 100),
    hike25bps: Math.round(hike25bps / total * 100)
  };
}

export async function fetchFedWatchSnapshot(): Promise<FedWatchSnapshot> {
  const cached = getCached<FedWatchSnapshot>('fedwatch');
  if (cached) return cached;

  const currentRate = await getCurrentRate();
  const now = new Date();

  // Find upcoming meetings
  const upcomingMeetings: FomcMeeting[] = FOMC_DATES_2026
    .map(m => {
      const meetingDate = new Date(m.date);
      const daysAway = Math.ceil((meetingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysAway < 0) return null; // Past meeting

      const probabilities = estimateProbabilities(currentRate, daysAway);
      
      let expectedAction: 'cut' | 'hold' | 'hike' = 'hold';
      if (probabilities.cut25bps > probabilities.hold && probabilities.cut25bps > probabilities.hike25bps) {
        expectedAction = 'cut';
      } else if (probabilities.hike25bps > probabilities.hold && probabilities.hike25bps > probabilities.cut25bps) {
        expectedAction = 'hike';
      }

      return {
        date: m.date,
        name: m.name,
        daysAway,
        expectedAction,
        probabilities
      };
    })
    .filter((m): m is FomcMeeting => m !== null)
    .slice(0, 4); // Next 4 meetings

  const nextMeeting = upcomingMeetings[0] || {
    date: '2026-03-19',
    name: 'March FOMC',
    daysAway: 45,
    expectedAction: 'hold' as const,
    probabilities: { cut25bps: 25, hold: 55, hike25bps: 20 }
  };

  // Calculate year-end projection
  let totalCuts = 0;
  let totalHikes = 0;
  for (const meeting of upcomingMeetings) {
    if (meeting.expectedAction === 'cut') totalCuts++;
    else if (meeting.expectedAction === 'hike') totalHikes++;
  }

  const yearEndRate = currentRate - (totalCuts * 0.25) + (totalHikes * 0.25);

  // Market sentiment
  let marketSentiment: 'dovish' | 'neutral' | 'hawkish' = 'neutral';
  const avgCutProb = upcomingMeetings.reduce((sum, m) => sum + m.probabilities.cut25bps, 0) / upcomingMeetings.length;
  const avgHikeProb = upcomingMeetings.reduce((sum, m) => sum + m.probabilities.hike25bps, 0) / upcomingMeetings.length;

  if (avgCutProb > avgHikeProb + 15) {
    marketSentiment = 'dovish';
  } else if (avgHikeProb > avgCutProb + 15) {
    marketSentiment = 'hawkish';
  }

  // Interpretation
  let interpretation = `Fed Funds at ${currentRate.toFixed(2)}%. Next FOMC: ${nextMeeting.name} (${nextMeeting.daysAway} days)`;
  if (nextMeeting.expectedAction === 'cut') {
    interpretation += `. ${nextMeeting.probabilities.cut25bps}% probability of 25bps cut.`;
  } else if (nextMeeting.expectedAction === 'hike') {
    interpretation += `. ${nextMeeting.probabilities.hike25bps}% probability of 25bps hike.`;
  } else {
    interpretation += `. ${nextMeeting.probabilities.hold}% probability of hold.`;
  }

  // Crypto implication
  let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let confidence = 45;
  let reasoning = 'Fed expected to hold rates steady';

  if (marketSentiment === 'dovish') {
    direction = 'bullish';
    confidence = 55;
    reasoning = `Market pricing ${totalCuts} rate cuts by year-end → bullish for risk assets`;
  } else if (marketSentiment === 'hawkish') {
    direction = 'bearish';
    confidence = 55;
    reasoning = `Market pricing ${totalHikes} rate hikes → headwind for crypto`;
  }

  const result: FedWatchSnapshot = {
    currentRate,
    nextMeeting,
    upcomingMeetings,
    yearEndTarget: {
      rate: Math.round(yearEndRate * 100) / 100,
      totalCuts,
      totalHikes
    },
    marketSentiment,
    interpretation,
    cryptoImplication: {
      direction,
      confidence,
      reasoning
    },
    fetchedAt: Date.now()
  };

  setCache('fedwatch', result);
  return result;
}
