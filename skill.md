---
name: macro-oracle
version: 2.0.0
description: Real-time macroeconomic intelligence for AI agents. Simple yes/no transaction decisions, Solana metrics, volatility forecasting, Fear & Greed, Fed policy, and historical backtesting.
homepage: https://macro-oracle-production.up.railway.app
author: Mistah
metadata: {"category":"trading","api_base":"https://macro-oracle-production.up.railway.app/api"}
---

# Macro Oracle

**Macroeconomic intelligence for autonomous agents.** One API call to know if you should transact.

**API Base:** `https://macro-oracle-production.up.railway.app/api`

No authentication required. All endpoints free. Sub-second response.

## 🎯 Agent-First Design

Most macro APIs dump data. Macro Oracle gives **actionable decisions**.

```javascript
// Should I execute this USDC transaction?
const decision = await fetch(
  'https://macro-oracle-production.up.railway.app/api/agent/should-transact?amount=5000'
).then(r => r.json());

if (!decision.shouldTransact) {
  console.log(decision.recommendation);
  // "Wait until after Non-Farm Payrolls. Suggested: 2026-02-07T15:30:00Z"
  return;
}
```

## ⚡ Quick Start

### 1. Should I Transact Now?
```bash
curl "https://macro-oracle-production.up.railway.app/api/agent/should-transact"
```
```json
{
  "shouldTransact": false,
  "confidence": 80,
  "riskLevel": "high",
  "factors": [
    {"name": "Fear & Greed", "signal": "red", "detail": "Extreme fear (9)"},
    {"name": "Upcoming Event", "signal": "yellow", "detail": "NFP in 31h"}
  ],
  "recommendation": "Wait until after Non-Farm Payrolls",
  "waitUntil": "2026-02-07T15:30:00.000Z"
}
```

### 2. One-Line Summary
```bash
curl "https://macro-oracle-production.up.railway.app/api/agent/tldr"
```
```json
{
  "summary": "Extreme fear (F&G: 9). Historically +14% avg returns over 30d.",
  "sentiment": "bearish",
  "action": "Consider accumulating. DCA if bullish long-term.",
  "fearGreed": 9,
  "nextEvent": "Non-Farm Payrolls on 2026-02-07"
}
```

### 3. Solana Metrics
```bash
curl "https://macro-oracle-production.up.railway.app/api/solana"
```
```json
{
  "price": 80.4,
  "priceChange24h": -10.45,
  "tvl": 6177153348,
  "tps": 3708,
  "stakingYield": 6.5,
  "macroContext": {
    "fearGreed": 9,
    "correlation": {"btc": 0.85, "eth": 0.82},
    "trend": "bearish"
  }
}
```

### 4. Volatility Forecast
```bash
curl "https://macro-oracle-production.up.railway.app/api/volatility/forecast"
```
```json
{
  "forecast": "moderate",
  "expectedRange": {"btc": 3, "eth": 3.5, "sol": 4},
  "drivers": ["Extreme sentiment (F&G: 9)"],
  "recommendation": "Above-average volatility expected. Reduce position sizes by 25%."
}
```

## 🔥 Agent-Focused Endpoints

| Endpoint | What It Does | Use Case |
|----------|--------------|----------|
| `/api/agent/should-transact` | Yes/no transaction decision | Before any USDC transfer |
| `/api/agent/tldr` | One-line market summary | Quick status check |
| `/api/solana` | SOL price, TVL, TPS, yield | Solana-native agents |
| `/api/volatility/forecast` | 24h volatility prediction | Position sizing |

### Should-Transact Query Parameters
```
?amount=10000    # Transaction size (larger = more conservative)
?urgency=high    # low, medium, high (higher = more willing to proceed)
```

## 📊 Data Endpoints

### Fear & Greed with Backtesting
```
GET /api/historical/fear-greed
```
Current reading + what historically happens when F&G < 20:
- 30-day: +14.3% avg, 64% win rate
- 60-day: +24.1% avg, 86% win rate
- 90-day: +44.3% avg, 93% win rate

### Economic Calendar
```
GET /api/calendar/next-critical
```
Next high-impact event with countdown and historical BTC impact.

### Dispute Context (for Arbitration)
```
GET /api/context/current
```
Live market conditions for AI arbitrators — volatility level, regime, recommended actions.

### Full Market Snapshot
```
GET /api/dashboard/json
```
Everything in one call: F&G, VIX, DXY, S&P, Gold, crypto prices, upcoming events.

## 📋 All Endpoints

### Agent-Focused (New)
| Endpoint | Description |
|----------|-------------|
| `GET /api/agent/should-transact` | Simple yes/no transaction decision |
| `GET /api/agent/tldr` | One-sentence market summary |
| `GET /api/solana` | Solana metrics + TVL + TPS |
| `GET /api/volatility/forecast` | 24h volatility prediction |

### Market Intelligence
| Endpoint | Description |
|----------|-------------|
| `GET /api/signal/json` | Current macro signal + crypto impact |
| `GET /api/dashboard/json` | Full market snapshot |
| `GET /api/summary` | Outlook + risks + opportunities |
| `GET /api/market` | BTC, ETH, DXY, VIX, Gold |
| `GET /api/tradfi` | S&P 500, Nasdaq, VIX, Gold |
| `GET /api/fred` | Fed Funds Rate, CPI, Treasury yields |

### Calendar & Events
| Endpoint | Description |
|----------|-------------|
| `GET /api/calendar` | Upcoming macro events |
| `GET /api/calendar/next-critical` | Next FOMC/CPI/NFP with countdown |
| `GET /api/calendar/all` | Full calendar |
| `GET /api/fedwatch` | Fed rate probabilities by meeting |

### Historical & Context
| Endpoint | Description |
|----------|-------------|
| `GET /api/historical/fear-greed` | F&G with backtesting data |
| `GET /api/historical/event/:type` | CPI/FOMC/NFP historical impact |
| `GET /api/context/current` | Live dispute context |
| `GET /api/context/dispute` | Historical period analysis |

### Advanced Data
| Endpoint | Description |
|----------|-------------|
| `GET /api/derivatives` | Funding rates, OI, liquidations |
| `GET /api/stablecoins` | USDT/USDC supply + flows |
| `GET /api/whales` | Large BTC transactions |
| `GET /api/onchain` | Network stats, mempool |
| `GET /api/news` | Crypto news sentiment |
| `GET /api/predictions` | Polymarket odds |

## 💡 Integration Examples

### Trading Agent
```javascript
const { shouldTransact, waitUntil } = await fetch(
  'https://macro-oracle-production.up.railway.app/api/agent/should-transact?amount=10000'
).then(r => r.json());

if (!shouldTransact) {
  scheduleRetry(new Date(waitUntil));
  return;
}

// Proceed with trade
executeTrade();
```

### Escrow Service
```javascript
const context = await fetch(
  'https://macro-oracle-production.up.railway.app/api/context/current'
).then(r => r.json());

if (context.volatilityLevel === 'extreme') {
  // Extend escrow deadline during market stress
  escrow.extendDeadline(48 * 60 * 60 * 1000);
}
```

### Solana DeFi Agent
```javascript
const sol = await fetch(
  'https://macro-oracle-production.up.railway.app/api/solana'
).then(r => r.json());

if (sol.macroContext.fearGreed < 20 && sol.priceChange24h < -10) {
  // Extreme fear + big dip = historical buying opportunity
  await depositToVault(sol.price);
}
```

### Dynamic Pricing
```javascript
const { forecast, expectedRange } = await fetch(
  'https://macro-oracle-production.up.railway.app/api/volatility/forecast'
).then(r => r.json());

if (forecast === 'extreme') {
  // Widen spreads during high volatility
  spread *= 2;
}
```

## 📡 Data Sources

- **Fear & Greed:** Alternative.me (live)
- **Federal Reserve:** FRED API (official)
- **TradFi:** Yahoo Finance (live)
- **Solana:** CoinGecko + DeFiLlama + Solana RPC
- **Stablecoins:** DeFiLlama
- **Derivatives:** OKX
- **Predictions:** Polymarket
- **Whales:** Blockchain.info
- **News:** CoinDesk RSS

## ⚙️ Technical Details

- **Response Time:** <500ms typical
- **Rate Limits:** None currently
- **Data Refresh:** 2-5 minutes depending on source
- **Uptime:** Railway-hosted, 99.9%+

---

Built by **Mistah** 🎩 for the **Colosseum Agent Hackathon**.

**GitHub:** https://github.com/AvgChris/macro-oracle  
**Live API:** https://macro-oracle-production.up.railway.app  
**Docs:** https://macro-oracle-production.up.railway.app/api
