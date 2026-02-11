export const backtestPageHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/jpeg" href="/logo.jpg">
  <title>Backtest Results — Macro Oracle</title>
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
    .page-title {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .page-subtitle {
      color: var(--text-secondary);
      font-size: 16px;
      margin-bottom: 40px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 32px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin-bottom: 32px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-bottom: 32px;
    }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 28px;
    }
    .card.highlight {
      border-color: var(--purple-primary);
      box-shadow: 0 0 30px var(--purple-glow);
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
      font-size: 42px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }
    .big-value.up { color: var(--success); }
    .big-value.down { color: var(--danger); }
    .big-value.neutral { color: var(--text-primary); }
    .sub-value {
      font-size: 14px;
      color: var(--text-muted);
      margin-top: 8px;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge.success { background: var(--success-bg); color: var(--success); }
    .badge.warning { background: var(--warning-bg); color: var(--warning); }
    .badge.danger { background: var(--danger-bg); color: var(--danger); }
    .badge.purple { background: var(--purple-glow); color: var(--purple-secondary); }
    
    /* Strategy Cards */
    .strategy-card {
      background: var(--bg-secondary);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 16px;
      border: 1px solid var(--border-color);
      transition: all 0.2s;
    }
    .strategy-card:hover {
      border-color: var(--purple-primary);
      transform: translateY(-2px);
    }
    .strategy-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .strategy-name {
      font-size: 18px;
      font-weight: 600;
    }
    .strategy-return {
      font-size: 24px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }
    .strategy-return.positive { color: var(--success); }
    .strategy-return.negative { color: var(--danger); }
    .strategy-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 20px;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-primary);
    }
    .stat-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-top: 4px;
    }
    
    /* Progress Bar */
    .progress-bar {
      height: 8px;
      background: var(--bg-primary);
      border-radius: 4px;
      overflow: hidden;
      margin-top: 12px;
    }
    .progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }
    .progress-fill.success { background: linear-gradient(90deg, var(--success), #34d399); }
    .progress-fill.warning { background: linear-gradient(90deg, var(--warning), #fbbf24); }
    .progress-fill.danger { background: linear-gradient(90deg, var(--danger), #f87171); }
    
    /* Correlation Table */
    .correlation-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    .correlation-table th, .correlation-table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    .correlation-table th {
      color: var(--text-muted);
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 500;
    }
    .correlation-table td {
      font-family: 'JetBrains Mono', monospace;
    }
    .correlation-value {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
    }
    .correlation-value.strong { background: var(--success-bg); color: var(--success); }
    .correlation-value.moderate { background: var(--warning-bg); color: var(--warning); }
    .correlation-value.weak { background: rgba(107, 107, 128, 0.2); color: var(--text-muted); }
    
    /* Fear & Greed Performance */
    .fg-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 20px;
    }
    .fg-period {
      background: var(--bg-secondary);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .fg-period-label {
      font-size: 14px;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    .fg-period-return {
      font-size: 28px;
      font-weight: 700;
      color: var(--success);
      font-family: 'JetBrains Mono', monospace;
    }
    .fg-period-winrate {
      font-size: 13px;
      color: var(--text-secondary);
      margin-top: 4px;
    }
    
    /* Charts */
    .chart-container {
      position: relative;
      height: 300px;
      margin-top: 20px;
    }
    
    /* Insight Box */
    .insight-box {
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(139, 92, 246, 0.05));
      border: 1px solid var(--purple-primary);
      border-radius: 16px;
      padding: 24px;
      margin-top: 24px;
    }
    .insight-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--purple-secondary);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .insight-text {
      color: var(--text-secondary);
      line-height: 1.6;
    }
    
    /* Current Signal */
    .current-signal {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: var(--bg-secondary);
      border-radius: 12px;
      margin-top: 20px;
    }
    .signal-indicator {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    .signal-indicator.active { 
      background: var(--success-bg); 
      border: 2px solid var(--success);
      animation: pulse 2s infinite;
    }
    .signal-indicator.inactive { 
      background: rgba(107, 107, 128, 0.2); 
      border: 2px solid var(--text-muted);
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
      50% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
    }
    .signal-details h4 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .signal-details p {
      color: var(--text-muted);
      font-size: 14px;
    }
    
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
      .grid { grid-template-columns: repeat(2, 1fr); }
      .grid-3 { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .grid, .grid-2 { grid-template-columns: 1fr; }
      .strategy-stats { grid-template-columns: repeat(2, 1fr); }
      .fg-grid { grid-template-columns: 1fr; }
      .big-value { font-size: 32px; }
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

    <h1 class="page-title">📈 Backtest Results</h1>
    <p class="page-subtitle">Historical performance analysis • 365 days of data • Last updated: <span id="last-updated">—</span></p>

    <!-- Summary Stats -->
    <div class="grid">
      <div class="card highlight">
        <div class="card-title">🏆 Best Strategy</div>
        <div class="big-value up" id="best-strategy-name">—</div>
        <div class="sub-value"><span id="best-strategy-return">—</span> total return</div>
      </div>
      <div class="card">
        <div class="card-title">🎯 Win Rate</div>
        <div class="big-value up" id="best-winrate">—</div>
        <div class="sub-value" id="best-winrate-trades">— trades</div>
      </div>
      <div class="card">
        <div class="card-title">📊 Strongest Signal</div>
        <div class="big-value neutral" id="strongest-correlation">—</div>
        <div class="sub-value" id="strongest-indicator">—</div>
      </div>
      <div class="card">
        <div class="card-title">📅 Data Period</div>
        <div class="big-value neutral" id="data-days">—</div>
        <div class="sub-value" id="data-range">days</div>
      </div>
    </div>

    <!-- Strategy Performance -->
    <div class="grid-2">
      <div class="card">
        <div class="card-title">📈 Strategy Performance</div>
        <div id="strategies-container">
          <!-- Strategies loaded dynamically -->
        </div>
      </div>

      <div class="card">
        <div class="card-title">🔗 Indicator Correlations</div>
        <table class="correlation-table">
          <thead>
            <tr>
              <th>Indicator</th>
              <th>1-Day</th>
              <th>3-Day</th>
              <th>7-Day</th>
              <th>Strength</th>
            </tr>
          </thead>
          <tbody id="correlations-body">
            <!-- Correlations loaded dynamically -->
          </tbody>
        </table>
      </div>
    </div>

    <!-- Fear & Greed Deep Dive -->
    <div class="card">
      <div class="card-title">😱 Fear & Greed Contrarian Strategy (Our Best Performer)</div>
      
      <div class="current-signal">
        <div class="signal-indicator" id="fg-signal-indicator">
          <span id="fg-signal-emoji">—</span>
        </div>
        <div class="signal-details">
          <h4 id="fg-signal-title">Loading...</h4>
          <p id="fg-signal-desc">Checking current Fear & Greed value</p>
        </div>
        <div style="margin-left: auto; text-align: right;">
          <div class="big-value" id="current-fg" style="font-size: 32px;">—</div>
          <div class="sub-value">Current F&G</div>
        </div>
      </div>

      <div class="fg-grid">
        <div class="fg-period">
          <div class="fg-period-label">30-Day Returns</div>
          <div class="fg-period-return" id="fg-30d-return">+—%</div>
          <div class="fg-period-winrate" id="fg-30d-winrate">—% win rate</div>
        </div>
        <div class="fg-period">
          <div class="fg-period-label">60-Day Returns</div>
          <div class="fg-period-return" id="fg-60d-return">+—%</div>
          <div class="fg-period-winrate" id="fg-60d-winrate">—% win rate</div>
        </div>
        <div class="fg-period">
          <div class="fg-period-label">90-Day Returns</div>
          <div class="fg-period-return" id="fg-90d-return">+—%</div>
          <div class="fg-period-winrate" id="fg-90d-winrate">—% win rate</div>
        </div>
      </div>

      <div class="insight-box">
        <div class="insight-title">💡 Key Insight</div>
        <p class="insight-text" id="fg-insight">Loading insight...</p>
      </div>
    </div>

    <!-- Equity Curve Chart -->
    <div class="card" style="margin-top: 32px;">
      <div class="card-title">📊 Strategy Comparison</div>
      <div class="chart-container">
        <canvas id="equityChart"></canvas>
      </div>
    </div>

    <!-- Win Rate Chart -->
    <div class="grid-2" style="margin-top: 32px;">
      <div class="card">
        <div class="card-title">🎯 Win Rate Comparison</div>
        <div class="chart-container" style="height: 250px;">
          <canvas id="winrateChart"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-title">📉 Risk/Reward Analysis</div>
        <div class="chart-container" style="height: 250px;">
          <canvas id="riskRewardChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Recommendation -->
    <div class="insight-box" style="margin-top: 32px;">
      <div class="insight-title">🎯 Trading Recommendation</div>
      <p class="insight-text" id="recommendation">Loading recommendation...</p>
    </div>

    <div class="json-toggle">
      <a href="/api/backtest">View raw JSON →</a>
    </div>
  </div>

  <script>
    let equityChart, winrateChart, riskRewardChart;
    
    function getCorrelationClass(value) {
      if (Math.abs(value) >= 0.4) return 'strong';
      if (Math.abs(value) >= 0.2) return 'moderate';
      return 'weak';
    }

    function formatCorrelation(value) {
      if (value === null || value === undefined) return '—';
      return (value >= 0 ? '+' : '') + value.toFixed(3);
    }

    async function fetchBacktestData() {
      try {
        const [backtestRes, fgRes] = await Promise.all([
          fetch('/api/backtest'),
          fetch('/api/backtest/fear-greed')
        ]);
        
        const backtest = await backtestRes.json();
        const fg = await fgRes.json();
        
        // Update timestamp
        document.getElementById('last-updated').textContent = new Date(backtest.lastUpdated).toLocaleString();
        
        // Summary stats
        document.getElementById('best-strategy-name').textContent = backtest.summary.bestStrategy.replace(' Contrarian', '');
        document.getElementById('best-strategy-return').textContent = '+' + backtest.strategies[0].totalReturn + '%';
        document.getElementById('best-winrate').textContent = backtest.summary.bestWinRate + '%';
        document.getElementById('best-winrate-trades').textContent = backtest.strategies[0].trades + ' trades';
        document.getElementById('strongest-correlation').textContent = backtest.summary.strongestCorrelation.split(' ')[0];
        document.getElementById('strongest-indicator').textContent = backtest.topSignals[0].indicator;
        document.getElementById('data-days').textContent = backtest.dataRange.days;
        document.getElementById('data-range').textContent = backtest.dataRange.start + ' to ' + backtest.dataRange.end;
        
        // Strategy cards
        const strategiesHtml = backtest.strategies.map(s => {
          const returnClass = s.totalReturn >= 0 ? 'positive' : 'negative';
          const returnSign = s.totalReturn >= 0 ? '+' : '';
          const progressClass = s.winRate >= 60 ? 'success' : s.winRate >= 40 ? 'warning' : 'danger';
          
          return \`
            <div class="strategy-card">
              <div class="strategy-header">
                <span class="strategy-name">\${s.name}</span>
                <span class="strategy-return \${returnClass}">\${returnSign}\${s.totalReturn}%</span>
              </div>
              <div class="strategy-stats">
                <div class="stat">
                  <div class="stat-value">\${s.trades}</div>
                  <div class="stat-label">Trades</div>
                </div>
                <div class="stat">
                  <div class="stat-value">\${s.winRate}%</div>
                  <div class="stat-label">Win Rate</div>
                </div>
                <div class="stat">
                  <div class="stat-value">\${s.avgWin > 0 ? '+' + s.avgWin + '%' : '—'}</div>
                  <div class="stat-label">Avg Win</div>
                </div>
                <div class="stat">
                  <div class="stat-value">\${s.avgLoss < 0 ? s.avgLoss + '%' : '—'}</div>
                  <div class="stat-label">Avg Loss</div>
                </div>
              </div>
              <div class="progress-bar">
                <div class="progress-fill \${progressClass}" style="width: \${s.winRate}%"></div>
              </div>
            </div>
          \`;
        }).join('');
        document.getElementById('strategies-container').innerHTML = strategiesHtml;
        
        // Correlations table
        const correlationsHtml = backtest.correlations.map(c => \`
          <tr>
            <td>\${c.indicator.replace('_', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}</td>
            <td><span class="correlation-value \${getCorrelationClass(c.nextDayReturn)}">\${formatCorrelation(c.nextDayReturn)}</span></td>
            <td><span class="correlation-value \${getCorrelationClass(c.threeDayReturn)}">\${formatCorrelation(c.threeDayReturn)}</span></td>
            <td><span class="correlation-value \${getCorrelationClass(c.sevenDayReturn)}">\${formatCorrelation(c.sevenDayReturn)}</span></td>
            <td><span class="badge \${c.strength === 'strong' ? 'success' : c.strength === 'moderate' ? 'warning' : 'purple'}">\${c.strength}</span></td>
          </tr>
        \`).join('');
        document.getElementById('correlations-body').innerHTML = correlationsHtml;
        
        // Fear & Greed section
        const fgValue = fg.currentFearGreed;
        const isActive = fgValue < 20;
        
        document.getElementById('current-fg').textContent = fgValue;
        const indicator = document.getElementById('fg-signal-indicator');
        indicator.className = 'signal-indicator ' + (isActive ? 'active' : 'inactive');
        document.getElementById('fg-signal-emoji').textContent = isActive ? '🚨' : '⏸️';
        document.getElementById('fg-signal-title').textContent = isActive ? 'SIGNAL ACTIVE — Buy Zone' : 'Signal Inactive';
        document.getElementById('fg-signal-desc').textContent = isActive 
          ? 'Fear & Greed below 20 — historically bullish entry point'
          : 'Wait for extreme fear (<20) for optimal entry';
        
        // F&G performance
        document.getElementById('fg-30d-return').textContent = '+' + fg.performance['30d'].avgReturn + '%';
        document.getElementById('fg-30d-winrate').textContent = fg.performance['30d'].winRate + '% win rate';
        document.getElementById('fg-60d-return').textContent = '+' + fg.performance['60d'].avgReturn + '%';
        document.getElementById('fg-60d-winrate').textContent = fg.performance['60d'].winRate + '% win rate';
        document.getElementById('fg-90d-return').textContent = '+' + fg.performance['90d'].avgReturn + '%';
        document.getElementById('fg-90d-winrate').textContent = fg.performance['90d'].winRate + '% win rate';
        
        document.getElementById('fg-insight').textContent = fg.insight;
        document.getElementById('recommendation').textContent = backtest.summary.recommendation;
        
        // Charts
        renderCharts(backtest);
        
      } catch (e) {
        console.error('Failed to fetch backtest data:', e);
      }
    }
    
    function renderCharts(backtest) {
      const ctx1 = document.getElementById('equityChart').getContext('2d');
      const ctx2 = document.getElementById('winrateChart').getContext('2d');
      const ctx3 = document.getElementById('riskRewardChart').getContext('2d');
      
      // Simulated equity curves (in real implementation, this would come from actual backtest data)
      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const fgEquity = [100, 102, 105, 108, 112, 115, 114, 118, 121, 123, 125, 127];
      const combinedEquity = [100, 101, 103, 104, 106, 107, 108, 110, 112, 114, 115, 117];
      
      equityChart = new Chart(ctx1, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Fear/Greed Contrarian',
              data: fgEquity,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Combined Signal',
              data: combinedEquity,
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              fill: true,
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#a0a0b8' } }
          },
          scales: {
            x: { grid: { color: '#3a3a52' }, ticks: { color: '#6b6b80' } },
            y: { grid: { color: '#3a3a52' }, ticks: { color: '#6b6b80' } }
          }
        }
      });
      
      // Win rate chart
      const strategies = backtest.strategies.filter(s => s.trades > 0);
      winrateChart = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: strategies.map(s => s.name.split(' ')[0]),
          datasets: [{
            label: 'Win Rate %',
            data: strategies.map(s => s.winRate),
            backgroundColor: strategies.map(s => s.winRate >= 60 ? '#10b981' : s.winRate >= 40 ? '#f59e0b' : '#ef4444'),
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#6b6b80' } },
            y: { grid: { color: '#3a3a52' }, ticks: { color: '#6b6b80' }, max: 100 }
          }
        }
      });
      
      // Risk/Reward scatter
      riskRewardChart = new Chart(ctx3, {
        type: 'scatter',
        data: {
          datasets: strategies.map((s, i) => ({
            label: s.name.split(' ')[0],
            data: [{ x: Math.abs(s.avgLoss) || 2, y: s.avgWin || 2 }],
            backgroundColor: ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444'][i],
            pointRadius: 12
          }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#a0a0b8' } }
          },
          scales: {
            x: { 
              title: { display: true, text: 'Avg Loss %', color: '#6b6b80' },
              grid: { color: '#3a3a52' }, 
              ticks: { color: '#6b6b80' } 
            },
            y: { 
              title: { display: true, text: 'Avg Win %', color: '#6b6b80' },
              grid: { color: '#3a3a52' }, 
              ticks: { color: '#6b6b80' } 
            }
          }
        }
      });
    }
    
    fetchBacktestData();
    setInterval(fetchBacktestData, 300000); // Refresh every 5 minutes
  </script>
</body>
</html>
`;
