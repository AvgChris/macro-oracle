# Macro Oracle 🎩

Real-time macroeconomic intelligence for crypto agents.

Built by **Mistah** for the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon/).

## What is this?

Macro Oracle is the missing context layer for autonomous crypto trading. It tracks Fed announcements, CPI, jobs data, DXY, yields, and geopolitical events — correlates them with crypto market impact — and serves actionable signals via API.

**Problem:** Crypto moves on macro. But agents lack real-time macro context.

**Solution:** Macro Oracle ingests macro data, analyzes correlations, and produces signals that agents can consume before executing trades.

## Features

- 📅 **Economic Calendar** - Fed, CPI, NFP, GDP, and more with impact ratings
- 💹 **DXY Regime Analysis** - Dollar strength regimes and crypto correlation
- 📊 **Risk Environment Scoring** - Multi-factor risk-on/risk-off signals
- 📈 **Historical Impact Data** - How past events moved BTC/ETH
- 🎯 **Actionable Signals** - Direction, confidence, magnitude, reasoning
- 🔗 **Agent-First API** - Clean REST endpoints for easy integration

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build && npm start
```

## API Endpoints

### Calendar
```bash
GET /api/calendar              # Upcoming events (default 7 days)
GET /api/calendar?days=14      # Custom timeframe
GET /api/calendar/all          # Full calendar
GET /api/calendar/next-critical # Next high-impact event
GET /api/calendar/impact/:level # Filter by impact (low/medium/high/critical)
```

### Market Data
```bash
GET /api/market                # Current snapshot (DXY, yields, equities, crypto)
GET /api/market/crypto         # Crypto market state
GET /api/market/dxy            # DXY regime analysis
GET /api/market/risk           # Risk environment score
GET /api/market/correlations   # All correlation data
GET /api/market/correlations/DXY-BTC  # Specific pair
```

### Signals
```bash
GET /api/signal                # Generate current macro signal
GET /api/signal/latest         # Last generated signal
GET /api/signals?limit=20      # Signal history
GET /api/signal/event/:id      # Signal for specific event
```

### Analysis
```bash
GET /api/summary               # Comprehensive market summary
GET /api/dashboard             # All data in one call
GET /api/impact/:eventType     # Historical impact for event type
```

## Example Response

```json
{
  "id": "abc-123",
  "timestamp": 1707042000000,
  "sentiment": "risk_off",
  "cryptoImpact": {
    "direction": "bearish",
    "confidence": 72,
    "magnitude": "medium",
    "reasoning": "DXY at 109.45 (strong dollar) pressuring risk assets. VIX: bearish. US10Y: bearish. Upcoming: CPI (YoY) on 2026-02-12"
  },
  "affectedAssets": ["BTC", "ETH", "SOL"],
  "historicalContext": {
    "similarEvents": 12,
    "avgBtcMove": -4.2,
    "avgEthMove": -5.1,
    "winRate": 68
  }
}
```

## Integration

```typescript
// Fetch current signal
const signal = await fetch('https://macro-oracle.example.com/api/signal').then(r => r.json());

if (signal.cryptoImpact.direction === 'bearish' && signal.cryptoImpact.confidence > 70) {
  // Reduce exposure or hedge
}
```

## Roadmap

- [ ] Live data feeds (CoinGecko, Yahoo Finance, FRED)
- [ ] Solana on-chain signal anchoring
- [ ] x402 micropayments for premium feeds
- [ ] Historical backtesting
- [ ] Alert subscriptions

## Tech Stack

- TypeScript
- Express 5
- Zod (validation)
- Solana Web3.js (coming)

## License

MIT

---

🎩 *The macro context layer for autonomous trading.*
