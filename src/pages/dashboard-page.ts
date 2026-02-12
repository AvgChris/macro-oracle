export const dashboardPageHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/jpeg" href="/logo.jpg">
  <title>Dashboard — Macro Oracle</title>
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
    .container { max-width: 1200px; margin: 0 auto; }
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
    .page-title {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 32px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-bottom: 32px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin-bottom: 32px;
    }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .card-title {
      font-size: 13px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .big-value {
      font-size: 36px;
      font-weight: 700;
    }
    .big-value.up { color: var(--success); }
    .big-value.down { color: var(--danger); }
    .big-value.neutral { color: var(--text-primary); }
    .sub-value {
      font-size: 14px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color);
    }
    .metric-row:last-child { border-bottom: none; }
    .metric-label { color: var(--text-secondary); }
    .metric-value { font-weight: 600; font-family: 'JetBrains Mono', monospace; }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge.fear { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
    .badge.greed { background: rgba(16, 185, 129, 0.1); color: var(--success); }
    .badge.neutral { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
    .badge.risk-off { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
    .badge.risk-on { background: rgba(16, 185, 129, 0.1); color: var(--success); }
    .change { font-size: 13px; margin-left: 8px; }
    .change.up { color: var(--success); }
    .change.down { color: var(--danger); }
    .events-list { margin-top: 12px; }
    .event-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--bg-secondary);
      border-radius: 12px;
      margin-bottom: 8px;
    }
    .event-name { font-weight: 500; }
    .event-date { color: var(--text-muted); font-size: 14px; }
    .refresh-note {
      text-align: center;
      color: var(--text-muted);
      font-size: 13px;
      margin-top: 24px;
    }
    .json-toggle {
      text-align: center;
      margin-top: 16px;
    }
    .json-toggle a {
      color: var(--purple-primary);
      text-decoration: none;
      font-size: 14px;
    }
    @media (max-width: 968px) {
      .grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .grid, .grid-2 { grid-template-columns: 1fr; }
      .big-value { font-size: 28px; }
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
        <a href="/signal">Signal</a>
        <a href="/backtest">Backtest</a>
        <a href="/trades">Trades</a>
      </nav>
    </header>

    <h1 class="page-title">Market Dashboard</h1>

    <div class="grid">
      <div class="card">
        <div class="card-title">📈 Bitcoin</div>
        <div class="big-value" id="btc-price">—</div>
        <div class="sub-value" id="btc-change">Loading...</div>
      </div>

      <div class="card">
        <div class="card-title">😱 Fear & Greed</div>
        <div class="big-value" id="fear-greed">—</div>
        <div class="sub-value"><span class="badge" id="fg-badge">—</span></div>
      </div>

      <div class="card">
        <div class="card-title">💵 DXY (Dollar)</div>
        <div class="big-value neutral" id="dxy">—</div>
        <div class="sub-value" id="dxy-regime">Loading...</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">🏦 Fed Data (FRED)</div>
        <div class="metric-row">
          <span class="metric-label">Fed Funds Rate</span>
          <span class="metric-value" id="fed-rate">—</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">CPI (YoY)</span>
          <span class="metric-value" id="cpi">—</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">10Y Treasury</span>
          <span class="metric-value" id="treasury-10y">—</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Unemployment</span>
          <span class="metric-value" id="unemployment">—</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">📊 TradFi Markets</div>
        <div class="metric-row">
          <span class="metric-label">S&P 500</span>
          <span class="metric-value" id="sp500">—</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Nasdaq</span>
          <span class="metric-value" id="nasdaq">—</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">VIX</span>
          <span class="metric-value" id="vix">—</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Gold</span>
          <span class="metric-value" id="gold">—</span>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">🎯 Current Signal</div>
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
          <div class="big-value" id="signal-direction" style="font-size: 28px;">—</div>
          <span class="badge" id="signal-sentiment">—</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Confidence</span>
          <span class="metric-value" id="signal-confidence">—</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Magnitude</span>
          <span class="metric-value" id="signal-magnitude">—</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">📅 Upcoming Events</div>
        <div class="events-list" id="events-list">
          <div class="event-item">Loading events...</div>
        </div>
      </div>
    </div>

    <div class="refresh-note">
      Data refreshes every 2 minutes • <span id="last-update"></span>
    </div>

    <div class="json-toggle">
      <a href="/api/dashboard/json">View raw JSON →</a>
    </div>
  </div>

  <script>
    function formatPrice(val) {
      if (!val) return '—';
      return '$' + Number(val).toLocaleString(undefined, {maximumFractionDigits: 0});
    }
    
    function formatPercent(val) {
      if (val === undefined || val === null) return '—';
      const num = Number(val);
      const sign = num >= 0 ? '+' : '';
      return sign + num.toFixed(2) + '%';
    }

    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard/json');
        const data = await res.json();
        
        // BTC
        const btcData = data.market?.btc || data.crypto;
        if (btcData) {
          const btcPrice = btcData.price || btcData.btcPrice || data.market?.btc;
          document.getElementById('btc-price').textContent = formatPrice(btcPrice);
          const change = btcData.change24h;
          if (change !== undefined) {
            const changeEl = document.getElementById('btc-change');
            changeEl.innerHTML = '<span class="change ' + (change >= 0 ? 'up' : 'down') + '">' + formatPercent(change) + ' (24h)</span>';
          } else {
            document.getElementById('btc-change').innerHTML = '<span class="change">Live price</span>';
          }
        }
        
        // Fear & Greed
        const fg = data.fearGreed || data.market?.fearGreed;
        if (fg) {
          const val = fg.value || fg;
          document.getElementById('fear-greed').textContent = val;
          const badge = document.getElementById('fg-badge');
          if (val <= 25) { badge.textContent = 'Extreme Fear'; badge.className = 'badge fear'; }
          else if (val <= 45) { badge.textContent = 'Fear'; badge.className = 'badge fear'; }
          else if (val <= 55) { badge.textContent = 'Neutral'; badge.className = 'badge neutral'; }
          else if (val <= 75) { badge.textContent = 'Greed'; badge.className = 'badge greed'; }
          else { badge.textContent = 'Extreme Greed'; badge.className = 'badge greed'; }
        }
        
        // DXY
        const dxy = data.dxy;
        if (dxy) {
          const dxyVal = typeof dxy === 'number' ? dxy : (dxy.dxy || dxy.value || 0);
          document.getElementById('dxy').textContent = dxyVal.toFixed ? dxyVal.toFixed(2) : dxyVal;
          document.getElementById('dxy-regime').textContent = dxy.regime || (dxyVal > 105 ? 'Strong Dollar' : dxyVal < 100 ? 'Weak Dollar' : 'Neutral');
        }
        
        // FRED
        const fred = data.fred;
        if (fred) {
          document.getElementById('fed-rate').textContent = (fred.fedFunds?.rate || fred.rate || '—') + '%';
          document.getElementById('cpi').textContent = (fred.cpi?.value || fred.cpi || '—') + '%';
          document.getElementById('treasury-10y').textContent = (fred.treasury?.yield10y || '—') + '%';
          document.getElementById('unemployment').textContent = (fred.unemployment?.rate || '—') + '%';
        }
        
        // TradFi
        const tradfi = data.tradfi;
        if (tradfi) {
          document.getElementById('sp500').textContent = formatPrice(tradfi.equities?.sp500?.price || tradfi.sp500);
          document.getElementById('nasdaq').textContent = formatPrice(tradfi.equities?.nasdaq?.price || tradfi.nasdaq);
          document.getElementById('vix').textContent = (tradfi.vix?.value || tradfi.vix || '—');
          document.getElementById('gold').textContent = formatPrice(tradfi.gold?.price || tradfi.gold);
        }
        
        // Signal
        const signal = data.signal;
        if (signal) {
          const dir = signal.cryptoImpact?.direction || signal.direction || 'neutral';
          const dirEl = document.getElementById('signal-direction');
          dirEl.textContent = dir.charAt(0).toUpperCase() + dir.slice(1);
          dirEl.className = 'big-value ' + (dir === 'bearish' ? 'down' : dir === 'bullish' ? 'up' : 'neutral');
          
          const sentEl = document.getElementById('signal-sentiment');
          const sent = signal.sentiment || 'neutral';
          sentEl.textContent = sent.replace('_', ' ').toUpperCase();
          sentEl.className = 'badge ' + sent.replace('_', '-');
          
          document.getElementById('signal-confidence').textContent = (signal.cryptoImpact?.confidence || signal.confidence || 0) + '%';
          document.getElementById('signal-magnitude').textContent = signal.cryptoImpact?.magnitude || signal.magnitude || '—';
        }
        
        // Events
        const events = data.calendar?.upcoming || data.events || [];
        const eventsEl = document.getElementById('events-list');
        if (events.length > 0) {
          eventsEl.innerHTML = events.slice(0, 4).map(e => 
            '<div class="event-item"><span class="event-name">' + (e.name || e.event) + '</span><span class="event-date">' + (e.date || e.time || '') + '</span></div>'
          ).join('');
        } else {
          eventsEl.innerHTML = '<div class="event-item">No upcoming events</div>';
        }
        
        document.getElementById('last-update').textContent = 'Last update: ' + new Date().toLocaleString();
      } catch (e) {
        console.error('Failed to fetch dashboard:', e);
      }
    }
    
    fetchDashboard();
    setInterval(fetchDashboard, 120000);
  </script>
</body>
</html>
`;
