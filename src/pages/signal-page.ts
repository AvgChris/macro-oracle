export const signalPageHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/jpeg" href="/logo.jpg">
  <title>Live Signal — Macro Oracle</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #25343F;
      --bg-secondary: #1e2b34;
      --bg-card: #2e4150;
      --purple-primary: #FF9B51;
      --purple-secondary: #FFB07A;
      --purple-glow: rgba(255, 155, 81, 0.15);
      --text-primary: #EAEFEF;
      --text-secondary: #BFC9D1;
      --text-muted: #8A9AA6;
      --border-color: #3D5565;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg-secondary);
      color: var(--text-primary);
      min-height: 100vh;
      padding: 40px 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: var(--text-primary);
    }
    .logo-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #FFB07A, #FF9B51);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .logo-text { font-size: 20px; font-weight: 700; }
    nav a {
      color: var(--text-secondary);
      text-decoration: none;
      margin-left: 24px;
      font-weight: 500;
    }
    nav a:hover { color: var(--purple-primary); }
    .signal-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
      margin-bottom: 24px;
    }
    .signal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }
    .signal-title { font-size: 14px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .signal-value { font-size: 48px; font-weight: 700; }
    .signal-value.bearish { color: var(--danger); }
    .signal-value.bullish { color: var(--success); }
    .signal-value.neutral { color: var(--warning); }
    .signal-badge {
      padding: 8px 16px;
      border-radius: 100px;
      font-size: 14px;
      font-weight: 600;
    }
    .signal-badge.risk-off { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
    .signal-badge.risk-on { background: rgba(16, 185, 129, 0.1); color: var(--success); }
    .signal-badge.neutral { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-bottom: 32px;
    }
    .metric {
      text-align: center;
      padding: 20px;
      background: var(--bg-secondary);
      border-radius: 16px;
    }
    .metric-value { font-size: 28px; font-weight: 700; color: var(--purple-primary); }
    .metric-label { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
    .reasoning-box {
      background: var(--bg-secondary);
      border-radius: 16px;
      padding: 24px;
      margin-top: 24px;
    }
    .reasoning-title { font-size: 14px; font-weight: 600; color: var(--text-muted); margin-bottom: 12px; }
    .reasoning-text { color: var(--text-secondary); line-height: 1.6; }
    .refresh-note {
      text-align: center;
      color: var(--text-muted);
      font-size: 13px;
      margin-top: 24px;
    }
    .loading { text-align: center; padding: 60px; color: var(--text-muted); }
    .json-toggle {
      text-align: center;
      margin-top: 24px;
    }
    .json-toggle a {
      color: var(--purple-primary);
      text-decoration: none;
      font-size: 14px;
    }
    @media (max-width: 640px) {
      .metrics-grid { grid-template-columns: 1fr; }
      .signal-value { font-size: 36px; }
      .signal-header { flex-direction: column; gap: 16px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <a href="/" class="logo">
        <div class="logo-icon"><img src="/logo.jpg" alt="Macro Oracle" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
        <span class="logo-text">Macro Oracle</span>
      </a>
      <nav>
        <a href="/">Home</a>
        <a href="/api">API</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/backtest">Backtest</a>
        <a href="/trades">Trades</a>
      </nav>
    </header>

    <div class="signal-card">
      <div class="signal-header">
        <div>
          <div class="signal-title">Current Signal</div>
          <div class="signal-value" id="direction">Loading...</div>
        </div>
        <div class="signal-badge" id="sentiment">—</div>
      </div>

      <div class="metrics-grid">
        <div class="metric">
          <div class="metric-value" id="confidence">—</div>
          <div class="metric-label">Confidence</div>
        </div>
        <div class="metric">
          <div class="metric-value" id="magnitude">—</div>
          <div class="metric-label">Magnitude</div>
        </div>
        <div class="metric">
          <div class="metric-value" id="timestamp">—</div>
          <div class="metric-label">Updated</div>
        </div>
      </div>

      <div class="reasoning-box">
        <div class="reasoning-title">Analysis</div>
        <div class="reasoning-text" id="reasoning">Loading analysis...</div>
      </div>
    </div>

    <div class="signal-card">
      <div class="signal-title">Affected Assets</div>
      <div id="assets" style="margin-top: 16px; font-size: 24px;">—</div>
    </div>

    <div class="refresh-note">
      Data refreshes every 2 minutes • <span id="last-update"></span>
    </div>

    <div class="json-toggle">
      <a href="/api/signal/json">View raw JSON →</a>
    </div>
  </div>

  <script>
    async function fetchSignal() {
      try {
        const res = await fetch('/api/signal/json');
        const data = await res.json();
        
        const direction = data.cryptoImpact?.direction || data.direction || 'neutral';
        const directionEl = document.getElementById('direction');
        directionEl.textContent = direction.charAt(0).toUpperCase() + direction.slice(1);
        directionEl.className = 'signal-value ' + direction;
        
        const sentiment = data.sentiment || 'neutral';
        const sentimentEl = document.getElementById('sentiment');
        sentimentEl.textContent = sentiment.replace('_', ' ').toUpperCase();
        sentimentEl.className = 'signal-badge ' + sentiment.replace('_', '-');
        
        document.getElementById('confidence').textContent = (data.cryptoImpact?.confidence || data.confidence || 0) + '%';
        document.getElementById('magnitude').textContent = data.cryptoImpact?.magnitude || data.magnitude || '—';
        
        const ts = data.timestamp ? new Date(data.timestamp) : new Date();
        document.getElementById('timestamp').textContent = ts.toLocaleTimeString();
        document.getElementById('last-update').textContent = 'Last update: ' + ts.toLocaleString();
        
        document.getElementById('reasoning').textContent = data.cryptoImpact?.reasoning || data.reasoning || 'No analysis available';
        
        const assets = data.affectedAssets || ['BTC', 'ETH', 'SOL'];
        document.getElementById('assets').textContent = assets.join(' • ');
      } catch (e) {
        document.getElementById('direction').textContent = 'Error';
        document.getElementById('reasoning').textContent = 'Failed to load signal data';
      }
    }
    
    fetchSignal();
    setInterval(fetchSignal, 120000);
  </script>
</body>
</html>
`;
