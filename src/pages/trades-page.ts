export const tradesPageHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trade Calls — Macro Oracle</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root {
      --bg-primary: #0f0f1a;
      --bg-secondary: #1a1a2e;
      --bg-card: #252540;
      --purple-primary: #7c3aed;
      --purple-secondary: #8b5cf6;
      --purple-glow: rgba(124, 58, 237, 0.15);
      --text-primary: #ffffff;
      --text-secondary: #a0a0b8;
      --text-muted: #6b6b80;
      --border-color: #3a3a52;
      --success: #10b981;
      --success-bg: rgba(16, 185, 129, 0.1);
      --warning: #f59e0b;
      --warning-bg: rgba(245, 158, 11, 0.1);
      --danger: #ef4444;
      --danger-bg: rgba(239, 68, 68, 0.1);
      --blue: #3b82f6;
      --blue-bg: rgba(59, 130, 246, 0.1);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      padding: 40px 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
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
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
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
      transition: color 0.2s;
    }
    nav a:hover { color: var(--purple-primary); }
    .page-title { font-size: 36px; font-weight: 700; margin-bottom: 12px; }
    .page-subtitle { color: var(--text-secondary); font-size: 16px; margin-bottom: 40px; }
    
    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 20px;
      text-align: center;
    }
    .stat-card.highlight {
      border-color: var(--purple-primary);
      box-shadow: 0 0 20px var(--purple-glow);
    }
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }
    .stat-value.up { color: var(--success); }
    .stat-value.down { color: var(--danger); }
    .stat-label {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-top: 6px;
    }
    
    /* Trade Cards */
    .section-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .trades-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    .trade-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 24px;
      transition: all 0.2s;
    }
    .trade-card:hover {
      border-color: var(--purple-primary);
      transform: translateY(-2px);
    }
    .trade-card.open {
      border-color: var(--blue);
      box-shadow: 0 0 20px var(--blue-bg);
    }
    .trade-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    .trade-symbol {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .symbol-badge {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
    }
    .direction-badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .direction-badge.long { background: var(--success-bg); color: var(--success); }
    .direction-badge.short { background: var(--danger-bg); color: var(--danger); }
    .trade-pnl {
      text-align: right;
    }
    .pnl-value {
      font-size: 24px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }
    .pnl-value.positive { color: var(--success); }
    .pnl-value.negative { color: var(--danger); }
    .pnl-value.pending { color: var(--blue); }
    .pnl-status {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-top: 4px;
    }
    .trade-levels {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;
      padding: 16px;
      background: var(--bg-secondary);
      border-radius: 12px;
    }
    .level {
      text-align: center;
    }
    .level-label {
      font-size: 10px;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .level-value {
      font-size: 14px;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
    }
    .level-value.entry { color: var(--text-primary); }
    .level-value.stop { color: var(--danger); }
    .level-value.tp { color: var(--success); }
    .trade-reasoning {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 12px;
    }
    .trade-indicators {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .indicator-tag {
      padding: 4px 10px;
      background: var(--purple-glow);
      border-radius: 100px;
      font-size: 11px;
      color: var(--purple-secondary);
    }
    .current-price-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--bg-primary);
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .current-price-label {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .current-price-value {
      font-size: 20px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-primary);
    }
    .current-pnl {
      font-size: 16px;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
      padding: 4px 10px;
      border-radius: 6px;
    }
    .current-pnl.up { background: var(--success-bg); color: var(--success); }
    .current-pnl.down { background: var(--danger-bg); color: var(--danger); }
    .trade-meta {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
      font-size: 12px;
      color: var(--text-muted);
    }
    .confidence-bar {
      width: 60px;
      height: 6px;
      background: var(--bg-primary);
      border-radius: 3px;
      overflow: hidden;
      display: inline-block;
      margin-left: 8px;
      vertical-align: middle;
    }
    .confidence-fill {
      height: 100%;
      border-radius: 3px;
    }
    .confidence-fill.high { background: var(--success); }
    .confidence-fill.medium { background: var(--warning); }
    .confidence-fill.low { background: var(--danger); }
    
    /* Charts */
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin-bottom: 40px;
    }
    .chart-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 24px;
    }
    .chart-title {
      font-size: 14px;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    .chart-container {
      height: 250px;
    }
    
    /* History Table */
    .history-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 24px;
      overflow-x: auto;
    }
    .history-table {
      width: 100%;
      border-collapse: collapse;
    }
    .history-table th, .history-table td {
      padding: 14px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    .history-table th {
      color: var(--text-muted);
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 500;
    }
    .history-table td {
      font-size: 14px;
    }
    .history-table tr:last-child td { border-bottom: none; }
    .history-table .symbol { font-weight: 600; }
    .history-table .mono { font-family: 'JetBrains Mono', monospace; }
    .status-badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    .status-badge.win { background: var(--success-bg); color: var(--success); }
    .status-badge.loss { background: var(--danger-bg); color: var(--danger); }
    .status-badge.open { background: var(--blue-bg); color: var(--blue); }
    
    .json-toggle {
      text-align: center;
      margin-top: 32px;
    }
    .json-toggle a {
      color: var(--purple-primary);
      text-decoration: none;
      font-size: 14px;
    }
    
    @media (max-width: 1200px) {
      .stats-grid { grid-template-columns: repeat(3, 1fr); }
      .trades-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .charts-grid { grid-template-columns: 1fr; }
      .trade-levels { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <a href="/" class="logo">
        <div class="logo-icon">📊</div>
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

    <h1 class="page-title">📈 Trade Calls</h1>
    <p class="page-subtitle">Live trade signals with full transparency • Track record with verified P&L</p>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card highlight">
        <div class="stat-value up" id="win-rate">—%</div>
        <div class="stat-label">Win Rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-value up" id="total-pnl">—%</div>
        <div class="stat-label">Total P&L</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="total-trades">—</div>
        <div class="stat-label">Total Trades</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="open-trades">—</div>
        <div class="stat-label">Open</div>
      </div>
      <div class="stat-card">
        <div class="stat-value up" id="profit-factor">—</div>
        <div class="stat-label">Profit Factor</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="best-trade">—%</div>
        <div class="stat-label">Best Trade</div>
      </div>
    </div>

    <!-- Active Trades -->
    <h2 class="section-title">🔴 Active Trades</h2>
    <div class="trades-grid" id="active-trades">
      <!-- Loaded dynamically -->
    </div>

    <!-- Charts -->
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">📊 Cumulative P&L</div>
        <div class="chart-container">
          <canvas id="pnlChart"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-title">🎯 Win/Loss Distribution</div>
        <div class="chart-container">
          <canvas id="winLossChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Trade History -->
    <h2 class="section-title">📜 Trade History</h2>
    <div class="history-card">
      <table class="history-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Symbol</th>
            <th>Direction</th>
            <th>Entry</th>
            <th>Exit</th>
            <th>P&L</th>
            <th>Status</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody id="history-body">
          <!-- Loaded dynamically -->
        </tbody>
      </table>
    </div>

    <div class="json-toggle">
      <a href="/api/trades">View raw JSON →</a>
    </div>
  </div>

  <script>
    function formatPrice(val) {
      if (!val) return '—';
      if (val >= 1) return '$' + val.toLocaleString(undefined, {maximumFractionDigits: 2});
      return '$' + val.toFixed(6);
    }
    
    function formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
    }
    
    function getDuration(start, end) {
      if (!end) return 'Active';
      const ms = new Date(end) - new Date(start);
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (days > 0) return days + 'd ' + hours + 'h';
      return hours + 'h';
    }
    
    function getConfidenceClass(conf) {
      if (conf >= 70) return 'high';
      if (conf >= 50) return 'medium';
      return 'low';
    }

    function renderTradeCard(trade) {
      const isOpen = trade.status === 'open';
      const pnlClass = isOpen ? 'pending' : (trade.pnlPercent >= 0 ? 'positive' : 'negative');
      const pnlDisplay = isOpen ? 'OPEN' : (trade.pnlPercent >= 0 ? '+' : '') + trade.pnlPercent + '%';
      const statusMap = {
        'open': 'Active',
        'tp1_hit': 'TP1 Hit',
        'tp2_hit': 'TP2 Hit',
        'tp3_hit': 'TP3 Hit',
        'stopped': 'Stopped Out',
        'closed': 'Closed'
      };
      
      return \`
        <div class="trade-card \${isOpen ? 'open' : ''}">
          <div class="trade-header">
            <div class="trade-symbol">
              <span class="symbol-badge">\${trade.symbol}</span>
              <span class="direction-badge \${trade.direction.toLowerCase()}">\${trade.direction}</span>
            </div>
            <div class="trade-pnl">
              <div class="pnl-value \${pnlClass}">\${pnlDisplay}</div>
              <div class="pnl-status">\${statusMap[trade.status]}</div>
            </div>
          </div>
          
          <div class="trade-levels">
            <div class="level">
              <div class="level-label">Entry</div>
              <div class="level-value entry">\${formatPrice(trade.entry)}</div>
            </div>
            <div class="level">
              <div class="level-label">Stop Loss</div>
              <div class="level-value stop">\${formatPrice(trade.stopLoss)}</div>
            </div>
            <div class="level">
              <div class="level-label">TP1</div>
              <div class="level-value tp">\${formatPrice(trade.takeProfit1)}</div>
            </div>
            <div class="level">
              <div class="level-label">\${trade.takeProfit2 ? 'TP2' : 'Exit'}</div>
              <div class="level-value tp">\${formatPrice(trade.takeProfit2 || trade.exitPrice)}</div>
            </div>
          </div>
          
          \${isOpen ? \`
          <div class="current-price-row">
            <span class="current-price-label">Current Price:</span>
            <span class="current-price-value" id="price-\${trade.symbol}">\${trade.currentPrice ? formatPrice(trade.currentPrice) : 'Loading...'}</span>
            <span class="current-pnl \${trade.unrealizedPnl >= 0 ? 'up' : 'down'}" id="pnl-\${trade.symbol}">\${trade.unrealizedPnl ? ((trade.unrealizedPnl >= 0 ? '+' : '') + trade.unrealizedPnl.toFixed(2) + '%') : ''}</span>
          </div>
          \` : ''}
          
          <div class="trade-reasoning">\${trade.reasoning}</div>
          
          <div class="trade-indicators">
            \${trade.indicators.map(i => '<span class="indicator-tag">' + i + '</span>').join('')}
          </div>
          
          <div class="trade-meta">
            <span>\${formatDate(trade.timestamp)}</span>
            <span>
              Confidence: \${trade.confidence}%
              <div class="confidence-bar">
                <div class="confidence-fill \${getConfidenceClass(trade.confidence)}" style="width: \${trade.confidence}%"></div>
              </div>
            </span>
          </div>
        </div>
      \`;
    }

    async function fetchTrades() {
      try {
        const [tradesRes, statsRes] = await Promise.all([
          fetch('/api/trades'),
          fetch('/api/trades/stats')
        ]);
        
        const trades = await tradesRes.json();
        const stats = await statsRes.json();
        
        // Update stats
        document.getElementById('win-rate').textContent = stats.winRate + '%';
        document.getElementById('win-rate').className = 'stat-value ' + (stats.winRate >= 50 ? 'up' : 'down');
        
        document.getElementById('total-pnl').textContent = (stats.totalPnl >= 0 ? '+' : '') + stats.totalPnl + '%';
        document.getElementById('total-pnl').className = 'stat-value ' + (stats.totalPnl >= 0 ? 'up' : 'down');
        
        document.getElementById('total-trades').textContent = stats.totalTrades;
        document.getElementById('open-trades').textContent = stats.openTrades;
        
        document.getElementById('profit-factor').textContent = stats.profitFactor === Infinity ? '∞' : stats.profitFactor;
        document.getElementById('profit-factor').className = 'stat-value ' + (stats.profitFactor >= 1 ? 'up' : 'down');
        
        if (stats.bestTrade) {
          document.getElementById('best-trade').textContent = '+' + stats.bestTrade.pnl + '%';
          document.getElementById('best-trade').className = 'stat-value up';
        }
        
        // Active trades
        const activeTrades = trades.filter(t => t.status === 'open');
        const activeContainer = document.getElementById('active-trades');
        if (activeTrades.length > 0) {
          activeContainer.innerHTML = activeTrades.map(renderTradeCard).join('');
          // Fetch prices AFTER cards are rendered
          await fetchPrices(trades);
        } else {
          activeContainer.innerHTML = '<div class="trade-card" style="text-align: center; color: var(--text-muted);">No active trades — waiting for next signal</div>';
        }
        
        // History table
        const historyHtml = trades.map(t => {
          const statusClass = t.status === 'open' ? 'open' : (t.outcome === 'win' ? 'win' : 'loss');
          const pnl = t.pnlPercent !== undefined ? ((t.pnlPercent >= 0 ? '+' : '') + t.pnlPercent + '%') : '—';
          
          return \`
            <tr>
              <td>\${formatDate(t.timestamp)}</td>
              <td class="symbol">\${t.symbol}</td>
              <td><span class="direction-badge \${t.direction.toLowerCase()}">\${t.direction}</span></td>
              <td class="mono">\${formatPrice(t.entry)}</td>
              <td class="mono">\${t.exitPrice ? formatPrice(t.exitPrice) : '—'}</td>
              <td class="mono" style="color: \${t.pnlPercent >= 0 ? 'var(--success)' : 'var(--danger)'}">\${pnl}</td>
              <td><span class="status-badge \${statusClass}">\${t.outcome || 'OPEN'}</span></td>
              <td>\${getDuration(t.timestamp, t.exitTimestamp)}</td>
            </tr>
          \`;
        }).join('');
        document.getElementById('history-body').innerHTML = historyHtml;
        
        // Charts
        renderCharts(trades, stats);
        
        return trades;
      } catch (e) {
        console.error('Failed to fetch trades:', e);
        return [];
      }
    }
    
    function renderCharts(trades, stats) {
      const closed = trades.filter(t => t.status !== 'open').reverse();
      
      // Cumulative P&L chart
      let cumPnl = 0;
      const pnlData = closed.map(t => {
        cumPnl += t.pnlPercent || 0;
        return cumPnl;
      });
      
      new Chart(document.getElementById('pnlChart').getContext('2d'), {
        type: 'line',
        data: {
          labels: closed.map((t, i) => 'Trade ' + (i + 1)),
          datasets: [{
            label: 'Cumulative P&L %',
            data: pnlData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: '#3a3a52' }, ticks: { color: '#6b6b80' } },
            y: { grid: { color: '#3a3a52' }, ticks: { color: '#6b6b80' } }
          }
        }
      });
      
      // Win/Loss donut
      new Chart(document.getElementById('winLossChart').getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Wins', 'Losses'],
          datasets: [{
            data: [stats.wins, stats.losses],
            backgroundColor: ['#10b981', '#ef4444'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              position: 'bottom',
              labels: { color: '#a0a0b8' }
            }
          },
          cutout: '65%'
        }
      });
    }
    
    // Fetch current prices for open trades
    async function fetchPrices(trades) {
      const openTrades = trades.filter(t => t.status === 'open');
      if (openTrades.length === 0) return;
      
      // Build CoinGecko IDs mapping
      const symbolToId = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum', 
        'SOL': 'solana',
        'SKR': 'seeker',
        'AVAX': 'avalanche-2',
        'BNB': 'binancecoin',
        'XRP': 'ripple',
        'ADA': 'cardano',
        'DOGE': 'dogecoin',
        'DOT': 'polkadot',
        'LINK': 'chainlink',
        'MATIC': 'matic-network',
        'UNI': 'uniswap',
        'ATOM': 'cosmos',
        'LTC': 'litecoin',
        'XMR': 'monero',
        'TRUMP': 'maga',
        'SUI': 'sui',
        'ASTER': 'aster-2',
        'BCH': 'bitcoin-cash',
        'XAUT': 'tether-gold',
        'PAXG': 'pax-gold'
      };
      
      const ids = openTrades.map(t => symbolToId[t.symbol] || t.symbol.toLowerCase()).filter(Boolean);
      if (ids.length === 0) return;
      
      try {
        const res = await fetch(\`https://api.coingecko.com/api/v3/simple/price?ids=\${ids.join(',')}&vs_currencies=usd\`);
        const prices = await res.json();
        
        openTrades.forEach(trade => {
          const id = symbolToId[trade.symbol] || trade.symbol.toLowerCase();
          const priceData = prices[id];
          if (priceData && priceData.usd) {
            const currentPrice = priceData.usd;
            const pnl = trade.direction === 'LONG' 
              ? ((currentPrice - trade.entry) / trade.entry) * 100
              : ((trade.entry - currentPrice) / trade.entry) * 100;
            
            const priceEl = document.getElementById('price-' + trade.symbol);
            const pnlEl = document.getElementById('pnl-' + trade.symbol);
            
            if (priceEl) priceEl.textContent = formatPrice(currentPrice);
            if (pnlEl) {
              pnlEl.textContent = (pnl >= 0 ? '+' : '') + pnl.toFixed(2) + '%';
              pnlEl.className = 'current-pnl ' + (pnl >= 0 ? 'up' : 'down');
            }
          }
        });
      } catch (e) {
        console.error('Failed to fetch prices:', e);
      }
    }
    
    // Initial load
    fetchTrades();
    
    // Refresh trades every minute
    setInterval(fetchTrades, 60000);
    
    // Refresh prices every 15 minutes (in addition to trade refreshes)
    setInterval(() => {
      fetch('/api/trades').then(r => r.json()).then(fetchPrices);
    }, 900000);
  </script>
</body>
</html>
`;
