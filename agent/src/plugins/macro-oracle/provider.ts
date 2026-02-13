import { type Provider, type ProviderResult, type IAgentRuntime } from "@elizaos/core";
import axios from "axios";

// ─── Types ───────────────────────────────────────────────────────────

interface ScannerResult {
  symbol: string;
  direction: "LONG" | "SHORT";
  confidence: number;
  indicators: Record<string, string>;
  timestamp: string;
  price?: number;
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

interface FearGreedData {
  value: number;
  classification: string;
  timestamp: string;
}

interface SignalData {
  shouldTransact: boolean;
  direction?: string;
  confidence?: number;
  reasons?: string[];
}

// ─── Helper ──────────────────────────────────────────────────────────

function getApiUrl(runtime: IAgentRuntime): string {
  return (
    runtime.getSetting("MACRO_ORACLE_API_URL") ||
    "https://macro-oracle-production.up.railway.app"
  );
}

async function fetchSafe<T>(url: string, fallback: T): Promise<T> {
  try {
    const { data } = await axios.get<T>(url, { timeout: 10000 });
    return data;
  } catch (err) {
    console.error(`[MacroOracle] Failed to fetch ${url}:`, (err as Error).message);
    return fallback;
  }
}

// ─── Provider ────────────────────────────────────────────────────────

export const macroOracleProvider: Provider = {
  name: "MACRO_ORACLE",
  description:
    "Provides real-time macro trading signals, scanner results, Fear & Greed index, trade history, and performance stats from the Macro Oracle API",

  get: async (runtime, _message, _state): Promise<ProviderResult> => {
    const apiUrl = getApiUrl(runtime);

    // Fetch all endpoints in parallel
    const [signals, scannerHistory, fearGreed, tradeStats] = await Promise.all([
      fetchSafe<SignalData>(`${apiUrl}/api/signals`, {
        shouldTransact: false,
      }),
      fetchSafe<ScannerResult[]>(`${apiUrl}/api/scanner/history`, []),
      fetchSafe<FearGreedData>(`${apiUrl}/api/fear-greed`, {
        value: 50,
        classification: "Neutral",
        timestamp: new Date().toISOString(),
      }),
      fetchSafe<TradeStats>(`${apiUrl}/api/trades/stats`, {
        totalTrades: 0,
        winRate: 0,
        totalPnlPercent: 0,
        avgWin: 0,
        avgLoss: 0,
        bestTrade: 0,
        worstTrade: 0,
      }),
    ]);

    // Format latest scanner results (last 5)
    const latestScans = scannerHistory.slice(0, 5);
    const scannerText = latestScans.length
      ? latestScans
          .map(
            (s) =>
              `  ${s.symbol}: ${s.direction} @ ${s.confidence}% confidence (${s.timestamp})`
          )
          .join("\n")
      : "  No recent scanner results";

    // Compose context string
    const text = `
=== MACRO ORACLE DATA ===

📊 CURRENT SIGNAL:
  Should Transact: ${signals.shouldTransact}
  Direction: ${signals.direction || "N/A"}
  Confidence: ${signals.confidence || "N/A"}%
  Reasons: ${signals.reasons?.join(", ") || "N/A"}

📡 LATEST SCANNER RESULTS:
${scannerText}

😱 FEAR & GREED INDEX:
  Value: ${fearGreed.value} (${fearGreed.classification})
  Updated: ${fearGreed.timestamp}

📈 TRADING PERFORMANCE:
  Total Trades: ${tradeStats.totalTrades}
  Win Rate: ${tradeStats.winRate}%
  Total P&L: ${tradeStats.totalPnlPercent > 0 ? "+" : ""}${tradeStats.totalPnlPercent}%
  Avg Win: +${tradeStats.avgWin}%
  Avg Loss: ${tradeStats.avgLoss}%
  Best Trade: +${tradeStats.bestTrade}%
  Worst Trade: ${tradeStats.worstTrade}%

=========================
`.trim();

    return {
      text,
      values: {
        signals,
        scannerHistory: latestScans,
        fearGreed,
        tradeStats,
      },
      data: {
        signals,
        scannerHistory: latestScans,
        fearGreed,
        tradeStats,
        apiUrl,
      },
    };
  },
};

// Export helper for use in other modules
export { getApiUrl, fetchSafe };
export type { ScannerResult, TradeStats, FearGreedData, SignalData };
