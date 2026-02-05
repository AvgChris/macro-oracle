---
name: macro-oracle
version: 1.0.0
description: Real-time macroeconomic intelligence for AI agents. Fear & Greed, Fed policy, DXY, CPI/FOMC events, and historical backtesting.
homepage: https://macro-oracle-production.up.railway.app
author: Mistah
metadata: {"category":"trading","api_base":"https://macro-oracle-production.up.railway.app/api"}
---

# Macro Oracle

Real-time macroeconomic intelligence for AI agents. The missing macro context layer for autonomous trading.

**API Base:** `https://macro-oracle-production.up.railway.app/api`

No authentication required. All endpoints are free.

## Why Use Macro Oracle?

Crypto moves on macro. DXY spikes, BTC dumps. Fed speaks, markets swing. But most trading agents are flying blind — they see price action but miss the macro context driving it.

Macro Oracle provides:
- 📊 **Fear & Greed Index** with historical performance data
- 📅 **Economic Calendar** (FOMC, CPI, NFP, GDP)
- 💹 **DXY Regime Analysis** with crypto correlation
- 🎯 **Actionable Signals** with confidence scores
- 📈 **Historical Backtesting** for strategy validation

## Quick Start

```javascript
// Get current macro signal
const signal = await fetch('https://macro-oracle-production.up.railway.app/api/signal').then(r => r.json());

if (signal.cryptoImpact.direction === 'bearish' && signal.cryptoImpact.confidence > 70) {
  console.log('Macro headwinds — reduce position size');
}
```

## Core Endpoints

### Current Signal
```
GET /api/signal
```
Returns current macro sentiment with crypto impact analysis.

**Response:**
```json
{
  "sentiment": "risk_off",
  "cryptoImpact": {
    "direction": "bearish",
    "confidence": 72,
    "magnitude": "medium",
    "reasoning": "DXY at 109.45 (strong dollar) pressuring risk assets"
  }
}
```

### Fear & Greed with Historical Performance
```
GET /api/historical/fear-greed
```
Current F&G reading plus historical performance when F&G < 20.

**Response:**
```json
{
  "current": { "value": 12, "classification": "Extreme Fear" },
  "historicalPerformance": {
    "30d": { "avgReturn": 14.3, "winRate": 64 },
    "60d": { "avgReturn": 24.1, "winRate": 86 },
    "90d": { "avgReturn": 44.3, "winRate": 93 }
  },
  "insight": "Historically, F&G <20 has led to avg +14.3% returns over 30d"
}
```

### Economic Calendar
```
GET /api/calendar/next-critical
```
Next high-impact macro event with countdown.

**Response:**
```json
{
  "event": { "name": "FOMC Rate Decision", "impact": "critical" },
  "countdown": 14400000,
  "recommendation": "Reduce leverage before announcement"
}
```

### Event Historical Impact
```
GET /api/historical/event/:type
```
Historical BTC impact for CPI, FOMC, NFP events.

**Response:**
```json
{
  "eventType": "CPI",
  "avgBtcMove": 3.8,
  "direction": {
    "hotterThanExpected": { "avgMove": -4.2 },
    "coolerThanExpected": { "avgMove": 5.5 }
  }
}
```

### Dispute Context (for Arbitration)
```
GET /api/context/current
```
Live market context for AI arbitrators handling disputes.

**Response:**
```json
{
  "fearGreed": 12,
  "volatilityLevel": "extreme",
  "marketRegime": "crisis",
  "recommendation": {
    "action": "extend_deadline",
    "confidence": 85,
    "reasoning": "Elevated volatility - consider extending deadlines"
  }
}
```

## All Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/signal` | Current macro signal + crypto impact |
| `GET /api/dashboard` | Full market snapshot |
| `GET /api/calendar` | Upcoming macro events |
| `GET /api/calendar/next-critical` | Next high-impact event |
| `GET /api/historical/fear-greed` | F&G with backtesting data |
| `GET /api/historical/event/:type` | CPI/FOMC/NFP historical impact |
| `GET /api/context/current` | Live dispute context |
| `GET /api/context/dispute` | Historical period context |
| `GET /api/fred` | Federal Reserve data |
| `GET /api/tradfi` | S&P 500, VIX, Gold, Oil |
| `GET /api/stablecoins` | USDT/USDC supply + flows |
| `GET /api/derivatives` | Funding rates, OI, liquidations |
| `GET /api/whales` | Large BTC transactions |
| `GET /api/news` | Crypto news sentiment |
| `GET /api/predictions` | Polymarket odds |

## Integration Examples

### Trading Agent
```javascript
const macro = await fetch('https://macro-oracle-production.up.railway.app/api/signal').then(r => r.json());
const calendar = await fetch('https://macro-oracle-production.up.railway.app/api/calendar/next-critical').then(r => r.json());

// Skip trading before high-impact events
if (calendar.countdown < 2 * 60 * 60 * 1000) {
  console.log(`${calendar.event.name} in ${calendar.countdown / 60000} min — waiting`);
  return;
}

// Adjust position sizing based on macro
if (macro.cryptoImpact.direction === 'bearish') {
  positionSize *= 0.5;
}
```

### DeFi Risk Manager
```javascript
const context = await fetch('https://macro-oracle-production.up.railway.app/api/context/current').then(r => r.json());

if (context.volatilityLevel === 'extreme') {
  // Tighten liquidation thresholds
  healthFactorBuffer *= 1.5;
}
```

### Arbitration Service
```javascript
const disputeContext = await fetch('https://macro-oracle-production.up.railway.app/api/context/current').then(r => r.json());

if (disputeContext.recommendation.action === 'extend_deadline') {
  // Market conditions warrant deadline extension
  extendDeadline(disputeContext.recommendation.reasoning);
}
```

## Data Sources

- **Fear & Greed:** Alternative.me
- **Federal Reserve:** FRED API
- **TradFi:** Yahoo Finance
- **Stablecoins:** DeFiLlama
- **Derivatives:** OKX
- **Predictions:** Polymarket
- **Whales:** Blockchain.info
- **News:** CoinDesk

## Rate Limits

No rate limits currently. Data refreshes every 2 minutes.

---

Built by Mistah 🎩 for the Colosseum Agent Hackathon.

**GitHub:** https://github.com/AvgChris/macro-oracle
**Live API:** https://macro-oracle-production.up.railway.app
