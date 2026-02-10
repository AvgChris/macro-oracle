// Risk Manager for Autonomous Trading
// Position sizing, correlation checks, and risk limits

export interface RiskParams {
  maxPositionSize: number;      // Max % of portfolio per trade (e.g., 5 = 5%)
  maxTotalExposure: number;     // Max % of portfolio in positions (e.g., 30 = 30%)
  maxCorrelatedExposure: number; // Max exposure to correlated assets
  minConfidence: number;        // Min signal confidence to trade (e.g., 70)
  maxLeverage: number;          // Max leverage allowed
  maxDailyLoss: number;         // Max daily loss % before stopping
}

export interface PositionSize {
  recommended: number;   // USD amount to trade
  leverage: number;      // Recommended leverage
  risk: number;          // Risk amount (position * SL distance)
  reason: string;        // Why this size
}

export interface RiskCheck {
  approved: boolean;
  reason: string;
  adjustments?: {
    reduceSize?: number;
    reduceLeverage?: number;
  };
}

// Asset correlation groups
const CORRELATION_GROUPS: Record<string, string[]> = {
  'majors': ['BTC', 'ETH'],
  'l1': ['SOL', 'AVAX', 'NEAR', 'APT', 'SUI'],
  'l2': ['ARB', 'OP', 'MATIC', 'BASE'],
  'defi': ['AAVE', 'UNI', 'LINK', 'MKR'],
  'meme': ['DOGE', 'SHIB', 'PEPE', 'WIF', 'BONK'],
  'gold': ['XAUT', 'PAXG'],
};

export class RiskManager {
  private params: RiskParams;
  private dailyPnL: number = 0;
  private openPositions: Map<string, { size: number; entry: number; side: string }> = new Map();
  
  constructor(params?: Partial<RiskParams>) {
    this.params = {
      maxPositionSize: 5,         // 5% max per trade
      maxTotalExposure: 30,       // 30% max total
      maxCorrelatedExposure: 15,  // 15% max in correlated assets
      minConfidence: 70,          // 70% min confidence
      maxLeverage: 5,             // 5x max leverage
      maxDailyLoss: 5,            // Stop after 5% daily loss
      ...params
    };
  }
  
  // Calculate position size based on Kelly Criterion + risk limits
  calculatePositionSize(
    portfolio: number,        // Total portfolio value
    confidence: number,       // Signal confidence (0-100)
    entryPrice: number,
    stopLoss: number,
    symbol: string
  ): PositionSize {
    // Check minimum confidence
    if (confidence < this.params.minConfidence) {
      return {
        recommended: 0,
        leverage: 1,
        risk: 0,
        reason: `Confidence ${confidence}% below minimum ${this.params.minConfidence}%`
      };
    }
    
    // Calculate risk per trade (SL distance)
    const slDistance = Math.abs(entryPrice - stopLoss) / entryPrice;
    
    // Kelly Criterion: f* = (bp - q) / b
    // Where b = win/loss ratio, p = win probability, q = 1-p
    const winRate = confidence / 100;
    const avgWin = 0.15;  // Assume 15% avg win (TP distance)
    const avgLoss = slDistance;
    const b = avgWin / avgLoss;
    const kellyFraction = (b * winRate - (1 - winRate)) / b;
    
    // Half-Kelly for safety
    const halfKelly = Math.max(0, kellyFraction / 2);
    
    // Apply position size limit
    const maxSize = portfolio * (this.params.maxPositionSize / 100);
    const kellySize = portfolio * halfKelly;
    
    // Check correlation exposure
    const correlatedExposure = this.getCorrelatedExposure(symbol, portfolio);
    const correlatedLimit = portfolio * (this.params.maxCorrelatedExposure / 100);
    const availableCorrelated = Math.max(0, correlatedLimit - correlatedExposure);
    
    // Check total exposure
    const totalExposure = this.getTotalExposure();
    const totalLimit = portfolio * (this.params.maxTotalExposure / 100);
    const availableTotal = Math.max(0, totalLimit - totalExposure);
    
    // Take minimum of all limits
    const recommended = Math.min(kellySize, maxSize, availableCorrelated, availableTotal);
    
    // Calculate leverage (higher confidence = can use more leverage)
    const baseLeverage = Math.ceil(confidence / 30);  // 70-100% = 3-4x
    const leverage = Math.min(baseLeverage, this.params.maxLeverage);
    
    let reason = '';
    if (recommended === kellySize) reason = 'Kelly criterion';
    else if (recommended === maxSize) reason = 'Position size limit';
    else if (recommended === availableCorrelated) reason = 'Correlation limit';
    else reason = 'Total exposure limit';
    
    return {
      recommended: Math.round(recommended * 100) / 100,
      leverage,
      risk: recommended * slDistance,
      reason
    };
  }
  
  // Check if trade passes all risk checks
  checkTrade(
    symbol: string,
    side: 'long' | 'short',
    size: number,
    leverage: number,
    portfolio: number
  ): RiskCheck {
    // Check daily loss limit
    if (this.dailyPnL < -(portfolio * this.params.maxDailyLoss / 100)) {
      return {
        approved: false,
        reason: `Daily loss limit reached (${this.params.maxDailyLoss}%)`
      };
    }
    
    // Check leverage
    if (leverage > this.params.maxLeverage) {
      return {
        approved: false,
        reason: `Leverage ${leverage}x exceeds max ${this.params.maxLeverage}x`,
        adjustments: { reduceLeverage: this.params.maxLeverage }
      };
    }
    
    // Check position size
    const maxSize = portfolio * (this.params.maxPositionSize / 100);
    if (size > maxSize) {
      return {
        approved: false,
        reason: `Size $${size} exceeds max $${maxSize.toFixed(0)}`,
        adjustments: { reduceSize: maxSize }
      };
    }
    
    // Check for conflicting position
    const existing = this.openPositions.get(symbol);
    if (existing && existing.side !== side) {
      return {
        approved: false,
        reason: `Conflicting ${existing.side} position exists for ${symbol}`
      };
    }
    
    return { approved: true, reason: 'All checks passed' };
  }
  
  // Get exposure in correlated assets
  private getCorrelatedExposure(symbol: string, portfolio: number): number {
    const group = Object.entries(CORRELATION_GROUPS)
      .find(([_, assets]) => assets.includes(symbol))?.[0];
    
    if (!group) return 0;
    
    const correlatedAssets = CORRELATION_GROUPS[group];
    let exposure = 0;
    
    for (const asset of correlatedAssets) {
      const position = this.openPositions.get(asset);
      if (position) {
        exposure += position.size;
      }
    }
    
    return exposure;
  }
  
  // Get total exposure across all positions
  private getTotalExposure(): number {
    let total = 0;
    for (const [_, position] of this.openPositions) {
      total += position.size;
    }
    return total;
  }
  
  // Track position
  addPosition(symbol: string, size: number, entry: number, side: string) {
    this.openPositions.set(symbol, { size, entry, side });
  }
  
  // Remove position
  removePosition(symbol: string) {
    this.openPositions.delete(symbol);
  }
  
  // Update daily PnL
  updatePnL(pnl: number) {
    this.dailyPnL += pnl;
  }
  
  // Reset daily stats (call at midnight)
  resetDaily() {
    this.dailyPnL = 0;
  }
  
  // Get current risk status
  getStatus(portfolio: number) {
    return {
      dailyPnL: this.dailyPnL,
      dailyPnLPercent: (this.dailyPnL / portfolio) * 100,
      totalExposure: this.getTotalExposure(),
      exposurePercent: (this.getTotalExposure() / portfolio) * 100,
      openPositions: this.openPositions.size,
      params: this.params
    };
  }
}

// Export default instance
export const riskManager = new RiskManager();
