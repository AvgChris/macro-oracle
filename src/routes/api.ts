// API Routes for Macro Oracle
// Serves macro intelligence to AI agents

import { Router, Request, Response } from 'express';
import { 
  getUpcomingEvents, 
  getEventsByImpact, 
  getHistoricalImpact, 
  getNextCriticalEvent,
  getFullCalendar 
} from '../services/calendar.js';
import { 
  getMarketSnapshot, 
  getCorrelations, 
  getCorrelation,
  getDxyRegime, 
  getRiskEnvironment, 
  getCryptoMarketState,
  refreshLiveData
} from '../services/market.js';
import { fetchAllMarketData } from '../services/feeds.js';
import { 
  generateCurrentSignal, 
  generateEventSignal, 
  getSignalHistory, 
  getLatestSignal,
  generateSummary 
} from '../services/signals.js';
import {
  fetchFredSnapshot,
  fetchFedFundsRate,
  fetchCpi,
  fetchTreasuryYields,
  fetchUnemployment,
  analyzeCryptoImpact
} from '../services/fred.js';
import { OracleStatus } from '../types.js';

const router = Router();
const startTime = Date.now();
let signalsGenerated = 0;

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Force refresh live data
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    await refreshLiveData();
    const data = await fetchAllMarketData();
    res.json({ 
      status: 'refreshed', 
      timestamp: Date.now(),
      liveData: data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to refresh data' });
  }
});

// Get raw live feed data
router.get('/feeds', async (req: Request, res: Response) => {
  try {
    const data = await fetchAllMarketData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch feeds' });
  }
});

// Oracle status
router.get('/status', (req: Request, res: Response) => {
  const status: OracleStatus = {
    online: true,
    lastUpdate: Date.now(),
    eventsTracked: getFullCalendar().length,
    signalsGenerated,
    uptime: Date.now() - startTime,
    version: '0.1.0'
  };
  res.json(status);
});

// === CALENDAR ENDPOINTS ===

// Get upcoming economic events
router.get('/calendar', (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 7;
  const events = getUpcomingEvents(days);
  res.json({
    count: events.length,
    days,
    events
  });
});

// Get full calendar
router.get('/calendar/all', (req: Request, res: Response) => {
  const events = getFullCalendar();
  res.json({
    count: events.length,
    events
  });
});

// Get next critical event
router.get('/calendar/next-critical', (req: Request, res: Response) => {
  const event = getNextCriticalEvent();
  if (!event) {
    res.json({ event: null, message: 'No upcoming critical events' });
    return;
  }
  
  const historical = getHistoricalImpact(event.type);
  res.json({
    event,
    historical,
    countdown: new Date(`${event.date}T${event.time}:00Z`).getTime() - Date.now()
  });
});

// Get events by impact level
router.get('/calendar/impact/:level', (req: Request, res: Response) => {
  const level = req.params.level as 'low' | 'medium' | 'high' | 'critical';
  if (!['low', 'medium', 'high', 'critical'].includes(level)) {
    res.status(400).json({ error: 'Invalid impact level' });
    return;
  }
  const events = getEventsByImpact(level);
  res.json({ impact: level, count: events.length, events });
});

// === MARKET DATA ENDPOINTS ===

// Current market snapshot
router.get('/market', (req: Request, res: Response) => {
  res.json(getMarketSnapshot());
});

// Crypto market state
router.get('/market/crypto', (req: Request, res: Response) => {
  res.json(getCryptoMarketState());
});

// DXY regime analysis
router.get('/market/dxy', (req: Request, res: Response) => {
  res.json(getDxyRegime());
});

// Risk environment
router.get('/market/risk', (req: Request, res: Response) => {
  res.json(getRiskEnvironment());
});

// Correlations
router.get('/market/correlations', (req: Request, res: Response) => {
  res.json({
    timestamp: Date.now(),
    correlations: getCorrelations()
  });
});

// Specific correlation pair
router.get('/market/correlations/:pair', (req: Request, res: Response) => {
  const correlation = getCorrelation(req.params.pair.toUpperCase());
  if (!correlation) {
    res.status(404).json({ error: 'Correlation pair not found' });
    return;
  }
  res.json(correlation);
});

// === SIGNAL ENDPOINTS ===

// Generate current signal
router.get('/signal', (req: Request, res: Response) => {
  const signal = generateCurrentSignal();
  signalsGenerated++;
  res.json(signal);
});

// Get latest signal without generating new one
router.get('/signal/latest', (req: Request, res: Response) => {
  const signal = getLatestSignal();
  res.json(signal || { message: 'No signals generated yet' });
});

// Get signal history
router.get('/signals', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const signals = getSignalHistory(limit);
  res.json({
    count: signals.length,
    signals
  });
});

// Generate signal for specific event
router.get('/signal/event/:eventId', (req: Request, res: Response) => {
  const events = getFullCalendar();
  const event = events.find(e => e.id === req.params.eventId);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  const signal = generateEventSignal(event);
  signalsGenerated++;
  res.json(signal);
});

// === ANALYSIS ENDPOINTS ===

// Get comprehensive summary
router.get('/summary', (req: Request, res: Response) => {
  const summary = generateSummary();
  res.json({
    timestamp: Date.now(),
    ...summary
  });
});

// Combined dashboard data
router.get('/dashboard', (req: Request, res: Response) => {
  res.json({
    timestamp: Date.now(),
    market: getMarketSnapshot(),
    crypto: getCryptoMarketState(),
    dxy: getDxyRegime(),
    risk: getRiskEnvironment(),
    nextCriticalEvent: getNextCriticalEvent(),
    upcomingEvents: getUpcomingEvents(3),
    latestSignal: getLatestSignal(),
    summary: generateSummary()
  });
});

// Historical impact for event type
router.get('/impact/:eventType', (req: Request, res: Response) => {
  const impact = getHistoricalImpact(req.params.eventType as any);
  res.json({
    eventType: req.params.eventType,
    ...impact
  });
});

// === FRED DATA ENDPOINTS (Official Fed Data) ===

// Full FRED macro snapshot
router.get('/fred', async (req: Request, res: Response) => {
  try {
    const snapshot = await fetchFredSnapshot();
    const impact = analyzeCryptoImpact(snapshot);
    res.json({
      ...snapshot,
      cryptoImpact: impact
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch FRED data' });
  }
});

// Federal Funds Rate
router.get('/fred/rate', async (req: Request, res: Response) => {
  try {
    const data = await fetchFedFundsRate();
    res.json(data || { error: 'Unable to fetch Fed Funds rate' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Fed Funds rate' });
  }
});

// CPI / Inflation
router.get('/fred/cpi', async (req: Request, res: Response) => {
  try {
    const data = await fetchCpi();
    res.json(data || { error: 'Unable to fetch CPI data' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch CPI data' });
  }
});

// Treasury Yields
router.get('/fred/treasury', async (req: Request, res: Response) => {
  try {
    const data = await fetchTreasuryYields();
    res.json(data || { error: 'Unable to fetch Treasury yields' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Treasury yields' });
  }
});

// Unemployment
router.get('/fred/unemployment', async (req: Request, res: Response) => {
  try {
    const data = await fetchUnemployment();
    res.json(data || { error: 'Unable to fetch unemployment data' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unemployment data' });
  }
});

export default router;
