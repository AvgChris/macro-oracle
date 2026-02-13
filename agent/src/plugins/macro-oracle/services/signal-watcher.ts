import { Service, type IAgentRuntime } from "@elizaos/core";
import axios from "axios";
import { getApiUrl, type ScannerResult } from "../provider.ts";
import { getDriftClient } from "../../../plugins/drift-perps/client.ts";

// ─── Constants ───────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours
const POSITION_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MIN_CONFIDENCE_THRESHOLD = 80;
const MARGIN_PER_TRADE = 100; // Fixed $100 margin per trade

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
    "Monitors Macro Oracle signals and auto-executes trades on Drift Protocol when high-confidence opportunities appear";

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private positionTimer: ReturnType<typeof setInterval> | null = null;
  private executedSignals: Set<string> = new Set();
  private openTrades: Map<string, ExecutedTrade> = new Map();

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime): Promise<SignalWatcherService> {
    const service = new SignalWatcherService(runtime);

    const autoTrade = String(runtime.getSetting("AUTO_TRADE_ENABLED") ?? process.env.AUTO_TRADE_ENABLED ?? "");
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
    ) as unknown as SignalWatcherService | undefined;
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
      const { data: scannerResponse } = await axios.get(
        `${apiUrl}/api/scanner/history`,
        { timeout: 15000 }
      );

      // API returns { scans: [{ signals: [...] }] }
      const scans = (scannerResponse as any)?.scans || [];
      if (!scans.length || !scans[0]?.signals?.length) {
        console.log("[SignalWatcher] 🐔 No scanner results available");
        return;
      }

      const latestScan = scans[0];
      const signals = latestScan.signals || [];

      console.log(`[SignalWatcher] 🐔 Processing ${signals.length} signals from latest scan`);

      // Process each signal
      for (const signal of signals) {
        // Normalize: API uses 'side' not 'direction', confidence is 0-1 not 0-100
        signal.direction = signal.side || signal.direction;
        signal.confidence = signal.confidence > 1 ? signal.confidence : signal.confidence * 100;
        signal.price = signal.entry || signal.price;

        const signalKey = `${signal.symbol}:${signal.direction}:${latestScan.timestamp}`;

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
      // Calculate SL distance for leverage decision
      const slDistance = signal.stopLoss && signal.price
        ? Math.abs(signal.price - signal.stopLoss) / signal.price
        : 0.10;

      // Confidence-based leverage: higher confidence + tighter SL = more leverage
      let leverage: number;
      if (signal.confidence >= 95) {
        leverage = slDistance < 0.05 ? 10 : slDistance < 0.10 ? 7 : 5;
      } else if (signal.confidence >= 90) {
        leverage = slDistance < 0.05 ? 7 : slDistance < 0.10 ? 5 : 3;
      } else if (signal.confidence >= 85) {
        leverage = slDistance < 0.05 ? 5 : slDistance < 0.10 ? 3 : 2;
      } else {
        leverage = slDistance < 0.05 ? 3 : 2;
      }

      const sizeUsd = MARGIN_PER_TRADE * leverage; // $100 margin × leverage = notional

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

      // Execute via Drift Protocol perps client
      const driftClient = getDriftClient(this.runtime);
      if (driftClient) {
        const slPercent = signal.stopLoss && signal.price
          ? Math.abs((signal.price - signal.stopLoss) / signal.price * 100)
          : 15;
        const tpPercent = signal.takeProfit1 && signal.price
          ? Math.abs((signal.takeProfit1 - signal.price) / signal.price * 100)
          : 30;

        const result = await driftClient.openPosition({
          symbol: signal.symbol,
          direction: signal.direction as "LONG" | "SHORT",
          sizeUsd: trade.sizeUsd,
          leverage: trade.leverage,
          stopLossPercent: slPercent,
          takeProfitPercent: tpPercent,
        });

        if (!result.success) {
          console.error(
            `[SignalWatcher] 🐔 TRADE FAILED: ${trade.symbol} — ${result.error}`
          );
          return; // Don't track failed trades
        }

        trade.entryPrice = result.price || trade.entryPrice;
        console.log(
          `[SignalWatcher] 🐔 TRADE EXECUTED ON DRIFT: ${trade.symbol} ${trade.direction} @ ${trade.leverage}x, $${trade.sizeUsd} (price: $${result.price})`
        );
      } else {
        console.warn(
          `[SignalWatcher] 🐔 No Drift client — trade logged but NOT executed: ${trade.symbol} ${trade.direction}`
        );
      }

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
      const driftClient = getDriftClient(this.runtime);
      if (!driftClient) return;

      const positions = await driftClient.getPositions();
      const openSymbols = new Set(positions.map((p) => p.symbol.toUpperCase()));

      for (const [symbol, trade] of this.openTrades.entries()) {
        const pos = positions.find(
          (p) => p.symbol.toUpperCase() === symbol.toUpperCase()
        );

        if (!pos) {
          // Position was closed (TP/SL hit or manually)
          trade.status = "CLOSED";
          const currentPrice = await driftClient.getMarkPrice(symbol);
          if (currentPrice && trade.entryPrice) {
            const direction = trade.direction === "LONG" ? 1 : -1;
            trade.pnlPercent =
              ((currentPrice - trade.entryPrice) / trade.entryPrice) *
              100 *
              direction;
          }
          this.openTrades.delete(symbol);
          await this.postTradeClose(trade);
          console.log(
            `[SignalWatcher] 🐔 Position CLOSED: ${symbol} P&L: ${trade.pnlPercent?.toFixed(2)}%`
          );
        } else {
          console.log(
            `[SignalWatcher] 🐔 Monitoring: ${symbol} ${trade.direction} | PnL: ${pos.unrealizedPnlPercent.toFixed(2)}% (open since ${trade.executedAt})`
          );
        }
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
      const emoji = trade.direction === "LONG" ? "🟢" : "🔴";
      const slPct = trade.entryPrice && trade.sizeUsd
        ? ((trade.sizeUsd / trade.leverage) / trade.entryPrice * 100).toFixed(1)
        : "?";
      
      const tweet = `${emoji} NEW TRADE: $${trade.symbol} ${trade.direction}

Entry: $${trade.entryPrice || "market"}
Margin: $${MARGIN_PER_TRADE} @ ${trade.leverage}x
Confidence: ${trade.confidence}%

🧠 Macro Oracle gave me a ${trade.confidence}% signal. ${trade.direction === "LONG" ? "Going long" : "Shorting"} with conviction.

Drift Protocol (devnet) | #crypto #${trade.symbol} #Solana`;

      // Store tweet for the social poster to pick up
      await (this.runtime as any).cacheManager?.set(
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
      const emoji = won ? "✅" : "❌";
      const pnl = trade.pnlPercent ?? 0;

      const lessons = won
        ? [
            "Patience pays. Let the thesis play out.",
            "Confluence of indicators = edge.",
            "Trust the data, not the noise.",
            "Risk management kept me in the game.",
          ]
        : [
            "Market had other plans. SL saved me from worse.",
            "Need to factor in more context next time.",
            "Small loss, lesson learned. Moving on.",
            "The setup was right but timing was off.",
          ];
      const lesson = lessons[Math.floor(Math.random() * lessons.length)];

      const tweet = `${emoji} CLOSED: $${trade.symbol} ${trade.direction}

P&L: ${pnl > 0 ? "+" : ""}${pnl.toFixed(2)}%

📝 What I learned: ${lesson}

Drift Protocol (devnet) | #crypto #trading #Solana`;

      await (this.runtime as any).cacheManager?.set(
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
      await (this.runtime as any).cacheManager?.set(key, JSON.stringify(trade), {
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
