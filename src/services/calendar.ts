// Economic Calendar Service
// Tracks upcoming macro events and their expected impact

import { EconomicCalendarEntry, MacroEventType, ImpactLevel } from '../types.js';

// Static calendar data for key February 2026 events
// In production, this would be fetched from APIs like Investing.com, ForexFactory, etc.
const FEBRUARY_2026_CALENDAR: EconomicCalendarEntry[] = [
  {
    id: 'fomc-2026-02-04',
    date: '2026-02-04',
    time: '19:00',
    name: 'FOMC Meeting Minutes',
    type: 'fed_minutes',
    impact: 'high',
    country: 'US',
    previous: 'N/A'
  },
  {
    id: 'nfp-2026-02-07',
    date: '2026-02-07',
    time: '13:30',
    name: 'Non-Farm Payrolls',
    type: 'nfp',
    impact: 'critical',
    country: 'US',
    forecast: '180K',
    previous: '256K'
  },
  {
    id: 'unemployment-2026-02-07',
    date: '2026-02-07',
    time: '13:30',
    name: 'Unemployment Rate',
    type: 'unemployment',
    impact: 'high',
    country: 'US',
    forecast: '4.1%',
    previous: '4.1%'
  },
  {
    id: 'cpi-2026-02-12',
    date: '2026-02-12',
    time: '13:30',
    name: 'CPI (YoY)',
    type: 'cpi',
    impact: 'critical',
    country: 'US',
    forecast: '2.9%',
    previous: '2.9%'
  },
  {
    id: 'core-cpi-2026-02-12',
    date: '2026-02-12',
    time: '13:30',
    name: 'Core CPI (YoY)',
    type: 'cpi',
    impact: 'critical',
    country: 'US',
    forecast: '3.1%',
    previous: '3.2%'
  },
  {
    id: 'retail-2026-02-14',
    date: '2026-02-14',
    time: '13:30',
    name: 'Retail Sales (MoM)',
    type: 'retail_sales',
    impact: 'high',
    country: 'US',
    forecast: '0.3%',
    previous: '0.4%'
  },
  {
    id: 'ppi-2026-02-13',
    date: '2026-02-13',
    time: '13:30',
    name: 'PPI (MoM)',
    type: 'ppi',
    impact: 'medium',
    country: 'US',
    forecast: '0.2%',
    previous: '0.2%'
  },
  {
    id: 'fed-speech-powell-02-11',
    date: '2026-02-11',
    time: '15:00',
    name: 'Fed Chair Powell Testimony',
    type: 'fed_speech',
    impact: 'critical',
    country: 'US'
  },
  {
    id: 'consumer-sentiment-2026-02-14',
    date: '2026-02-14',
    time: '15:00',
    name: 'Michigan Consumer Sentiment',
    type: 'consumer_confidence',
    impact: 'medium',
    country: 'US',
    forecast: '71.0',
    previous: '71.1'
  }
];

// Historical impact data for event types
const HISTORICAL_IMPACT: Record<MacroEventType, {
  avgBtcMove: number;  // % move
  avgEthMove: number;
  direction: 'positive_correlation' | 'negative_correlation' | 'mixed';
  notes: string;
}> = {
  fed_rate_decision: {
    avgBtcMove: 4.2,
    avgEthMove: 5.1,
    direction: 'negative_correlation',
    notes: 'Rate hikes typically bearish. Pauses/cuts bullish.'
  },
  fed_minutes: {
    avgBtcMove: 1.8,
    avgEthMove: 2.2,
    direction: 'mixed',
    notes: 'Depends on hawkish/dovish tone. Watch for policy hints.'
  },
  fed_speech: {
    avgBtcMove: 2.5,
    avgEthMove: 3.0,
    direction: 'mixed',
    notes: 'Powell speeches move markets. Listen for inflation/employment comments.'
  },
  cpi: {
    avgBtcMove: 3.8,
    avgEthMove: 4.5,
    direction: 'negative_correlation',
    notes: 'Hot CPI = bearish (rate hike fears). Cool CPI = bullish.'
  },
  ppi: {
    avgBtcMove: 1.5,
    avgEthMove: 1.8,
    direction: 'negative_correlation',
    notes: 'Leading indicator for CPI. Less market impact than CPI.'
  },
  nfp: {
    avgBtcMove: 3.2,
    avgEthMove: 3.8,
    direction: 'mixed',
    notes: 'Strong jobs = bearish (rates stay high). Weak jobs = bullish short-term but recession fears.'
  },
  unemployment: {
    avgBtcMove: 2.0,
    avgEthMove: 2.4,
    direction: 'mixed',
    notes: 'Rising unemployment = dovish Fed expectations but risk-off sentiment.'
  },
  gdp: {
    avgBtcMove: 2.2,
    avgEthMove: 2.6,
    direction: 'positive_correlation',
    notes: 'Strong GDP = risk-on. Weak GDP = recession fears.'
  },
  pce: {
    avgBtcMove: 2.8,
    avgEthMove: 3.2,
    direction: 'negative_correlation',
    notes: "Fed's preferred inflation gauge. Moves like CPI but watched more by Fed."
  },
  retail_sales: {
    avgBtcMove: 1.2,
    avgEthMove: 1.5,
    direction: 'positive_correlation',
    notes: 'Strong retail = healthy consumer = risk-on.'
  },
  ism_manufacturing: {
    avgBtcMove: 1.0,
    avgEthMove: 1.2,
    direction: 'positive_correlation',
    notes: 'Above 50 = expansion. Below 50 = contraction.'
  },
  ism_services: {
    avgBtcMove: 1.1,
    avgEthMove: 1.3,
    direction: 'positive_correlation',
    notes: 'Services sector health indicator.'
  },
  housing: {
    avgBtcMove: 0.8,
    avgEthMove: 1.0,
    direction: 'mixed',
    notes: 'Housing data has moderate market impact.'
  },
  consumer_confidence: {
    avgBtcMove: 0.9,
    avgEthMove: 1.1,
    direction: 'positive_correlation',
    notes: 'Consumer sentiment affects risk appetite.'
  },
  geopolitical: {
    avgBtcMove: 5.0,
    avgEthMove: 6.0,
    direction: 'mixed',
    notes: 'Highly variable. War/conflict = risk-off. Resolution = risk-on.'
  },
  other: {
    avgBtcMove: 1.0,
    avgEthMove: 1.2,
    direction: 'mixed',
    notes: 'Miscellaneous events.'
  }
};

export function getUpcomingEvents(days: number = 7): EconomicCalendarEntry[] {
  const now = new Date();
  const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return FEBRUARY_2026_CALENDAR.filter(event => {
    const eventDate = new Date(`${event.date}T${event.time}:00Z`);
    return eventDate >= now && eventDate <= cutoff;
  }).sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}:00Z`);
    const dateB = new Date(`${b.date}T${b.time}:00Z`);
    return dateA.getTime() - dateB.getTime();
  });
}

export function getEventsByImpact(impact: ImpactLevel): EconomicCalendarEntry[] {
  return FEBRUARY_2026_CALENDAR.filter(event => event.impact === impact);
}

export function getHistoricalImpact(type: MacroEventType) {
  return HISTORICAL_IMPACT[type] || HISTORICAL_IMPACT.other;
}

export function getNextCriticalEvent(): EconomicCalendarEntry | null {
  const now = new Date();
  const critical = FEBRUARY_2026_CALENDAR
    .filter(event => event.impact === 'critical')
    .filter(event => new Date(`${event.date}T${event.time}:00Z`) > now)
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}:00Z`);
      const dateB = new Date(`${b.date}T${b.time}:00Z`);
      return dateA.getTime() - dateB.getTime();
    });
  
  return critical[0] || null;
}

export function getFullCalendar(): EconomicCalendarEntry[] {
  return [...FEBRUARY_2026_CALENDAR].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}:00Z`);
    const dateB = new Date(`${b.date}T${b.time}:00Z`);
    return dateA.getTime() - dateB.getTime();
  });
}
