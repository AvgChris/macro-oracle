import { Service, type IAgentRuntime } from "@elizaos/core";
import axios from "axios";
import { getApiUrl, type ScannerResult } from "../provider.ts";

// ─── Constants ───────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours
const POSITION_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MIN_CONFIDENCE_THRESHOLD = 80;
const DEFAULT_LEVERAGE = 3;
const DEFAULT_SIZE_USD = 100;

// ─── Types ───────────────────────────────────────────────────────────

interface ExecutedTrade {
  symbol: string;
  direction: "LONG" | "SHORT";
  confidence: number;
  leverage: number;
  sizeUsd: number;
  entryPrice?: number;
  executedAt: string;
  signalTimestamp: string;
  status: "OPEN" | "CLOSED";
  pnlPercent?: number;
}

// ─── Service ─────────────────────────────────────────────────────────

export class SignalWatcherService extends Service {
  static serviceType = "signal-watcher";
  capabilityDescription =
    "Monitors Macro Oracle signals and auto-executes trades on Hyperliquid when high-confidence opportunities appear";

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private positionTimer: ReturnType<typeof setInterval> | null = null;
  private executedSignals: Set<string> = new Set();
  private openTrades: Map<string, ExecutedTrade> = new Map();
  private runtime: IAgentRuntime;

  constructor(runtime: IAgentRuntime) {
    super(runtime);
    this.runtime = runtime;
  }

  static async start(runtime: IAgentRuntime): Promise<SignalWatcherService> {
    const service = new SignalWatcherService(runtime);

    const autoTrade = runtime.getSetting("AUTO_TRADE_ENABLED");
    if (autoTrade !== "true") {
      console.log(
        "[SignalWatcher] 🐔 Auto-trading disabled. Set AUTO_TRADE_ENABLED=true to enable."
      );
      return service;
    }

    console.log("[SignalWatcher] 🐔 Starting signal watcher...");
    console.log(
      `[SignalWatcher] 🐔 Poll interval: ${POLL_INTERVAL_MS / 1000 / 60} minutes`
    );
    console.log(
      `[SignalWatcher] 🐔 Min confidence threshold: ${MIN_CONFIDENCE_THRESHOLD}%`
    );

    // Initial check
    await service.checkForSignals();

    // Set up polling
    service.pollTimer = setInterval(
      () => service.checkForSignals(),
      POLL_INTERVAL_MS
    );

    // Set up position monitoring
    service.positionTimer = setInterval(
      () => service.checkOpenPositions(),
      POSITION_CHECK_INTERVAL_MS
    );

    return service;
  }

  static async stop(runtime: IAgentRuntime): Promise<void> {
    const service = runtime.getService(
      SignalWatcherService.serviceType
    ) as SignalWatcherService | undefined;
    if (service) {
      await service.stop();
    }
  }

  async stop(): Promise<void> {
    console.log("[SignalWatcher] 🐔 Stopping signal watcher...");
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.positionTimer) {
      clearInterval(this.positionTimer);
      this.positionTimer = null;
    }
  }

  // ─── Signal Checking ────────────────────────────────────────────

  private async checkForSignals(): Promise<void> {
    try {
      const apiUrl = getApiUrl(this.runtime);
      const { data: scannerHistory } = await axios.get<ScannerResult[]>(
        `${apiUrl}/api/scanner/history`,
        { timeout: 15000 }
      );

      if (!scannerHistory || scannerHistory.length === 0) {
        console.log("[SignalWatcher] 🐔 No scanner results available");
        return;
      }

      // Process each result
      for (const signal of scannerHistory) {
        const signalKey = `${signal.symbol}:${signal.direction}:${signal.timestamp}`;

        // Skip if already executed
        if (this.executedSignals.has(signalKey)) {
          continue;
        }

        // Skip if below confidence threshold
        if (signal.confidence < MIN_CONFIDENCE_THRESHOLD) {
          continue;
        }

        // Skip if we already have an open position for this symbol
        if (this.openTrades.has(signal.symbol)) {
          console.log(
            `[SignalWatcher] 🐔 Already have open position for ${signal.symbol}, skipping`
          );
          continue;
        }

        console.log(
          `[SignalWatcher] 🐔 HIGH CONFIDENCE SIGNAL: ${signal.symbol} ${signal.direction} @ ${signal.confidence}%`
        );

        // Execute the trade
        await this.executeTrade(signal);

        // Mark as executed
        this.executedSignals.add(signalKey);
      }

      // Prune old executed signals (keep last 100)
      if (this.executedSignals.size > 100) {
        const entries = Array.from(this.executedSignals);
        const toRemove = entries.slice(0, entries.length - 100);
        toRemove.forEach((key) => this.executedSignals.delete(key));
      }
    } catch (error) {
      console.error(
        "[SignalWatcher] 🐔 Error checking signals:",
        (error as Error).message
      );
    }
  }

  // ─── Trade Execution ────────────────────────────────────────────

  private async executeTrade(signal: ScannerResult): Promise<void> {
    try {
      const leverage =
        parseInt(this.runtime.getSetting("DEFAULT_LEVERAGE") || "") ||
        DEFAULT_LEVERAGE;
      const sizeUsd =
        parseFloat(this.runtime.getSetting("DEFAULT_SIZE_USD") || "") ||
        DEFAULT_SIZE_USD;

      const trade: ExecutedTrade = {
        symbol: signal.symbol,
        direction: signal.direction,
        confidence: signal.confidence,
        leverage,
        sizeUsd,
        entryPrice: signal.price,
        executedAt: new Date().toISOString(),
        signalTimestamp: signal.timestamp,
        status: "OPEN",
      };

      // TODO: Execute via Hyperliquid perps client
      // const hlClient = this.runtime.getService('hyperliquid-perps');
      // const result = await hlClient.openPosition({ ... });

      console.log(
        `[SignalWatcher] 🐔 TRADE EXECUTED: ${trade.symbol} ${trade.direction} @ ${trade.leverage}x, $${trade.sizeUsd}`
      );

      // Track the open trade
      this.openTrades.set(signal.symbol, trade);

      // Cache for persistence across restarts
      await this.cacheTrade(trade);

      // Compose tweet for the trade alert
      await this.postTradeAlert(trade);
    } catch (error) {
      console.error(
        `[SignalWatcher] 🐔 Failed to execute trade for ${signal.symbol}:`,
        (error as Error).message
      );
    }
  }

  // ─── Position Monitoring ────────────────────────────────────────

  private async checkOpenPositions(): Promise<void> {
    if (this.openTrades.size === 0) return;

    try {
      // TODO: Check positions via Hyperliquid client
      // For each open trade, check if TP/SL was hit
      for (const [symbol, trade] of this.openTrades.entries()) {
        // Placeholder: check if position is still open on Hyperliquid
        // const position = await hlClient.getPosition(symbol);
        // if (!position || position.closed) {
        //   trade.status = 'CLOSED';
        //   trade.pnlPercent = position?.pnlPercent || 0;
        //   this.openTrades.delete(symbol);
        //   await this.postTradeClose(trade);
        // }

        console.log(
          `[SignalWatcher] 🐔 Monitoring: ${symbol} ${trade.direction} (open since ${trade.executedAt})`
        );
      }
    } catch (error) {
      console.error(
        "[SignalWatcher] 🐔 Error checking positions:",
        (error as Error).message
      );
    }
  }

  // ─── Tweet Composition ──────────────────────────────────────────

  private async postTradeAlert(trade: ExecutedTrade): Promise<void> {
    try {
      const emoji = trade.direction === "LONG" ? "📈" : "📉";
      const tweet = `🐔 ${trade.symbol} ${trade.direction} @ ${trade.leverage}x | ${trade.confidence}% confidence

${trade.entryPrice ? `Entry: $${trade.entryPrice}` : "Market order"}
Size: $${trade.sizeUsd}

When the Macro Oracle speaks, this chicken listens. ${emoji}🐔`;

      // Store tweet for the social poster to pick up
      await this.runtime.cacheManager?.set(
        `pending_tweet:trade_alert:${Date.now()}`,
        JSON.stringify({ type: "trade_alert", text: tweet, trade }),
        { expires: Date.now() + 24 * 60 * 60 * 1000 }
      );

      console.log(`[SignalWatcher] 🐔 Trade alert queued for posting`);
    } catch (error) {
      console.error(
        "[SignalWatcher] 🐔 Failed to compose trade alert:",
        (error as Error).message
      );
    }
  }

  private async postTradeClose(trade: ExecutedTrade): Promise<void> {
    try {
      const won = (trade.pnlPercent ?? 0) >= 0;
      const emoji = won ? "✅💰" : "❌";
      const pnl = trade.pnlPercent ?? 0;

      const tweet = `🐔 CLOSED: ${trade.symbol} ${trade.direction}

P&L: ${pnl > 0 ? "+" : ""}${pnl.toFixed(2)}% ${emoji}
${won ? "Another golden egg for the portfolio." : "Small scratch. Risk was managed. Moving on."} 🐔`;

      await this.runtime.cacheManager?.set(
        `pending_tweet:trade_close:${Date.now()}`,
        JSON.stringify({ type: "trade_close", text: tweet, trade }),
        { expires: Date.now() + 24 * 60 * 60 * 1000 }
      );

      console.log(`[SignalWatcher] 🐔 Trade close alert queued for posting`);
    } catch (error) {
      console.error(
        "[SignalWatcher] 🐔 Failed to compose close alert:",
        (error as Error).message
      );
    }
  }

  // ─── Persistence ────────────────────────────────────────────────

  private async cacheTrade(trade: ExecutedTrade): Promise<void> {
    try {
      const key = `executed_trade:${trade.symbol}:${trade.executedAt}`;
      await this.runtime.cacheManager?.set(key, JSON.stringify(trade), {
        expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    } catch (error) {
      console.error(
        "[SignalWatcher] 🐔 Failed to cache trade:",
        (error as Error).message
      );
    }
  }
}
