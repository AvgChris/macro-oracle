// Macro Oracle - Real-time macroeconomic intelligence for crypto agents
// Built by Mistah 🎩 for the Colosseum Agent Hackathon

import express from 'express';
import apiRoutes from './routes/api.js';
import { startLiveFeeds } from './services/feeds.js';
import { refreshLiveData } from './services/market.js';
import { landingPageHtml } from './landing.js';
import { apiDocsHtml } from './api-docs.js';
import { signalPageHtml } from './pages/signal-page.js';
import { dashboardPageHtml } from './pages/dashboard-page.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Start live data feeds (refresh every 2 minutes)
startLiveFeeds(120000);

// Initial data fetch
refreshLiveData().catch(console.error);

// Middleware
app.use(express.json());

// CORS for agent access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Root serves the beautiful docs landing page
app.get('/', (req, res) => {
  res.type('html').send(landingPageHtml);
});

// API docs page (beautiful HTML documentation)
app.get('/api', (req, res) => {
  res.type('html').send(apiDocsHtml);
});

// API info endpoint (JSON for programmatic access)
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Macro Oracle',
    version: "0.2.0",
    description: 'Real-time macroeconomic intelligence for crypto agents',
    author: 'Mistah 🎩',
    hackathon: 'Colosseum Agent Hackathon 2026',
    endpoints: {
      health: 'GET /api/health',
      status: 'GET /api/status',
      calendar: {
        upcoming: 'GET /api/calendar?days=7',
        all: 'GET /api/calendar/all',
        nextCritical: 'GET /api/calendar/next-critical',
        byImpact: 'GET /api/calendar/impact/:level'
      },
      market: {
        snapshot: 'GET /api/market',
        crypto: 'GET /api/market/crypto',
        dxy: 'GET /api/market/dxy',
        risk: 'GET /api/market/risk',
        correlations: 'GET /api/market/correlations',
        correlationPair: 'GET /api/market/correlations/:pair'
      },
      signals: {
        current: 'GET /api/signal',
        latest: 'GET /api/signal/latest',
        history: 'GET /api/signals?limit=20',
        forEvent: 'GET /api/signal/event/:eventId'
      },
      analysis: {
        summary: 'GET /api/summary',
        dashboard: 'GET /api/dashboard',
        impact: 'GET /api/impact/:eventType'
      },
      fred: {
        snapshot: 'GET /api/fred',
        fedFundsRate: 'GET /api/fred/rate',
        cpi: 'GET /api/fred/cpi',
        treasury: 'GET /api/fred/treasury',
        unemployment: 'GET /api/fred/unemployment'
      },
      tradfi: {
        snapshot: 'GET /api/tradfi',
        equities: 'GET /api/tradfi/equities',
        vix: 'GET /api/tradfi/vix',
        gold: 'GET /api/tradfi/gold'
      },
      stablecoins: {
        snapshot: 'GET /api/stablecoins'
      },
      news: {
        snapshot: 'GET /api/news',
        sentiment: 'GET /api/news/sentiment'
      },
      derivatives: {
        snapshot: 'GET /api/derivatives',
        funding: 'GET /api/derivatives/funding',
        openInterest: 'GET /api/derivatives/oi',
        liquidations: 'GET /api/derivatives/liquidations'
      },
      predictions: {
        snapshot: 'GET /api/predictions',
        markets: 'GET /api/predictions/markets'
      },
      whales: {
        snapshot: 'GET /api/whales'
      },
      onchain: {
        snapshot: 'GET /api/onchain'
      },
      fedwatch: {
        snapshot: 'GET /api/fedwatch'
      }
    },
    features: [
      'Economic calendar with Fed, CPI, NFP, GDP events',
      'DXY regime analysis and crypto correlation',
      'Risk environment scoring',
      'Historical impact data for event types',
      'Actionable signals with confidence scores',
      'Real-time market snapshots',
      '🆕 FRED API integration (official Fed data)',
      '🆕 Fed Funds Rate with trend analysis',
      '🆕 CPI with year-over-year inflation',
      '🆕 Treasury yields and yield curve inversion detection',
      '🆕 Unemployment rate tracking',
      '🆕 TradFi data (S&P 500, Nasdaq, VIX, Gold, Oil, DXY)',
      '🆕 Stablecoin supply tracking (USDT, USDC, DAI flows)',
      '🆕 Crypto news sentiment analysis',
      '🆕 Derivatives data (funding rates, open interest, liquidations)'
    ]
  });
});

// HTML pages for signal and dashboard
app.get('/signal', (req, res) => {
  res.type('html').send(signalPageHtml);
});

app.get('/dashboard', (req, res) => {
  res.type('html').send(dashboardPageHtml);
});

// API routes
app.use('/api', apiRoutes);

// Fallback: redirect unknown routes to docs (Express 5 syntax)
app.get('/{*path}', (req, res) => {
  res.redirect('/');
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                      MACRO ORACLE                          ║
║         Real-time Macro Intelligence for Crypto            ║
║                                                            ║
║  🎩 Built by Mistah for Colosseum Agent Hackathon         ║
╚═══════════════════════════════════════════════════════════╝

Server running on http://localhost:${PORT}

Endpoints:
  GET /              - API documentation
  GET /api/status    - Oracle status
  GET /api/dashboard - Full dashboard
  GET /api/signal    - Current macro signal
  GET /api/calendar  - Upcoming events

Ready to serve macro intelligence to agents. 🚀
  `);
});

export default app;
