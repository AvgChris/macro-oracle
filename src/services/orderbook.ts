// Orderbook Analysis Service
// Correlates CEX orderbook depth with macro indicators for powerful signals

import axios from 'axios';
import { fetchCurrentFearGreed } from './historical.js';
import { fetchVix } from './yahoo.js';

interface OrderbookLevel {
  price: number;
  quantity: number;
  total: number;  // cumulative
}

interface OrderbookSnapshot {
  symbol: string;
  timestamp: number;
  midPrice: number;
  spread: number;
  spreadBps: number;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  bidDepth: number;    // Total bid volume in USD
  askDepth: number;    // Total ask volume in USD
  imbalance: number;   // -1 to 1 (negative = more sells, positive = more buys)
  imbalancePercent: number;
  walls: {
    bid: { price: number; size: number; distancePercent: number } | null;
    ask: { price: number; size: number; distancePercent: number } | null;
  };
}

interface MacroOrderbookSignal {
  symbol: string;
  timestamp: number;
  
  // Orderbook metrics
  orderbook: {
    midPrice: number;
    spread: number;
    spreadBps: number;
    bidDepth: number;
    askDepth: number;
    imbalance: number;
    imbalancePercent: number;
    bidWall: { price: number; size: number; distancePercent: number } | null;
    askWall: { price: number; size: number; distancePercent: number } | null;
  };
  
  // Macro context
  macro: {
    fearGreed: number;
    fearGreedSignal: 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';
    vix: number | null;
    vixSignal: 'low' | 'normal' | 'elevated' | 'high' | 'extreme' | null;
  };
  
  // Combined signal
  signal: {
    direction: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
    confidence: number;
    reasoning: string[];
    actionable: boolean;
  };
  
  // Support/Resistance
  levels: {
    nearestSupport: number | null;
    nearestResistance: number | null;
    supportStrength: 'weak' | 'moderate' | 'strong' | null;
    resistanceStrength: 'weak' | 'moderate' | 'strong' | null;
  };
}

const BINANCE_API = 'https://api.binance.com/api/v3';

// Supported symbols
const SYMBOLS: Record<string, string> = {
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
  SOL: 'SOLUSDT',
};

/**
 * Fetch orderbook from Binance
 */
async function fetchBinanceOrderbook(symbol: string, limit: number = 100): Promise<{
  bids: [string, string][];
  asks: [string, string][];
  lastUpdateId: number;
} | null> {
  try {
    const binanceSymbol = SYMBOLS[symbol.toUpperCase()] || `${symbol.toUpperCase()}USDT`;
    const response = await axios.get(`${BINANCE_API}/depth`, {
      params: { symbol: binanceSymbol, limit },
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch orderbook for ${symbol}:`, error);
    return null;
  }
}

/**
 * Calculate orderbook metrics
 */
function analyzeOrderbook(
  bids: [string, string][],
  asks: [string, string][],
  symbol: string
): OrderbookSnapshot {
  const timestamp = Date.now();
  
  // Parse bids and asks
  const parsedBids: OrderbookLevel[] = [];
  const parsedAsks: OrderbookLevel[] = [];
  let bidTotal = 0;
  let askTotal = 0;
  
  for (const [price, qty] of bids) {
    const p = parseFloat(price);
    const q = parseFloat(qty);
    bidTotal += q;
    parsedBids.push({ price: p, quantity: q, total: bidTotal });
  }
  
  for (const [price, qty] of asks) {
    const p = parseFloat(price);
    const q = parseFloat(qty);
    askTotal += q;
    parsedAsks.push({ price: p, quantity: q, total: askTotal });
  }
  
  const bestBid = parsedBids[0]?.price || 0;
  const bestAsk = parsedAsks[0]?.price || 0;
  const midPrice = (bestBid + bestAsk) / 2;
  const spread = bestAsk - bestBid;
  const spreadBps = (spread / midPrice) * 10000;
  
  // Calculate depth in USD (approximate)
  const bidDepth = parsedBids.reduce((sum, b) => sum + b.price * b.quantity, 0);
  const askDepth = parsedAsks.reduce((sum, a) => sum + a.price * a.quantity, 0);
  
  // Imbalance: positive = more bids (bullish), negative = more asks (bearish)
  const totalDepth = bidDepth + askDepth;
  const imbalance = totalDepth > 0 ? (bidDepth - askDepth) / totalDepth : 0;
  const imbalancePercent = imbalance * 100;
  
  // Find walls (large orders > 2x average)
  const avgBidSize = bidTotal / parsedBids.length;
  const avgAskSize = askTotal / parsedAsks.length;
  
  let bidWall: OrderbookSnapshot['walls']['bid'] = null;
  let askWall: OrderbookSnapshot['walls']['ask'] = null;
  
  for (const bid of parsedBids) {
    if (bid.quantity > avgBidSize * 3) {
      bidWall = {
        price: bid.price,
        size: bid.quantity * bid.price,
        distancePercent: ((midPrice - bid.price) / midPrice) * 100
      };
      break;
    }
  }
  
  for (const ask of parsedAsks) {
    if (ask.quantity > avgAskSize * 3) {
      askWall = {
        price: ask.price,
        size: ask.quantity * ask.price,
        distancePercent: ((ask.price - midPrice) / midPrice) * 100
      };
      break;
    }
  }
  
  return {
    symbol,
    timestamp,
    midPrice,
    spread,
    spreadBps,
    bids: parsedBids.slice(0, 20),
    asks: parsedAsks.slice(0, 20),
    bidDepth,
    askDepth,
    imbalance,
    imbalancePercent,
    walls: { bid: bidWall, ask: askWall }
  };
}

/**
 * Combine orderbook analysis with macro indicators
 */
export async function getMacroOrderbookSignal(symbol: string = 'BTC'): Promise<MacroOrderbookSignal> {
  // Fetch orderbook
  const rawOrderbook = await fetchBinanceOrderbook(symbol, 100);
  if (!rawOrderbook) {
    throw new Error(`Failed to fetch orderbook for ${symbol}`);
  }
  
  const orderbook = analyzeOrderbook(rawOrderbook.bids, rawOrderbook.asks, symbol);
  
  // Fetch macro indicators
  const fearGreed = await fetchCurrentFearGreed();
  let vix: number | null = null;
  
  try {
    const vixData = await fetchVix();
    vix = vixData?.value || null;
  } catch (e) {
    // VIX fetch failed
  }
  
  // Classify macro signals
  let fearGreedSignal: MacroOrderbookSignal['macro']['fearGreedSignal'] = 'neutral';
  if (fearGreed.value < 20) fearGreedSignal = 'extreme_fear';
  else if (fearGreed.value < 40) fearGreedSignal = 'fear';
  else if (fearGreed.value > 80) fearGreedSignal = 'extreme_greed';
  else if (fearGreed.value > 60) fearGreedSignal = 'greed';
  
  let vixSignal: MacroOrderbookSignal['macro']['vixSignal'] = null;
  if (vix !== null) {
    if (vix < 15) vixSignal = 'low';
    else if (vix < 20) vixSignal = 'normal';
    else if (vix < 25) vixSignal = 'elevated';
    else if (vix < 35) vixSignal = 'high';
    else vixSignal = 'extreme';
  }
  
  // Generate combined signal
  let signalScore = 0;
  const reasoning: string[] = [];
  
  // Orderbook imbalance contribution
  if (orderbook.imbalance > 0.2) {
    signalScore += 2;
    reasoning.push(`Strong bid imbalance (${orderbook.imbalancePercent.toFixed(1)}% more bids)`);
  } else if (orderbook.imbalance > 0.1) {
    signalScore += 1;
    reasoning.push(`Moderate bid imbalance (${orderbook.imbalancePercent.toFixed(1)}%)`);
  } else if (orderbook.imbalance < -0.2) {
    signalScore -= 2;
    reasoning.push(`Strong ask imbalance (${Math.abs(orderbook.imbalancePercent).toFixed(1)}% more asks)`);
  } else if (orderbook.imbalance < -0.1) {
    signalScore -= 1;
    reasoning.push(`Moderate ask imbalance (${Math.abs(orderbook.imbalancePercent).toFixed(1)}%)`);
  }
  
  // Fear & Greed contribution (contrarian for extremes)
  if (fearGreedSignal === 'extreme_fear') {
    signalScore += 2;  // Contrarian bullish
    reasoning.push(`Extreme fear (F&G: ${fearGreed.value}) — historically bullish`);
  } else if (fearGreedSignal === 'fear') {
    signalScore += 1;
    reasoning.push(`Fear territory (F&G: ${fearGreed.value}) — caution but opportunity`);
  } else if (fearGreedSignal === 'extreme_greed') {
    signalScore -= 2;  // Contrarian bearish
    reasoning.push(`Extreme greed (F&G: ${fearGreed.value}) — historically bearish`);
  } else if (fearGreedSignal === 'greed') {
    signalScore -= 1;
    reasoning.push(`Greed territory (F&G: ${fearGreed.value}) — potential top`);
  }
  
  // VIX contribution
  if (vixSignal === 'extreme' || vixSignal === 'high') {
    // High VIX during fear = potential bottom (contrarian)
    if (fearGreedSignal === 'extreme_fear' || fearGreedSignal === 'fear') {
      signalScore += 1;
      reasoning.push(`High VIX (${vix?.toFixed(1)}) + fear = capitulation signal`);
    } else {
      signalScore -= 1;
      reasoning.push(`High VIX (${vix?.toFixed(1)}) — elevated risk`);
    }
  }
  
  // Wall analysis
  if (orderbook.walls.bid && orderbook.walls.bid.distancePercent < 2) {
    signalScore += 1;
    reasoning.push(`Strong bid wall at $${orderbook.walls.bid.price.toFixed(0)} (${orderbook.walls.bid.distancePercent.toFixed(1)}% below)`);
  }
  if (orderbook.walls.ask && orderbook.walls.ask.distancePercent < 2) {
    signalScore -= 1;
    reasoning.push(`Strong ask wall at $${orderbook.walls.ask.price.toFixed(0)} (${orderbook.walls.ask.distancePercent.toFixed(1)}% above)`);
  }
  
  // Convert score to signal
  let direction: MacroOrderbookSignal['signal']['direction'] = 'neutral';
  if (signalScore >= 3) direction = 'strong_buy';
  else if (signalScore >= 1) direction = 'buy';
  else if (signalScore <= -3) direction = 'strong_sell';
  else if (signalScore <= -1) direction = 'sell';
  
  const confidence = Math.min(90, 50 + Math.abs(signalScore) * 10);
  const actionable = Math.abs(signalScore) >= 2;
  
  // Support/Resistance levels
  let nearestSupport: number | null = null;
  let nearestResistance: number | null = null;
  let supportStrength: 'weak' | 'moderate' | 'strong' | null = null;
  let resistanceStrength: 'weak' | 'moderate' | 'strong' | null = null;
  
  if (orderbook.walls.bid) {
    nearestSupport = orderbook.walls.bid.price;
    supportStrength = orderbook.walls.bid.size > 1000000 ? 'strong' : 
                     orderbook.walls.bid.size > 500000 ? 'moderate' : 'weak';
  }
  if (orderbook.walls.ask) {
    nearestResistance = orderbook.walls.ask.price;
    resistanceStrength = orderbook.walls.ask.size > 1000000 ? 'strong' :
                        orderbook.walls.ask.size > 500000 ? 'moderate' : 'weak';
  }
  
  return {
    symbol,
    timestamp: Date.now(),
    orderbook: {
      midPrice: orderbook.midPrice,
      spread: orderbook.spread,
      spreadBps: orderbook.spreadBps,
      bidDepth: orderbook.bidDepth,
      askDepth: orderbook.askDepth,
      imbalance: orderbook.imbalance,
      imbalancePercent: orderbook.imbalancePercent,
      bidWall: orderbook.walls.bid,
      askWall: orderbook.walls.ask
    },
    macro: {
      fearGreed: fearGreed.value,
      fearGreedSignal,
      vix,
      vixSignal
    },
    signal: {
      direction,
      confidence,
      reasoning,
      actionable
    },
    levels: {
      nearestSupport,
      nearestResistance,
      supportStrength,
      resistanceStrength
    }
  };
}

/**
 * Get orderbook snapshot for multiple assets
 */
export async function getMultiAssetOrderbook(): Promise<{
  timestamp: number;
  assets: Record<string, OrderbookSnapshot>;
  summary: {
    overallImbalance: number;
    mostBullish: string;
    mostBearish: string;
  };
}> {
  const symbols = ['BTC', 'ETH', 'SOL'];
  const assets: Record<string, OrderbookSnapshot> = {};
  
  for (const symbol of symbols) {
    const raw = await fetchBinanceOrderbook(symbol, 50);
    if (raw) {
      assets[symbol] = analyzeOrderbook(raw.bids, raw.asks, symbol);
    }
  }
  
  // Calculate overall imbalance
  let totalBidDepth = 0;
  let totalAskDepth = 0;
  let mostBullish = '';
  let mostBearish = '';
  let maxImbalance = -Infinity;
  let minImbalance = Infinity;
  
  for (const [symbol, data] of Object.entries(assets)) {
    totalBidDepth += data.bidDepth;
    totalAskDepth += data.askDepth;
    if (data.imbalance > maxImbalance) {
      maxImbalance = data.imbalance;
      mostBullish = symbol;
    }
    if (data.imbalance < minImbalance) {
      minImbalance = data.imbalance;
      mostBearish = symbol;
    }
  }
  
  const overallImbalance = totalBidDepth + totalAskDepth > 0 
    ? (totalBidDepth - totalAskDepth) / (totalBidDepth + totalAskDepth)
    : 0;
  
  return {
    timestamp: Date.now(),
    assets,
    summary: {
      overallImbalance,
      mostBullish,
      mostBearish
    }
  };
}

/**
 * Get simple orderbook imbalance for quick checks
 */
export async function getOrderbookImbalance(symbol: string = 'BTC'): Promise<{
  symbol: string;
  imbalance: number;
  imbalancePercent: number;
  bidDepth: number;
  askDepth: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  midPrice: number;
  timestamp: number;
}> {
  const raw = await fetchBinanceOrderbook(symbol, 100);
  if (!raw) {
    throw new Error(`Failed to fetch orderbook for ${symbol}`);
  }
  
  const analysis = analyzeOrderbook(raw.bids, raw.asks, symbol);
  
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (analysis.imbalance > 0.15) signal = 'bullish';
  else if (analysis.imbalance < -0.15) signal = 'bearish';
  
  return {
    symbol,
    imbalance: analysis.imbalance,
    imbalancePercent: analysis.imbalancePercent,
    bidDepth: analysis.bidDepth,
    askDepth: analysis.askDepth,
    signal,
    midPrice: analysis.midPrice,
    timestamp: analysis.timestamp
  };
}
