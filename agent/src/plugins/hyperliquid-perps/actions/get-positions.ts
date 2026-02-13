import {
  type Action,
  type ActionResult,
  type IAgentRuntime,
  type Memory,
  type State,
  type HandlerCallback,
} from "@elizaos/core";
import { getHyperliquidClient } from "../client.ts";

// ─── Action ──────────────────────────────────────────────────────────

export const getPositionsAction: Action = {
  name: "GET_POSITIONS",
  similes: [
    "SHOW_PERP_POSITIONS",
    "HYPERLIQUID_POSITIONS",
    "HL_POSITIONS",
    "MY_PERPS",
    "OPEN_PERPS",
  ],
  description:
    "Get all open perpetual futures positions on Hyperliquid with live P&L data.",

  validate: async (runtime: IAgentRuntime): Promise<boolean> => {
    return !!runtime.getSetting("HYPERLIQUID_PRIVATE_KEY");
  },

  handler: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const client = getHyperliquidClient(runtime);
      if (!client) {
        if (callback) {
          await callback({
            text: "🐔 Hyperliquid not configured. Set HYPERLIQUID_PRIVATE_KEY to see positions. 🐔",
          });
        }
        return { text: "Hyperliquid not configured", success: false, data: {} };
      }

      const [positions, accountSummary] = await Promise.all([
        client.getPositions(),
        client.getAccountSummary(),
      ]);

      if (positions.length === 0) {
        if (callback) {
          await callback({
            text: `🐔 No open positions on Hyperliquid.

💰 Account Value: $${accountSummary.accountValue || "N/A"}
💵 Withdrawable: $${accountSummary.withdrawable || "N/A"}
🌐 Network: ${runtime.getSetting("HYPERLIQUID_TESTNET") !== "false" ? "TESTNET" : "MAINNET"}

Dry powder ready. Waiting for the next signal. 🐔`,
            actions: ["GET_POSITIONS"],
          });
        }

        return {
          text: "No open positions",
          success: true,
          data: { positions: [], accountSummary },
        };
      }

      // Format positions
      const positionLines = positions.map((p) => {
        const pnlEmoji = p.unrealizedPnl >= 0 ? "🟢" : "🔴";
        const pnlText =
          p.unrealizedPnlPercent >= 0
            ? `+${p.unrealizedPnlPercent.toFixed(2)}%`
            : `${p.unrealizedPnlPercent.toFixed(2)}%`;

        return `  ${pnlEmoji} ${p.symbol} ${p.side.toUpperCase()} @ ${p.leverage}x
     Entry: $${p.entryPrice.toFixed(2)} | Mark: $${p.markPrice.toFixed(2)}
     Size: ${p.size.toFixed(4)} | P&L: ${pnlText} ($${p.unrealizedPnl.toFixed(2)})
     Liq: $${p.liquidationPrice.toFixed(2)} | Margin: $${p.marginUsed.toFixed(2)}`;
      });

      const totalPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
      const totalPnlEmoji = totalPnl >= 0 ? "📈" : "📉";

      if (callback) {
        await callback({
          text: `🐔 HYPERLIQUID POSITIONS (${positions.length})

${positionLines.join("\n\n")}

${totalPnlEmoji} Total Unrealized P&L: $${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
💰 Account Value: $${accountSummary.accountValue || "N/A"}
🌐 Network: ${runtime.getSetting("HYPERLIQUID_TESTNET") !== "false" ? "TESTNET" : "MAINNET"}

The numbers are in. This chicken is ${totalPnl >= 0 ? "winning" : "managing risk"}. 🐔`,
          actions: ["GET_POSITIONS"],
        });
      }

      return {
        text: `${positions.length} open positions`,
        success: true,
        data: { positions, accountSummary, totalPnl },
      };
    } catch (error) {
      const errMsg = (error as Error).message;
      console.error("[GetPositions] Error:", errMsg);

      if (callback) {
        await callback({
          text: `🐔 Error fetching positions: ${errMsg}. 🐔`,
        });
      }
      return { text: `Error: ${errMsg}`, success: false, data: { error: errMsg } };
    }
  },

  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "Show me my Hyperliquid positions" },
      },
      {
        name: "{{agent}}",
        content: {
          text: "🐔 Pulling up the Hyperliquid positions...",
          action: "GET_POSITIONS",
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "What perps do I have open?" },
      },
      {
        name: "{{agent}}",
        content: {
          text: "🐔 Let me check the perps book...",
          action: "GET_POSITIONS",
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "How's the portfolio doing on HL?" },
      },
      {
        name: "{{agent}}",
        content: {
          text: "🐔 Checking the Hyperliquid portfolio now...",
          action: "GET_POSITIONS",
        },
      },
    ],
  ],
};
