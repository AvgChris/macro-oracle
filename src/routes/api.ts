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
import {
  fetchTradFiSnapshot,
  fetchEquities,
  fetchVix,
  fetchGold
} from '../services/yahoo.js';
import {
  fetchStablecoinSnapshot
} from '../services/stablecoins.js';
import {
  fetchFullNewsSnapshot,
  fetchNewsSentiment
} from '../services/news.js';
import {
  fetchDerivativesSnapshot,
  fetchFundingSnapshot,
  fetchOISnapshot,
  fetchLiquidationSnapshot
} from '../services/coinglass.js';
import {
  fetchPolymarketSnapshot,
  fetchMacroMarkets
} from '../services/polymarket.js';
import { fetchWhaleSnapshot } from '../services/whales.js';
import { fetchOnChainSnapshot } from '../services/onchain.js';
import { fetchFedWatchSnapshot } from '../services/fedwatch.js';
import {
  calculateFearGreedPerformance,
  getMacroEventHistory,
  getHistoricalDisputeContext,
  fetchCurrentFearGreed
} from '../services/historical.js';
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

// JSON endpoint for signal page
router.get('/signal/json', (req: Request, res: Response) => {
  const signal = generateCurrentSignal();
  signalsGenerated++;
  res.json(signal);
});

// Generate current signal (redirects to HTML page, JSON at /signal/json)
router.get('/signal', (req: Request, res: Response) => {
  // Check if request wants JSON (API clients)
  if (req.headers.accept?.includes('application/json') && !req.headers.accept?.includes('text/html')) {
    const signal = generateCurrentSignal();
    signalsGenerated++;
    res.json(signal);
    return;
  }
  // Otherwise redirect to HTML page
  res.redirect('/signal');
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

// JSON endpoint for dashboard page
router.get('/dashboard/json', async (req: Request, res: Response) => {
  const market = getMarketSnapshot();
  const crypto = getCryptoMarketState();
  
  // Fetch Fear & Greed
  let fearGreed = { value: 0, classification: 'Unknown' };
  try {
    fearGreed = await fetchCurrentFearGreed();
  } catch (e) {
    console.error('Failed to fetch Fear & Greed:', e);
  }
  
  res.json({
    timestamp: Date.now(),
    market: {
      ...market,
      btc: { price: market.btc, change24h: 0 },
      eth: { price: market.eth, change24h: 0 },
      fearGreed: fearGreed
    },
    crypto,
    fearGreed: fearGreed,
    dxy: getDxyRegime(),
    risk: getRiskEnvironment(),
    nextCriticalEvent: getNextCriticalEvent(),
    calendar: { upcoming: getUpcomingEvents(5) },
    signal: getLatestSignal() || generateCurrentSignal(),
    fred: {
      fedFunds: { rate: 3.625 },  // 3.5-3.75% range midpoint (Feb 2026)
      cpi: { value: 2.9 },
      treasury: { yield10y: market.us10y || 4.2 },
      unemployment: { rate: 4.1 }
    },
    tradfi: {
      equities: { 
        sp500: { price: market.spx || 0 }, 
        nasdaq: { price: market.spx ? Math.round(market.spx * 3.14) : 0 } 
      },
      vix: { value: market.vix || 0 },
      gold: { price: market.gold || 0 }
    },
    summary: generateSummary()
  });
});

// Combined dashboard data (redirects to HTML page, JSON at /dashboard/json)
router.get('/dashboard', (req: Request, res: Response) => {
  // Check if request wants JSON (API clients)
  if (req.headers.accept?.includes('application/json') && !req.headers.accept?.includes('text/html')) {
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
    return;
  }
  // Otherwise redirect to HTML page
  res.redirect('/dashboard');
});

// Dispute context endpoint (for arbitration services like PayGuard)
router.get('/context/dispute', (req: Request, res: Response) => {
  const market = getMarketSnapshot();
  const risk = getRiskEnvironment();
  
  // Determine volatility level
  let volatilityLevel: 'low' | 'normal' | 'elevated' | 'high' | 'extreme' = 'normal';
  const vix = market.vix || 20;
  if (vix < 15) volatilityLevel = 'low';
  else if (vix < 20) volatilityLevel = 'normal';
  else if (vix < 25) volatilityLevel = 'elevated';
  else if (vix < 35) volatilityLevel = 'high';
  else volatilityLevel = 'extreme';
  
  // Use risk environment for fear/greed approximation
  const fearGreed = risk.score < 30 ? 20 : risk.score < 50 ? 40 : risk.score < 70 ? 60 : 80;
  
  // Determine market regime
  let marketRegime: 'normal' | 'volatile' | 'crisis' | 'black_swan' = 'normal';
  if (vix > 35 || fearGreed < 15) marketRegime = 'black_swan';
  else if (vix > 25 || fearGreed < 25) marketRegime = 'crisis';
  else if (vix > 20 || fearGreed < 35) marketRegime = 'volatile';
  
  // Recent events
  const recentEvents: string[] = [];
  if (fearGreed < 20) recentEvents.push(`Extreme Fear (F&G: ${fearGreed})`);
  if (vix > 25) recentEvents.push(`High VIX (${vix.toFixed(1)})`);
  if (market.dxy && market.dxy > 106) recentEvents.push('Strong Dollar pressure');
  
  // Get upcoming critical event
  const nextEvent = getNextCriticalEvent();
  if (nextEvent) {
    const countdown = new Date(nextEvent.date).getTime() - Date.now();
    if (countdown > 0 && countdown < 24 * 60 * 60 * 1000) {
      recentEvents.push(`${nextEvent.name} in ${Math.round(countdown / 3600000)}h`);
    }
  }
  
  // Recommended action for arbitration
  let recommendedAction: 'proceed_normal' | 'extend_deadline' | 'pause_arbitration' | 'factor_volatility' = 'proceed_normal';
  let confidence = 70;
  
  if (marketRegime === 'black_swan') {
    recommendedAction = 'pause_arbitration';
    confidence = 90;
  } else if (marketRegime === 'crisis') {
    recommendedAction = 'extend_deadline';
    confidence = 85;
  } else if (marketRegime === 'volatile') {
    recommendedAction = 'factor_volatility';
    confidence = 75;
  }
  
  res.json({
    timestamp: Date.now(),
    volatilityLevel,
    marketRegime,
    recentEvents,
    metrics: {
      vix: vix.toFixed(1),
      fearGreed,
      dxy: market.dxy,
      btcPrice: market.btc
    },
    recommendation: {
      action: recommendedAction,
      confidence,
      reasoning: marketRegime === 'black_swan' 
        ? 'Extreme market conditions - disputes may be affected by force majeure'
        : marketRegime === 'crisis'
        ? 'Elevated volatility - consider extending deadlines for performance-based contracts'
        : marketRegime === 'volatile'
        ? 'Above-normal volatility - factor market conditions into evaluation'
        : 'Normal market conditions - proceed with standard arbitration'
    }
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

// === TRADFI DATA ENDPOINTS (Yahoo Finance) ===

// Full TradFi snapshot
router.get('/tradfi', async (req: Request, res: Response) => {
  try {
    const snapshot = await fetchTradFiSnapshot();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch TradFi data' });
  }
});

// Equities (S&P 500, Nasdaq)
router.get('/tradfi/equities', async (req: Request, res: Response) => {
  try {
    const data = await fetchEquities();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch equity data' });
  }
});

// VIX
router.get('/tradfi/vix', async (req: Request, res: Response) => {
  try {
    const data = await fetchVix();
    res.json(data || { error: 'Unable to fetch VIX data' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch VIX data' });
  }
});

// Gold
router.get('/tradfi/gold', async (req: Request, res: Response) => {
  try {
    const data = await fetchGold();
    res.json(data || { error: 'Unable to fetch gold data' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gold data' });
  }
});

// === STABLECOIN DATA ENDPOINTS (DeFiLlama) ===

// Stablecoin supply snapshot
router.get('/stablecoins', async (req: Request, res: Response) => {
  try {
    const snapshot = await fetchStablecoinSnapshot();
    res.json(snapshot || { error: 'Unable to fetch stablecoin data' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stablecoin data' });
  }
});

// === NEWS/SENTIMENT ENDPOINTS ===

// Full news snapshot
router.get('/news', async (req: Request, res: Response) => {
  try {
    const snapshot = await fetchFullNewsSnapshot();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news data' });
  }
});

// News sentiment only
router.get('/news/sentiment', async (req: Request, res: Response) => {
  try {
    const sentiment = await fetchNewsSentiment();
    res.json(sentiment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news sentiment' });
  }
});

// === DERIVATIVES DATA ENDPOINTS (Coinglass/Binance) ===

// === WHALE TRACKING ENDPOINTS ===

// Whale transaction snapshot
router.get('/whales', async (req: Request, res: Response) => {
  try {
    const snapshot = await fetchWhaleSnapshot();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch whale data' });
  }
});

// === ON-CHAIN METRICS ENDPOINTS ===

// Bitcoin on-chain snapshot
router.get('/onchain', async (req: Request, res: Response) => {
  try {
    const snapshot = await fetchOnChainSnapshot();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch on-chain data' });
  }
});

// === FEDWATCH ENDPOINTS ===

// Fed rate probabilities
router.get('/fedwatch', async (req: Request, res: Response) => {
  try {
    const snapshot = await fetchFedWatchSnapshot();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch FedWatch data' });
  }
});

// === PREDICTION MARKET ENDPOINTS (Polymarket) ===

// Full Polymarket snapshot
router.get('/predictions', async (req: Request, res: Response) => {
  try {
    const snapshot = await fetchPolymarketSnapshot();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prediction market data' });
  }
});

// Macro-relevant markets only
router.get('/predictions/markets', async (req: Request, res: Response) => {
  try {
    const markets = await fetchMacroMarkets();
    res.json(markets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch markets' });
  }
});

// Debug endpoint for testing OKX API
router.get('/derivatives/debug', async (req: Request, res: Response) => {
  const axios = (await import('axios')).default;
  try {
    const okxRes = await axios.get('https://www.okx.com/api/v5/public/funding-rate', {
      params: { instId: 'BTC-USDT-SWAP' },
      timeout: 10000,
      headers: { 'User-Agent': 'MacroOracle/1.0' }
    });
    res.json({ success: true, data: okxRes.data });
  } catch (error: any) {
    res.json({ success: false, error: error.message, code: error.code });
  }
});

// Full derivatives snapshot
router.get('/derivatives', async (req: Request, res: Response) => {
  try {
    const snapshot = await fetchDerivativesSnapshot();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch derivatives data' });
  }
});

// Funding rates
router.get('/derivatives/funding', async (req: Request, res: Response) => {
  try {
    const data = await fetchFundingSnapshot();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch funding rates' });
  }
});

// Open Interest
router.get('/derivatives/oi', async (req: Request, res: Response) => {
  try {
    const data = await fetchOISnapshot();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch open interest' });
  }
});

// Liquidations
router.get('/derivatives/liquidations', async (req: Request, res: Response) => {
  try {
    const data = await fetchLiquidationSnapshot();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch liquidation data' });
  }
});

// === HISTORICAL DATA ENDPOINTS ===

// Fear & Greed historical performance
router.get('/historical/fear-greed', async (req: Request, res: Response) => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 20;
    const performance = calculateFearGreedPerformance(threshold);
    const current = await fetchCurrentFearGreed();
    
    res.json({
      current,
      historicalPerformance: performance,
      insight: current.value < 20 
        ? `Current F&G (${current.value}) is in extreme fear territory. Historically, readings <20 have led to avg +${performance.performance['30d'].avgReturn}% returns over 30 days with ${performance.performance['30d'].winRate}% win rate.`
        : `Current F&G (${current.value}) is not in extreme fear territory. Historical extreme fear data provided for reference.`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch historical Fear & Greed data' });
  }
});

// Macro event historical impact
router.get('/historical/event/:eventType', (req: Request, res: Response) => {
  try {
    const eventType = req.params.eventType;
    const history = getMacroEventHistory(eventType);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event history' });
  }
});

// Dispute context for arbitration (historical period analysis)
router.get('/context/dispute', (req: Request, res: Response) => {
  try {
    const startDate = req.query.start as string || '2026-01-01';
    const endDate = req.query.end as string || '2026-02-04';
    const context = getHistoricalDisputeContext(startDate, endDate);
    res.json(context);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate dispute context' });
  }
});

// Current context for live disputes
router.get('/context/current', async (req: Request, res: Response) => {
  try {
    const fearGreed = await fetchCurrentFearGreed();
    
    // Determine volatility level
    let volatilityLevel = 'normal';
    if (fearGreed.value < 20) volatilityLevel = 'extreme';
    else if (fearGreed.value < 35) volatilityLevel = 'high';
    else if (fearGreed.value > 75) volatilityLevel = 'elevated';
    
    res.json({
      timestamp: Date.now(),
      fearGreed: fearGreed.value,
      fearGreedClassification: fearGreed.classification,
      volatilityLevel,
      marketRegime: fearGreed.value < 25 ? 'crisis' : fearGreed.value > 60 ? 'euphoria' : 'normal',
      recentEvents: [
        `Fear & Greed at ${fearGreed.value} (${fearGreed.classification})`,
        volatilityLevel === 'extreme' ? 'Market in extreme fear - elevated volatility expected' : null,
      ].filter(Boolean),
      recommendation: {
        action: volatilityLevel === 'extreme' ? 'extend_deadline' : 'proceed_normal',
        confidence: volatilityLevel === 'extreme' ? 85 : 70,
        reasoning: volatilityLevel === 'extreme' 
          ? 'Elevated volatility - consider extending deadlines and adjusting performance benchmarks'
          : 'Normal market conditions'
      },
      historicalContext: fearGreed.isExtremeFear ? fearGreed.historicalContext : null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate current context' });
  }
});

// === AGENT-FOCUSED ENDPOINTS (Simple, actionable) ===

import { shouldTransact, getTldr, fetchSolanaMetrics, forecastVolatility } from '../services/agent.js';
import { getMacroOrderbookSignal, getMultiAssetOrderbook, getOrderbookImbalance } from '../services/orderbook.js';
import { getBacktestSnapshot, getFearGreedBacktest, getCorrelationsSummary, getStrategyPerformance } from '../services/backtest.js';
import { getAllTrades, getOpenTrades, getTradeStats, getTradeById, addTrade, closeTrade, getRecentTrades } from '../services/trades.js';
import { autoTrader } from '../services/execution/auto-trader.js';

// Simple yes/no: Should I transact now?
router.get('/agent/should-transact', async (req: Request, res: Response) => {
  try {
    const amount = req.query.amount ? parseFloat(req.query.amount as string) : undefined;
    const urgency = (req.query.urgency as 'low' | 'medium' | 'high') || 'medium';
    
    const decision = await shouldTransact(amount, urgency);
    res.json({
      ...decision,
      timestamp: Date.now(),
      queryParams: { amount, urgency }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate transaction conditions' });
  }
});

// One-line market summary
router.get('/agent/tldr', async (req: Request, res: Response) => {
  try {
    const tldr = await getTldr();
    res.json({
      ...tldr,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// Solana-specific metrics (for Colosseum hackathon)
router.get('/solana', async (req: Request, res: Response) => {
  try {
    const metrics = await fetchSolanaMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Solana metrics' });
  }
});

// Volatility forecast for next 24h
router.get('/volatility/forecast', async (req: Request, res: Response) => {
  try {
    const forecast = await forecastVolatility();
    res.json({
      ...forecast,
      timestamp: Date.now(),
      period: '24h'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate volatility forecast' });
  }
});

// === ORDERBOOK + MACRO CORRELATION ENDPOINTS ===

// Combined macro + orderbook signal (the killer feature)
router.get('/orderbook/signal', async (req: Request, res: Response) => {
  try {
    const symbol = (req.query.symbol as string)?.toUpperCase() || 'BTC';
    const signal = await getMacroOrderbookSignal(symbol);
    res.json(signal);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate orderbook signal' });
  }
});

// Multi-asset orderbook overview
router.get('/orderbook/multi', async (req: Request, res: Response) => {
  try {
    const data = await getMultiAssetOrderbook();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch multi-asset orderbook' });
  }
});

// Simple orderbook imbalance check
router.get('/orderbook/imbalance', async (req: Request, res: Response) => {
  try {
    const symbol = (req.query.symbol as string)?.toUpperCase() || 'BTC';
    const imbalance = await getOrderbookImbalance(symbol);
    res.json(imbalance);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch orderbook imbalance' });
  }
});

// Orderbook for specific symbol
router.get('/orderbook/:symbol', async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const signal = await getMacroOrderbookSignal(symbol);
    res.json(signal);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch orderbook' });
  }
});

// Debug endpoint for orderbook API test
router.get('/orderbook/debug/kucoin', async (req: Request, res: Response) => {
  const axios = (await import('axios')).default;
  try {
    const response = await axios.get('https://api.kucoin.com/api/v1/market/orderbook/level2_20', {
      params: { symbol: 'BTC-USDT' },
      timeout: 10000,
      headers: { 'User-Agent': 'MacroOracle/2.0' }
    });
    res.json({ success: true, data: response.data });
  } catch (error: any) {
    res.json({ 
      success: false, 
      error: error.message, 
      code: error.code,
      response: error.response?.data
    });
  }
});

// === BACKTESTING ENDPOINTS ===

// Full backtest snapshot with all strategies and correlations
router.get('/backtest', (req: Request, res: Response) => {
  try {
    const snapshot = getBacktestSnapshot();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch backtest data' });
  }
});

// Fear & Greed specific backtest (our best strategy)
router.get('/backtest/fear-greed', (req: Request, res: Response) => {
  try {
    const backtest = getFearGreedBacktest();
    res.json(backtest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Fear & Greed backtest' });
  }
});

// Correlations summary
router.get('/backtest/correlations', (req: Request, res: Response) => {
  try {
    const correlations = getCorrelationsSummary();
    res.json(correlations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch correlations' });
  }
});

// Strategy performance by name
router.get('/backtest/strategy/:name', (req: Request, res: Response) => {
  try {
    const strategy = getStrategyPerformance(req.params.name);
    if (!strategy) {
      res.status(404).json({ error: 'Strategy not found' });
      return;
    }
    res.json(strategy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch strategy performance' });
  }
});

// === TRADE CALLS ENDPOINTS ===

// Get latest trade signals/recommendations for agents
router.get('/trades/signals', (req: Request, res: Response) => {
  try {
    const openTrades = getOpenTrades();
    const stats = getTradeStats();
    
    // Format signals for agent consumption
    const signals = openTrades.map(trade => ({
      symbol: trade.symbol,
      direction: trade.direction,
      entry: trade.entry,
      stopLoss: trade.stopLoss,
      takeProfit1: trade.takeProfit1,
      takeProfit2: trade.takeProfit2,
      confidence: trade.confidence,
      indicators: trade.indicators,
      reasoning: trade.reasoning,
      timestamp: trade.timestamp,
      status: trade.status
    }));
    
    res.json({
      timestamp: Date.now(),
      activeSignals: signals.length,
      signals,
      performance: {
        winRate: stats.winRate,
        totalPnl: stats.totalPnl,
        profitFactor: stats.profitFactor
      },
      usage: {
        description: 'Active trade signals from Macro Oracle scanner',
        refreshRate: '2 hours',
        riskWarning: 'DYOR - these are signals, not financial advice'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trade signals' });
  }
});

// Get all trades
router.get('/trades', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const trades = getRecentTrades(limit);
    res.json(trades);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// Get trade stats
router.get('/trades/stats', (req: Request, res: Response) => {
  try {
    const stats = getTradeStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trade stats' });
  }
});

// Get open trades only
router.get('/trades/open', (req: Request, res: Response) => {
  try {
    const trades = getOpenTrades();
    res.json(trades);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch open trades' });
  }
});

// Get trade by ID
router.get('/trades/:id', (req: Request, res: Response) => {
  try {
    const trade = getTradeById(req.params.id);
    if (!trade) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }
    res.json(trade);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trade' });
  }
});

// Add new trade (POST)
router.post('/trades', (req: Request, res: Response) => {
  try {
    const trade = addTrade(req.body);
    res.status(201).json(trade);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add trade' });
  }
});

// Close a trade
router.post('/trades/:id/close', (req: Request, res: Response) => {
  try {
    const { exitPrice, status } = req.body;
    const trade = closeTrade(req.params.id, exitPrice, status);
    if (!trade) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }
    res.json(trade);
  } catch (error) {
    res.status(500).json({ error: 'Failed to close trade' });
  }
});

// === PRICE ENDPOINT (proxy for frontend) ===

// Get current price from OKX (avoids CORS issues)
router.get('/price/:symbol', async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const instId = `${symbol}-USDT`;
    
    const axios = (await import('axios')).default;
    const response = await axios.get('https://www.okx.com/api/v5/market/ticker', {
      params: { instId },
      timeout: 5000,
      headers: { 'User-Agent': 'MacroOracle/2.0' }
    });
    
    if (response.data.code === '0' && response.data.data?.[0]) {
      const ticker = response.data.data[0];
      res.json({
        symbol,
        price: parseFloat(ticker.last),
        change24h: ((parseFloat(ticker.last) - parseFloat(ticker.open24h)) / parseFloat(ticker.open24h) * 100).toFixed(2),
        high24h: parseFloat(ticker.high24h),
        low24h: parseFloat(ticker.low24h),
        volume24h: parseFloat(ticker.volCcy24h),
        timestamp: parseInt(ticker.ts)
      });
    } else {
      res.status(404).json({ error: `Price not found for ${symbol}` });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch price' });
  }
});

// === AUTONOMOUS TRADING ENDPOINTS ===

// Get auto-trader status
router.get('/auto-trader/status', (req: Request, res: Response) => {
  try {
    const status = autoTrader.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get auto-trader status' });
  }
});

// Process signals (trigger trade evaluation)
router.post('/auto-trader/process', async (req: Request, res: Response) => {
  try {
    const results = await autoTrader.processSignals();
    res.json({
      timestamp: Date.now(),
      processed: results.length,
      results
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to process signals' });
  }
});

// Enable/disable auto-trader
router.post('/auto-trader/enable', (req: Request, res: Response) => {
  autoTrader.enable();
  res.json({ enabled: true, status: autoTrader.getStatus() });
});

router.post('/auto-trader/disable', (req: Request, res: Response) => {
  autoTrader.disable();
  res.json({ enabled: false, status: autoTrader.getStatus() });
});

// Toggle dry run mode
router.post('/auto-trader/dry-run', (req: Request, res: Response) => {
  const { enabled } = req.body;
  autoTrader.setDryRun(enabled !== false);
  res.json({ dryRun: enabled !== false, status: autoTrader.getStatus() });
});

// Update configuration
router.post('/auto-trader/config', (req: Request, res: Response) => {
  try {
    autoTrader.updateConfig(req.body);
    res.json({ updated: true, status: autoTrader.getStatus() });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update config' });
  }
});

// Get trade log
router.get('/auto-trader/log', (req: Request, res: Response) => {
  try {
    const log = autoTrader.getTradeLog();
    res.json({
      count: log.length,
      trades: log
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get trade log' });
  }
});

export default router;
