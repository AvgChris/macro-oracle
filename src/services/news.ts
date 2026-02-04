// Crypto News Service - CryptoPanic API
// Real-time crypto news and sentiment

import axios from 'axios';

const CRYPTOPANIC_API = 'https://cryptopanic.com/api/v1';
const API_KEY = process.env.CRYPTOPANIC_API_KEY || ''; // Free tier available
const CACHE_TTL = 180000; // 3 minute cache

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

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  currencies: string[];
}

export interface NewsSentiment {
  overall: 'bullish' | 'bearish' | 'neutral';
  score: number; // -100 to +100
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  topHeadlines: NewsItem[];
  fetchedAt: number;
}

// Fallback: RSS feed parsing for free news
async function fetchCryptoNewsRSS(): Promise<NewsItem[]> {
  try {
    // Use CoinDesk RSS as fallback (no API key needed)
    const res = await axios.get('https://www.coindesk.com/arc/outboundfeeds/rss/', {
      timeout: 10000,
      headers: {
        'User-Agent': 'MacroOracle/1.0'
      }
    });

    // Simple RSS parsing
    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;

    let match;
    while ((match = itemRegex.exec(res.data)) !== null && items.length < 10) {
      const itemContent = match[1];
      const titleMatch = titleRegex.exec(itemContent);
      const linkMatch = linkRegex.exec(itemContent);
      const pubDateMatch = pubDateRegex.exec(itemContent);

      if (titleMatch && linkMatch) {
        const title = titleMatch[1];
        
        // Simple sentiment from title keywords
        let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
        const lowerTitle = title.toLowerCase();
        
        const positiveKeywords = ['surge', 'rally', 'gains', 'bullish', 'soars', 'jumps', 'rises', 'record', 'adoption', 'approval', 'breakout'];
        const negativeKeywords = ['crash', 'plunge', 'drops', 'bearish', 'falls', 'tumbles', 'hack', 'fraud', 'sec', 'lawsuit', 'ban', 'fear'];

        if (positiveKeywords.some(kw => lowerTitle.includes(kw))) {
          sentiment = 'positive';
        } else if (negativeKeywords.some(kw => lowerTitle.includes(kw))) {
          sentiment = 'negative';
        }

        // Extract mentioned currencies
        const currencies: string[] = [];
        if (lowerTitle.includes('bitcoin') || lowerTitle.includes('btc')) currencies.push('BTC');
        if (lowerTitle.includes('ethereum') || lowerTitle.includes('eth')) currencies.push('ETH');
        if (lowerTitle.includes('solana') || lowerTitle.includes('sol')) currencies.push('SOL');

        items.push({
          title,
          source: 'CoinDesk',
          url: linkMatch[1],
          publishedAt: pubDateMatch?.[1] || new Date().toISOString(),
          sentiment,
          currencies
        });
      }
    }

    return items;
  } catch (error) {
    console.error('Failed to fetch crypto news RSS:', error);
    return [];
  }
}

// Try CryptoPanic API first, fallback to RSS
async function fetchCryptoNews(): Promise<NewsItem[]> {
  const cached = getCached<NewsItem[]>('crypto_news');
  if (cached) return cached;

  // If we have API key, use CryptoPanic
  if (API_KEY) {
    try {
      const res = await axios.get(`${CRYPTOPANIC_API}/posts/`, {
        params: {
          auth_token: API_KEY,
          filter: 'hot',
          kind: 'news',
          public: true
        },
        timeout: 10000
      });

      const items: NewsItem[] = (res.data.results || []).slice(0, 15).map((item: any) => ({
        title: item.title,
        source: item.source?.title || 'Unknown',
        url: item.url,
        publishedAt: item.published_at,
        sentiment: item.votes?.positive > item.votes?.negative ? 'positive' :
                   item.votes?.negative > item.votes?.positive ? 'negative' : 'neutral',
        currencies: (item.currencies || []).map((c: any) => c.code)
      }));

      setCache('crypto_news', items);
      return items;
    } catch (error) {
      console.error('CryptoPanic API failed, falling back to RSS:', error);
    }
  }

  // Fallback to RSS
  const items = await fetchCryptoNewsRSS();
  setCache('crypto_news', items);
  return items;
}

export async function fetchNewsSentiment(): Promise<NewsSentiment> {
  const news = await fetchCryptoNews();

  const positiveCount = news.filter(n => n.sentiment === 'positive').length;
  const negativeCount = news.filter(n => n.sentiment === 'negative').length;
  const neutralCount = news.filter(n => n.sentiment === 'neutral').length;
  const total = news.length || 1;

  // Calculate sentiment score (-100 to +100)
  const score = Math.round(((positiveCount - negativeCount) / total) * 100);

  let overall: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (score > 20) overall = 'bullish';
  else if (score < -20) overall = 'bearish';

  return {
    overall,
    score,
    positiveCount,
    negativeCount,
    neutralCount,
    topHeadlines: news.slice(0, 5),
    fetchedAt: Date.now()
  };
}

// Macro news from financial sources
export async function fetchMacroNews(): Promise<NewsItem[]> {
  const cached = getCached<NewsItem[]>('macro_news');
  if (cached) return cached;

  try {
    // Use Reuters RSS for macro news
    const res = await axios.get('https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best', {
      timeout: 10000,
      headers: {
        'User-Agent': 'MacroOracle/1.0'
      }
    });

    // Parse RSS (simplified)
    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title>(.*?)<\/title>/;

    let match;
    while ((match = itemRegex.exec(res.data)) !== null && items.length < 5) {
      const itemContent = match[1];
      const titleMatch = titleRegex.exec(itemContent);

      if (titleMatch) {
        items.push({
          title: titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, ''),
          source: 'Reuters',
          url: '',
          publishedAt: new Date().toISOString(),
          sentiment: 'neutral',
          currencies: []
        });
      }
    }

    setCache('macro_news', items);
    return items;
  } catch (error) {
    console.error('Failed to fetch macro news:', error);
    return [];
  }
}

export interface FullNewsSnapshot {
  crypto: NewsSentiment;
  fetchedAt: number;
  cryptoImplication: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    reasoning: string;
  };
}

export async function fetchFullNewsSnapshot(): Promise<FullNewsSnapshot> {
  const crypto = await fetchNewsSentiment();

  let direction: 'bullish' | 'bearish' | 'neutral' = crypto.overall;
  let confidence = Math.min(Math.abs(crypto.score) + 30, 75);
  let reasoning = `News sentiment: ${crypto.positiveCount} positive, ${crypto.negativeCount} negative headlines`;

  if (crypto.overall === 'bullish') {
    reasoning = `Bullish news flow: ${crypto.positiveCount} positive vs ${crypto.negativeCount} negative headlines`;
  } else if (crypto.overall === 'bearish') {
    reasoning = `Bearish news flow: ${crypto.negativeCount} negative vs ${crypto.positiveCount} positive headlines`;
  }

  return {
    crypto,
    fetchedAt: Date.now(),
    cryptoImplication: {
      direction,
      confidence,
      reasoning
    }
  };
}
