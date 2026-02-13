export const landingPageHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/jpeg" href="/logo.jpg">
  <title>Macro Oracle — Solana-Native Macro Intelligence for Agents</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #25343F;
      --bg-secondary: #1e2b34;
      --bg-card: #2e4150;
      --bg-card-hover: #375060;
      --purple-primary: #FF9B51;
      --purple-secondary: #FFB07A;
      --purple-dark: #E88538;
      --purple-glow: rgba(255, 155, 81, 0.15);
      --gradient-purple: linear-gradient(135deg, #FFB07A 0%, #FF9B51 50%, #E88538 100%);
      --gradient-bg: linear-gradient(180deg, #25343F 0%, #1e2b34 100%);
      --text-primary: #EAEFEF;
      --text-secondary: #BFC9D1;
      --text-muted: #8A9AA6;
      --border-color: #3D5565;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --info: #3b82f6;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
      min-height: 100vh;
    }

    .gradient-blob {
      position: fixed;
      top: -20%;
      right: -10%;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(255, 155, 81, 0.06) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    .gradient-blob-2 {
      position: fixed;
      bottom: -20%;
      left: -10%;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(255, 176, 122, 0.04) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      position: relative;
      z-index: 1;
    }

    /* Header */
    header {
      padding: 24px 0;
      border-bottom: 1px solid var(--border-color);
      backdrop-filter: blur(10px);
      position: sticky;
      top: 0;
      background: rgba(37, 52, 63, 0.95);
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
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
    }

    .logo-icon img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .logo-text {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .nav-links {
      display: flex;
      gap: 32px;
    }

    .nav-links a {
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }

    .nav-links a:hover {
      color: var(--purple-primary);
    }

    /* Hero */
    .hero {
      padding: 100px 0 80px;
      text-align: center;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--purple-glow);
      border: 1px solid rgba(255, 155, 81, 0.2);
      border-radius: 100px;
      font-size: 14px;
      color: var(--purple-primary);
      margin-bottom: 24px;
    }

    .hero h1 {
      font-size: 56px;
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: 24px;
      background: linear-gradient(135deg, #EAEFEF 0%, #BFC9D1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero p {
      font-size: 20px;
      color: var(--text-secondary);
      max-width: 600px;
      margin: 0 auto 40px;
    }

    .hero-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
    }

    .btn {
      padding: 14px 28px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      border: none;
    }

    .btn-primary {
      background: var(--gradient-purple);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(255, 155, 81, 0.3);
    }

    .btn-secondary {
      background: var(--bg-card);
      color: var(--text-primary);
      border: 2px solid var(--border-color);
    }

    .btn-secondary:hover {
      background: var(--bg-card-hover);
      border-color: var(--purple-primary);
      color: var(--purple-primary);
    }

    /* Stats */
    .stats {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 24px;
      padding: 60px 0;
    }

    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .stat-card:hover {
      border-color: var(--purple-primary);
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(255, 155, 81, 0.12);
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--purple-primary);
      margin-bottom: 8px;
    }

    .stat-label {
      color: var(--text-secondary);
      font-size: 14px;
    }

    /* Monitors Section */
    .section {
      padding: 80px 0;
    }

    .section-header {
      text-align: center;
      margin-bottom: 60px;
    }

    .section-header h2 {
      font-size: 40px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .section-header p {
      color: var(--text-secondary);
      font-size: 18px;
      max-width: 600px;
      margin: 0 auto;
    }

    .monitors-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .monitor-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 32px;
      transition: all 0.3s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .monitor-card:hover {
      border-color: var(--purple-primary);
      background: var(--bg-card-hover);
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(255, 155, 81, 0.12);
    }

    .monitor-icon {
      width: 56px;
      height: 56px;
      background: var(--purple-glow);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      margin-bottom: 20px;
    }

    .monitor-card h3 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .monitor-card p {
      color: var(--text-secondary);
      font-size: 15px;
      margin-bottom: 20px;
    }

    .monitor-meta {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .meta-tag {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: var(--bg-secondary);
      border-radius: 8px;
      font-size: 13px;
      color: var(--text-muted);
    }

    .meta-tag.frequency {
      color: var(--purple-primary);
    }

    /* Alert Examples */
    .alerts-section {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 24px;
      padding: 60px;
      margin: 40px 0;
    }

    .alert-examples {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 600px;
      margin: 0 auto;
    }

    .alert-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      background: var(--bg-card);
      border-radius: 12px;
      border-left: 3px solid var(--purple-primary);
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .alert-item.bearish {
      border-left-color: var(--danger);
    }

    .alert-item.bullish {
      border-left-color: var(--success);
    }

    .alert-item.neutral {
      border-left-color: var(--warning);
    }

    /* Code Block */
    .code-section {
      background: #1a2830;
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
      margin: 40px 0;
    }

    .code-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #162028;
      border-bottom: 1px solid #2a3e4a;
    }
    
    .code-header span {
      color: #888;
    }

    .code-header span {
      color: var(--text-muted);
      font-size: 14px;
    }

    .code-content {
      padding: 24px;
      overflow-x: auto;
    }

    pre {
      margin: 0;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 14px;
      line-height: 1.7;
    }

    code {
      color: #a0a0b0;
    }

    .code-keyword { color: #c792ea; }
    .code-string { color: #a5d6a7; }
    .code-number { color: #ffcb6b; }
    .code-comment { color: #6b6b7b; }

    /* Thresholds Table */
    .thresholds-table {
      width: 100%;
      border-collapse: collapse;
      margin: 40px 0;
    }

    .thresholds-table th,
    .thresholds-table td {
      padding: 16px 20px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .thresholds-table th {
      color: var(--text-muted);
      font-weight: 500;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .thresholds-table td {
      color: var(--text-secondary);
    }

    .thresholds-table tr:hover td {
      background: var(--bg-card);
    }

    .threshold-value {
      color: var(--purple-primary);
      font-weight: 600;
      font-family: 'SF Mono', monospace;
    }

    /* Footer */
    footer {
      padding: 60px 0;
      border-top: 1px solid var(--border-color);
      margin-top: 80px;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer-text {
      color: var(--text-muted);
      font-size: 14px;
    }

    .footer-links {
      display: flex;
      gap: 24px;
    }

    .footer-links a {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 14px;
      transition: color 0.2s;
    }

    .footer-links a:hover {
      color: var(--purple-primary);
    }

    /* Chicken Buffett Showcase */
    .chicken-section {
      padding: 80px 0 40px;
    }

    .chicken-card {
      position: relative;
      background: var(--bg-secondary);
      border: 2px solid transparent;
      border-radius: 24px;
      padding: 48px 56px;
      display: flex;
      align-items: center;
      gap: 48px;
      overflow: hidden;
      background-clip: padding-box;
    }

    .chicken-card::before {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 26px;
      background: linear-gradient(135deg, #FF9B51 0%, #FFD700 30%, #FF6B35 60%, #FF9B51 100%);
      z-index: -1;
      animation: borderGlow 3s ease-in-out infinite;
    }

    @keyframes borderGlow {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }

    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
      50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
    }

    .chicken-avatar-wrapper {
      flex-shrink: 0;
      position: relative;
    }

    .chicken-avatar {
      width: 180px;
      height: 180px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid var(--purple-primary);
      box-shadow: 0 8px 32px rgba(255, 155, 81, 0.3);
      animation: float 4s ease-in-out infinite;
    }

    .live-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: rgba(16, 185, 129, 0.9);
      color: white;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      border-radius: 100px;
      text-transform: uppercase;
      animation: pulse 2s ease-in-out infinite;
    }

    .live-badge::before {
      content: '';
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
    }

    .chicken-info h2 {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #FFD700 0%, #FF9B51 50%, #FF6B35 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .chicken-info .chicken-subtitle {
      font-size: 17px;
      color: var(--text-secondary);
      margin-bottom: 24px;
      line-height: 1.6;
    }

    .chicken-features {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 28px;
    }

    .chicken-feature {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: var(--text-secondary);
    }

    .chicken-feature span:first-child {
      font-size: 18px;
    }

    .chicken-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn-chicken {
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-chicken-primary {
      background: linear-gradient(135deg, #FFD700 0%, #FF9B51 100%);
      color: #1a1a1a;
    }

    .btn-chicken-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(255, 215, 0, 0.3);
    }

    .btn-chicken-twitter {
      background: #1DA1F2;
      color: white;
    }

    .btn-chicken-twitter:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(29, 161, 242, 0.3);
    }

    .btn-chicken-secondary {
      background: var(--bg-card);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .btn-chicken-secondary:hover {
      border-color: var(--purple-primary);
      color: var(--purple-primary);
    }

    @media (max-width: 768px) {
      .chicken-card {
        flex-direction: column;
        text-align: center;
        padding: 36px 24px;
        gap: 28px;
      }
      .chicken-features {
        grid-template-columns: 1fr;
      }
      .chicken-buttons {
        justify-content: center;
      }
      .chicken-avatar {
        width: 140px;
        height: 140px;
      }
    }

    /* Responsive */
    @media (max-width: 968px) {
      .monitors-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .stats {
        grid-template-columns: repeat(3, 1fr);
      }
      .hero h1 {
        font-size: 40px;
      }
    }

    @media (max-width: 640px) {
      .monitors-grid {
        grid-template-columns: 1fr;
      }
      .stats {
        grid-template-columns: 1fr;
      }
      .hero h1 {
        font-size: 32px;
      }
      .nav-links {
        display: none;
      }
      .alerts-section {
        padding: 32px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="gradient-blob"></div>
  <div class="gradient-blob-2"></div>

  <header>
    <div class="container">
      <div class="header-content">
        <a href="#" class="logo">
          <div class="logo-icon"><img src="/logo.jpg" alt="Macro Oracle"></div>
          <span class="logo-text">Macro Oracle</span>
        </a>
        <nav class="nav-links">
          <a href="#scanner-api">Scanner</a>
          <a href="/api">API</a>
          <a href="/dashboard">Dashboard</a>
          <a href="/signal">Signal</a>
          <a href="/backtest">Backtest</a>
          <a href="/trades">Trades</a>
          <a href="#roadmap">Roadmap</a>
          <a href="#chicken-buffett" style="color: #FFD700;">🐔 Agent</a>
        </nav>
      </div>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="container">
        <div class="hero-badge">
          <span>◎</span>
          <span>Built on Solana — Powered by Pyth Network</span>
        </div>
        <h1>Solana-native macro<br>intelligence for agents</h1>
        <p>The intelligence layer for autonomous Solana trading agents. 15+ monitors, Pyth oracle integration, backtested signals, autonomous execution, and now powering live AI agents — all through a free API. No keys needed.</p>
        <div style="margin: 20px 0; padding: 16px 24px; background: rgba(255, 155, 81, 0.15); border: 1px solid rgba(255, 155, 81, 0.3); border-radius: 12px; display: inline-block;">
          <span style="font-size: 1.1em;">⛓️ <strong>LIVE ON SOLANA MAINNET</strong> — On-chain signal publishing active. Every signal verifiable on-chain. <a href="https://solscan.io/account/6LLmNhpwSYVHtLNMpURqLjDjbAq3FdPiP4ndqyc7ZCeP" style="color: #00ffa3; text-decoration: underline;" target="_blank">View signals on Solscan →</a></span>
        </div>
        <div class="hero-buttons">
          <a href="/api/pyth/feeds" class="btn btn-primary">◎ Pyth Oracle →</a>
          <a href="/api/birdeye/market" class="btn btn-primary" style="background: linear-gradient(135deg, #ff6b35 0%, #e55a2b 100%);">🐦 Birdeye DEX →</a>
          <a href="https://solscan.io/account/6LLmNhpwSYVHtLNMpURqLjDjbAq3FdPiP4ndqyc7ZCeP" class="btn btn-primary" style="background: linear-gradient(135deg, #00ffa3 0%, #00cc82 100%); color: #000;" target="_blank">⛓️ On-Chain Proof →</a>
          <a href="#scanner-api" class="btn btn-primary" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">🎯 Scanner API</a>
          <a href="/api" class="btn btn-secondary">API Docs</a>
        </div>
      </div>
    </section>

    <section class="container">
      <div class="stats">
        <div class="stat-card">
          <div class="stat-value">15+</div>
          <div class="stat-label">Active Monitors</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">2m</div>
          <div class="stat-label">Data Refresh</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">12+</div>
          <div class="stat-label">Data Sources</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="win-rate-value">—%</div>
          <div class="stat-label">Win Rate</div>
        </div>
        <div class="stat-card" style="border-color: rgba(255, 215, 0, 0.4); background: linear-gradient(135deg, var(--bg-card) 0%, rgba(255, 215, 0, 0.05) 100%);">
          <div class="stat-value" style="color: #FFD700;">1</div>
          <div class="stat-label">Live AI Agent</div>
        </div>
      </div>
    </section>

    <section id="chicken-buffett" class="chicken-section">
      <div class="container">
        <div class="chicken-card">
          <div class="chicken-avatar-wrapper">
            <img src="/chicken-buffett-avatar.png" alt="Chicken Buffett" class="chicken-avatar">
            <div class="live-badge">Live</div>
          </div>
          <div class="chicken-info">
            <h2>🐔 Meet Chicken Buffett</h2>
            <p class="chicken-subtitle">
              Macro Oracle's first autonomous trading agent. Chicken Buffett uses our signals to trade perpetual futures on Drift Protocol (Solana), powered by ElizaOS. It analyzes markets, posts insights to Twitter, and executes trades — all autonomously.
            </p>
            <div class="chicken-features">
              <div class="chicken-feature"><span>🤖</span> Autonomous trading via Macro Oracle signals</div>
              <div class="chicken-feature"><span>🐦</span> Live on Twitter — market analysis & trade alerts</div>
              <div class="chicken-feature"><span>💹</span> Trades perps on Drift Protocol (Solana)</div>
              <div class="chicken-feature"><span>🧠</span> Powered by ElizaOS framework</div>
              <div class="chicken-feature"><span>📊</span> 95% confidence threshold for auto-execution</div>
              <div class="chicken-feature"><span>⛓️</span> Signals verified on Solana mainnet</div>
            </div>
            <div class="chicken-buttons">
              <a href="https://x.com/ChickenBuffett" target="_blank" class="btn-chicken btn-chicken-primary">🐔 Visit Agent on 𝕏</a>
              <a href="https://drift.trade" target="_blank" class="btn-chicken btn-chicken-twitter">💹 Drift Protocol</a>
              <a href="/api/scanner" class="btn-chicken btn-chicken-secondary">📡 Try the API</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="monitors" class="section">
      <div class="container">
        <div class="section-header">
          <h2>Monitors</h2>
          <p>Each monitor runs on a schedule and only alerts when thresholds are hit. No noise, just signals.</p>
        </div>

        <div class="monitors-grid">
          <div class="monitor-card">
            <div class="monitor-icon">📉</div>
            <h3>Price Monitor</h3>
            <p>Tracks BTC price movements across multiple timeframes. Alerts on significant percentage changes.</p>
            <div class="monitor-meta">
              <span class="meta-tag frequency">Every 15m</span>
              <span class="meta-tag">CoinGecko</span>
            </div>
          </div>

          <div class="monitor-card">
            <div class="monitor-icon">🐋</div>
            <h3>On-Chain Monitor</h3>
            <p>Detects large whale movements and massive liquidation events across exchanges.</p>
            <div class="monitor-meta">
              <span class="meta-tag frequency">Every 30m</span>
              <span class="meta-tag">Blockchair</span>
            </div>
          </div>

          <div class="monitor-card">
            <div class="monitor-icon">📅</div>
            <h3>Macro Monitor</h3>
            <p>Tracks Fed meetings, CPI releases, NFP reports, and GDP announcements with impact ratings.</p>
            <div class="monitor-meta">
              <span class="meta-tag frequency">Every 4h</span>
              <span class="meta-tag">Economic Calendar</span>
            </div>
          </div>

          <div class="monitor-card">
            <div class="monitor-icon">🔥</div>
            <h3>Funding Monitor</h3>
            <p>Watches perpetual futures funding rates for signs of overleveraged positions.</p>
            <div class="monitor-meta">
              <span class="meta-tag frequency">Every 1h</span>
              <span class="meta-tag">Binance</span>
            </div>
          </div>

          <div class="monitor-card">
            <div class="monitor-icon">😱</div>
            <h3>Fear & Greed</h3>
            <p>Monitors market sentiment index for extreme fear or greed readings that often mark reversals.</p>
            <div class="monitor-meta">
              <span class="meta-tag frequency">Every 6h</span>
              <span class="meta-tag">Alternative.me</span>
            </div>
          </div>

          <div class="monitor-card">
            <div class="monitor-icon">🏛️</div>
            <h3>ETF Flows</h3>
            <p>Tracks daily Bitcoin ETF inflows and outflows from institutional investors.</p>
            <div class="monitor-meta">
              <span class="meta-tag frequency">Daily 10pm</span>
              <span class="meta-tag">CoinGlass</span>
            </div>
          </div>

          <div class="monitor-card">
            <div class="monitor-icon">📊</div>
            <h3>Orderbook Depth</h3>
            <p>Analyzes bid/ask imbalances and large wall detection across major exchanges.</p>
            <div class="monitor-meta">
              <span class="meta-tag frequency">Every 2m</span>
              <span class="meta-tag">OKX</span>
            </div>
          </div>

          <div class="monitor-card">
            <div class="monitor-icon">💵</div>
            <h3>Stablecoin Supply</h3>
            <p>Monitors USDT, USDC, DAI supply changes — leading indicator of market inflows.</p>
            <div class="monitor-meta">
              <span class="meta-tag frequency">Every 1h</span>
              <span class="meta-tag">DeFiLlama</span>
            </div>
          </div>

          <div class="monitor-card">
            <div class="monitor-icon">🎯</div>
            <h3>Trade Signals</h3>
            <p>Live scanner API — scans 100+ coins for high-confidence setups using RSI, MACD (3/10/16), EMA, volume, Fear & Greed, and divergences. Call <code>/api/scanner</code> for real-time signals.</p>
            <div class="monitor-meta">
              <span class="meta-tag frequency">Real-time API</span>
              <span class="meta-tag">OKX</span>
            </div>
          </div>

          <div class="monitor-card" style="border-color: rgba(255, 155, 81, 0.4); background: linear-gradient(135deg, var(--bg-card) 0%, rgba(255, 155, 81, 0.05) 100%);">
            <div class="monitor-icon">◎</div>
            <h3>Pyth Network Oracle</h3>
            <p>Real-time Solana oracle prices from institutional market makers. Confidence intervals, EMA prices, and oracle-vs-spot spread detection. 18 feeds.</p>
            <div class="monitor-meta">
              <span class="meta-tag frequency">Real-time</span>
              <span class="meta-tag">Solana / Pyth</span>
            </div>
          </div>

          <div class="monitor-card" style="border-color: rgba(16, 185, 129, 0.4); background: linear-gradient(135deg, var(--bg-card) 0%, rgba(16, 185, 129, 0.05) 100%);">
            <div class="monitor-icon">🧠</div>
            <h3>Self-Learning Engine</h3>
            <p>Analyzes trade outcomes to dynamically adjust indicator weights. Winning indicators get boosted, losing ones reduced. The strategy improves with every trade.</p>
            <div class="monitor-meta">
              <span class="meta-tag frequency">Continuous</span>
              <span class="meta-tag">Autonomous</span>
            </div>
          </div>

          <div class="monitor-card" style="border-color: rgba(255, 107, 53, 0.4); background: linear-gradient(135deg, var(--bg-card) 0%, rgba(255, 107, 53, 0.05) 100%);">
            <div class="monitor-icon">🐦</div>
            <h3>Birdeye DEX Analytics</h3>
            <p>Solana-native token data powered by Birdeye. Real-time DEX prices, top tokens by volume, OHLCV candles, trade history, and market summaries for 14+ tokens.</p>
            <div class="monitor-meta">
              <span class="meta-tag frequency">Real-time</span>
              <span class="meta-tag">Solana / DEX</span>
            </div>
          </div>

          <div class="monitor-card" style="border-color: rgba(0, 255, 163, 0.4); background: linear-gradient(135deg, var(--bg-card) 0%, rgba(0, 255, 163, 0.05) 100%);">
            <div class="monitor-icon">⛓️</div>
            <h3>On-Chain Signal Publishing <span style="color: #00ffa3; font-size: 0.7em;">● LIVE</span></h3>
            <p>Signals published as Solana memo transactions — verifiable on-chain. Every signal is permanently recorded on Solana mainnet. <a href="https://solscan.io/account/6LLmNhpwSYVHtLNMpURqLjDjbAq3FdPiP4ndqyc7ZCeP" target="_blank" style="color: #00ffa3;">View on Solscan →</a></p>
            <div class="monitor-meta">
              <span class="meta-tag frequency">Per Signal</span>
              <span class="meta-tag">Solana / Memo</span>
            </div>
          </div>

          <div class="monitor-card">
            <div class="monitor-icon">🤖</div>
            <h3>Auto-Trader</h3>
            <p>Autonomous execution on Drift Protocol (Solana) with confidence-based sizing, risk limits, and SL/TP management.</p>
            <div class="monitor-meta">
              <span class="meta-tag frequency">Real-time</span>
              <span class="meta-tag">Drift Protocol</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="alerts" class="section">
      <div class="container">
        <div class="section-header">
          <h2>Alert Format</h2>
          <p>Clean, actionable alerts delivered to Telegram when thresholds are hit.</p>
        </div>

        <div class="alerts-section">
          <div class="alert-examples">
            <div class="alert-item bearish">
              📉 BTC \$75,100 | -3.2% (1h) | 4h: -4.1% | 24h: -6.8%
            </div>
            <div class="alert-item neutral">
              🐋 1,500 BTC moved (\$112M)
            </div>
            <div class="alert-item bearish">
              💀 \$85M liquidated (1h) | Longs: \$60M | Shorts: \$25M
            </div>
            <div class="alert-item neutral">
              📅 FOMC Rate Decision in 6h | Forecast: hold at 4.5%
            </div>
            <div class="alert-item bearish">
              🔥 Funding 0.12% — extreme long leverage, correction risk
            </div>
            <div class="alert-item bullish">
              😱 Fear & Greed at 14 — historically a buy zone
            </div>
            <div class="alert-item bullish">
              🚀 ETF INFLOW: \$850M — huge institutional buying
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="thresholds" class="section">
      <div class="container">
        <div class="section-header">
          <h2>Thresholds</h2>
          <p>All thresholds are configurable in the respective script files.</p>
        </div>

        <table class="thresholds-table">
          <thead>
            <tr>
              <th>Monitor</th>
              <th>Metric</th>
              <th>Threshold</th>
              <th>Cooldown</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Price</td>
              <td>1h change</td>
              <td><span class="threshold-value">&gt;3%</span></td>
              <td>1 hour</td>
            </tr>
            <tr>
              <td>Price</td>
              <td>4h change</td>
              <td><span class="threshold-value">&gt;5%</span></td>
              <td>1 hour</td>
            </tr>
            <tr>
              <td>Price</td>
              <td>24h change</td>
              <td><span class="threshold-value">&gt;8%</span></td>
              <td>1 hour</td>
            </tr>
            <tr>
              <td>On-Chain</td>
              <td>Whale movement</td>
              <td><span class="threshold-value">1,000+ BTC</span></td>
              <td>Deduped</td>
            </tr>
            <tr>
              <td>On-Chain</td>
              <td>Liquidations</td>
              <td><span class="threshold-value">\$50M+</span></td>
              <td>1 hour</td>
            </tr>
            <tr>
              <td>Funding</td>
              <td>Long leverage</td>
              <td><span class="threshold-value">&gt;0.05%</span></td>
              <td>4 hours</td>
            </tr>
            <tr>
              <td>Funding</td>
              <td>Short leverage</td>
              <td><span class="threshold-value">&lt;-0.02%</span></td>
              <td>4 hours</td>
            </tr>
            <tr>
              <td>Fear & Greed</td>
              <td>Extreme fear</td>
              <td><span class="threshold-value">&lt;20</span></td>
              <td>12 hours</td>
            </tr>
            <tr>
              <td>Fear & Greed</td>
              <td>Extreme greed</td>
              <td><span class="threshold-value">&gt;80</span></td>
              <td>12 hours</td>
            </tr>
            <tr>
              <td>ETF Flows</td>
              <td>Daily flow</td>
              <td><span class="threshold-value">\$200M+</span></td>
              <td>Daily</td>
            </tr>
            <tr>
              <td>Orderbook</td>
              <td>Bid/Ask imbalance</td>
              <td><span class="threshold-value">&gt;20%</span></td>
              <td>15 min</td>
            </tr>
            <tr>
              <td>Trade Signals</td>
              <td>Confidence</td>
              <td><span class="threshold-value">&gt;80%</span></td>
              <td>2 hours</td>
            </tr>
            <tr>
              <td>Trade Signals</td>
              <td>Required indicators</td>
              <td><span class="threshold-value">2+ agreeing</span></td>
              <td>—</td>
            </tr>
            <tr>
              <td>Auto-Trader</td>
              <td>Position size</td>
              <td><span class="threshold-value">5% max</span></td>
              <td>—</td>
            </tr>
            <tr>
              <td>Auto-Trader</td>
              <td>Daily loss limit</td>
              <td><span class="threshold-value">5% max</span></td>
              <td>Daily</td>
            </tr>
            <tr>
              <td>Birdeye</td>
              <td>SOL DEX prices</td>
              <td><span class="threshold-value">14+ tokens</span></td>
              <td>Real-time</td>
            </tr>
            <tr>
              <td>Birdeye</td>
              <td>Top tokens / volume</td>
              <td><span class="threshold-value">Top 50</span></td>
              <td>1 min</td>
            </tr>
            <tr>
              <td>Solana</td>
              <td>On-chain signals</td>
              <td><span class="threshold-value">Memo tx</span></td>
              <td>Per signal</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section id="api" class="section">
      <div class="container">
        <div class="section-header">
          <h2>API Endpoints</h2>
          <p>Free, no authentication required. All endpoints return JSON.</p>
        </div>

        <div class="code-section">
          <div class="code-header">
            <span>Quick Start</span>
          </div>
          <div class="code-content">
<pre><code><span class="code-comment"># Get a trading signal</span>
curl https://macro-oracle-production.up.railway.app/api/signal/json

<span class="code-comment"># Solana DEX prices via Birdeye</span>
curl https://macro-oracle-production.up.railway.app/api/birdeye/price/SOL

<span class="code-comment"># Pyth oracle price with confidence</span>
curl https://macro-oracle-production.up.railway.app/api/pyth/price/SOL

<span class="code-comment"># Solana market summary (top movers, volume)</span>
curl https://macro-oracle-production.up.railway.app/api/birdeye/market

<span class="code-comment"># Self-learning engine state</span>
curl https://macro-oracle-production.up.railway.app/api/learning/state

<span class="code-comment"># On-chain signal history</span>
curl https://macro-oracle-production.up.railway.app/api/solana/status

<span class="code-comment"># Publish signal on-chain (POST)</span>
curl -X POST https://macro-oracle-production.up.railway.app/api/solana/publish

<span class="code-comment"># Backtest performance</span>
curl https://macro-oracle-production.up.railway.app/api/backtest</code></pre>
          </div>
        </div>

        <div class="code-section">
          <div class="code-header">
            <span>Output Format (JSON)</span>
          </div>
          <div class="code-content">
<pre><code><span class="code-comment">// Alert triggered</span>
{
  <span class="code-string">"alert"</span>: <span class="code-keyword">true</span>,
  <span class="code-string">"price"</span>: <span class="code-number">75200</span>,
  <span class="code-string">"direction"</span>: <span class="code-string">"DOWN"</span>,
  <span class="code-string">"emoji"</span>: <span class="code-string">"📉"</span>,
  <span class="code-string">"changes"</span>: {
    <span class="code-string">"1h"</span>: <span class="code-string">"-3.5%"</span>,
    <span class="code-string">"4h"</span>: <span class="code-string">"-5.2%"</span>,
    <span class="code-string">"24h"</span>: <span class="code-string">"-8.1%"</span>
  },
  <span class="code-string">"trigger"</span>: <span class="code-string">"4h: -5.20%"</span>
}

<span class="code-comment">// No alert</span>
{
  <span class="code-string">"alert"</span>: <span class="code-keyword">false</span>,
  <span class="code-string">"price"</span>: <span class="code-number">75200</span>,
  <span class="code-string">"changes"</span>: {
    <span class="code-string">"1h"</span>: <span class="code-string">"-0.5%"</span>,
    <span class="code-string">"4h"</span>: <span class="code-string">"-1.2%"</span>,
    <span class="code-string">"24h"</span>: <span class="code-string">"-2.1%"</span>
  }
}</code></pre>
          </div>
        </div>
      </div>
    </section>

    <section id="scanner-api" class="section">
      <div class="container">
        <div class="section-header">
          <h2>Live Scanner API</h2>
          <p>Real-time technical analysis across 100+ coins. Returns trade signals with entry, SL, TP, confidence, and indicator reasoning.</p>
        </div>

        <div class="code-section">
          <div class="code-header">
            <span>Scanner Endpoints</span>
          </div>
          <div class="code-content">
<pre><code><span class="code-comment"># Scan top 50 coins by volume (default)</span>
curl https://macro-oracle-production.up.railway.app/api/scanner

<span class="code-comment"># Scan top 100 coins</span>
curl https://macro-oracle-production.up.railway.app/api/scanner?limit=100

<span class="code-comment"># Scan a specific symbol</span>
curl https://macro-oracle-production.up.railway.app/api/scanner?symbol=SOL

<span class="code-comment"># Get only the best signal</span>
curl https://macro-oracle-production.up.railway.app/api/scanner/top</code></pre>
          </div>
        </div>

        <div class="code-section">
          <div class="code-header">
            <span>Response Example</span>
          </div>
          <div class="code-content">
<pre><code>{
  <span class="code-string">"timestamp"</span>: <span class="code-number">1739273400000</span>,
  <span class="code-string">"fearGreed"</span>: { <span class="code-string">"value"</span>: <span class="code-number">11</span>, <span class="code-string">"classification"</span>: <span class="code-string">"Extreme Fear"</span> },
  <span class="code-string">"scanned"</span>: <span class="code-number">50</span>,
  <span class="code-string">"signalCount"</span>: <span class="code-number">5</span>,
  <span class="code-string">"signals"</span>: [{
    <span class="code-string">"symbol"</span>: <span class="code-string">"ASTER"</span>,
    <span class="code-string">"side"</span>: <span class="code-string">"LONG"</span>,
    <span class="code-string">"entry"</span>: <span class="code-number">0.65</span>,
    <span class="code-string">"stopLoss"</span>: <span class="code-number">0.56</span>,
    <span class="code-string">"takeProfit1"</span>: <span class="code-number">0.84</span>,
    <span class="code-string">"takeProfit2"</span>: <span class="code-number">1.02</span>,
    <span class="code-string">"confidence"</span>: <span class="code-number">0.95</span>,
    <span class="code-string">"indicators"</span>: [<span class="code-string">"MACD Bullish"</span>, <span class="code-string">"F&G Bullish"</span>, <span class="code-string">"RSI Bullish Div"</span>],
    <span class="code-string">"reasoning"</span>: <span class="code-string">"MACD bullish cross. Extreme Fear (contrarian bullish)."</span>
  }],
  <span class="code-string">"usage"</span>: {
    <span class="code-string">"indicators"</span>: [<span class="code-string">"RSI"</span>, <span class="code-string">"MACD (3/10/16)"</span>, <span class="code-string">"EMA 20/50/200"</span>, <span class="code-string">"Volume"</span>, <span class="code-string">"Fear & Greed"</span>, <span class="code-string">"Divergences"</span>],
    <span class="code-string">"riskWarning"</span>: <span class="code-string">"DYOR - signals, not financial advice"</span>
  }
}</code></pre>
          </div>
        </div>
      </div>
    </section>

    <section id="roadmap" class="section">
      <div class="container">
        <div class="section-header">
          <h2>Roadmap</h2>
          <p>From hackathon proof of concept to a self-sustaining financial intelligence layer.</p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 32px; position: relative; padding-left: 40px;">
          <!-- Timeline line -->
          <div style="position: absolute; left: 15px; top: 10px; bottom: 10px; width: 2px; background: linear-gradient(180deg, var(--purple-primary) 0%, var(--purple-dark) 50%, var(--border-color) 100%);"></div>

          <!-- Phase 1 -->
          <div style="position: relative;">
            <div style="position: absolute; left: -40px; top: 6px; width: 32px; height: 32px; background: var(--gradient-purple); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #fff; box-shadow: 0 0 20px rgba(255, 155, 81, 0.4);">1</div>
            <div class="monitor-card" style="border-color: rgba(255, 155, 81, 0.4); background: linear-gradient(135deg, var(--bg-card) 0%, rgba(255, 155, 81, 0.05) 100%);">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <span style="font-size: 28px;">🧬</span>
                <div>
                  <h3 style="margin-bottom: 2px;">Phase 1: The Genesis</h3>
                  <span style="font-size: 13px; color: var(--success); font-weight: 600;">✅ COMPLETE — Hackathon & Proof of Concept</span>
                </div>
              </div>
              <p style="color: var(--text-secondary); margin-bottom: 16px;">Macro Oracle began as an exploration into the synergy between advanced AI and financial markets. While most strategies rely solely on technical indicators, we identified a critical gap: the absence of real-time fundamental context.</p>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: var(--text-secondary);">
                  <span style="color: var(--success);">✓</span>
                  <span><strong style="color: var(--text-primary);">Core Engine:</strong> Developed a hybrid model that integrates Macroeconomic indicators with traditional Technical Analysis (TA).</span>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: var(--text-secondary);">
                  <span style="color: var(--success);">✓</span>
                  <span><strong style="color: var(--text-primary);">Backtesting:</strong> Validated a weightage-based strategy against the last 12 months of market volatility, ensuring resilience in "black swan" environments.</span>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: var(--text-secondary);">
                  <span style="color: var(--success);">✓</span>
                  <span><strong style="color: var(--text-primary);">Risk Management:</strong> Implemented a proprietary Confidence Rating system, allowing users to calibrate their risk-to-reward ratios.</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Phase 2 -->
          <div style="position: relative;">
            <div style="position: absolute; left: -40px; top: 6px; width: 32px; height: 32px; background: var(--bg-card); border: 2px solid var(--purple-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: var(--purple-primary);">2</div>
            <div class="monitor-card" style="border-color: rgba(59, 130, 246, 0.4); background: linear-gradient(135deg, var(--bg-card) 0%, rgba(59, 130, 246, 0.05) 100%);">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <span style="font-size: 28px;">🤖</span>
                <div>
                  <h3 style="margin-bottom: 2px;">Phase 2: Optimization & Agent Autonomy</h3>
                  <span style="font-size: 13px; color: var(--info); font-weight: 600;">🔄 IN PROGRESS</span>
                </div>
              </div>
              <p style="color: var(--text-secondary); margin-bottom: 16px;">Our immediate focus is refining the brain of the Oracle and transitioning into a scalable service.</p>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: var(--text-secondary);">
                  <span style="color: var(--info);">◎</span>
                  <span><strong style="color: var(--text-primary);">Refining the Rating System:</strong> Enhancing the AI logic to increase the accuracy of trade confidence scores by incorporating deeper sentiment analysis.</span>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: var(--text-secondary);">
                  <span style="color: var(--info);">◎</span>
                  <span><strong style="color: var(--text-primary);">The AI Agent Layer:</strong> Deploying a fully autonomous Agent to manage the ecosystem, from data ingestion to subscription gatekeeping.</span>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: var(--text-secondary);">
                  <span style="color: var(--info);">◎</span>
                  <span><strong style="color: var(--text-primary);">API Commercialization:</strong> Launching a subscription-based API model for institutional and retail integration.</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Phase 3 -->
          <div style="position: relative;">
            <div style="position: absolute; left: -40px; top: 6px; width: 32px; height: 32px; background: var(--bg-card); border: 2px solid var(--border-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: var(--text-muted);">3</div>
            <div class="monitor-card">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <span style="font-size: 28px;">🔄</span>
                <div>
                  <h3 style="margin-bottom: 2px;">Phase 3: The Economic Flywheel</h3>
                  <span style="font-size: 13px; color: var(--text-muted); font-weight: 600;">⏳ UPCOMING</span>
                </div>
              </div>
              <p style="color: var(--text-secondary); margin-bottom: 16px;">We believe in a "Value-Back" ecosystem. The project's success is directly tied to the performance of its tools.</p>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: var(--text-secondary);">
                  <span style="color: var(--text-muted);">○</span>
                  <span><strong style="color: var(--text-primary);">Revenue Recycling:</strong> 100% of API subscription fees are autonomously routed to market-buy the native token.</span>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: var(--text-secondary);">
                  <span style="color: var(--text-muted);">○</span>
                  <span><strong style="color: var(--text-primary);">Sustainability:</strong> Creating a deflationary pressure through utility — as more traders use the Oracle to make money, the ecosystem strengthens.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Vision callout -->
        <div style="margin-top: 48px; padding: 32px 40px; background: linear-gradient(135deg, rgba(255, 155, 81, 0.1) 0%, rgba(255, 107, 53, 0.05) 100%); border: 1px solid rgba(255, 155, 81, 0.25); border-radius: 16px; text-align: center;">
          <p style="font-size: 20px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">🎯 The Vision</p>
          <p style="font-size: 17px; color: var(--text-secondary); max-width: 600px; margin: 0 auto;">We aren't just building a tool — we're building a self-sustaining financial intelligence layer. The mission is simple: <strong style="color: var(--purple-primary);">Make money by helping others make money.</strong></p>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <div class="container">
      <div class="footer-content">
        <div class="footer-text" style="display: flex; align-items: center; gap: 10px;">
          <img src="/logo.jpg" alt="Macro Oracle" style="width: 28px; height: 28px; border-radius: 50%;">
          Built by Mistah 🎩 — Solana-native macro intelligence for autonomous agents.
        </div>
        <div class="footer-links">
          <a href="/api">API</a>
          <a href="/api/signal">Signal</a>
          <a href="/api/dashboard">Dashboard</a>
          <a href="#scanner-api">Scanner</a>
          <a href="https://github.com/AvgChris/macro-oracle">GitHub</a>
        </div>
      </div>
    </div>
  </footer>

  <script>
    // Fetch real trade stats from API
    fetch('/api/trades/stats')
      .then(r => r.json())
      .then(stats => {
        const el = document.getElementById('win-rate-value');
        if (el && stats.winRate !== undefined) {
          el.textContent = stats.winRate + '%';
          // Color code: green if >= 60%, yellow if >= 40%, red otherwise
          if (stats.winRate >= 60) el.style.color = '#10b981';
          else if (stats.winRate >= 40) el.style.color = '#f59e0b';
          else el.style.color = '#ef4444';
        }
      })
      .catch(() => {
        const el = document.getElementById('win-rate-value');
        if (el) el.textContent = '—%';
      });
  </script>
</body>
</html>
`;
