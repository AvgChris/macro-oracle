import {
  type Action,
  type ActionResult,
  type IAgentRuntime,
  type Memory,
  type State,
  type HandlerCallback,
} from "@elizaos/core";
import { getApiUrl, fetchSafe, type ScannerResult, type FearGreedData } from "../provider.ts";

// ─── Action ──────────────────────────────────────────────────────────

export const analyzeMarketAction: Action = {
  name: "ANALYZE_MARKET",
  similes: [
    "MARKET_ANALYSIS",
    "CHECK_MARKET",
    "SCANNER",
    "CHECK_SIGNALS",
    "MARKET_STATUS",
    "WHATS_THE_MARKET",
  ],
  description:
    "Fetch the latest Macro Oracle scanner results, Fear & Greed index, and signal data to provide a comprehensive market analysis.",

  validate: async (_runtime: IAgentRuntime): Promise<boolean> => {
    return true; // Always available
  },

  handler: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const apiUrl = getApiUrl(runtime);

      const [scannerHistory, fearGreed, signals] = await Promise.all([
        fetchSafe<ScannerResult[]>(`${apiUrl}/api/scanner/history`, []),
        fetchSafe<FearGreedData>(`${apiUrl}/api/fear-greed`, {
          value: 50,
          classification: "Neutral",
          timestamp: new Date().toISOString(),
        }),
        fetchSafe<Record<string, unknown>>(`${apiUrl}/api/signals`, {}),
      ]);

      // Categorize scanner results
      const latest = scannerHistory.slice(0, 10);
      const bullish = latest.filter((s) => s.direction === "LONG");
      const bearish = latest.filter((s) => s.direction === "SHORT");
      const highConfidence = latest.filter((s) => s.confidence >= 80);

      // Fear & Greed emoji
      let fgEmoji = "😐";
      if (fearGreed.value <= 20) fgEmoji = "😱";
      else if (fearGreed.value <= 40) fgEmoji = "😰";
      else if (fearGreed.value >= 80) fgEmoji = "🤑";
      else if (fearGreed.value >= 60) fgEmoji = "😏";

      // Format scanner results
      const scannerText = latest.length
        ? latest
            .map(
              (s) =>
                `  ${s.direction === "LONG" ? "🟢" : "🔴"} ${s.symbol}: ${s.direction} @ ${s.confidence}% confidence`
            )
            .join("\n")
        : "  No recent scanner results available";

      // High confidence alerts
      const alertText = highConfidence.length
        ? highConfidence
            .map(
              (s) =>
                `  🎯 ${s.symbol} ${s.direction} — ${s.confidence}% confidence`
            )
            .join("\n")
        : "  No high-confidence signals (≥80%) right now. Patience, young chickens.";

      const responseText = `🐔 MARKET ANALYSIS

${fgEmoji} FEAR & GREED: ${fearGreed.value} — ${fearGreed.classification}

📡 SCANNER RESULTS (latest ${latest.length}):
${scannerText}

  Bullish signals: ${bullish.length} | Bearish signals: ${bearish.length}

🎯 HIGH CONFIDENCE ALERTS (≥80%):
${alertText}

📊 COMPOSITE SIGNAL:
  Should Transact: ${(signals as Record<string, unknown>).shouldTransact ?? "N/A"}
  Direction: ${(signals as Record<string, unknown>).direction ?? "N/A"}
  Confidence: ${(signals as Record<string, unknown>).confidence ?? "N/A"}%

This chicken has analyzed the data. The coop has spoken. 🐔📊`;

      if (callback) {
        await callback({
          text: responseText,
          actions: ["ANALYZE_MARKET"],
        });
      }

      return {
        text: responseText,
        success: true,
        data: {
          scannerHistory: latest,
          fearGreed,
          signals,
          summary: {
            bullishCount: bullish.length,
            bearishCount: bearish.length,
            highConfidenceCount: highConfidence.length,
          },
        },
      };
    } catch (error) {
      const errMsg = (error as Error).message;
      console.error("[AnalyzeMarket] Error:", errMsg);

      if (callback) {
        await callback({
          text: `🐔 Market analysis temporarily unavailable: ${errMsg}. The data feed is molting. 🐔`,
          actions: ["ANALYZE_MARKET"],
        });
      }

      return {
        text: `Market analysis failed: ${errMsg}`,
        success: false,
        data: { error: errMsg },
      };
    }
  },

  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "What does the market look like?" },
      },
      {
        name: "{{agent}}",
        content: {
          text: "🐔 Let me scan the data for you...",
          action: "ANALYZE_MARKET",
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "Any good signals right now?" },
      },
      {
        name: "{{agent}}",
        content: {
          text: "🐔 Pulling up the Macro Oracle scanner...",
          action: "ANALYZE_MARKET",
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "What's the Fear & Greed index at?" },
      },
      {
        name: "{{agent}}",
        content: {
          text: "🐔 Let me check the sentiment data...",
          action: "ANALYZE_MARKET",
        },
      },
    ],
  ],
};
