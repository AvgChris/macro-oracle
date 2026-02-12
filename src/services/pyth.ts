/**
 * Pyth Network Price Feed Integration
 * 
 * Uses Pyth's Hermes REST API to fetch real-time, on-chain-verified price data.
 * Pyth is Solana's native oracle — prices are published on-chain by institutional
 * market makers and verified through Solana's consensus.
 * 
 * Hermes API: https://hermes.pyth.network
 * Docs: https://docs.pyth.network/price-feeds
 */

import https from 'https';

// Well-known Pyth price feed IDs (hex, no 0x prefix)
export const PYTH_FEED_IDS: Record<string, string> = {
  'BTC':    'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'ETH':    'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'SOL':    'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  'ASTER':  'a903b5a82cb572397e3d47595d2889cf80513f5b4cf7a36b513ae10cc8b1e338',
  'HYPE':   '4279e31cc369bbcc2faf022b382b080e32a8e689ff20fbc530d2a603eb6cd98b',
  'ZRO':    '3bd860bea28bf982fa06bcf358118064bb114086cc03993bd76197eaab0b8018',
  'XRP':    'ec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8',
  'DOGE':   'dcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c',
  'AVAX':   '93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1571f4c46e7a0',
  'LINK':   '8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221',
  'SUI':    '23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
  'DOT':    'ca3eed9b267293f6595901c734c7525ce8ef49adafe8284f97c3240849bc0c76',
  'ADA':    '2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d',
  'NEAR':   'c415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750',
  'ARB':    '3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5',
  'OP':     '385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711544d2d59165e9bdf',
  'UNI':    '78d185a741d07edb3d5e547538f4c1c4b4512eb4e30a3b4e6df5e7c6c5e527da',
  'AAVE':   '2b9ab1e972a281585084148ba1389800799bd4be63b957507db1349314e47445',
};

const HERMES_BASE = 'https://hermes.pyth.network';

export interface PythPrice {
  symbol: string;
  feedId: string;
  price: number;
  confidence: number;
  emaPrice: number;
  emaConfidence: number;
  publishTime: string;
  expo: number;
  source: 'pyth';
}

export interface PythPriceComparison {
  symbol: string;
  pyth: { price: number; confidence: number; publishTime: string };
  okx?: { price: number };
  spread?: number;
  spreadPercent?: number;
}

/**
 * Fetch latest price for a single asset from Pyth Hermes
 */
export async function fetchPythPrice(symbol: string): Promise<PythPrice | null> {
  const feedId = PYTH_FEED_IDS[symbol.toUpperCase()];
  if (!feedId) return null;

  try {
    const url = `${HERMES_BASE}/v2/updates/price/latest?ids[]=0x${feedId}&parsed=true`;
    const data = await httpsGet(url);
    const json = JSON.parse(data);

    if (!json.parsed || json.parsed.length === 0) return null;

    const feed = json.parsed[0];
    const expo = feed.price.expo;

    return {
      symbol: symbol.toUpperCase(),
      feedId,
      price: parseInt(feed.price.price) * Math.pow(10, expo),
      confidence: parseInt(feed.price.conf) * Math.pow(10, expo),
      emaPrice: parseInt(feed.ema_price.price) * Math.pow(10, expo),
      emaConfidence: parseInt(feed.ema_price.conf) * Math.pow(10, expo),
      publishTime: new Date(feed.price.publish_time * 1000).toISOString(),
      expo,
      source: 'pyth'
    };
  } catch (err) {
    console.error(`Pyth fetch error for ${symbol}:`, err);
    return null;
  }
}

/**
 * Fetch latest prices for multiple assets in a single request
 */
export async function fetchPythPrices(symbols: string[]): Promise<PythPrice[]> {
  const validSymbols = symbols.filter(s => PYTH_FEED_IDS[s.toUpperCase()]);
  if (validSymbols.length === 0) return [];

  const idParams = validSymbols
    .map(s => `ids[]=0x${PYTH_FEED_IDS[s.toUpperCase()]}`)
    .join('&');

  try {
    const url = `${HERMES_BASE}/v2/updates/price/latest?${idParams}&parsed=true`;
    const data = await httpsGet(url);
    const json = JSON.parse(data);

    if (!json.parsed) return [];

    return json.parsed.map((feed: any, i: number) => {
      const expo = feed.price.expo;
      return {
        symbol: validSymbols[i].toUpperCase(),
        feedId: feed.id,
        price: parseInt(feed.price.price) * Math.pow(10, expo),
        confidence: parseInt(feed.price.conf) * Math.pow(10, expo),
        emaPrice: parseInt(feed.ema_price.price) * Math.pow(10, expo),
        emaConfidence: parseInt(feed.ema_price.conf) * Math.pow(10, expo),
        publishTime: new Date(feed.price.publish_time * 1000).toISOString(),
        expo,
        source: 'pyth' as const
      };
    });
  } catch (err) {
    console.error('Pyth multi-fetch error:', err);
    return [];
  }
}

/**
 * Search for a Pyth price feed ID by symbol name
 */
export async function searchPythFeed(query: string): Promise<Array<{id: string, symbol: string}>> {
  try {
    const url = `${HERMES_BASE}/v2/price_feeds?query=${encodeURIComponent(query)}&asset_type=crypto`;
    const data = await httpsGet(url);
    const feeds = JSON.parse(data);

    return feeds.slice(0, 10).map((f: any) => ({
      id: f.id,
      symbol: f.attributes?.symbol || f.attributes?.base || 'unknown'
    }));
  } catch (err) {
    console.error('Pyth search error:', err);
    return [];
  }
}

/**
 * Get all supported Pyth feed symbols
 */
export function getSupportedPythFeeds(): string[] {
  return Object.keys(PYTH_FEED_IDS);
}

function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'MacroOracle/2.0',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}
