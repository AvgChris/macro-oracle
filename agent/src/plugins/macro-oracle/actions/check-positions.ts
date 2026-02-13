import {
  type Action,
  type ActionResult,
  type IAgentRuntime,
  type Memory,
  type State,
  type HandlerCallback,
} from "@elizaos/core";
import { getApiUrl, fetchSafe } from "../provider.ts";

// ─── Types ───────────────────────────────────────────────────────────

interface Trade {
  id: string;
  symbol: string;
  direction: string;
  entryPrice: number;
  currentPrice?: number;
  pnlPercent?: number;
  status: string;
  openedAt: string;
  closedAt?: string;
}

// ─── Action ──────────────────────────────────────────────────────────

export const checkPositionsAction: Action = {
  name: "CHECK_POSITIONS",
  similes: [
    "SHOW_POSITIONS",
    "MY_POSITIONS",
    "OPEN_POSITIONS",
    "PORTFOLIO",
    "POSITION_STATUS",
  ],
  description:
    "Check current open positions, trade history, and P&L from both Macro Oracle trade log and Hyperliquid.",

  validate: async (_runtime: IAgentRuntime): Promise<boolean> => {
    return true; // Always available — shows data even without active trades
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

      // Fetch trades and stats in parallel
      const [trades, stats] = await Promise.all([
        fetchSafe<Trade[]>(`${apiUrl}/api/trades`, []),
        fetchSafe<Record<string, unknown>>(`${apiUrl}/api/trades/stats`, {}),
      ]);

      const openTrades = trades.filter((t) => t.status === "OPEN");
      const closedTrades = trades.filter((t) => t.status === "CLOSED");
      const recentClosed = closedTrades.slice(0, 5);

      // Format open positions
      let openText = "No open positions. This chicken is patient. 🐔";
      if (openTrades.length > 0) {
        openText = openTrades
          .map(
            (t) =>
              `  📍 ${t.symbol} ${t.direction} | Entry: $${t.entryPrice}${t.pnlPercent !== undefined ? ` | P&L: ${t.pnlPercent > 0 ? "+" : ""}${t.pnlPercent}%` : ""}`
          )
          .join("\n");
      }

      // Format recent closed trades
      let closedText = "No closed trades yet.";
      if (recentClosed.length > 0) {
        closedText = recentClosed
          .map(
            (t) =>
              `  ${t.pnlPercent !== undefined && t.pnlPercent >= 0 ? "✅" : "❌"} ${t.symbol} ${t.direction} | P&L: ${t.pnlPercent !== undefined && t.pnlPercent > 0 ? "+" : ""}${t.pnlPercent ?? "N/A"}%`
          )
          .join("\n");
      }

      const responseText = `🐔 POSITION REPORT

📂 OPEN POSITIONS (${openTrades.length}):
${openText}

📜 RECENT CLOSED (last 5):
${closedText}

📈 OVERALL STATS:
  Total Trades: ${(stats as Record<string, unknown>).totalTrades ?? 0}
  Win Rate: ${(stats as Record<string, unknown>).winRate ?? 0}%
  Total P&L: ${Number((stats as Record<string, unknown>).totalPnlPercent ?? 0) > 0 ? "+" : ""}${(stats as Record<string, unknown>).totalPnlPercent ?? 0}%

The numbers don't lie. This chicken keeps receipts. 🐔📊`;

      if (callback) {
        await callback({
          text: responseText,
          actions: ["CHECK_POSITIONS"],
        });
      }

      return {
        text: responseText,
        success: true,
        data: { openTrades, recentClosed, stats },
      };
    } catch (error) {
      const errMsg = (error as Error).message;
      console.error("[CheckPositions] Error:", errMsg);

      if (callback) {
        await callback({
          text: `🐔 Couldn't fetch position data: ${errMsg}. Even Bloomberg has outages. 🐔`,
          actions: ["CHECK_POSITIONS"],
        });
      }

      return {
        text: `Failed to check positions: ${errMsg}`,
        success: false,
        data: { error: errMsg },
      };
    }
  },

  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "What positions do you have open?" },
      },
      {
        name: "{{agent}}",
        content: {
          text: "🐔 Let me pull up the portfolio...",
          action: "CHECK_POSITIONS",
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "How's the P&L looking?" },
      },
      {
        name: "{{agent}}",
        content: {
          text: "🐔 Checking the numbers now...",
          action: "CHECK_POSITIONS",
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "Show me your trades" },
      },
      {
        name: "{{agent}}",
        content: {
          text: "🐔 Pulling up the trade log. This chicken keeps receipts...",
          action: "CHECK_POSITIONS",
        },
      },
    ],
  ],
};
