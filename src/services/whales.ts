// Whale Alert Service - Large Transaction Tracking
// Monitors large BTC/ETH movements

import axios from 'axios';

const CACHE_TTL = 120000; // 2 minute cache

interface CachedData<T> {
  data: T;
  timestamp: number;
}

const cache: Map<string, CachedData<any>> = new Map();

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export interface WhaleTransaction {
  hash: string;
  amount: number;
  amountUsd: number;
  from: string;
  to: string;
  timestamp: number;
  type: 'exchange_inflow' | 'exchange_outflow' | 'whale_transfer' | 'unknown';
}

export interface WhaleSnapshot {
  btc: {
    largeTransactions: WhaleTransaction[];
    totalVolume24h: number;
    exchangeNetFlow: 'inflow' | 'outflow' | 'neutral';
    whaleActivity: 'high' | 'medium' | 'low';
  };
  interpretation: string;
  cryptoImplication: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    reasoning: string;
  };
  fetchedAt: number;
}

// Known exchange addresses (simplified list)
const EXCHANGE_ADDRESSES = new Set([
  'bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h', // Binance
  '3M219KR5vEneNb47ewrPfWyb5jQ2DjxRP6', // Binance
  'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97', // Bitfinex
  '1NDyJtNTjmwk5xPNhjgAMu4HDHigtobu1s', // Binance
]);

// Check if address is likely an exchange
function isExchangeAddress(addr: string): boolean {
  // Known exchanges or patterns
  if (EXCHANGE_ADDRESSES.has(addr)) return true;
  // Binance cold wallets often start with bc1qm34
  if (addr.startsWith('bc1qm34')) return true;
  // Large legacy addresses often exchanges
  if (addr.startsWith('1') && addr.length === 34) return true;
  return false;
}

// Get recent large BTC transactions from blockchain.info
async function fetchLargeBtcTransactions(): Promise<WhaleTransaction[]> {
  const cached = getCached<WhaleTransaction[]>('btc_whales');
  if (cached) return cached;

  try {
    // Get unconfirmed transactions (recent)
    const res = await axios.get('https://blockchain.info/unconfirmed-transactions', {
      params: { format: 'json' },
      timeout: 10000
    });

    // Get BTC price
    const priceRes = await axios.get('https://blockchain.info/ticker', { timeout: 5000 });
    const btcPrice = priceRes.data?.USD?.last || 75000;

    const transactions: WhaleTransaction[] = [];
    const txs = res.data?.txs || [];

    for (const tx of txs) {
      // Calculate total output value
      const totalValue = (tx.out || []).reduce((sum: number, out: any) => sum + (out.value || 0), 0);
      const btcAmount = totalValue / 1e8; // Satoshis to BTC
      const usdAmount = btcAmount * btcPrice;

      // Only track transactions > $1M
      if (usdAmount >= 1000000) {
        const fromAddr = tx.inputs?.[0]?.prev_out?.addr || 'unknown';
        const toAddr = tx.out?.[0]?.addr || 'unknown';

        let type: WhaleTransaction['type'] = 'whale_transfer';
        if (isExchangeAddress(toAddr) && !isExchangeAddress(fromAddr)) {
          type = 'exchange_inflow'; // Selling pressure
        } else if (isExchangeAddress(fromAddr) && !isExchangeAddress(toAddr)) {
          type = 'exchange_outflow'; // Accumulation
        }

        transactions.push({
          hash: tx.hash,
          amount: Math.round(btcAmount * 100) / 100,
          amountUsd: Math.round(usdAmount),
          from: fromAddr,
          to: toAddr,
          timestamp: tx.time * 1000,
          type
        });
      }

      // Limit to 10 whale transactions
      if (transactions.length >= 10) break;
    }

    setCache('btc_whales', transactions);
    return transactions;
  } catch (error: any) {
    console.error('Failed to fetch BTC whale transactions:', error.message);
    return [];
  }
}

export async function fetchWhaleSnapshot(): Promise<WhaleSnapshot> {
  const transactions = await fetchLargeBtcTransactions();

  // Calculate metrics
  const totalVolume = transactions.reduce((sum, tx) => sum + tx.amountUsd, 0);
  
  const inflows = transactions.filter(tx => tx.type === 'exchange_inflow');
  const outflows = transactions.filter(tx => tx.type === 'exchange_outflow');
  
  const inflowVolume = inflows.reduce((sum, tx) => sum + tx.amountUsd, 0);
  const outflowVolume = outflows.reduce((sum, tx) => sum + tx.amountUsd, 0);

  let exchangeNetFlow: 'inflow' | 'outflow' | 'neutral' = 'neutral';
  if (inflowVolume > outflowVolume * 1.5) {
    exchangeNetFlow = 'inflow';
  } else if (outflowVolume > inflowVolume * 1.5) {
    exchangeNetFlow = 'outflow';
  }

  let whaleActivity: 'high' | 'medium' | 'low' = 'low';
  if (transactions.length >= 5) whaleActivity = 'high';
  else if (transactions.length >= 2) whaleActivity = 'medium';

  // Interpretation
  let interpretation = 'Normal whale activity';
  if (whaleActivity === 'high' && exchangeNetFlow === 'inflow') {
    interpretation = 'High whale activity with exchange inflows — potential selling pressure';
  } else if (whaleActivity === 'high' && exchangeNetFlow === 'outflow') {
    interpretation = 'High whale activity with exchange outflows — accumulation signal';
  } else if (whaleActivity === 'high') {
    interpretation = 'High whale activity — increased volatility expected';
  }

  // Crypto implication
  let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let confidence = 35;
  let reasoning = 'Whale activity within normal range';

  if (exchangeNetFlow === 'inflow') {
    direction = 'bearish';
    confidence = 50;
    reasoning = `Exchange inflows ($${(inflowVolume / 1e6).toFixed(1)}M) > outflows — selling pressure`;
  } else if (exchangeNetFlow === 'outflow') {
    direction = 'bullish';
    confidence = 50;
    reasoning = `Exchange outflows ($${(outflowVolume / 1e6).toFixed(1)}M) > inflows — accumulation`;
  }

  return {
    btc: {
      largeTransactions: transactions.slice(0, 5),
      totalVolume24h: totalVolume,
      exchangeNetFlow,
      whaleActivity
    },
    interpretation,
    cryptoImplication: {
      direction,
      confidence,
      reasoning
    },
    fetchedAt: Date.now()
  };
}
