// Trade Calls Tracking Service
// Tracks historical trade calls and their performance

export interface TradeCall {
  id: string;
  timestamp: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2?: number;
  takeProfit3?: number;
  confidence: number;
  reasoning: string;
  indicators: string[];
  status: 'open' | 'tp1_hit' | 'tp2_hit' | 'tp3_hit' | 'stopped' | 'closed';
  exitPrice?: number;
  exitTimestamp?: string;
  pnlPercent?: number;
  outcome?: 'win' | 'loss';
}

export interface TradeStats {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  totalPnl: number;
  bestTrade: { symbol: string; pnl: number } | null;
  worstTrade: { symbol: string; pnl: number } | null;
  profitFactor: number;
}

// In-memory trade storage (would be database in production)
// Only trades from Feb 5, 2026 onwards
const trades: TradeCall[] = [
  {
    id: 'trade-001',
    timestamp: '2026-02-06T11:00:00Z',
    symbol: 'SOL',
    direction: 'LONG',
    entry: 80.48,
    stopLoss: 72.00,
    takeProfit1: 87.00,
    takeProfit2: 98.00,
    takeProfit3: 108.00,
    confidence: 70,
    reasoning: 'RSI 18.9 extremely oversold, F&G 6, volume +129%, weekly bottom + daily green',
    indicators: ['Extreme Fear (F&G 6)', 'RSI < 20', 'Volume Surge', 'Weekly Bottom'],
    status: 'tp1_hit',
    exitPrice: 88.12,
    exitTimestamp: '2026-02-07T04:00:00Z',
    pnlPercent: 9.5,
    outcome: 'win'
  },
  {
    id: 'trade-002',
    timestamp: '2026-02-07T06:36:00Z',
    symbol: 'SKR',
    direction: 'LONG',
    entry: 0.0231,
    stopLoss: 0.0231,
    takeProfit1: 0.0283,
    takeProfit2: 0.0360,
    takeProfit3: 0.0450,
    confidence: 55,
    reasoning: 'Pullback after +29% week, high volume (50% mcap), F&G 6 extreme fear. SL moved to breakeven (Feb 8, 16:14 UTC) after +12% move',
    indicators: ['Weekly Momentum', 'Volume/MCap Ratio', 'Extreme Fear'],
    status: 'stopped',
    exitPrice: 0.0231,
    exitTimestamp: '2026-02-09T10:00:00Z',
    pnlPercent: 0,
    outcome: 'win'
  },
  {
    id: 'trade-003',
    timestamp: '2026-02-07T16:32:00Z',
    symbol: 'BCH',
    direction: 'SHORT',
    entry: 523.70,
    stopLoss: 523.70,
    takeProfit1: 461.54,
    takeProfit2: 400.00,
    confidence: 50,
    reasoning: 'MACD bearish cross, Price below 20/50 EMA. SL moved to breakeven after initial profit.',
    indicators: ['MACD Bearish', 'Bearish Trend', 'Below EMA 20/50'],
    status: 'stopped',
    exitPrice: 523.70,
    exitTimestamp: '2026-02-09T14:50:00Z',
    pnlPercent: 0,
    outcome: 'win'
  },
  {
    id: 'trade-004',
    timestamp: '2026-02-09T14:57:00Z',
    symbol: 'ASTER',
    direction: 'LONG',
    entry: 0.60,
    stopLoss: 0.60,
    takeProfit1: 0.74,
    takeProfit2: 0.89,
    confidence: 95,
    reasoning: '95% confidence setup. MACD bullish + Extreme Fear (F&G 14) + RSI bullish divergence + MACD bullish divergence. 5x leverage.',
    indicators: ['MACD Bullish', 'Extreme Fear (F&G 14)', 'RSI Bullish Divergence', 'MACD Bullish Divergence'],
    status: 'open',
  },
  {
    id: 'trade-005',
    timestamp: '2026-02-10T08:47:00Z',
    symbol: 'ZRO',
    direction: 'LONG',
    entry: 1.9375,
    stopLoss: 1.9375,
    takeProfit1: 2.30,
    takeProfit2: 2.71,
    confidence: 80,
    reasoning: 'MACD bullish cross, price above 20/50 EMA, Extreme Fear (F&G 9). 5x leverage.',
    indicators: ['MACD Bullish', 'Bullish Trend', 'Extreme Fear (F&G 9)'],
    status: 'stopped',
    exitPrice: 1.9375,
    exitTimestamp: '2026-02-10T10:55:00Z',
    pnlPercent: 0,
    outcome: 'win'
  }
];

export function getAllTrades(): TradeCall[] {
  return [...trades].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function getOpenTrades(): TradeCall[] {
  return trades.filter(t => t.status === 'open');
}

export function getClosedTrades(): TradeCall[] {
  return trades.filter(t => t.status !== 'open');
}

export function getTradeById(id: string): TradeCall | undefined {
  return trades.find(t => t.id === id);
}

export function addTrade(trade: Omit<TradeCall, 'id'>): TradeCall {
  const newTrade: TradeCall = {
    ...trade,
    id: `trade-${String(trades.length + 1).padStart(3, '0')}`
  };
  trades.push(newTrade);
  return newTrade;
}

export function updateTrade(id: string, updates: Partial<TradeCall>): TradeCall | null {
  const index = trades.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  trades[index] = { ...trades[index], ...updates };
  return trades[index];
}

export function closeTrade(id: string, exitPrice: number, status: TradeCall['status']): TradeCall | null {
  const trade = trades.find(t => t.id === id);
  if (!trade) return null;
  
  const pnlPercent = trade.direction === 'LONG'
    ? ((exitPrice - trade.entry) / trade.entry) * 100
    : ((trade.entry - exitPrice) / trade.entry) * 100;
  
  trade.status = status;
  trade.exitPrice = exitPrice;
  trade.exitTimestamp = new Date().toISOString();
  trade.pnlPercent = Math.round(pnlPercent * 100) / 100;
  trade.outcome = pnlPercent > 0 ? 'win' : 'loss';
  
  return trade;
}

export function getTradeStats(): TradeStats {
  const closed = getClosedTrades();
  const wins = closed.filter(t => t.outcome === 'win');
  const losses = closed.filter(t => t.outcome === 'loss');
  
  const avgWin = wins.length > 0 
    ? wins.reduce((sum, t) => sum + (t.pnlPercent || 0), 0) / wins.length 
    : 0;
  
  const avgLoss = losses.length > 0 
    ? losses.reduce((sum, t) => sum + (t.pnlPercent || 0), 0) / losses.length 
    : 0;
  
  const totalPnl = closed.reduce((sum, t) => sum + (t.pnlPercent || 0), 0);
  
  const sortedByPnl = [...closed].sort((a, b) => (b.pnlPercent || 0) - (a.pnlPercent || 0));
  const best = sortedByPnl[0];
  const worst = sortedByPnl[sortedByPnl.length - 1];
  
  const grossProfit = wins.reduce((sum, t) => sum + (t.pnlPercent || 0), 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.pnlPercent || 0), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  
  return {
    totalTrades: trades.length,
    openTrades: getOpenTrades().length,
    closedTrades: closed.length,
    wins: wins.length,
    losses: losses.length,
    winRate: closed.length > 0 ? Math.round((wins.length / closed.length) * 100) : 0,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    totalPnl: Math.round(totalPnl * 100) / 100,
    bestTrade: best ? { symbol: best.symbol, pnl: best.pnlPercent || 0 } : null,
    worstTrade: worst ? { symbol: worst.symbol, pnl: worst.pnlPercent || 0 } : null,
    profitFactor: Math.round(profitFactor * 100) / 100
  };
}

export function getRecentTrades(limit: number = 10): TradeCall[] {
  return getAllTrades().slice(0, limit);
}
