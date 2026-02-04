# Macro Oracle 🎩

**The one-stop macro intelligence layer for crypto agents.**

Real-time Fed data, TradFi markets, stablecoin flows, and news sentiment — all in one API.

Built by **Mistah** for the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon/).

🔗 **Live API:** https://macro-oracle-production.up.railway.app

## Why Macro Oracle?

Crypto moves on macro. DXY spikes, BTC dumps. Fed speaks, markets swing. But most trading agents are flying blind — they see price action but miss the macro context driving it.

**Problem:** Agents lack real-time macro context.

**Solution:** Macro Oracle aggregates macro data from multiple sources, analyzes correlations, and produces actionable signals for autonomous trading.

## Data Sources

| Source | Data | Update Frequency |
|--------|------|------------------|
| **FRED** (Federal Reserve) | Fed Funds Rate, CPI, Treasury Yields, Unemployment | Daily |
| **Yahoo Finance** | S&P 500, Nasdaq, VIX, Gold, Oil, DXY | Real-time |
| **DeFiLlama** | Stablecoin supply (USDT, USDC, DAI) | 5 min |
| **CoinGecko** | BTC, ETH, SOL prices, market cap | 1 min |
| **Alternative.me** | Fear & Greed Index | 1 min |
| **CoinDesk** | Crypto news headlines | 3 min |

## Features

- 📅 **Economic Calendar** — Fed meetings, CPI, NFP, GDP with impact ratings
- 💹 **DXY Regime Analysis** — Dollar strength regimes and crypto correlation (-0.72)
- 📊 **Risk Environment Scoring** — Multi-factor risk-on/risk-off signals
- 🏦 **FRED Integration** — Official Fed data (rates, inflation, yields, unemployment)
- 📈 **TradFi Markets** — S&P 500, Nasdaq, VIX, Gold, Oil tracking
- 💵 **Stablecoin Flows** — USDT/USDC supply changes as liquidity indicator
- 📰 **News Sentiment** — Real-time crypto headline analysis
- 🎯 **Actionable Signals** — Direction, confidence, magnitude, reasoning
- 🔗 **Agent-First API** — Clean REST endpoints for easy integration

## Quick Start

```bash
# Clone
git clone https://github.com/AvgChris/macro-oracle.git
cd macro-oracle

# Install
npm install

# Run
npm run dev
```

## API Endpoints

### Core Intelligence
```bash
GET /api/signal              # Current macro signal with crypto impact
GET /api/dashboard           # Full dashboard (all data in one call)
GET /api/summary             # Comprehensive market summary
```

### Fed Data (FRED)
```bash
GET /api/fred                # Full FRED snapshot + crypto impact analysis
GET /api/fred/rate           # Federal Funds Rate + trend
GET /api/fred/cpi            # CPI with YoY inflation %
GET /api/fred/treasury       # 10Y/2Y yields + inversion detection
GET /api/fred/unemployment   # Unemployment rate + trend
```

### TradFi Markets (Yahoo Finance)
```bash
GET /api/tradfi              # Full TradFi snapshot + risk appetite
GET /api/tradfi/equities     # S&P 500, Nasdaq with trend
GET /api/tradfi/vix          # VIX with fear level interpretation
GET /api/tradfi/gold         # Gold with safe haven flow analysis
```

### Stablecoins (DeFiLlama)
```bash
GET /api/stablecoins         # Supply, 7d changes, inflow/outflow detection
```

### News & Sentiment
```bash
GET /api/news                # Headlines + sentiment analysis
GET /api/news/sentiment      # Sentiment score only
```

### Economic Calendar
```bash
GET /api/calendar            # Upcoming events (default 7 days)
GET /api/calendar/next-critical  # Next high-impact event
GET /api/calendar/impact/:level  # Filter by impact level
```

### Market Data
```bash
GET /api/feeds               # Live crypto prices + Fear/Greed
GET /api/market              # Full market snapshot
GET /api/market/dxy          # DXY regime analysis
GET /api/market/risk         # Risk environment score
GET /api/market/correlations # Correlation data
```

## Example: Current Signal

```bash
curl https://macro-oracle-production.up.railway.app/api/signal
```

```json
{
  "id": "sig-abc123",
  "timestamp": 1707042000000,
  "sentiment": "risk_off",
  "cryptoImpact": {
    "direction": "bearish",
    "confidence": 72,
    "magnitude": "medium",
    "reasoning": "DXY at 109.45 (strong dollar) pressuring risk assets. Fed Funds at 3.64%. Stablecoin outflow -$1.5B 7d."
  },
  "affectedAssets": ["BTC", "ETH", "SOL"],
  "historicalContext": {
    "avgBtcMove": -4.2,
    "winRate": 68
  }
}
```

## Example: FRED Snapshot

```bash
curl https://macro-oracle-production.up.railway.app/api/fred
```

```json
{
  "fedFunds": {"rate": 3.64, "trend": "stable"},
  "treasury": {"yield10y": 4.29, "yield2y": 3.57, "spread": 0.71, "inverted": false},
  "unemployment": {"rate": 4.4, "trend": "stable"},
  "summary": {
    "monetaryPolicy": "neutral",
    "yieldCurve": "normal",
    "laborMarket": "moderate",
    "inflationRisk": "moderate"
  },
  "cryptoImpact": {"direction": "neutral", "confidence": 30}
}
```

## Example: Stablecoin Flows

```bash
curl https://macro-oracle-production.up.railway.app/api/stablecoins
```

```json
{
  "totalSupply": 261833,
  "totalChange7d": -1484,
  "flowDirection": "outflow",
  "interpretation": "Stablecoin supply shrinking — capital exiting crypto",
  "cryptoImplication": {
    "direction": "bearish",
    "confidence": 50,
    "reasoning": "$1484M stablecoin outflow — selling pressure"
  }
}
```

## Integration Example

```typescript
// Before executing a trade, check macro context
const macro = await fetch('https://macro-oracle-production.up.railway.app/api/signal')
  .then(r => r.json());

if (macro.cryptoImpact.direction === 'bearish' && macro.cryptoImpact.confidence > 70) {
  console.log('Macro headwinds detected, reducing position size');
  positionSize *= 0.5;
}

// Check for upcoming volatility events
const calendar = await fetch('https://macro-oracle-production.up.railway.app/api/calendar/next-critical')
  .then(r => r.json());

if (calendar.countdown < 2 * 60 * 60 * 1000) { // < 2 hours
  console.log(`${calendar.event.name} in ${calendar.countdown / 60000} minutes — waiting`);
  return; // Skip trade
}
```

## Hackathon Integration Opportunities

Macro Oracle is designed to complement other agents:

- **Trading Agents** — Check macro context before executing
- **DeFi Protocols** — Adjust risk parameters based on macro environment
- **Liquidation Protection** — Pre-event warnings for volatility
- **Signal Aggregators** — Add macro layer to on-chain signals
- **Portfolio Managers** — Macro-adjusted performance evaluation

## Roadmap

- [x] Economic calendar with impact ratings
- [x] DXY regime analysis
- [x] FRED API integration (official Fed data)
- [x] TradFi markets (Yahoo Finance)
- [x] Stablecoin flow tracking (DeFiLlama)
- [x] News sentiment analysis
- [ ] Solana on-chain signal anchoring
- [ ] x402 micropayments for premium feeds
- [ ] WebSocket real-time updates
- [ ] Historical backtesting API

## Tech Stack

- TypeScript / Node.js
- Express 5
- FRED API (Federal Reserve)
- Yahoo Finance
- DeFiLlama
- CoinGecko
- Deployed on Railway

## License

MIT

---

🎩 **Macro Oracle** — *The macro context layer for autonomous trading.*

*Built for the Colosseum Agent Hackathon 2026*
