---
name: macro-oracle
version: 2.1.0
description: Real-time macroeconomic intelligence for AI agents. Backtested signals, orderbook analysis, Fear & Greed contrarian strategy (68% win rate), and simple yes/no transaction decisions.
homepage: https://macro-oracle-production.up.railway.app
author: Mistah
metadata: {"category":"trading","api_base":"https://macro-oracle-production.up.railway.app/api"}
---

# Macro Oracle

**Backtested macro intelligence for autonomous agents.** One API call to know if you should transact.

**API Base:** `https://macro-oracle-production.up.railway.app/api`

No authentication required. All endpoints free. Sub-second response.

## 🎯 Why Macro Oracle?

Most trading fails because it ignores context. We've backtested 365 days of data:

| Strategy | Win Rate | Return | Trades |
|----------|----------|--------|--------|
| **Fear/Greed Contrarian** | **68.2%** | **+26.8%** | 22 |
| Combined Signal | 57.6% | +16.7% | 33 |

**Strongest correlation:** Funding Rate → 3-day returns (0.50 correlation)

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
    {"name": "Upcoming Event", "signal": "yellow", "detail": "NFP in 28h"}
  ],
  "recommendation": "Wait until after Non-Farm Payrolls",
  "waitUntil": "2026-02-07T15:30:00.000Z"
}
```

### 2. Backtested Strategy Performance
```bash
curl "https://macro-oracle-production.up.railway.app/api/backtest"
```
```json
{
  "strategies": [
    {"name": "Fear/Greed Contrarian", "winRate": 68.2, "totalReturn": 26.8},
    {"name": "Combined Signal", "winRate": 57.6, "totalReturn": 16.7}
  ],
  "correlations": [
    {"indicator": "funding_rate", "threeDayReturn": 0.498, "strength": "strong"}
  ],
  "summary": {
    "bestStrategy": "Fear/Greed Contrarian",
    "recommendation": "Use extreme fear (F&G < 20) as primary buy signal"
  }
}
```

### 3. Orderbook + Macro Signal
```bash
curl "https://macro-oracle-production.up.railway.app/api/orderbook/signal?symbol=BTC"
```
```json
{
  "orderbook": {
    "midPrice": 65239,
    "bidDepth": 134514,
    "askDepth": 88105,
    "imbalancePercent": 20.85
  },
  "macro": {
    "fearGreed": 9,
    "fearGreedSignal": "extreme_fear"
  },
  "signal": {
    "direction": "strong_buy",
    "confidence": 80,
    "reasoning": [
      "Strong bid imbalance (20.8% more bids)",
      "Extreme fear (F&G: 9) — historically bullish"
    ]
  }
}
```

### 4. Fear & Greed Backtest
```bash
curl "https://macro-oracle-production.up.railway.app/api/backtest/fear-greed"
```
```json
{
  "threshold": 20,
  "performance": {
    "30d": {"avgReturn": 14.3, "winRate": 64},
    "60d": {"avgReturn": 24.1, "winRate": 86},
    "90d": {"avgReturn": 44.3, "winRate": 93}
  },
  "currentFearGreed": 9,
  "isSignalActive": true
}
```

## 📊 All Endpoints

### Agent-Focused (Actionable Decisions)
| Endpoint | Description |
|----------|-------------|
| `GET /api/agent/should-transact` | Yes/no transaction decision with reasoning |
| `GET /api/agent/tldr` | One-sentence market summary |
| `GET /api/volatility/forecast` | 24h volatility prediction |
| `GET /api/solana` | Solana metrics + TVL + TPS |

### Backtesting & Signals
| Endpoint | Description |
|----------|-------------|
| `GET /api/backtest` | Full backtest snapshot (strategies, correlations) |
| `GET /api/backtest/fear-greed` | Fear & Greed strategy performance |
| `GET /api/backtest/correlations` | Indicator correlations with returns |
| `GET /api/backtest/strategy/:name` | Specific strategy performance |

### Orderbook + Macro
| Endpoint | Description |
|----------|-------------|
| `GET /api/orderbook/signal?symbol=BTC` | Combined orderbook + macro signal |
| `GET /api/orderbook/multi` | BTC, ETH, SOL orderbooks at once |
| `GET /api/orderbook/imbalance?symbol=X` | Quick bid/ask imbalance check |

### Market Intelligence
| Endpoint | Description |
|----------|-------------|
| `GET /api/signal` | Current macro signal + crypto impact |
| `GET /api/dashboard/json` | Full market snapshot |
| `GET /api/market` | BTC, ETH, DXY, VIX, Gold |
| `GET /api/historical/fear-greed` | F&G with backtesting data |

### Calendar & Events
| Endpoint | Description |
|----------|-------------|
| `GET /api/calendar/next-critical` | Next FOMC/CPI/NFP with countdown |
| `GET /api/fedwatch` | Fed rate probabilities by meeting |

### Derivatives & On-Chain
| Endpoint | Description |
|----------|-------------|
| `GET /api/derivatives` | Funding rates, OI, liquidations |
| `GET /api/whales` | Large BTC transactions |

## 💡 Integration Examples

### Trading Agent (Best Practice)
```javascript
// 1. Check if we should trade
const decision = await fetch(
  'https://macro-oracle-production.up.railway.app/api/agent/should-transact'
).then(r => r.json());

if (!decision.shouldTransact) {
  console.log(decision.recommendation);
  return; // Wait for better conditions
}

// 2. Get backtest-validated signal
const backtest = await fetch(
  'https://macro-oracle-production.up.railway.app/api/backtest/fear-greed'
).then(r => r.json());

if (backtest.isSignalActive && backtest.currentFearGreed < 20) {
  // Extreme fear = historically +14% avg return
  executeBuy();
}
```

### With Clodds Integration (Ready)
```javascript
// Macro Oracle signals + Clodds execution
const signal = await fetch(
  'https://macro-oracle-production.up.railway.app/api/orderbook/signal?symbol=BTC'
).then(r => r.json());

if (signal.signal.direction === 'strong_buy') {
  // Execute via Clodds Compute API
  await clodds.trade({
    action: 'buy',
    symbol: 'BTC',
    platform: 'hyperliquid',
    confidence: signal.signal.confidence
  });
}
```

## 📈 Backtested Edge

We don't guess. We tested:

**Correlations (365 days):**
- Funding Rate → 3-day returns: **0.50** (strong)
- Open Interest → Next day: **0.25** (moderate)
- Fear/Greed → 7-day returns: 0.07 (weak, but extreme values work)

**Strategy Results:**
- Fear/Greed < 20 → Buy: **68% win rate, +26.8% return**
- Extreme fear entries: **+14% avg 30-day return**

## 📡 Data Sources

- **Fear & Greed:** Alternative.me (live)
- **Orderbook:** Binance, KuCoin (live)
- **Federal Reserve:** FRED API (official)
- **TradFi:** Yahoo Finance (live)
- **Derivatives:** OKX, Binance Futures
- **Solana:** CoinGecko + DeFiLlama

## ⚙️ Technical Details

- **Response Time:** <500ms typical
- **Rate Limits:** None currently
- **Data Refresh:** 2-5 minutes depending on source
- **Uptime:** Railway-hosted, 99.9%+

---

Built by **Mistah** 🎩 for the **Colosseum Agent Hackathon**.

**GitHub:** https://github.com/AvgChris/macro-oracle  
**Live API:** https://macro-oracle-production.up.railway.app
