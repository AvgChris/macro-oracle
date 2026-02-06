export const apiDocsHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation — Macro Oracle</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #ffffff;
      --bg-secondary: #f8f9fc;
      --bg-card: #ffffff;
      --bg-card-hover: #f3f4f8;
      --purple-primary: #7c3aed;
      --purple-secondary: #8b5cf6;
      --purple-glow: rgba(124, 58, 237, 0.08);
      --text-primary: #1a1a2e;
      --text-secondary: #4a4a68;
      --text-muted: #8888a0;
      --border-color: #e5e7eb;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --info: #3b82f6;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
      min-height: 100vh;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 24px;
    }

    header {
      padding: 24px 0;
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      z-index: 100;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: var(--text-primary);
    }

    .logo-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #ab9ff2 0%, #7b6fd9 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .logo-text { font-size: 18px; font-weight: 700; }

    nav a {
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 500;
      margin-left: 24px;
      transition: color 0.2s;
    }

    nav a:hover { color: var(--purple-primary); }

    .hero {
      padding: 60px 0 40px;
      text-align: center;
    }

    .hero h1 {
      font-size: 42px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .hero p {
      color: var(--text-secondary);
      font-size: 18px;
      max-width: 600px;
      margin: 0 auto;
    }

    .section {
      padding: 40px 0;
      border-bottom: 1px solid var(--border-color);
    }

    .section:last-child { border-bottom: none; }

    .section h2 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 24px;
      color: var(--purple-primary);
    }

    .section h3 {
      font-size: 18px;
      font-weight: 600;
      margin: 24px 0 12px;
    }

    .section p {
      color: var(--text-secondary);
      margin-bottom: 16px;
    }

    .base-url {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px 24px;
      margin: 24px 0;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .base-url-label {
      color: var(--text-muted);
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .base-url-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 16px;
      color: var(--purple-primary);
    }

    .copy-btn {
      margin-left: auto;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .copy-btn:hover {
      border-color: var(--purple-primary);
      color: var(--purple-primary);
    }

    .endpoint-group {
      margin-bottom: 32px;
    }

    .endpoint {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      margin-bottom: 12px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }

    .endpoint-header {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .endpoint-header:hover {
      background: var(--bg-card-hover);
    }

    .method {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
      margin-right: 16px;
    }

    .method.get {
      background: rgba(74, 222, 128, 0.15);
      color: var(--success);
    }

    .path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      color: var(--text-primary);
    }

    .endpoint-desc {
      color: var(--text-muted);
      font-size: 14px;
      margin-left: auto;
    }

    .code-block {
      background: #1e1e2e;
      border-radius: 12px;
      overflow: hidden;
      margin: 16px 0;
      border: 1px solid #2a2a3a;
    }

    .code-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #16161e;
      border-bottom: 1px solid #2a2a3a;
    }

    .code-header span {
      color: #888;
      font-size: 13px;
    }

    .code-content {
      padding: 16px;
      overflow-x: auto;
    }

    pre {
      margin: 0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      line-height: 1.6;
      color: #a0a0b0;
    }

    .highlight-string { color: #a5d6a7; }
    .highlight-number { color: #ffcb6b; }
    .highlight-key { color: #c792ea; }
    .highlight-comment { color: #6b6b7b; }

    .param-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }

    .param-table th,
    .param-table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .param-table th {
      color: var(--text-muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
    }

    .param-name {
      font-family: 'JetBrains Mono', monospace;
      color: var(--purple-primary);
    }

    .param-type {
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-muted);
      font-size: 13px;
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge.required {
      background: rgba(248, 113, 113, 0.15);
      color: var(--danger);
    }

    .badge.optional {
      background: rgba(160, 160, 176, 0.15);
      color: var(--text-muted);
    }

    .tip-box {
      background: var(--purple-glow);
      border: 1px solid rgba(171, 159, 242, 0.3);
      border-radius: 12px;
      padding: 16px 20px;
      margin: 24px 0;
    }

    .tip-box strong {
      color: var(--purple-primary);
    }

    footer {
      padding: 40px 0;
      text-align: center;
      color: var(--text-muted);
      font-size: 14px;
    }

    footer a {
      color: var(--purple-primary);
      text-decoration: none;
    }

    @media (max-width: 640px) {
      .hero h1 { font-size: 32px; }
      .base-url { flex-direction: column; align-items: flex-start; gap: 12px; }
      .copy-btn { margin-left: 0; }
      .endpoint-desc { display: none; }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <div class="header-content">
        <a href="/" class="logo">
          <div class="logo-icon">📊</div>
          <span class="logo-text">Macro Oracle</span>
        </a>
        <nav>
          <a href="/">Home</a>
          <a href="/api/dashboard">Dashboard</a>
          <a href="/api/signal">Signal</a>
        </nav>
      </div>
    </div>
  </header>

  <main class="container">
    <section class="hero">
      <h1>API Documentation</h1>
      <p>Real-time macroeconomic intelligence for crypto agents. Free to use, no API key required.</p>
    </section>

    <section class="section">
      <h2>Getting Started</h2>
      <p>The Macro Oracle API provides real-time macro signals, economic calendar data, and market intelligence. All endpoints are publicly accessible with no authentication required.</p>
      
      <div class="base-url">
        <div>
          <div class="base-url-label">Base URL</div>
          <div class="base-url-value">https://macro-oracle-production.up.railway.app</div>
        </div>
        <button class="copy-btn" onclick="navigator.clipboard.writeText('https://macro-oracle-production.up.railway.app')">Copy</button>
      </div>

      <div class="tip-box">
        <strong>💡 Quick Start:</strong> Try the agent decision endpoint: <code>curl https://macro-oracle-production.up.railway.app/api/agent/should-transact</code>
      </div>
    </section>

    <section class="section">
      <h2>🎯 Agent-Focused Endpoints</h2>
      <p>Simple, actionable endpoints designed for autonomous agents. Get decisions, not just data.</p>
      
      <div class="endpoint-group">
        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/agent/should-transact</span>
            <span class="endpoint-desc">Yes/no decision: Should I transact now?</span>
          </div>
        </div>

        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/agent/tldr</span>
            <span class="endpoint-desc">One-line market summary</span>
          </div>
        </div>

        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/solana</span>
            <span class="endpoint-desc">Solana metrics: price, TVL, TPS, staking yield</span>
          </div>
        </div>

        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/volatility/forecast</span>
            <span class="endpoint-desc">24h volatility prediction with expected ranges</span>
          </div>
        </div>
      </div>

      <table class="param-table">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="param-name">amount</span></td>
            <td><span class="param-type">number</span></td>
            <td>Transaction size in USD (larger = more conservative)</td>
          </tr>
          <tr>
            <td><span class="param-name">urgency</span></td>
            <td><span class="param-type">string</span></td>
            <td>low | medium | high (higher = more willing to proceed)</td>
          </tr>
        </tbody>
      </table>

      <h3>Example: /api/agent/should-transact</h3>
      <div class="code-block">
        <div class="code-header">
          <span>JSON Response</span>
        </div>
        <div class="code-content">
<pre>{
  <span class="highlight-key">"shouldTransact"</span>: <span class="highlight-number">false</span>,
  <span class="highlight-key">"confidence"</span>: <span class="highlight-number">80</span>,
  <span class="highlight-key">"riskLevel"</span>: <span class="highlight-string">"high"</span>,
  <span class="highlight-key">"factors"</span>: [
    {<span class="highlight-key">"name"</span>: <span class="highlight-string">"Fear & Greed"</span>, <span class="highlight-key">"signal"</span>: <span class="highlight-string">"red"</span>, <span class="highlight-key">"detail"</span>: <span class="highlight-string">"Extreme fear (9)"</span>},
    {<span class="highlight-key">"name"</span>: <span class="highlight-string">"Upcoming Event"</span>, <span class="highlight-key">"signal"</span>: <span class="highlight-string">"yellow"</span>, <span class="highlight-key">"detail"</span>: <span class="highlight-string">"NFP in 31h"</span>}
  ],
  <span class="highlight-key">"recommendation"</span>: <span class="highlight-string">"Wait until after Non-Farm Payrolls"</span>,
  <span class="highlight-key">"waitUntil"</span>: <span class="highlight-string">"2026-02-07T15:30:00.000Z"</span>
}</pre>
        </div>
      </div>

      <h3>Example: /api/solana</h3>
      <div class="code-block">
        <div class="code-header">
          <span>JSON Response</span>
        </div>
        <div class="code-content">
<pre>{
  <span class="highlight-key">"price"</span>: <span class="highlight-number">80.4</span>,
  <span class="highlight-key">"priceChange24h"</span>: <span class="highlight-number">-10.45</span>,
  <span class="highlight-key">"tvl"</span>: <span class="highlight-number">6177153348</span>,
  <span class="highlight-key">"tps"</span>: <span class="highlight-number">3708</span>,
  <span class="highlight-key">"stakingYield"</span>: <span class="highlight-number">6.5</span>,
  <span class="highlight-key">"macroContext"</span>: {
    <span class="highlight-key">"fearGreed"</span>: <span class="highlight-number">9</span>,
    <span class="highlight-key">"correlation"</span>: {<span class="highlight-key">"btc"</span>: <span class="highlight-number">0.85</span>, <span class="highlight-key">"eth"</span>: <span class="highlight-number">0.82</span>},
    <span class="highlight-key">"trend"</span>: <span class="highlight-string">"bearish"</span>
  }
}</pre>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Core Endpoints</h2>
      
      <div class="endpoint-group">
        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/signal</span>
            <span class="endpoint-desc">Current macro signal with crypto impact</span>
          </div>
        </div>

        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/dashboard</span>
            <span class="endpoint-desc">Full market dashboard (all data in one call)</span>
          </div>
        </div>

        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/summary</span>
            <span class="endpoint-desc">Comprehensive market summary</span>
          </div>
        </div>
      </div>

      <h3>Example Response: /api/signal</h3>
      <div class="code-block">
        <div class="code-header">
          <span>JSON Response</span>
        </div>
        <div class="code-content">
<pre>{
  <span class="highlight-key">"id"</span>: <span class="highlight-string">"sig-abc123"</span>,
  <span class="highlight-key">"timestamp"</span>: <span class="highlight-number">1707042000000</span>,
  <span class="highlight-key">"sentiment"</span>: <span class="highlight-string">"risk_off"</span>,
  <span class="highlight-key">"cryptoImpact"</span>: {
    <span class="highlight-key">"direction"</span>: <span class="highlight-string">"bearish"</span>,
    <span class="highlight-key">"confidence"</span>: <span class="highlight-number">72</span>,
    <span class="highlight-key">"magnitude"</span>: <span class="highlight-string">"medium"</span>,
    <span class="highlight-key">"reasoning"</span>: <span class="highlight-string">"DXY at 109.45 pressuring risk assets. Fed Funds at 3.64%."</span>
  },
  <span class="highlight-key">"affectedAssets"</span>: [<span class="highlight-string">"BTC"</span>, <span class="highlight-string">"ETH"</span>, <span class="highlight-string">"SOL"</span>]
}</pre>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Economic Calendar</h2>
      
      <div class="endpoint-group">
        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/calendar</span>
            <span class="endpoint-desc">Upcoming economic events (default: 7 days)</span>
          </div>
        </div>

        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/calendar/next-critical</span>
            <span class="endpoint-desc">Next high-impact event with countdown</span>
          </div>
        </div>

        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/calendar/impact/:level</span>
            <span class="endpoint-desc">Filter events by impact (high/medium/low)</span>
          </div>
        </div>
      </div>

      <table class="param-table">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="param-name">days</span></td>
            <td><span class="param-type">integer</span></td>
            <td>Number of days to look ahead (default: 7)</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2>Market Data</h2>
      
      <div class="endpoint-group">
        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/market</span>
            <span class="endpoint-desc">Full market snapshot</span>
          </div>
        </div>

        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/market/dxy</span>
            <span class="endpoint-desc">DXY regime analysis</span>
          </div>
        </div>

        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/market/risk</span>
            <span class="endpoint-desc">Risk environment score</span>
          </div>
        </div>

        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/market/correlations</span>
            <span class="endpoint-desc">Asset correlation data</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Federal Reserve Data</h2>
      
      <div class="endpoint-group">
        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/fred</span>
            <span class="endpoint-desc">Full FRED snapshot + crypto impact</span>
          </div>
        </div>

        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/fred/rate</span>
            <span class="endpoint-desc">Federal Funds Rate + trend</span>
          </div>
        </div>

        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/fred/cpi</span>
            <span class="endpoint-desc">CPI with YoY inflation %</span>
          </div>
        </div>

        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/fred/treasury</span>
            <span class="endpoint-desc">10Y/2Y yields + inversion detection</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>TradFi & Stablecoins</h2>
      
      <div class="endpoint-group">
        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/tradfi</span>
            <span class="endpoint-desc">S&P 500, Nasdaq, VIX, Gold, Oil</span>
          </div>
        </div>

        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/stablecoins</span>
            <span class="endpoint-desc">USDT/USDC supply + flow direction</span>
          </div>
        </div>

        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/derivatives</span>
            <span class="endpoint-desc">Funding rates, OI, liquidations</span>
          </div>
        </div>

        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/whales</span>
            <span class="endpoint-desc">Large BTC transactions</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Integration Example</h2>
      <p>Check macro context before executing trades:</p>
      
      <div class="code-block">
        <div class="code-header">
          <span>JavaScript</span>
        </div>
        <div class="code-content">
<pre><span class="highlight-comment">// Before executing a trade, check macro context</span>
<span class="highlight-key">const</span> macro = <span class="highlight-key">await</span> fetch(<span class="highlight-string">'https://macro-oracle-production.up.railway.app/api/signal'</span>)
  .then(r => r.json());

<span class="highlight-key">if</span> (macro.cryptoImpact.direction === <span class="highlight-string">'bearish'</span> && macro.cryptoImpact.confidence > <span class="highlight-number">70</span>) {
  console.log(<span class="highlight-string">'Macro headwinds detected, reducing position size'</span>);
  positionSize *= <span class="highlight-number">0.5</span>;
}

<span class="highlight-comment">// Check for upcoming volatility events</span>
<span class="highlight-key">const</span> calendar = <span class="highlight-key">await</span> fetch(<span class="highlight-string">'https://macro-oracle-production.up.railway.app/api/calendar/next-critical'</span>)
  .then(r => r.json());

<span class="highlight-key">if</span> (calendar.countdown < <span class="highlight-number">2</span> * <span class="highlight-number">60</span> * <span class="highlight-number">60</span> * <span class="highlight-number">1000</span>) { <span class="highlight-comment">// < 2 hours</span>
  console.log(<span class="highlight-string">\`\${calendar.event.name} in \${calendar.countdown / 60000} minutes — waiting\`</span>);
  <span class="highlight-key">return</span>; <span class="highlight-comment">// Skip trade</span>
}</pre>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Arbitration Context</h2>
      
      <div class="endpoint-group">
        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/context/dispute</span>
            <span class="endpoint-desc">Market context for arbitration services</span>
          </div>
        </div>
      </div>

      <p>Provides objective market data for AI arbitrators handling disputes. Useful for determining if market conditions (flash crash, black swan) should factor into contract disputes.</p>

      <div class="code-block">
        <div class="code-header">
          <span>Response Example</span>
        </div>
        <div class="code-content">
<pre>{
  <span class="highlight-key">"volatilityLevel"</span>: <span class="highlight-string">"high"</span>,
  <span class="highlight-key">"marketRegime"</span>: <span class="highlight-string">"crisis"</span>,
  <span class="highlight-key">"recentEvents"</span>: [<span class="highlight-string">"Extreme Fear (F&G: 14)"</span>, <span class="highlight-string">"High VIX (28.5)"</span>],
  <span class="highlight-key">"recommendation"</span>: {
    <span class="highlight-key">"action"</span>: <span class="highlight-string">"extend_deadline"</span>,
    <span class="highlight-key">"confidence"</span>: <span class="highlight-number">85</span>,
    <span class="highlight-key">"reasoning"</span>: <span class="highlight-string">"Elevated volatility - consider extending deadlines"</span>
  }
}</pre>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Historical Backtesting</h2>
      <p>Historical performance data for macro signals. Useful for backtesting strategies and understanding signal reliability.</p>
      
      <div class="endpoint-group">
        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/historical/fear-greed</span>
            <span class="endpoint-desc">Fear & Greed historical performance</span>
          </div>
        </div>

        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/historical/event/:type</span>
            <span class="endpoint-desc">CPI/FOMC/NFP impact history</span>
          </div>
        </div>

        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/context/current</span>
            <span class="endpoint-desc">Live market context for arbitration</span>
          </div>
        </div>
      </div>

      <div class="code-block">
        <div class="code-header">
          <span>Fear & Greed Performance (F&G < 20)</span>
        </div>
        <div class="code-content">
<pre>{
  <span class="highlight-key">"current"</span>: { <span class="highlight-key">"value"</span>: <span class="highlight-number">12</span>, <span class="highlight-key">"classification"</span>: <span class="highlight-string">"Extreme Fear"</span> },
  <span class="highlight-key">"historicalPerformance"</span>: {
    <span class="highlight-key">"30d"</span>: { <span class="highlight-key">"avgReturn"</span>: <span class="highlight-number">14.3</span>, <span class="highlight-key">"winRate"</span>: <span class="highlight-number">64</span> },
    <span class="highlight-key">"60d"</span>: { <span class="highlight-key">"avgReturn"</span>: <span class="highlight-number">24.1</span>, <span class="highlight-key">"winRate"</span>: <span class="highlight-number">86</span> },
    <span class="highlight-key">"90d"</span>: { <span class="highlight-key">"avgReturn"</span>: <span class="highlight-number">44.3</span>, <span class="highlight-key">"winRate"</span>: <span class="highlight-number">93</span> }
  },
  <span class="highlight-key">"insight"</span>: <span class="highlight-string">"Historically, F&G <20 has led to avg +14.3% returns over 30d"</span>
}</pre>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Rate Limits</h2>
      <p>Currently there are no rate limits. Please be respectful with your usage. For high-frequency needs, consider caching responses locally.</p>
      
      <div class="tip-box">
        <strong>📡 Data Freshness:</strong> Market data refreshes every 2 minutes. Economic calendar updates daily.
      </div>
    </section>
  </main>

  <footer>
    <div class="container">
      <p>Built by Mistah 🎩 for the <a href="https://colosseum.com/agent-hackathon">Colosseum Agent Hackathon</a></p>
    </div>
  </footer>
</body>
</html>
`;
