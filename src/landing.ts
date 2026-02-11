export const landingPageHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/jpeg" href="/logo.jpg">
  <title>Macro Oracle — Real-time Market Intelligence</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #0f0f1a;
      --bg-secondary: #1a1a2e;
      --bg-card: #252540;
      --bg-card-hover: #2f2f4a;
      --purple-primary: #7c3aed;
      --purple-secondary: #8b5cf6;
      --purple-dark: #6d28d9;
      --purple-glow: rgba(124, 58, 237, 0.15);
      --gradient-purple: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%);
      --gradient-bg: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%);
      --text-primary: #ffffff;
      --text-secondary: #a0a0b8;
      --text-muted: #6b6b80;
      --border-color: #3a3a52;
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
      background: radial-gradient(circle, rgba(124, 58, 237, 0.06) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    .gradient-blob-2 {
      position: fixed;
      bottom: -20%;
      left: -10%;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.04) 0%, transparent 70%);
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
      background: rgba(15, 15, 26, 0.95);
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
      border: 1px solid rgba(171, 159, 242, 0.2);
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
      background: linear-gradient(135deg, #ffffff 0%, #a0a0b8 100%);
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
      box-shadow: 0 8px 30px rgba(171, 159, 242, 0.3);
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
      grid-template-columns: repeat(4, 1fr);
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
      box-shadow: 0 8px 24px rgba(124, 58, 237, 0.12);
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
      box-shadow: 0 12px 32px rgba(124, 58, 237, 0.12);
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
      background: #1e1e2e;
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
      background: #16161e;
      border-bottom: 1px solid #2a2a3a;
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

    /* Responsive */
    @media (max-width: 968px) {
      .monitors-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .stats {
        grid-template-columns: repeat(2, 1fr);
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
          <a href="#latest-calls">Latest Calls</a>
          <a href="/api">API</a>
          <a href="/dashboard">Dashboard</a>
          <a href="/signal">Signal</a>
          <a href="/backtest">Backtest</a>
          <a href="/trades">Trades</a>
        </nav>
      </div>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="container">
        <div class="hero-badge">
          <span>⚡</span>
          <span>Real-time market intelligence</span>
        </div>
        <h1>Market signals that<br>actually matter</h1>
        <p>15+ automated monitors tracking price action, orderbook depth, on-chain activity, macro events, funding rates, sentiment, stablecoins, predictions, and institutional flows — plus autonomous trade execution.</p>
        <div style="margin: 20px 0; padding: 16px 24px; background: rgba(124, 58, 237, 0.15); border: 1px solid rgba(124, 58, 237, 0.3); border-radius: 12px; display: inline-block;">
          <span style="font-size: 1.1em;">🎯 <strong>NEW: Live Scanner API</strong> — Scan any coin for trade signals in real-time. <a href="#scanner-api" style="color: #8b5cf6; text-decoration: underline;">Try it →</a></span>
        </div>
        <div class="hero-buttons">
          <a href="/api/dashboard" class="btn btn-primary">Live Dashboard →</a>
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
          <div class="stat-value">100%</div>
          <div class="stat-label">Win Rate</div>
        </div>
      </div>
    </section>

    <section id="latest-calls" class="section">
      <div class="container">
        <div class="section-header">
          <h2>Latest Calls</h2>
          <p>Auto-generated trade signals from our 2-hour scanner cycle. Live entry, SL, and TP levels.</p>
        </div>

        <div id="calls-loading" style="text-align: center; color: var(--text-muted); padding: 40px;">
          Loading latest scanner data...
        </div>

        <div id="calls-container" style="display: none;">
          <div id="calls-meta" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
              <span id="calls-timestamp" style="color: var(--text-muted); font-size: 14px;"></span>
              <span id="calls-fg" style="font-size: 14px; padding: 4px 12px; border-radius: 8px;"></span>
            </div>
            <span id="calls-count" style="color: var(--text-secondary); font-size: 14px;"></span>
          </div>

          <div style="overflow-x: auto;">
            <table class="thresholds-table" id="calls-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Entry</th>
                  <th>Stop Loss</th>
                  <th>TP1</th>
                  <th>TP2</th>
                  <th>Confidence</th>
                  <th>Indicators</th>
                </tr>
              </thead>
              <tbody id="calls-body">
              </tbody>
            </table>
          </div>

          <div id="calls-history" style="margin-top: 32px;">
            <h3 style="font-size: 18px; margin-bottom: 16px; color: var(--text-secondary);">Previous Scans</h3>
            <div id="history-container" style="display: flex; flex-direction: column; gap: 12px;"></div>
          </div>
        </div>

        <div id="calls-error" style="display: none; text-align: center; color: var(--danger); padding: 40px;">
          Failed to load scanner data. Try refreshing.
        </div>
      </div>
    </section>

    <script>
    (function() {
      const fmt = (n, d) => {
        if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (n >= 1) return n.toFixed(d || 4);
        return n.toPrecision(4);
      };

      const timeAgo = (ts) => {
        const diff = Date.now() - ts;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return mins + 'm ago';
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return hrs + 'h ' + (mins % 60) + 'm ago';
        return Math.floor(hrs / 24) + 'd ago';
      };

      const renderSignals = (scan, tbody) => {
        tbody.innerHTML = '';
        if (!scan.signals || scan.signals.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px;">No signals in this scan</td></tr>';
          return;
        }
        scan.signals.forEach(s => {
          const conf = Math.round(s.confidence * 100);
          const confColor = conf >= 80 ? 'var(--success)' : conf >= 60 ? 'var(--warning)' : 'var(--text-muted)';
          const sideColor = s.side === 'LONG' ? 'var(--success)' : 'var(--danger)';
          const slPct = ((s.stopLoss - s.entry) / s.entry * 100).toFixed(1);
          const tp1Pct = ((s.takeProfit1 - s.entry) / s.entry * 100).toFixed(1);
          const tp2Pct = ((s.takeProfit2 - s.entry) / s.entry * 100).toFixed(1);

          const row = document.createElement('tr');
          row.innerHTML = 
            '<td style="font-weight:600;">' + s.symbol + '</td>' +
            '<td><span style="color:' + sideColor + ';font-weight:600;">' + s.side + '</span></td>' +
            '<td style="font-family:monospace;">$' + fmt(s.entry) + '</td>' +
            '<td style="font-family:monospace;color:var(--danger);">$' + fmt(s.stopLoss) + ' <span style="font-size:12px;">(' + slPct + '%)</span></td>' +
            '<td style="font-family:monospace;color:var(--success);">$' + fmt(s.takeProfit1) + ' <span style="font-size:12px;">(+' + tp1Pct + '%)</span></td>' +
            '<td style="font-family:monospace;color:var(--success);">$' + fmt(s.takeProfit2) + ' <span style="font-size:12px;">(+' + tp2Pct + '%)</span></td>' +
            '<td><span style="color:' + confColor + ';font-weight:600;">' + conf + '%</span></td>' +
            '<td style="font-size:13px;color:var(--text-secondary);">' + s.indicators.join(', ') + '</td>';
          tbody.appendChild(row);
        });
      };

      const renderFG = (fg) => {
        const el = document.getElementById('calls-fg');
        if (!fg) { el.style.display = 'none'; return; }
        const color = fg.value <= 25 ? 'var(--danger)' : fg.value >= 75 ? 'var(--success)' : 'var(--warning)';
        el.style.background = 'rgba(0,0,0,0.3)';
        el.style.border = '1px solid ' + color;
        el.style.color = color;
        el.textContent = 'F&G: ' + fg.value + ' (' + fg.classification + ')';
      };

      fetch('/api/scanner/history?limit=12')
        .then(r => r.json())
        .then(data => {
          document.getElementById('calls-loading').style.display = 'none';

          if (!data.scans || data.scans.length === 0) {
            document.getElementById('calls-loading').style.display = 'block';
            document.getElementById('calls-loading').textContent = 'First scan is running — check back in a few minutes.';
            return;
          }

          document.getElementById('calls-container').style.display = 'block';

          // Render latest scan
          const latest = data.scans[0];
          document.getElementById('calls-timestamp').textContent = 'Last scan: ' + timeAgo(latest.timestamp) + ' (' + new Date(latest.timestamp).toUTCString().slice(0, -4) + ' UTC)';
          document.getElementById('calls-count').textContent = latest.signalCount + ' signals from ' + latest.scanned + ' coins';
          renderFG(latest.fearGreed);
          renderSignals(latest, document.getElementById('calls-body'));

          // Render history
          const historyContainer = document.getElementById('history-container');
          if (data.scans.length <= 1) {
            historyContainer.innerHTML = '<p style="color:var(--text-muted);font-size:14px;">More scan history will appear after the next 2h cycle.</p>';
            return;
          }

          data.scans.slice(1, 12).forEach((scan, i) => {
            const card = document.createElement('div');
            card.style.cssText = 'background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:16px 20px;cursor:pointer;transition:all 0.2s;';
            card.onmouseenter = function() { this.style.borderColor = 'var(--purple-primary)'; };
            card.onmouseleave = function() { this.style.borderColor = 'var(--border-color)'; };

            const fgVal = scan.fearGreed ? scan.fearGreed.value : '?';
            const fgColor = fgVal <= 25 ? 'var(--danger)' : fgVal >= 75 ? 'var(--success)' : 'var(--warning)';

            card.innerHTML = 
              '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
                '<div style="display:flex;align-items:center;gap:12px;">' +
                  '<span style="color:var(--text-muted);font-size:14px;min-width:80px;">' + timeAgo(scan.timestamp) + '</span>' +
                  '<span style="color:' + fgColor + ';font-size:13px;">F&G: ' + fgVal + '</span>' +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:16px;">' +
                  '<span style="color:var(--text-secondary);font-size:14px;">' + scan.signalCount + ' signals</span>' +
                  (scan.signals.length > 0 ? '<span style="color:var(--purple-primary);font-size:13px;">' + scan.signals.map(function(s) { return s.symbol; }).join(', ') + '</span>' : '') +
                '</div>' +
              '</div>' +
              '<div class="history-detail" style="display:none;margin-top:12px;"></div>';

            card.onclick = function() {
              const detail = this.querySelector('.history-detail');
              if (detail.style.display === 'none') {
                detail.style.display = 'block';
                if (!detail.querySelector('table')) {
                  const tbl = document.createElement('table');
                  tbl.className = 'thresholds-table';
                  tbl.style.marginTop = '8px';
                  tbl.innerHTML = '<thead><tr><th>Symbol</th><th>Side</th><th>Entry</th><th>SL</th><th>TP1</th><th>TP2</th><th>Conf</th><th>Indicators</th></tr></thead><tbody></tbody>';
                  detail.appendChild(tbl);
                  renderSignals(scan, tbl.querySelector('tbody'));
                }
              } else {
                detail.style.display = 'none';
              }
            };

            historyContainer.appendChild(card);
          });
        })
        .catch(err => {
          document.getElementById('calls-loading').style.display = 'none';
          document.getElementById('calls-error').style.display = 'block';
          console.error('Scanner history fetch error:', err);
        });
    })();
    </script>

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

          <div class="monitor-card">
            <div class="monitor-icon">🔮</div>
            <h3>Prediction Markets</h3>
            <p>Tracks Polymarket odds for Fed decisions, elections, and macro events.</p>
            <div class="monitor-meta">
              <span class="meta-tag frequency">Every 30m</span>
              <span class="meta-tag">Polymarket</span>
            </div>
          </div>

          <div class="monitor-card">
            <div class="monitor-icon">🤖</div>
            <h3>Auto-Trader</h3>
            <p>Autonomous execution on Hyperliquid with Kelly sizing, risk limits, and SL/TP management.</p>
            <div class="monitor-meta">
              <span class="meta-tag frequency">Real-time</span>
              <span class="meta-tag">Hyperliquid</span>
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
          </tbody>
        </table>
      </div>
    </section>

    <section id="api" class="section">
      <div class="container">
        <div class="section-header">
          <h2>Running Manually</h2>
          <p>Execute any monitor script directly to get current readings.</p>
        </div>

        <div class="code-section">
          <div class="code-header">
            <span>Terminal</span>
          </div>
          <div class="code-content">
<pre><code><span class="code-comment"># Check current BTC price + recent moves</span>
node scripts/btc-price-monitor.js

<span class="code-comment"># Check whale/liquidation events</span>
node scripts/onchain-monitor.js

<span class="code-comment"># Check upcoming macro events</span>
node scripts/macro-monitor.js

<span class="code-comment"># Check funding rates</span>
node scripts/funding-monitor.js

<span class="code-comment"># Check fear & greed</span>
node scripts/feargreed-monitor.js

<span class="code-comment"># Check ETF flows</span>
node scripts/etf-monitor.js</code></pre>
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
  </main>

  <footer>
    <div class="container">
      <div class="footer-content">
        <div class="footer-text" style="display: flex; align-items: center; gap: 10px;">
          <img src="/logo.jpg" alt="Macro Oracle" style="width: 28px; height: 28px; border-radius: 50%;">
          Built by Mistah 🎩 — Macro intelligence for the agent economy.
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
</body>
</html>
`;
