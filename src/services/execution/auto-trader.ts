// Autonomous Trading System for Macro Oracle
// Executes trades based on scanner signals with risk management

import { HyperliquidClient, HLOrderResult } from './hyperliquid.js';
import { RiskManager, PositionSize, RiskCheck } from './risk-manager.js';
import { getOpenTrades, TradeCall, addTrade, closeTrade } from '../trades.js';

export interface AutoTraderConfig {
  enabled: boolean;
  dryRun: boolean;              // If true, simulate but don't execute
  portfolio: number;            // Portfolio size in USD
  privateKey?: string;          // Wallet private key (for live trading)
  minConfidence: number;        // Minimum confidence to auto-trade
  maxTradesPerDay: number;      // Max trades per day
  cooldownMinutes: number;      // Minutes between trades
  allowedSymbols: string[];     // Symbols allowed for auto-trading
  notifyOnTrade: boolean;       // Send notifications
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
      minConfidence: 80,
      maxTradesPerDay: 5,
      cooldownMinutes: 30,
      allowedSymbols: ['BTC', 'ETH', 'SOL', 'ASTER', 'ZRO'],
      notifyOnTrade: true,
      ...config
    };
    
    this.hlClient = new HyperliquidClient(config?.privateKey);
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
    
    // Calculate position size
    const size = this.riskManager.calculatePositionSize(
      this.config.portfolio,
      signal.confidence,
      signal.entry,
      signal.stopLoss,
      signal.symbol
    );
    
    if (size.recommended === 0) {
      return {
        success: false,
        action: 'rejected',
        signal,
        size,
        reason: size.reason,
        timestamp
      };
    }
    
    // Run risk checks
    const riskCheck = this.riskManager.checkTrade(
      signal.symbol,
      signal.direction.toLowerCase() as 'long' | 'short',
      size.recommended,
      size.leverage,
      this.config.portfolio
    );
    
    if (!riskCheck.approved) {
      // Try with adjustments
      if (riskCheck.adjustments) {
        const adjSize = riskCheck.adjustments.reduceSize || size.recommended;
        const adjLev = riskCheck.adjustments.reduceLeverage || size.leverage;
        
        const retry = this.riskManager.checkTrade(
          signal.symbol,
          signal.direction.toLowerCase() as 'long' | 'short',
          adjSize,
          adjLev,
          this.config.portfolio
        );
        
        if (!retry.approved) {
          return {
            success: false,
            action: 'rejected',
            signal,
            size,
            riskCheck,
            reason: riskCheck.reason,
            timestamp
          };
        }
        
        size.recommended = adjSize;
        size.leverage = adjLev;
      } else {
        return {
          success: false,
          action: 'rejected',
          signal,
          size,
          riskCheck,
          reason: riskCheck.reason,
          timestamp
        };
      }
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
  
  // Update configuration
  updateConfig(updates: Partial<AutoTraderConfig>) {
    this.config = { ...this.config, ...updates };
    
    if (updates.privateKey) {
      this.hlClient = new HyperliquidClient(updates.privateKey);
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

// Export singleton
export const autoTrader = new AutoTrader({
  enabled: false,
  dryRun: true,
  portfolio: 1000,
  minConfidence: 80,
  allowedSymbols: ['BTC', 'ETH', 'SOL', 'ASTER', 'ZRO', 'XAUT', 'PAXG']
});

// Export class for custom instances
export { AutoTrader };
