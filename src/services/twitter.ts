// Twitter/X API integration for Chicken Buffett (@ChickenBuffett)
// Uses Twitter API v2 with OAuth 1.0a User Context

import axios from 'axios';
import crypto from 'crypto';

const TWITTER_API = 'https://api.twitter.com/2';

interface TwitterConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}

function getConfig(): TwitterConfig | null {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;
  
  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    return null;
  }
  
  return { apiKey, apiSecret, accessToken, accessSecret };
}

// Generate OAuth 1.0a signature
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  config: TwitterConfig
): string {
  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(
      Object.keys(params)
        .sort()
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
        .join('&')
    )
  ].join('&');
  
  const signingKey = `${encodeURIComponent(config.apiSecret)}&${encodeURIComponent(config.accessSecret)}`;
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64');
  
  return signature;
}

// Generate OAuth Authorization header
function generateOAuthHeader(method: string, url: string, config: TwitterConfig): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: config.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: config.accessToken,
    oauth_version: '1.0'
  };
  
  const signature = generateOAuthSignature(method, url, oauthParams, config);
  oauthParams.oauth_signature = signature;
  
  const header = 'OAuth ' + Object.keys(oauthParams)
    .sort()
    .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
    .join(', ');
  
  return header;
}

// Post a tweet
export async function postTweet(text: string): Promise<{ success: boolean; tweetId?: string; error?: string }> {
  const config = getConfig();
  
  if (!config) {
    console.log('[TWITTER] No API keys configured. Tweet would be:');
    console.log(text);
    return { success: false, error: 'Twitter API keys not configured' };
  }
  
  // Truncate to 280 chars if needed
  const tweetText = text.length > 280 ? text.slice(0, 277) + '...' : text;
  
  const url = `${TWITTER_API}/tweets`;
  const authHeader = generateOAuthHeader('POST', url, config);
  
  try {
    const response = await axios.post(
      url,
      { text: tweetText },
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const tweetId = response.data?.data?.id;
    console.log(`[TWITTER] Tweet posted: ${tweetId}`);
    return { success: true, tweetId };
  } catch (error: any) {
    const errMsg = error.response?.data?.detail || error.response?.data?.title || error.message;
    console.error(`[TWITTER] Failed: ${errMsg}`);
    return { success: false, error: errMsg };
  }
}

// Post a thread (array of tweets)
export async function postThread(tweets: string[]): Promise<{ success: boolean; tweetIds: string[] }> {
  const config = getConfig();
  if (!config) {
    console.log('[TWITTER] No API keys. Thread would be:');
    tweets.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
    return { success: false, tweetIds: [] };
  }
  
  const tweetIds: string[] = [];
  let replyToId: string | undefined;
  
  for (const text of tweets) {
    const tweetText = text.length > 280 ? text.slice(0, 277) + '...' : text;
    const url = `${TWITTER_API}/tweets`;
    const authHeader = generateOAuthHeader('POST', url, config);
    
    const body: any = { text: tweetText };
    if (replyToId) {
      body.reply = { in_reply_to_tweet_id: replyToId };
    }
    
    try {
      const response = await axios.post(url, body, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });
      
      const tweetId = response.data?.data?.id;
      tweetIds.push(tweetId);
      replyToId = tweetId;
    } catch (error: any) {
      console.error(`[TWITTER] Thread tweet failed:`, error.response?.data || error.message);
      break;
    }
  }
  
  return { success: tweetIds.length === tweets.length, tweetIds };
}

// Check if Twitter is configured
export function isTwitterConfigured(): boolean {
  return getConfig() !== null;
}
