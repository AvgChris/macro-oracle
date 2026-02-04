// Polymarket Service - Prediction Market Data
// Real-money prediction market odds for macro events

import axios from 'axios';

const GAMMA_API = 'https://gamma-api.polymarket.com';
const CLOB_API = 'https://clob.polymarket.com';
const CACHE_TTL = 300000; // 5 minute cache

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

export interface PredictionMarket {
  id: string;
  question: string;
  category: string;
  endDate: string;
  outcomes: {
    name: string;
    probability: number;
  }[];
  volume: number;
  liquidity: number;
}

export interface MacroMarkets {
  fedRateCut: PredictionMarket | null;
  recession: PredictionMarket | null;
  crypto: PredictionMarket[];
  politics: PredictionMarket[];
  fetchedAt: number;
}

// Search for macro-relevant markets
async function searchMarkets(query: string, limit: number = 10): Promise<any[]> {
  try {
    const res = await axios.get(`${GAMMA_API}/markets`, {
      params: { 
        limit,
        closed: false,
        active: true
      },
      timeout: 10000,
      headers: { 'User-Agent': 'MacroOracle/1.0' }
    });
    
    // Filter by query in question text
    const markets = res.data || [];
    return markets.filter((m: any) => 
      m.question?.toLowerCase().includes(query.toLowerCase()) ||
      m.description?.toLowerCase().includes(query.toLowerCase())
    );
  } catch (error: any) {
    console.error('Polymarket search failed:', error.message);
    return [];
  }
}

// Get current markets with prices
async function getActiveMarkets(limit: number = 50): Promise<any[]> {
  const cached = getCached<any[]>('active_markets');
  if (cached) return cached;

  try {
    const res = await axios.get(`${GAMMA_API}/markets`, {
      params: { 
        limit,
        closed: false,
        active: true,
        order: 'volume',
        ascending: false
      },
      timeout: 10000,
      headers: { 'User-Agent': 'MacroOracle/1.0' }
    });
    
    const markets = res.data || [];
    setCache('active_markets', markets);
    return markets;
  } catch (error: any) {
    console.error('Polymarket markets failed:', error.message);
    return [];
  }
}

// Transform raw market to our format
function transformMarket(raw: any): PredictionMarket | null {
  if (!raw || !raw.question) return null;
  
  try {
    // Parse outcomes from tokens or outcomePrices
    const outcomes: { name: string; probability: number }[] = [];
    
    if (raw.outcomePrices) {
      const prices = JSON.parse(raw.outcomePrices);
      outcomes.push({ name: 'Yes', probability: Math.round(parseFloat(prices[0]) * 100) });
      outcomes.push({ name: 'No', probability: Math.round(parseFloat(prices[1]) * 100) });
    } else if (raw.tokens) {
      raw.tokens.forEach((token: any) => {
        outcomes.push({
          name: token.outcome || 'Unknown',
          probability: Math.round((token.price || 0.5) * 100)
        });
      });
    }

    return {
      id: raw.id || raw.conditionId,
      question: raw.question,
      category: raw.category || 'general',
      endDate: raw.endDate || raw.end_date_iso,
      outcomes,
      volume: parseFloat(raw.volume || raw.volumeNum || '0'),
      liquidity: parseFloat(raw.liquidity || '0')
    };
  } catch (e) {
    return null;
  }
}

// Macro-relevant keywords
const MACRO_KEYWORDS = {
  fed: ['fed', 'federal reserve', 'rate cut', 'rate hike', 'fomc', 'powell', 'interest rate'],
  recession: ['recession', 'gdp', 'economic'],
  crypto: ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'solana'],
  politics: ['trump', 'biden', 'election', 'president', 'congress']
};

export async function fetchMacroMarkets(): Promise<MacroMarkets> {
  const cached = getCached<MacroMarkets>('macro_markets');
  if (cached) return cached;

  const allMarkets = await getActiveMarkets(100);
  
  // Categorize markets
  let fedRateCut: PredictionMarket | null = null;
  let recession: PredictionMarket | null = null;
  const crypto: PredictionMarket[] = [];
  const politics: PredictionMarket[] = [];

  for (const raw of allMarkets) {
    const question = (raw.question || '').toLowerCase();
    const market = transformMarket(raw);
    if (!market) continue;

    // Check Fed/rate related
    if (MACRO_KEYWORDS.fed.some(kw => question.includes(kw))) {
      if (!fedRateCut || market.volume > fedRateCut.volume) {
        fedRateCut = market;
      }
    }

    // Check recession
    if (MACRO_KEYWORDS.recession.some(kw => question.includes(kw))) {
      if (!recession || market.volume > recession.volume) {
        recession = market;
      }
    }

    // Check crypto
    if (MACRO_KEYWORDS.crypto.some(kw => question.includes(kw))) {
      crypto.push(market);
    }

    // Check politics
    if (MACRO_KEYWORDS.politics.some(kw => question.includes(kw))) {
      politics.push(market);
    }
  }

  // Sort by volume and take top 5
  crypto.sort((a, b) => b.volume - a.volume);
  politics.sort((a, b) => b.volume - a.volume);

  const result: MacroMarkets = {
    fedRateCut,
    recession,
    crypto: crypto.slice(0, 5),
    politics: politics.slice(0, 5),
    fetchedAt: Date.now()
  };

  setCache('macro_markets', result);
  return result;
}

export interface PolymarketSnapshot {
  markets: MacroMarkets;
  summary: {
    fedSentiment: string;
    cryptoSentiment: string;
    politicalRisk: string;
  };
  cryptoImplication: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    reasoning: string;
  };
  fetchedAt: number;
}

export async function fetchPolymarketSnapshot(): Promise<PolymarketSnapshot> {
  const markets = await fetchMacroMarkets();

  // Analyze sentiment
  let fedSentiment = 'Unknown';
  if (markets.fedRateCut) {
    const yesProb = markets.fedRateCut.outcomes.find(o => o.name === 'Yes')?.probability || 50;
    fedSentiment = yesProb > 60 ? 'Dovish (rate cut likely)' :
                   yesProb < 40 ? 'Hawkish (no cut expected)' : 'Mixed';
  }

  let cryptoSentiment = 'Neutral';
  if (markets.crypto.length > 0) {
    // Check probability of "above" markets - high Yes probability = bullish
    const aboveMarkets = markets.crypto.filter(m => 
      m.question.toLowerCase().includes('above') || 
      m.question.toLowerCase().includes('higher')
    );
    
    if (aboveMarkets.length > 0) {
      const avgYesProb = aboveMarkets.reduce((sum, m) => {
        const yesOutcome = m.outcomes.find(o => o.name === 'Yes');
        return sum + (yesOutcome?.probability || 50);
      }, 0) / aboveMarkets.length;
      
      cryptoSentiment = avgYesProb > 60 ? 'Bullish' : avgYesProb < 30 ? 'Bearish' : 'Mixed';
    }
  }

  let politicalRisk = 'Low';
  if (markets.politics.length > 2) {
    politicalRisk = 'Elevated';
  }

  // Crypto implication
  let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let confidence = 40;
  let reasoning = 'Prediction markets show mixed sentiment';

  if (fedSentiment.includes('Dovish')) {
    direction = 'bullish';
    confidence = 55;
    reasoning = 'Markets pricing in rate cuts → bullish for risk assets';
  } else if (fedSentiment.includes('Hawkish')) {
    direction = 'bearish';
    confidence = 55;
    reasoning = 'Markets not expecting cuts → headwind for crypto';
  }
  
  // Override with crypto sentiment if Fed sentiment unknown
  if (fedSentiment === 'Unknown') {
    if (cryptoSentiment === 'Bearish') {
      direction = 'bearish';
      confidence = 50;
      reasoning = 'Prediction markets expect crypto prices to stay low';
    } else if (cryptoSentiment === 'Bullish') {
      direction = 'bullish';
      confidence = 50;
      reasoning = 'Prediction markets expect crypto prices to rise';
    }
  }

  return {
    markets,
    summary: {
      fedSentiment,
      cryptoSentiment,
      politicalRisk
    },
    cryptoImplication: {
      direction,
      confidence,
      reasoning
    },
    fetchedAt: Date.now()
  };
}
