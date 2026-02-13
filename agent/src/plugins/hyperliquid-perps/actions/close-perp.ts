import {
  type Action,
  type ActionResult,
  type IAgentRuntime,
  type Memory,
  type State,
  type HandlerCallback,
  ModelType,
} from "@elizaos/core";
import { z } from "zod";
import { getHyperliquidClient } from "../client.ts";

// ─── Schema ──────────────────────────────────────────────────────────

const ClosePerpSchema = z.object({
  symbol: z.string().toUpperCase().describe("Trading symbol to close"),
  sizePercent: z
    .number()
    .min(1)
    .max(100)
    .default(100)
    .describe("Percentage of position to close (100 = full close)"),
});

const EXTRACT_TEMPLATE = `
Extract the position closing parameters from the conversation.

Recent messages:
{{recentMessages}}

Extract:
- symbol: the token position to close (uppercase)
- sizePercent: what percentage to close (100 = all, 50 = half, etc.)

Respond with a JSON object.
`;

// ─── Action ──────────────────────────────────────────────────────────

export const closePerpAction: Action = {
  name: "CLOSE_PERP",
  similes: [
    "CLOSE_PERPETUAL",
    "CLOSE_POSITION",
    "EXIT_POSITION",
    "TAKE_PROFIT",
    "STOP_LOSS",
    "EXIT_TRADE",
  ],
  description:
    "Close a perpetual futures position on Hyperliquid. Can close full position or a percentage.",

  validate: async (runtime: IAgentRuntime): Promise<boolean> => {
    return !!runtime.getSetting("HYPERLIQUID_PRIVATE_KEY");
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const client = getHyperliquidClient(runtime);
      if (!client) {
        if (callback) {
          await callback({
            text: "🐔 Hyperliquid not configured. Can't close what I can't access. 🐔",
          });
        }
        return { text: "Hyperliquid not configured", success: false, data: {} };
      }

      // Extract parameters using LLM
      const context = EXTRACT_TEMPLATE.replace(
        "{{recentMessages}}",
        message.content.text || ""
      );

      const llmResult = await runtime.useModel(ModelType.TEXT_SMALL, {
        prompt: context,
        maxTokens: 200,
        temperature: 0.1,
      });

      const jsonStr = String(llmResult).replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      const extracted = JSON.parse(jsonStr);
      const params = ClosePerpSchema.parse(extracted);

      // Get position info before closing (for P&L reporting)
      const positions = await client.getPositions();
      const position = positions.find(
        (p) => p.symbol.toUpperCase() === params.symbol.toUpperCase()
      );

      if (!position) {
        if (callback) {
          await callback({
            text: `🐔 No open position found for ${params.symbol}. Can't close what doesn't exist — even this chicken knows that. 🐔`,
          });
        }
        return {
          text: `No position for ${params.symbol}`,
          success: false,
          data: { symbol: params.symbol },
        };
      }

      // Close the position
      const result = await client.closePosition({
        symbol: params.symbol,
        sizePercent: params.sizePercent,
      });

      if (result.success) {
        const pnlEmoji = position.unrealizedPnl >= 0 ? "✅💰" : "❌";
        const pnlText =
          position.unrealizedPnlPercent >= 0
            ? `+${position.unrealizedPnlPercent.toFixed(2)}%`
            : `${position.unrealizedPnlPercent.toFixed(2)}%`;

        if (callback) {
          await callback({
            text: `🐔 POSITION CLOSED ${pnlEmoji}

📊 ${params.symbol} ${position.side.toUpperCase()} — ${params.sizePercent}% closed
💵 Entry: $${position.entryPrice.toFixed(2)} → Exit: ~$${position.markPrice.toFixed(2)}
📈 P&L: ${pnlText} ($${position.unrealizedPnl.toFixed(2)})

${position.unrealizedPnl >= 0 ? "Another egg in the basket." : "Small loss. Risk managed. Live to trade another day."} 🐔`,
            actions: ["CLOSE_PERP"],
          });
        }

        return { text: "Position closed", success: true, data: { ...result, pnl: position.unrealizedPnlPercent } };
      } else {
        if (callback) {
          await callback({
            text: `🐔 Failed to close position: ${result.error}. 🐔`,
            actions: ["CLOSE_PERP"],
          });
        }
        return { text: `Failed: ${result.error}`, success: false, data: result as any };
      }
    } catch (error) {
      const errMsg = (error as Error).message;
      console.error("[ClosePerp] Error:", errMsg);

      if (callback) {
        await callback({
          text: `🐔 Error closing position: ${errMsg}. 🐔`,
        });
      }
      return { text: `Error: ${errMsg}`, success: false, data: { error: errMsg } };
    }
  },

  examples: [
    [
      { name: "{{user1}}", content: { text: "Close my ETH position" } },
      {
        name: "{{agent}}",
        content: {
          text: "🐔 Closing the ETH position. Let me calculate the P&L...",
          action: "CLOSE_PERP",
        },
      },
    ],
    [
      { name: "{{user1}}", content: { text: "Close half of my SOL long" } },
      {
        name: "{{agent}}",
        content: {
          text: "🐔 Closing 50% of the SOL position. Locking in partial profits...",
          action: "CLOSE_PERP",
        },
      },
    ],
    [
      { name: "{{user1}}", content: { text: "Exit all positions" } },
      {
        name: "{{agent}}",
        content: {
          text: "🐔 Closing everything. Sometimes the best trade is no trade...",
          action: "CLOSE_PERP",
        },
      },
    ],
  ],
};
