// Core types for Macro Oracle

export type MacroEventType = 
  | 'fed_rate_decision'
  | 'fed_minutes'
  | 'fed_speech'
  | 'cpi'
  | 'ppi'
  | 'nfp'  // Non-farm payrolls
  | 'unemployment'
  | 'gdp'
  | 'pce'  // Personal consumption expenditures
  | 'retail_sales'
  | 'ism_manufacturing'
  | 'ism_services'
  | 'housing'
  | 'consumer_confidence'
  | 'geopolitical'
  | 'other';

export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';

export type MarketSentiment = 'risk_on' | 'risk_off' | 'neutral' | 'uncertain';

export interface MacroEvent {
  id: string;
  type: MacroEventType;
  name: string;
  timestamp: number;  // Unix ms
  impact: ImpactLevel;
  actual?: number | string;
  forecast?: number | string;
  previous?: number | string;
  description?: string;
  source: string;
}

export interface MarketSnapshot {
  timestamp: number;
  dxy: number;          // Dollar index
  us10y: number;        // 10-year Treasury yield
  spx: number;          // S&P 500
  vix: number;          // Volatility index
  gold: number;
  btc: number;
  eth: number;
  totalCryptoMcap: number;
}

export interface CorrelationData {
  pair: string;         // e.g., "DXY-BTC"
  correlation: number;  // -1 to 1
  period: string;       // e.g., "7d", "30d"
  sampleSize: number;
  updatedAt: number;
}

export interface MacroSignal {
  id: string;
  timestamp: number;
  event?: MacroEvent;
  sentiment: MarketSentiment;
  cryptoImpact: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: number;  // 0-100
    magnitude: 'small' | 'medium' | 'large';
    reasoning: string;
  };
  affectedAssets: string[];
  historicalContext?: {
    similarEvents: number;
    avgBtcMove: number;
    avgEthMove: number;
    winRate: number;  // % of times direction was correct
  };
}

export interface EconomicCalendarEntry {
  id: string;
  date: string;         // YYYY-MM-DD
  time: string;         // HH:MM UTC
  name: string;
  type: MacroEventType;
  impact: ImpactLevel;
  country: string;
  forecast?: string;
  previous?: string;
}

export interface OracleStatus {
  online: boolean;
  lastUpdate: number;
  eventsTracked: number;
  signalsGenerated: number;
  uptime: number;
  version: string;
}
