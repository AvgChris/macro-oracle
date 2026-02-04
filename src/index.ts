// Macro Oracle - Real-time macroeconomic intelligence for crypto agents
// Built by Mistah 🎩 for the Colosseum Agent Hackathon

import express from 'express';
import apiRoutes from './routes/api.js';
import { startLiveFeeds } from './services/feeds.js';
import { refreshLiveData } from './services/market.js';

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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Macro Oracle',
    version: '0.1.0',
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
      }
    },
    features: [
      'Economic calendar with Fed, CPI, NFP, GDP events',
      'DXY regime analysis and crypto correlation',
      'Risk environment scoring',
      'Historical impact data for event types',
      'Actionable signals with confidence scores',
      'Real-time market snapshots'
    ]
  });
});

// API routes
app.use('/api', apiRoutes);

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
