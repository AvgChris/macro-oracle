// Autonomous Trading System for Macro Oracle
// Executes trades based on scanner signals with risk management

import { HyperliquidClient, HLOrderResult } from './hyperliquid.js';
import { RiskManager, PositionSize, RiskCheck } from './risk-manager.js';
import { getOpenTrades, TradeCall, addTrade, closeTrade } from '../trades.js';

export interface AutoTraderConfig {
  enabled: boolean;
  dryRun: boolean;              // If true, simulate but don't execute
  portfolio: number;            // Portfolio size in USD
  marginPerTrade: number;       // Fixed margin per trade in USD
  privateKey?: string;          // Wallet private key (for live trading)
  minConfidence: number;        // Minimum confidence to auto-trade
  maxTradesPerDay: number;      // Max trades per day
  cooldownMinutes: number;      // Minutes between trades
  allowedSymbols: string[];     // Symbols allowed for auto-trading
  notifyOnTrade: boolean;       // Send notifications
  tweetTrades: boolean;         // Post trades to Twitter/X
}

export interface TradeResult {
  success: boolean;
  action: 'executed' | 'simulated' | 'rejected' | 'error';
  signal: TradeCall;
  size?: PositionSize;
  riskCheck?: RiskCheck;
  order?: HLOrderResult;
  reason: string;
  timestamp: number;
}

export interface AutoTraderStatus {
  enabled: boolean;
  dryRun: boolean;
  portfolio: number;
  tradesToday: number;
  lastTrade: number | null;
  openPositions: number;
  pendingSignals: number;
  riskStatus: any;
}

class AutoTrader {
  private config: AutoTraderConfig;
  private hlClient: HyperliquidClient;
  private riskManager: RiskManager;
  private tradesToday: number = 0;
  private lastTradeTime: number = 0;
  private tradeLog: TradeResult[] = [];
  
  constructor(config?: Partial<AutoTraderConfig>) {
    this.config = {
      enabled: false,
      dryRun: true,
      portfolio: 1000,
      marginPerTrade: 100,
      minConfidence: 80,
      maxTradesPerDay: 5,
      cooldownMinutes: 30,
      allowedSymbols: ['BTC', 'ETH', 'SOL', 'ASTER', 'ZRO'],
      notifyOnTrade: true,
      tweetTrades: true,
      ...config
    };
    
    this.hlClient = new HyperliquidClient(config?.privateKey, true); // testnet
    this.riskManager = new RiskManager({
      minConfidence: this.config.minConfidence
    });
  }
  
  // Process all active signals
  async processSignals(): Promise<TradeResult[]> {
    if (!this.config.enabled) {
      return [{
        success: false,
        action: 'rejected',
        signal: {} as TradeCall,
        reason: 'Auto-trader is disabled',
        timestamp: Date.now()
      }];
    }
    
    const signals = getOpenTrades();
    const results: TradeResult[] = [];
    
    for (const signal of signals) {
      // Skip if already traded this signal
      if (this.hasTraded(signal.id)) {
        continue;
      }
      
      const result = await this.processSignal(signal);
      results.push(result);
      
      // Stop if we hit daily limit
      if (this.tradesToday >= this.config.maxTradesPerDay) {
        break;
      }
    }
    
    return results;
  }
  
  // Process a single signal
  async processSignal(signal: TradeCall): Promise<TradeResult> {
    const timestamp = Date.now();
    
    // Check if symbol is allowed
    if (!this.config.allowedSymbols.includes(signal.symbol)) {
      return {
        success: false,
        action: 'rejected',
        signal,
        reason: `Symbol ${signal.symbol} not in allowed list`,
        timestamp
      };
    }
    
    // Check confidence
    if (signal.confidence < this.config.minConfidence) {
      return {
        success: false,
        action: 'rejected',
        signal,
        reason: `Confidence ${signal.confidence}% below minimum ${this.config.minConfidence}%`,
        timestamp
      };
    }
    
    // Check cooldown
    const cooldownMs = this.config.cooldownMinutes * 60 * 1000;
    if (timestamp - this.lastTradeTime < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - (timestamp - this.lastTradeTime)) / 60000);
      return {
        success: false,
        action: 'rejected',
        signal,
        reason: `Cooldown: ${remaining} minutes remaining`,
        timestamp
      };
    }
    
    // Check daily limit
    if (this.tradesToday >= this.config.maxTradesPerDay) {
      return {
        success: false,
        action: 'rejected',
        signal,
        reason: `Daily trade limit reached (${this.config.maxTradesPerDay})`,
        timestamp
      };
    }
    
    // Fixed $100 margin per trade — leverage decided by confidence
    const margin = this.config.marginPerTrade;
    const slDistance = Math.abs(signal.entry - signal.stopLoss) / signal.entry;
    
    // Leverage logic: Chicken Buffett decides based on confidence + risk
    // Higher confidence + tighter SL = more leverage
    // 80-85% → 2-3x, 85-90% → 3-5x, 90-95% → 5-7x, 95-100% → 7-10x
    let leverage: number;
    if (signal.confidence >= 95) {
      leverage = slDistance < 0.05 ? 10 : slDistance < 0.10 ? 7 : 5;
    } else if (signal.confidence >= 90) {
      leverage = slDistance < 0.05 ? 7 : slDistance < 0.10 ? 5 : 3;
    } else if (signal.confidence >= 85) {
      leverage = slDistance < 0.05 ? 5 : slDistance < 0.10 ? 3 : 2;
    } else {
      leverage = slDistance < 0.05 ? 3 : 2;
    }
    
    const notionalSize = margin * leverage;
    
    const size: PositionSize = {
      recommended: notionalSize,
      leverage,
      risk: notionalSize * slDistance,
      reason: `$${margin} margin × ${leverage}x leverage (confidence ${signal.confidence}%, SL ${(slDistance * 100).toFixed(1)}%)`
    };
    
    // Simple risk check — skip the old percentage-based system
    const riskCheck: RiskCheck = { approved: true, reason: 'Fixed margin mode' };
    
    // Check daily loss limit
    if (this.riskManager.getStatus(this.config.portfolio).dailyPnL < -(this.config.portfolio * 0.05)) {
      return {
        success: false,
        action: 'rejected',
        signal,
        size,
        riskCheck: { approved: false, reason: 'Daily loss limit (5%) reached' },
        reason: 'Daily loss limit reached',
        timestamp
      };
    }
    
    // Execute or simulate
    if (this.config.dryRun) {
      // Simulate trade
      console.log(`[DRY RUN] Would execute: ${signal.direction} ${signal.symbol}`);
      console.log(`  Size: $${size.recommended} @ ${size.leverage}x`);
      console.log(`  Entry: ${signal.entry}, SL: ${signal.stopLoss}, TP: ${signal.takeProfit1}`);
      
      this.tradesToday++;
      this.lastTradeTime = timestamp;
      this.tradeLog.push({
        success: true,
        action: 'simulated',
        signal,
        size,
        riskCheck,
        reason: 'Dry run simulation',
        timestamp
      });
      
      return {
        success: true,
        action: 'simulated',
        signal,
        size,
        riskCheck,
        reason: 'Trade simulated (dry run mode)',
        timestamp
      };
    }
    
    // Live execution
    try {
      const order = await this.hlClient.placeOrder({
        symbol: signal.symbol,
        side: signal.direction.toLowerCase() as 'long' | 'short',
        size: size.recommended,
        leverage: size.leverage
      });
      
      if (order.success) {
        // Track position
        this.riskManager.addPosition(
          signal.symbol,
          size.recommended,
          signal.entry,
          signal.direction
        );
        
        // Set SL/TP
        await this.hlClient.setStopLoss(signal.symbol, signal.stopLoss);
        await this.hlClient.setTakeProfit(signal.symbol, signal.takeProfit1);
        
        this.tradesToday++;
        this.lastTradeTime = timestamp;
        
        const result: TradeResult = {
          success: true,
          action: 'executed',
          signal,
          size,
          riskCheck,
          order,
          reason: 'Trade executed successfully',
          timestamp
        };
        
        this.tradeLog.push(result);
        
        // Tweet the trade (if Twitter keys are configured on this service)
        // Note: Chicken Buffett's ElizaOS agent handles its own Twitter posting
        // This is a fallback for the Macro Oracle API service
        if (this.config.tweetTrades) {
          this.tweetTrade(result).catch(err => console.log('[TWEET] Skipped (ElizaOS handles tweeting):', err.message));
        }
        
        return result;
      } else {
        return {
          success: false,
          action: 'error',
          signal,
          size,
          riskCheck,
          order,
          reason: order.error || 'Order failed',
          timestamp
        };
      }
    } catch (error: any) {
      return {
        success: false,
        action: 'error',
        signal,
        size,
        reason: error.message || 'Execution error',
        timestamp
      };
    }
  }
  
  // Check if we've already traded a signal
  private hasTraded(signalId: string): boolean {
    return this.tradeLog.some(t => t.signal.id === signalId && t.success);
  }
  
  // Get auto-trader status
  getStatus(): AutoTraderStatus {
    return {
      enabled: this.config.enabled,
      dryRun: this.config.dryRun,
      portfolio: this.config.portfolio,
      tradesToday: this.tradesToday,
      lastTrade: this.lastTradeTime || null,
      openPositions: getOpenTrades().length,
      pendingSignals: getOpenTrades().filter(s => 
        s.confidence >= this.config.minConfidence && 
        this.config.allowedSymbols.includes(s.symbol) &&
        !this.hasTraded(s.id)
      ).length,
      riskStatus: this.riskManager.getStatus(this.config.portfolio)
    };
  }
  
  // Get trade log
  getTradeLog(): TradeResult[] {
    return [...this.tradeLog];
  }
  
  // Tweet a trade entry
  private async tweetTrade(result: TradeResult): Promise<void> {
    const s = result.signal;
    const filled = result.order?.filled;
    const avgPx = filled?.avgPx || s.entry.toString();
    const side = s.direction.toUpperCase();
    const emoji = side === 'LONG' ? '🟢' : '🔴';
    const slPct = (Math.abs(s.entry - s.stopLoss) / s.entry * 100).toFixed(1);
    const tpPct = (Math.abs(s.takeProfit1 - s.entry) / s.entry * 100).toFixed(1);
    
    const tweet = [
      `${emoji} NEW TRADE: $${s.symbol} ${side}`,
      ``,
      `Entry: $${avgPx}`,
      `SL: $${s.stopLoss} (-${slPct}%)`,
      `TP1: $${s.takeProfit1} (+${tpPct}%)`,
      `Margin: $${this.config.marginPerTrade} @ ${result.size?.leverage}x`,
      `Confidence: ${s.confidence}%`,
      ``,
      `📊 Setup: ${s.indicators?.join(', ') || s.reasoning}`,
      ``,
      `🧠 My thesis: ${this.generateThesis(s)}`,
      ``,
      `Powered by @MacroOracle_ai | Testnet`,
      `#crypto #trading #${s.symbol}`
    ].join('\n');
    
    await this.postTweet(tweet);
  }
  
  // Tweet a trade close / outcome
  async tweetTradeOutcome(symbol: string, result: 'tp' | 'sl' | 'breakeven', pnl: number, lesson: string): Promise<void> {
    const emoji = result === 'tp' ? '✅' : result === 'sl' ? '❌' : '➡️';
    const resultText = result === 'tp' ? 'TARGET HIT' : result === 'sl' ? 'STOPPED OUT' : 'BREAKEVEN';
    
    const tweet = [
      `${emoji} TRADE CLOSED: $${symbol} — ${resultText}`,
      ``,
      `P&L: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%`,
      ``,
      `📝 What I learned:`,
      lesson,
      ``,
      `Win rate: ${this.getWinRate()}% | Trades: ${this.tradeLog.filter(t => t.success).length}`,
      ``,
      `Powered by @MacroOracle_ai | Testnet`,
      `#crypto #trading`
    ].join('\n');
    
    await this.postTweet(tweet);
  }
  
  // Generate a thesis from the signal
  private generateThesis(signal: TradeCall): string {
    const indicators = signal.indicators || [];
    const parts: string[] = [];
    
    if (indicators.some(i => i.includes('Fear'))) {
      parts.push('Market fear is extreme — historically a buy zone');
    }
    if (indicators.some(i => i.includes('MACD Bullish'))) {
      parts.push('momentum shifting bullish');
    }
    if (indicators.some(i => i.includes('MACD Bearish'))) {
      parts.push('momentum shifting bearish');
    }
    if (indicators.some(i => i.includes('RSI Bullish'))) {
      parts.push('RSI showing hidden strength');
    }
    if (indicators.some(i => i.includes('Divergence'))) {
      parts.push('price-indicator divergence detected');
    }
    
    return parts.length > 0 ? parts.join(', ') + '.' : signal.reasoning.slice(0, 200);
  }
  
  // Get win rate
  private getWinRate(): string {
    const closed = this.tradeLog.filter(t => t.success && t.action === 'executed');
    if (closed.length === 0) return '0';
    // For now return based on trade log — will be refined as trades close
    return ((closed.length / Math.max(closed.length, 1)) * 100).toFixed(0);
  }
  
  // Post to Twitter/X
  private async postTweet(text: string): Promise<void> {
    try {
      const { postTweet: tweet } = await import('../twitter.js');
      const result = await tweet(text);
      if (result.success) {
        console.log('[TWEET] Posted:', text.slice(0, 80) + '...');
      } else {
        console.log('[TWEET] Not posted (no keys?):', result.error);
        console.log('[TWEET] Content:', text);
      }
    } catch (error: any) {
      console.error('[TWEET] Failed:', error.message);
    }
  }
  
  // Update configuration
  updateConfig(updates: Partial<AutoTraderConfig>) {
    this.config = { ...this.config, ...updates };
    
    if (updates.privateKey) {
      this.hlClient = new HyperliquidClient(updates.privateKey, true); // testnet
    }
    
    if (updates.minConfidence) {
      this.riskManager = new RiskManager({
        minConfidence: updates.minConfidence
      });
    }
  }
  
  // Enable/disable
  enable() { this.config.enabled = true; }
  disable() { this.config.enabled = false; }
  
  // Toggle dry run
  setDryRun(dryRun: boolean) { this.config.dryRun = dryRun; }
  
  // Reset daily stats
  resetDaily() {
    this.tradesToday = 0;
    this.riskManager.resetDaily();
  }
}

// Export singleton — reads config from env
const hlKey = process.env.HL_PRIVATE_KEY;
export const autoTrader = new AutoTrader({
  enabled: !!hlKey,           // Enable if key is present
  dryRun: !hlKey,             // Only dry-run if no key
  portfolio: 1000,
  marginPerTrade: 100,        // Fixed $100 margin per trade
  privateKey: hlKey,
  minConfidence: 80,
  maxTradesPerDay: 5,
  cooldownMinutes: 30,
  allowedSymbols: ['BTC', 'ETH', 'SOL', 'ASTER', 'ZRO', 'XAUT', 'PAXG'],
  notifyOnTrade: true,
  tweetTrades: true
});

// Export class for custom instances
export { AutoTrader };
