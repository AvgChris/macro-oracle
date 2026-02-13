import { Service, type IAgentRuntime, ModelType } from "@elizaos/core";
import axios from "axios";
import {
  getRandomTemplate,
  getWeightedTweetType,
  strategyRules,
  type TweetType,
} from "../templates/tweets.ts";

// ─── Constants ───────────────────────────────────────────────────────

const DEFAULT_MIN_INTERVAL_MS = 90 * 60 * 1000; // 90 minutes
const DEFAULT_MAX_INTERVAL_MS = 180 * 60 * 1000; // 180 minutes

// ─── Types ───────────────────────────────────────────────────────────

interface FearGreedData {
  value: number;
  classification: string;
}

interface TradeStats {
  totalTrades: number;
  winRate: number;
  totalPnlPercent: number;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
}

interface ScannerResult {
  symbol: string;
  direction: string;
  confidence: number;
}

// ─── Service ─────────────────────────────────────────────────────────

export class SocialPosterService extends Service {
  static serviceType = "social-poster";
  capabilityDescription =
    "Scheduled social media posting service for Chicken Buffett — posts trade alerts, market commentary, P&L updates, and engagement content on Twitter/X";

  private postTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingTweetTimer: ReturnType<typeof setInterval> | null = null;
  private runtime: IAgentRuntime;
  private lastPostType: TweetType | null = null;
  private lastFearGreedValue: number | null = null;
  private postCount: number = 0;

  constructor(runtime: IAgentRuntime) {
    super(runtime);
    this.runtime = runtime;
  }

  static async start(runtime: IAgentRuntime): Promise<SocialPosterService> {
    const service = new SocialPosterService(runtime);

    const twitterEnabled = !!runtime.getSetting("TWITTER_API_KEY");
    const postEnabled = runtime.getSetting("TWITTER_ENABLE_POST") === "true";

    if (!twitterEnabled || !postEnabled) {
      console.log(
        "[SocialPoster] 🐔 Twitter not configured or posting disabled. Social poster inactive."
      );
      return service;
    }

    console.log("[SocialPoster] 🐔 Starting social poster service...");

    // Schedule first post
    service.scheduleNextPost();

    // Check for pending tweets from signal watcher every 30 seconds
    service.pendingTweetTimer = setInterval(
      () => service.checkPendingTweets(),
      30000
    );

    return service;
  }

  static async stop(runtime: IAgentRuntime): Promise<void> {
    const service = runtime.getService(
      SocialPosterService.serviceType
    ) as SocialPosterService | undefined;
    if (service) {
      await service.stop();
    }
  }

  async stop(): Promise<void> {
    console.log("[SocialPoster] 🐔 Stopping social poster...");
    if (this.postTimer) {
      clearTimeout(this.postTimer);
      this.postTimer = null;
    }
    if (this.pendingTweetTimer) {
      clearInterval(this.pendingTweetTimer);
      this.pendingTweetTimer = null;
    }
  }

  // ─── Post Scheduling ───────────────────────────────────────────

  private scheduleNextPost(): void {
    const minInterval =
      parseInt(this.runtime.getSetting("SOCIAL_POST_MIN_INTERVAL_MS") || "") ||
      DEFAULT_MIN_INTERVAL_MS;
    const maxInterval =
      parseInt(this.runtime.getSetting("SOCIAL_POST_MAX_INTERVAL_MS") || "") ||
      DEFAULT_MAX_INTERVAL_MS;

    const delay =
      Math.floor(Math.random() * (maxInterval - minInterval)) + minInterval;

    console.log(
      `[SocialPoster] 🐔 Next post in ${Math.round(delay / 1000 / 60)} minutes`
    );

    this.postTimer = setTimeout(() => this.createAndPost(), delay);
  }

  // ─── Post Creation ─────────────────────────────────────────────

  private async createAndPost(): Promise<void> {
    try {
      // Pick a tweet type (avoid repeating the same type twice)
      let tweetType = getWeightedTweetType();
      if (tweetType === this.lastPostType) {
        tweetType = getWeightedTweetType(); // Re-roll once
      }
      this.lastPostType = tweetType;

      console.log(`[SocialPoster] 🐔 Creating ${tweetType} tweet...`);

      // Fetch live data for context
      const apiUrl =
        this.runtime.getSetting("MACRO_ORACLE_API_URL") ||
        "https://macro-oracle-production.up.railway.app";

      const [fearGreed, tradeStats, scannerHistory] = await Promise.all([
        this.fetchSafe<FearGreedData>(`${apiUrl}/api/fear-greed`, {
          value: 50,
          classification: "Neutral",
        }),
        this.fetchSafe<TradeStats>(`${apiUrl}/api/trades/stats`, {
          totalTrades: 0,
          winRate: 0,
          totalPnlPercent: 0,
          avgWin: 0,
          avgLoss: 0,
          bestTrade: 0,
          worstTrade: 0,
        }),
        this.fetchSafe<ScannerResult[]>(`${apiUrl}/api/scanner/history`, []),
      ]);

      // Build template variables
      const vars = this.buildTemplateVars(
        tweetType,
        fearGreed,
        tradeStats,
        scannerHistory
      );

      // Get template and fill in variables
      const template = getRandomTemplate(tweetType);
      let tweet = this.fillTemplate(template, vars);

      // Use LLM to polish the tweet if it's still rough
      if (tweet.includes("{{")) {
        tweet = await this.polishWithLLM(tweetType, vars);
      }

      // Ensure tweet is within length limit
      const maxLength =
        parseInt(this.runtime.getSetting("TWITTER_MAX_TWEET_LENGTH") || "") ||
        280;
      if (tweet.length > maxLength) {
        tweet = tweet.substring(0, maxLength - 3) + "...";
      }

      console.log(`[SocialPoster] 🐔 Tweet composed (${tweet.length} chars): ${tweet.substring(0, 80)}...`);

      // Queue the tweet for the Twitter plugin to pick up
      // The @elizaos/plugin-twitter handles actual posting
      await this.runtime.cacheManager?.set(
        `pending_tweet:scheduled:${Date.now()}`,
        JSON.stringify({ type: tweetType, text: tweet }),
        { expires: Date.now() + 24 * 60 * 60 * 1000 }
      );

      this.postCount++;
      this.lastFearGreedValue = fearGreed.value;

      console.log(
        `[SocialPoster] 🐔 Tweet queued (#${this.postCount}). Type: ${tweetType}`
      );
    } catch (error) {
      console.error(
        "[SocialPoster] 🐔 Error creating post:",
        (error as Error).message
      );
    }

    // Schedule next post regardless of success/failure
    this.scheduleNextPost();
  }

  // ─── Template Variables ─────────────────────────────────────────

  private buildTemplateVars(
    type: TweetType,
    fearGreed: FearGreedData,
    stats: TradeStats,
    scanner: ScannerResult[]
  ): Record<string, string | number> {
    const bullish = scanner.filter((s) => s.direction === "LONG");
    const bearish = scanner.filter((s) => s.direction === "SHORT");
    const topSignal = scanner[0];

    // Fear & Greed commentary
    let fgCommentary = "";
    if (fearGreed.value <= 20) {
      fgCommentary =
        "Blood in the streets. Smart money is accumulating. So is this chicken.";
    } else if (fearGreed.value <= 40) {
      fgCommentary =
        "Fear in the air. Opportunity for the disciplined.";
    } else if (fearGreed.value >= 80) {
      fgCommentary =
        "Extreme greed. Time to be cautious. This chicken doesn't chase tops.";
    } else if (fearGreed.value >= 60) {
      fgCommentary = "Greed creeping in. Tightening stops.";
    } else {
      fgCommentary = "Neutral zone. Waiting for conviction.";
    }

    // Pick a strategy rule
    const rule =
      strategyRules[Math.floor(Math.random() * strategyRules.length)];

    return {
      // Fear & Greed
      fearGreedValue: fearGreed.value,
      fearGreedLabel: fearGreed.classification,
      previousFG: this.lastFearGreedValue ?? fearGreed.value,
      currentFG: fearGreed.value,
      commentary: fgCommentary,
      trendComment:
        this.lastFearGreedValue !== null
          ? fearGreed.value > this.lastFearGreedValue
            ? "Sentiment improving. The flock is gaining confidence."
            : fearGreed.value < this.lastFearGreedValue
              ? "Sentiment dropping. Fear rising. This chicken sees opportunity."
              : "Holding steady. Patience mode."
          : "First reading of the session. Establishing baseline.",

      // Scanner
      bullishCount: bullish.length,
      bearishCount: bearish.length,
      dominantSignal:
        bullish.length > bearish.length ? "bullish" : "bearish",
      marketSummary:
        bullish.length > bearish.length
          ? "Lean bullish, but wait for confirmation"
          : "Lean bearish, tightening risk management",
      symbol: topSignal?.symbol ?? "N/A",
      direction: topSignal?.direction ?? "N/A",
      confidence: topSignal?.confidence ?? 0,
      indicatorCount: Math.floor(Math.random() * 3) + 3, // 3-5
      price: "market",
      leverage: 3,
      sizeUsd: 100,
      emoji: topSignal?.direction === "LONG" ? "📈" : "📉",

      // Stats
      winRate: stats.winRate,
      totalPnl: stats.totalPnlPercent,
      tradeCount: stats.totalTrades,
      bestTrade: stats.bestTrade,
      worstTrade: stats.worstTrade,
      pnlPercent: stats.totalPnlPercent,
      pnlDetails: `${stats.totalPnlPercent > 0 ? "+" : ""}${stats.totalPnlPercent}% across ${stats.totalTrades} trades`,
      pnlComment:
        stats.totalPnlPercent > 0
          ? "Another golden egg for the portfolio."
          : "Small scratch. The process continues.",

      // Strategy
      ruleNumber: rule.number,
      rule: rule.rule,
      insight:
        "The market rewards patience and punishes ego. I have neither ego nor impatience. I'm a chicken.",
      lessonsLearned: "Risk management. That's it. That's the tweet.",
      tip: "Never risk more than 2% on a single trade.",
    };
  }

  // ─── Template Filling ──────────────────────────────────────────

  private fillTemplate(
    template: string,
    vars: Record<string, string | number>
  ): string {
    let filled = template;
    for (const [key, value] of Object.entries(vars)) {
      filled = filled.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, "g"),
        String(value)
      );
    }
    return filled;
  }

  // ─── LLM Polish ────────────────────────────────────────────────

  private async polishWithLLM(
    type: TweetType,
    vars: Record<string, string | number>
  ): Promise<string> {
    try {
      const prompt = `You are Chicken Buffett, a data-driven crypto trading chicken in a suit.
Write a single tweet (max 280 chars) of type "${type}" using this data:
${JSON.stringify(vars, null, 2)}

Rules:
- Be specific with numbers
- Include 🐔 emoji
- No hashtags
- Match the personality: confident, analytical, witty, poultry-themed
- Keep it under 280 characters

Tweet:`;

      const result = await this.runtime.useModel(ModelType.TEXT_SMALL, {
        prompt,
        maxTokens: 100,
        temperature: 0.9,
      });

      const tweet =
        typeof result === "string"
          ? result.trim().replace(/^["']|["']$/g, "")
          : String(result);

      return tweet || "The data speaks. This chicken listens. 🐔";
    } catch {
      return "The data speaks. This chicken listens. 🐔";
    }
  }

  // ─── Pending Tweet Check ───────────────────────────────────────

  private async checkPendingTweets(): Promise<void> {
    // Check for tweets queued by the signal watcher
    // These get priority over scheduled posts
    try {
      // Pending tweets are stored in the cache by signal-watcher
      // The Twitter plugin will pick them up for posting
      // This method is a hook for future implementation of direct posting
    } catch (error) {
      console.error(
        "[SocialPoster] 🐔 Error checking pending tweets:",
        (error as Error).message
      );
    }
  }

  // ─── Utils ─────────────────────────────────────────────────────

  private async fetchSafe<T>(url: string, fallback: T): Promise<T> {
    try {
      const { data } = await axios.get<T>(url, { timeout: 10000 });
      return data;
    } catch {
      return fallback;
    }
  }
}
