# 🐔 Chicken Buffett

> The world's most data-driven poultry trader. Built on [ElizaOS](https://github.com/elizaos/eliza), powered by [Macro Oracle](https://macro-oracle-production.up.railway.app).

![Status](https://img.shields.io/badge/status-alpha-yellow)
![Runtime](https://img.shields.io/badge/runtime-ElizaOS%201.7-blue)
![Trading](https://img.shields.io/badge/trading-Hyperliquid%20Perps-purple)

## What is this?

Chicken Buffett is an autonomous crypto trading agent that:

1. **Monitors market signals** via the Macro Oracle API (RSI, MACD, Bollinger Bands, VWAP, OBV, Fear & Greed)
2. **Executes perpetual futures trades** on Hyperliquid when high-confidence signals appear
3. **Posts on Twitter/X** — trade alerts, market commentary, P&L updates, and strategy insights
4. **Responds to conversations** as a data-obsessed chicken in a suit who takes trading very seriously

It's Warren Buffett meets KFC, and it's entirely data-driven.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ElizaOS Runtime                           │
│                                                             │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────┐  │
│  │  Macro Oracle    │  │ Hyperliquid Perps │  │  Social   │  │
│  │  Plugin          │  │ Plugin            │  │  Plugin   │  │
│  │                  │  │                   │  │           │  │
│  │  • Provider      │  │  • Open Perp      │  │  • Tweet  │  │
│  │  • Execute       │  │  • Close Perp     │  │    Poster │  │
│  │  • Analyze       │  │  • Get Positions  │  │  • Tweet  │  │
│  │  • Check Pos     │  │  • SDK Client     │  │    Tmpl   │  │
│  │  • Signal Watch  │  │                   │  │           │  │
│  └────────┬─────────┘  └────────┬──────────┘  └─────┬─────┘  │
│           │                     │                    │        │
│  ┌────────▼─────────────────────▼────────────────────▼─────┐  │
│  │              Chicken Buffett Character                   │  │
│  │        (personality, style, post examples)               │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Bootstrap   │  │  SQL (PGLite)│  │  Twitter Plugin   │  │
│  │  Plugin      │  │  Plugin      │  │  (official)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                                        │
         ▼                                        ▼
   Macro Oracle API                         Twitter/X API
   (signals, F&G,                          (posting, replies,
    scanner, stats)                         engagement)
         │
         ▼
   Hyperliquid DEX
   (perp trading)
```

## Quick Start

### Prerequisites

- **Node.js v23+**
- **bun** (v1.3.4+)
- Macro Oracle API access (free, open)
- Hyperliquid wallet (testnet recommended to start)
- Twitter API credentials (OAuth 1.0a with Read+Write)
- OpenAI API key (or Anthropic)

### Setup

```bash
# 1. Navigate to the agent directory
cd macro-oracle/agent

# 2. Install dependencies
bun install

# 3. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 4. Start in development mode
bun run dev

# OR start in production mode
bun run start
```

### Docker

```bash
# Build
docker build -t chicken-buffett .

# Run
docker run -d \
  --name chicken-buffett \
  --env-file .env \
  -p 3000:3000 \
  chicken-buffett
```

## Configuration

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for LLM |
| `MACRO_ORACLE_API_URL` | Macro Oracle API endpoint |
| `HYPERLIQUID_PRIVATE_KEY` | Wallet private key (0x prefixed) |
| `HYPERLIQUID_TESTNET` | Use testnet (true/false) |

### Optional: Twitter

| Variable | Description |
|----------|-------------|
| `TWITTER_API_KEY` | Twitter consumer API key |
| `TWITTER_API_SECRET_KEY` | Twitter consumer API secret |
| `TWITTER_ACCESS_TOKEN` | Twitter access token (Read+Write!) |
| `TWITTER_ACCESS_TOKEN_SECRET` | Twitter access token secret |
| `TWITTER_ENABLE_POST` | Enable autonomous posting |

### Optional: Auto-Trading

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTO_TRADE_ENABLED` | Enable signal auto-execution | `false` |
| `DEFAULT_LEVERAGE` | Default leverage for trades | `3` |
| `DEFAULT_SIZE_USD` | Default position size (USD) | `100` |
| `AUTO_TRADE_MIN_CONFIDENCE` | Min confidence to auto-trade | `80` |

## Custom Plugins

### Macro Oracle Plugin (`macro-oracle`)

Integrates with the Macro Oracle API:

- **Provider**: Injects real-time signal data, Fear & Greed, scanner results, and trade stats into the LLM context
- **Actions**:
  - `EXECUTE_SIGNAL` — Execute a trade based on a signal
  - `CHECK_POSITIONS` — View open positions and P&L
  - `ANALYZE_MARKET` — Get full market analysis from the scanner
- **Service**: Signal Watcher — background polling that auto-executes high-confidence signals

### Hyperliquid Perps Plugin (`hyperliquid-perps`)

Custom perpetual futures trading (the official ElizaOS Hyperliquid plugin is spot-only):

- **Actions**:
  - `OPEN_PERP` — Open a perp position with leverage, SL, and TP
  - `CLOSE_PERP` — Close a position (full or partial)
  - `GET_POSITIONS` — View all open perp positions with live P&L
- **Client**: Full Hyperliquid SDK integration for perps (market orders, leverage, cross-margin, stop loss, take profit)

### Social Plugin (`social`)

Scheduled social media posting:

- **Service**: Social Poster — posts at configurable intervals with weighted tweet types
- **Templates**: Pre-built templates for trade alerts, market commentary, P&L updates, Macro Oracle promotion, strategy insights, and engagement posts

## Trading Logic

```
┌─────────────────────────────────┐
│  Signal Watcher (every 2 hours) │
│                                 │
│  1. Poll /api/scanner/history   │
│  2. Filter ≥80% confidence      │
│  3. Skip already-traded signals │
│  4. Skip if position exists     │
│                                 │
│  If high-confidence signal:     │
│  ├── Open perp on Hyperliquid   │
│  ├── Set SL/TP                  │
│  ├── Queue trade alert tweet    │
│  └── Cache trade for tracking   │
│                                 │
│  Monitor open positions:        │
│  ├── Check TP/SL hits           │
│  └── Queue close alert tweet    │
└─────────────────────────────────┘
```

## Safety

- **Always start with testnet** (`HYPERLIQUID_TESTNET=true`)
- Auto-trading is **off by default** (`AUTO_TRADE_ENABLED=false`)
- Default leverage is conservative (3x)
- Stop loss is set on every trade
- The signal watcher won't re-trade signals it's already acted on
- Position sizing is configurable and conservative by default

## Tech Stack

- **Runtime**: [ElizaOS](https://github.com/elizaos/eliza) v1.7
- **Language**: TypeScript
- **Package Manager**: bun
- **LLM**: OpenAI (GPT-4) or Anthropic (Claude)
- **Trading**: Hyperliquid DEX via `hyperliquid` npm SDK
- **Signals**: Macro Oracle API
- **Social**: Twitter/X via `@elizaos/plugin-twitter`
- **Database**: PGLite (dev) or PostgreSQL (prod)

## License

MIT

---

*Not financial advice. Chicken Buffett is an experimental trading agent. Trade at your own risk. No chickens were harmed in the making of this software.* 🐔
