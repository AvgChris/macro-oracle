// Solana On-Chain Signal Publishing Service
// Publishes trading signals as memo transactions on Solana mainnet

import {
  Connection,
  Keypair,
  Transaction,
  TransactionInstruction,
  PublicKey,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
const SOLANA_RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const SOLANA_SECRET_KEY = process.env.SOLANA_SECRET_KEY || '2ZZ32ZKEXzHSzUTHkU1rSsp8mYgmqwGXcRdhU31FDueHcMActKCwgrhq8ybB6u3hrkmFKnwLLxit95fG3qdYCy5x';

interface SignalData {
  type: 'macro_signal' | 'fear_greed' | 'orderbook' | 'learning_epoch';
  symbol?: string;
  direction?: 'bullish' | 'bearish' | 'neutral';
  confidence?: number;
  indicators?: Record<string, any>;
  timestamp: number;
  source: string;
}

interface PublishResult {
  success: boolean;
  signature?: string;
  explorer?: string;
  error?: string;
  cost?: number; // lamports
}

// In-memory log of published signals
const publishedSignals: Array<{
  signal: SignalData;
  result: PublishResult;
  publishedAt: string;
}> = [];

function getKeypair(): Keypair | null {
  try {
    if (SOLANA_SECRET_KEY) {
      const secretKey = bs58.decode(SOLANA_SECRET_KEY);
      return Keypair.fromSecretKey(secretKey);
    }
    
    // Fallback: try local file
    const fs = require('fs');
    const path = require('path');
    // Check multiple possible locations
    const possiblePaths = [
      path.join(process.env.HOME || '/home/node', 'clawd', '.secrets', 'solana-keypair.json'),
      path.join(process.env.HOME || '/home/node', '.secrets', 'solana-keypair.json'),
      '/home/node/clawd/.secrets/solana-keypair.json',
    ];
    const configPath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const secretKey = bs58.decode(config.secretKey);
      return Keypair.fromSecretKey(secretKey);
    }
    
    return null;
  } catch (e) {
    console.error('Failed to load Solana keypair:', e);
    return null;
  }
}

function getConnection(): Connection {
  return new Connection(SOLANA_RPC, 'confirmed');
}

export async function publishSignalOnChain(signal: SignalData): Promise<PublishResult> {
  const keypair = getKeypair();
  if (!keypair) {
    return { success: false, error: 'No Solana keypair configured' };
  }

  const connection = getConnection();
  
  try {
    // Check balance first
    const balance = await connection.getBalance(keypair.publicKey);
    if (balance < 10000) { // Need at least ~0.00001 SOL
      return { 
        success: false, 
        error: `Insufficient SOL balance: ${balance / 1e9} SOL. Need at least 0.00001 SOL.`,
      };
    }

    // Compact memo format: MO|type|symbol|direction|confidence|timestamp
    const memoData = JSON.stringify({
      v: 1,
      src: 'macro-oracle',
      ...signal,
    });
    
    // Truncate if too long (memo has ~566 byte limit)
    const memo = memoData.length > 500 ? memoData.substring(0, 500) : memoData;
    
    const memoInstruction = new TransactionInstruction({
      keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: true }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memo, 'utf-8'),
    });

    const transaction = new Transaction().add(memoInstruction);
    
    const signature = await sendAndConfirmTransaction(connection, transaction, [keypair], {
      commitment: 'confirmed',
    });
    
    const result: PublishResult = {
      success: true,
      signature,
      explorer: `https://solscan.io/tx/${signature}`,
    };
    
    // Log it
    publishedSignals.push({
      signal,
      result,
      publishedAt: new Date().toISOString(),
    });
    
    // Keep only last 100
    if (publishedSignals.length > 100) {
      publishedSignals.splice(0, publishedSignals.length - 100);
    }
    
    console.log(`✅ Signal published on-chain: ${signature}`);
    return result;
  } catch (error: any) {
    const result: PublishResult = {
      success: false,
      error: error.message || 'Unknown error',
    };
    
    publishedSignals.push({
      signal,
      result,
      publishedAt: new Date().toISOString(),
    });
    
    console.error('❌ Failed to publish signal on-chain:', error.message);
    return result;
  }
}

export async function getWalletStatus(): Promise<{
  address: string | null;
  balance: number;
  balanceSOL: number;
  signalsPublished: number;
  recentSignals: typeof publishedSignals;
}> {
  const keypair = getKeypair();
  if (!keypair) {
    return {
      address: null,
      balance: 0,
      balanceSOL: 0,
      signalsPublished: 0,
      recentSignals: [],
    };
  }

  const connection = getConnection();
  let balance = 0;
  try {
    balance = await connection.getBalance(keypair.publicKey);
  } catch (e) {
    // ignore
  }

  return {
    address: keypair.publicKey.toBase58(),
    balance,
    balanceSOL: balance / 1e9,
    signalsPublished: publishedSignals.filter(s => s.result.success).length,
    recentSignals: publishedSignals.slice(-20),
  };
}

export async function publishMacroSnapshot(): Promise<PublishResult> {
  // Import market data services
  try {
    const { getFearGreedIndex } = require('./market');
    
    const fg = await getFearGreedIndex();
    
    const signal: SignalData = {
      type: 'fear_greed',
      direction: fg.value <= 25 ? 'bullish' : fg.value >= 75 ? 'bearish' : 'neutral',
      confidence: Math.abs(50 - fg.value) * 2, // 0-100 scale
      indicators: {
        fearGreedValue: fg.value,
        fearGreedClassification: fg.classification,
      },
      timestamp: Date.now(),
      source: 'macro-oracle',
    };
    
    return publishSignalOnChain(signal);
  } catch (error: any) {
    return { success: false, error: `Failed to get macro data: ${error.message}` };
  }
}

export type { SignalData, PublishResult };
