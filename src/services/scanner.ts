// Live Trade Scanner Service
// Self-contained OKX market scanner with technical analysis
// Ported from chris-trading-bot scanner logic

import axios from 'axios';

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════

export interface ScannerSignal {
  symbol: string;
  side: 'LONG' | 'SHORT';
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  confidence: number;
  indicators: string[];
  reasoning: string;
  timestamp: number;
}

export interface FearGreedData {
  value: number;
  classification: string;
  timestamp: number;
}

interface FGSignal {
  signal: 'bullish' | 'bearish' | 'neutral';
  strength: number;
}

interface DivergenceResult {
  rsiDivergence: 'bullish' | 'bearish' | null;
  macdDivergence: 'bullish' | 'bearish' | null;
  strength: number;
}

interface Indicators {
  rsi: number;
  macd: { macd: number; signal: number; histogram: number };
  volumeMA: number;
  volumeRatio: number;
  ema20: number;
  ema50: number;
  ema200: number;
}

interface CoinInfo {
  symbol: string;
  price: number;
  volume24h: number;
}

export interface ScanResult {
  timestamp: number;
  fearGreed: FearGreedData;
  scanned: number;
  signalCount: number;
  signals: ScannerSignal[];
  usage: {
    description: string;
    refreshRate: string;
    riskWarning: string;
    indicators: string[];
  };
}

// ═══════════════════════════════════════
// Fear & Greed Index
// ═══════════════════════════════════════

let cachedFG: FearGreedData | null = null;
let lastFGFetch = 0;
const FG_CACHE_MS = 3600000; // 1 hour

async function getFearGreedIndex(): Promise<FearGreedData> {
  const now = Date.now();
  if (cachedFG && (now - lastFGFetch) < FG_CACHE_MS) {
    return cachedFG;
  }

  try {
    const { data } = await axios.get('https://api.alternative.me/fng/?limit=1', {
      timeout: 10000,
      headers: { 'User-Agent': 'MacroOracle/2.0' }
    });

    if (data.data && data.data[0]) {
      cachedFG = {
        value: parseInt(data.data[0].value),
        classification: data.data[0].value_classification,
        timestamp: parseInt(data.data[0].timestamp) * 1000
      };
      lastFGFetch = now;
      return cachedFG;
    }
  } catch (err: any) {
    console.error('Error fetching Fear & Greed:', err.message);
  }

  return { value: 50, classification: 'Neutral', timestamp: now };
}

function getFearGreedSignal(value: number): FGSignal {
  if (value <= 10) return { signal: 'bullish', strength: 0.3 };
  if (value <= 25) return { signal: 'bullish', strength: 0.2 };
  if (value <= 40) return { signal: 'bullish', strength: 0.1 };
  if (value >= 90) return { signal: 'bearish', strength: 0.3 };
  if (value >= 75) return { signal: 'bearish', strength: 0.2 };
  if (value >= 60) return { signal: 'bearish', strength: 0.1 };
  return { signal: 'neutral', strength: 0 };
}

// ═══════════════════════════════════════
// OKX API
// ═══════════════════════════════════════

const STABLECOINS = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDD', 'USDP'];

async function fetchOKXTopCoins(limit: number): Promise<CoinInfo[]> {
  try {
    const { data } = await axios.get('https://www.okx.com/api/v5/market/tickers', {
      params: { instType: 'SPOT' },
      timeout: 15000,
      headers: { 'User-Agent': 'MacroOracle/2.0' }
    });

    if (data.code !== '0') {
      console.error('OKX tickers error:', data.msg);
      return [];
    }

    return data.data
      .filter((t: any) => t.instId.endsWith('-USDT'))
      .map((t: any) => ({
        symbol: t.instId.replace('-USDT', ''),
        price: parseFloat(t.last),
        volume24h: parseFloat(t.volCcy24h)
      }))
      .filter((coin: CoinInfo) => !STABLECOINS.includes(coin.symbol))
      .sort((a: CoinInfo, b: CoinInfo) => b.volume24h - a.volume24h)
      .slice(0, limit);
  } catch (err: any) {
    console.error('OKX tickers fetch error:', err.message);
    return [];
  }
}

interface CandleData {
  prices: number[];
  volumes: number[];
}

async function fetchOKXCandles(symbol: string, days: number = 90, bar: string = '1D'): Promise<CandleData> {
  const instId = `${symbol}-USDT`;
  const limit = Math.min(days, 100);

  try {
    const { data } = await axios.get('https://www.okx.com/api/v5/market/candles', {
      params: { instId, bar, limit },
      timeout: 10000,
      headers: { 'User-Agent': 'MacroOracle/2.0' }
    });

    if (data.code !== '0') {
      console.error(`OKX API error for ${symbol}:`, data.msg);
      return { prices: [], volumes: [] };
    }

    // OKX returns newest first — reverse for oldest first
    // Format: [ts, o, h, l, c, vol, volCcy, volCcyQuote, confirm]
    const candles = data.data.reverse();
    const prices = candles.map((c: any) => parseFloat(c[4]));  // close
    const volumes = candles.map((c: any) => parseFloat(c[5])); // volume

    return { prices, volumes };
  } catch (err: any) {
    console.error(`OKX fetch error for ${symbol}:`, err.message);
    return { prices: [], volumes: [] };
  }
}

// ═══════════════════════════════════════
// Technical Indicators
// ═══════════════════════════════════════

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  const changes = prices.slice(1).map((p, i) => p - prices[i]);
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? -c : 0);
  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMACD(prices: number[], fast: number = 3, slow: number = 10, signalPeriod: number = 16) {
  // Calculate full MACD series for proper signal line
  const macdSeries: number[] = [];
  for (let i = slow; i <= prices.length; i++) {
    const slice = prices.slice(0, i);
    const emaFast = calculateEMA(slice, fast);
    const emaSlow = calculateEMA(slice, slow);
    macdSeries.push(emaFast - emaSlow);
  }

  const macdLine = macdSeries[macdSeries.length - 1] || 0;

  // Signal line is EMA of MACD values
  let signalLine = macdLine;
  if (macdSeries.length >= signalPeriod) {
    const k = 2 / (signalPeriod + 1);
    signalLine = macdSeries.slice(0, signalPeriod).reduce((a, b) => a + b, 0) / signalPeriod;
    for (let i = signalPeriod; i < macdSeries.length; i++) {
      signalLine = macdSeries[i] * k + signalLine * (1 - k);
    }
  }

  return {
    macd: macdLine,
    signal: signalLine,
    histogram: macdLine - signalLine
  };
}

function calculateIndicators(prices: number[], volumes?: number[]): Indicators {
  const rsi = calculateRSI(prices, 14);
  const macd = calculateMACD(prices, 3, 10, 16);
  const ema20 = calculateEMA(prices, 20);
  const ema50 = calculateEMA(prices, 50);
  const ema200 = calculateEMA(prices, 200);

  let volumeMA = 0;
  let volumeRatio = 1;
  if (volumes && volumes.length > 0) {
    const recentVols = volumes.slice(-20);
    volumeMA = recentVols.reduce((a, b) => a + b, 0) / recentVols.length;
    volumeRatio = volumeMA > 0 ? volumes[volumes.length - 1] / volumeMA : 1;
  }

  return { rsi, macd, volumeMA, volumeRatio, ema20, ema50, ema200 };
}

// ═══════════════════════════════════════
// Divergence Detection
// ═══════════════════════════════════════

function calculateRSISeries(prices: number[], period: number = 14): number[] {
  const series: number[] = [];
  for (let i = period; i < prices.length; i++) {
    const slice = prices.slice(i - period, i + 1);
    series.push(calculateSingleRSI(slice, period));
  }
  return series;
}

function calculateSingleRSI(prices: number[], period: number): number {
  if (prices.length < period + 1) return 50;
  const changes = prices.slice(1).map((p, i) => p - prices[i]);
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? -c : 0);
  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMACDSeries(prices: number[], fast: number = 3, slow: number = 10): number[] {
  const series: number[] = [];
  for (let i = slow; i < prices.length; i++) {
    const slice = prices.slice(0, i + 1);
    const emaFast = calculateEMA(slice, fast);
    const emaSlow = calculateEMA(slice, slow);
    series.push(emaFast - emaSlow);
  }
  return series;
}

function findLocalExtremes(data: number[], type: 'low' | 'high'): number[] {
  const extremes: number[] = [];
  const lookback = 3;
  for (let i = lookback; i < data.length - lookback; i++) {
    let isExtreme = true;
    for (let j = 1; j <= lookback; j++) {
      if (type === 'low') {
        if (data[i] > data[i - j] || data[i] > data[i + j]) { isExtreme = false; break; }
      } else {
        if (data[i] < data[i - j] || data[i] < data[i + j]) { isExtreme = false; break; }
      }
    }
    if (isExtreme) extremes.push(i);
  }
  return extremes;
}

function detectDivergences(prices: number[], rsiValues: number[], macdValues: number[]): DivergenceResult {
  const result: DivergenceResult = { rsiDivergence: null, macdDivergence: null, strength: 0 };
  if (prices.length < 20) return result;

  const recentPrices = prices.slice(-20);
  const recentRSI = rsiValues.slice(-20);
  const recentMACD = macdValues.slice(-20);
  const priceLows = findLocalExtremes(recentPrices, 'low');
  const priceHighs = findLocalExtremes(recentPrices, 'high');

  // RSI Divergence
  if (priceLows.length >= 2 && recentRSI.length >= 20) {
    const [prevIdx, currIdx] = priceLows.slice(-2);
    if (recentPrices[currIdx] < recentPrices[prevIdx] && recentRSI[currIdx] > recentRSI[prevIdx]) {
      result.rsiDivergence = 'bullish';
      result.strength += 0.15;
    }
  }
  if (priceHighs.length >= 2 && recentRSI.length >= 20) {
    const [prevIdx, currIdx] = priceHighs.slice(-2);
    if (recentPrices[currIdx] > recentPrices[prevIdx] && recentRSI[currIdx] < recentRSI[prevIdx]) {
      result.rsiDivergence = 'bearish';
      result.strength += 0.15;
    }
  }

  // MACD Divergence
  if (priceLows.length >= 2 && recentMACD.length >= 20) {
    const [prevIdx, currIdx] = priceLows.slice(-2);
    if (recentPrices[currIdx] < recentPrices[prevIdx] && recentMACD[currIdx] > recentMACD[prevIdx]) {
      result.macdDivergence = 'bullish';
      result.strength += 0.15;
    }
  }
  if (priceHighs.length >= 2 && recentMACD.length >= 20) {
    const [prevIdx, currIdx] = priceHighs.slice(-2);
    if (recentPrices[currIdx] > recentPrices[prevIdx] && recentMACD[currIdx] < recentMACD[prevIdx]) {
      result.macdDivergence = 'bearish';
      result.strength += 0.15;
    }
  }

  return result;
}

// ═══════════════════════════════════════
// Signal Generation
// ═══════════════════════════════════════

function calculateATR(prices: number[]): number {
  if (prices.length < 2) return prices[0] * 0.02;
  const ranges = prices.slice(1).map((p, i) => Math.abs(p - prices[i]));
  return ranges.reduce((a, b) => a + b, 0) / ranges.length;
}

function generateSignal(
  symbol: string,
  price: number,
  ind: Indicators,
  fgSignal: FGSignal,
  divergence: DivergenceResult
): ScannerSignal | null {
  const bullishSignals: string[] = [];
  const bearishSignals: string[] = [];
  let bullishScore = 0;
  let bearishScore = 0;
  const reasoning: string[] = [];

  // RSI
  if (ind.rsi < 35) {
    bullishSignals.push('RSI Oversold');
    bullishScore += 0.2;
    reasoning.push(`RSI ${ind.rsi.toFixed(1)} (oversold)`);
  } else if (ind.rsi > 65) {
    bearishSignals.push('RSI Overbought');
    bearishScore += 0.2;
    reasoning.push(`RSI ${ind.rsi.toFixed(1)} (overbought)`);
  }

  // MACD
  if (ind.macd.histogram > 0 && ind.macd.macd > ind.macd.signal) {
    bullishSignals.push('MACD Bullish');
    bullishScore += 0.25;
    reasoning.push('MACD bullish cross');
  } else if (ind.macd.histogram < 0 && ind.macd.macd < ind.macd.signal) {
    bearishSignals.push('MACD Bearish');
    bearishScore += 0.25;
    reasoning.push('MACD bearish cross');
  }

  // EMA Trend
  if (price > ind.ema20 && ind.ema20 > ind.ema50) {
    bullishSignals.push('Bullish Trend');
    bullishScore += 0.25;
    reasoning.push('Price > 20/50 EMA');
  } else if (price < ind.ema20 && ind.ema20 < ind.ema50) {
    bearishSignals.push('Bearish Trend');
    bearishScore += 0.25;
    reasoning.push('Price < 20/50 EMA');
  }

  // Volume confirmation
  if (ind.volumeRatio > 1.5) {
    bullishScore += 0.1;
    bearishScore += 0.1;
    reasoning.push(`Volume +${((ind.volumeRatio - 1) * 100).toFixed(0)}%`);
  }

  // Strong EMA alignment bonus
  if (price > ind.ema20 && ind.ema20 > ind.ema50 && ind.ema50 > ind.ema200) {
    bullishScore += 0.1;
  } else if (price < ind.ema20 && ind.ema20 < ind.ema50 && ind.ema50 < ind.ema200) {
    bearishScore += 0.1;
  }

  // Fear & Greed
  if (fgSignal.signal === 'bullish') {
    bullishSignals.push('F&G Bullish');
    bullishScore += fgSignal.strength;
    if (fgSignal.strength >= 0.2) reasoning.push('Extreme Fear (contrarian bullish)');
  } else if (fgSignal.signal === 'bearish') {
    bearishSignals.push('F&G Bearish');
    bearishScore += fgSignal.strength;
    if (fgSignal.strength >= 0.2) reasoning.push('Extreme Greed (contrarian bearish)');
  }

  // Divergences
  if (divergence.rsiDivergence === 'bullish') {
    bullishSignals.push('RSI Bullish Div');
    bullishScore += divergence.strength;
    reasoning.push('RSI bullish divergence');
  } else if (divergence.rsiDivergence === 'bearish') {
    bearishSignals.push('RSI Bearish Div');
    bearishScore += divergence.strength;
    reasoning.push('RSI bearish divergence');
  }
  if (divergence.macdDivergence === 'bullish') {
    bullishSignals.push('MACD Bullish Div');
    bullishScore += divergence.strength;
    reasoning.push('MACD bullish divergence');
  } else if (divergence.macdDivergence === 'bearish') {
    bearishSignals.push('MACD Bearish Div');
    bearishScore += divergence.strength;
    reasoning.push('MACD bearish divergence');
  }

  // Require at least 2 agreeing signals, no conflicting
  let side: 'LONG' | 'SHORT' | null = null;
  let confidence = 0;
  let signals: string[] = [];

  if (bullishSignals.length >= 2 && bearishSignals.length === 0) {
    side = 'LONG';
    confidence = Math.min(bullishScore, 0.95);
    signals = bullishSignals;
  } else if (bearishSignals.length >= 2 && bullishSignals.length === 0) {
    side = 'SHORT';
    confidence = Math.min(bearishScore, 0.95);
    signals = bearishSignals;
  }

  if (!side || confidence < 0.45) return null;

  // SL/TP based on ATR
  const atr = calculateATR([price, ind.ema20, ind.ema50]);
  const slDist = atr * 1.5;
  const tpDist = atr * 3;

  const stopLoss = Math.max(side === 'LONG' ? price - slDist : price + slDist, 0);
  const takeProfit1 = Math.max(side === 'LONG' ? price + tpDist : price - tpDist, 0);
  const takeProfit2 = Math.max(side === 'LONG' ? price + tpDist * 2 : price - tpDist * 2, 0);

  return {
    symbol,
    side,
    entry: price,
    stopLoss,
    takeProfit1,
    takeProfit2,
    confidence,
    indicators: signals,
    reasoning: reasoning.join('. ') + '.',
    timestamp: Date.now()
  };
}

// ═══════════════════════════════════════
// Scan Functions (public API)
// ═══════════════════════════════════════

const USAGE_INFO = {
  description: 'Live trade signals from Macro Oracle scanner',
  refreshRate: 'Real-time on request',
  riskWarning: 'DYOR - signals, not financial advice',
  indicators: ['RSI', 'MACD (3/10/16)', 'EMA 20/50/200', 'Volume', 'Fear & Greed', 'Divergences']
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function analyzeCoin(
  symbol: string,
  price: number,
  fgSignal: FGSignal,
  bar: string = '1D'
): Promise<ScannerSignal | null> {
  const { prices, volumes } = await fetchOKXCandles(symbol, 90, bar);

  if (prices.length < 50) return null;

  const indicators = calculateIndicators(prices, volumes);
  const rsiSeries = calculateRSISeries(prices);
  const macdSeries = calculateMACDSeries(prices);
  const divergence = detectDivergences(prices, rsiSeries, macdSeries);

  return generateSignal(symbol, price, indicators, fgSignal, divergence);
}

/**
 * Scan top N coins by volume, return all signals
 */
export async function scanMarket(limit: number = 50, bar: string = '1D'): Promise<ScanResult> {
  const clampedLimit = Math.min(Math.max(limit, 1), 100);

  const fearGreed = await getFearGreedIndex();
  const fgSignal = getFearGreedSignal(fearGreed.value);
  const coins = await fetchOKXTopCoins(clampedLimit);
  const signals: ScannerSignal[] = [];

  for (const coin of coins) {
    try {
      const signal = await analyzeCoin(coin.symbol, coin.price, fgSignal, bar);
      if (signal) signals.push(signal);
      // Rate limit: OKX allows 20 req/2sec
      await sleep(200);
    } catch (err: any) {
      console.error(`Scanner error on ${coin.symbol}:`, err.message);
    }
  }

  signals.sort((a, b) => b.confidence - a.confidence);

  return {
    timestamp: Date.now(),
    fearGreed,
    scanned: coins.length,
    signalCount: signals.length,
    signals,
    usage: USAGE_INFO
  };
}

/**
 * Scan a specific symbol
 */
export async function scanSymbol(symbol: string, bar: string = '1D'): Promise<ScanResult> {
  const upper = symbol.toUpperCase();

  const fearGreed = await getFearGreedIndex();
  const fgSignal = getFearGreedSignal(fearGreed.value);

  // Fetch current price via ticker
  let price: number;
  try {
    const { data } = await axios.get('https://www.okx.com/api/v5/market/ticker', {
      params: { instId: `${upper}-USDT` },
      timeout: 10000,
      headers: { 'User-Agent': 'MacroOracle/2.0' }
    });
    if (data.code !== '0' || !data.data?.[0]) {
      return {
        timestamp: Date.now(),
        fearGreed,
        scanned: 0,
        signalCount: 0,
        signals: [],
        usage: USAGE_INFO
      };
    }
    price = parseFloat(data.data[0].last);
  } catch {
    return {
      timestamp: Date.now(),
      fearGreed,
      scanned: 0,
      signalCount: 0,
      signals: [],
      usage: USAGE_INFO
    };
  }

  const signals: ScannerSignal[] = [];
  try {
    const signal = await analyzeCoin(upper, price, fgSignal, bar);
    if (signal) signals.push(signal);
  } catch (err: any) {
    console.error(`Scanner error on ${upper}:`, err.message);
  }

  return {
    timestamp: Date.now(),
    fearGreed,
    scanned: 1,
    signalCount: signals.length,
    signals,
    usage: USAGE_INFO
  };
}

/**
 * Scan top N coins, return only the best signal
 */
export async function getBestSignal(limit: number = 50): Promise<ScanResult> {
  const result = await scanMarket(limit);
  return {
    ...result,
    signals: result.signals.slice(0, 1)
  };
}

// ═══════════════════════════════════════
// Scan History — stores last N scan results
// ═══════════════════════════════════════

const MAX_HISTORY = 48; // ~4 days of 2h scans
const scanHistory: ScanResult[] = [];
let autoScanInterval: NodeJS.Timeout | null = null;

/** Add a scan result to history */
function recordScan(result: ScanResult): void {
  scanHistory.unshift(result); // newest first
  if (scanHistory.length > MAX_HISTORY) {
    scanHistory.length = MAX_HISTORY;
  }
}

/** Get scan history */
export function getScanHistory(limit: number = 24): ScanResult[] {
  return scanHistory.slice(0, limit);
}

/** Get latest scan (most recent) */
export function getLatestScan(): ScanResult | null {
  return scanHistory[0] || null;
}

/** Run a scheduled scan and record it */
async function runScheduledScan(): Promise<void> {
  console.log(`[Scanner] Running scheduled 2h scan at ${new Date().toISOString()}`);
  try {
    const result = await scanMarket(100);
    recordScan(result);
    console.log(`[Scanner] Scan complete: ${result.signalCount} signals from ${result.scanned} coins`);
  } catch (err: any) {
    console.error(`[Scanner] Scheduled scan failed:`, err.message);
  }
}

/** Start the auto-scan interval (every 2 hours) */
export function startAutoScan(): void {
  if (autoScanInterval) return; // already running
  
  console.log('[Scanner] Starting auto-scan (every 2 hours)');
  
  // Run immediately on startup
  runScheduledScan();
  
  // Then every 2 hours
  autoScanInterval = setInterval(runScheduledScan, 2 * 60 * 60 * 1000);
}

/** Stop auto-scan */
export function stopAutoScan(): void {
  if (autoScanInterval) {
    clearInterval(autoScanInterval);
    autoScanInterval = null;
  }
}
