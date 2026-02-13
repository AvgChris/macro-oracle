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

const OpenPerpSchema = z.object({
  symbol: z.string().toUpperCase().describe("Trading symbol (e.g. ETH, SOL, BTC)"),
  direction: z.enum(["LONG", "SHORT"]).describe("Trade direction"),
  sizeUsd: z.number().min(10).default(100).describe("Position size in USD"),
  leverage: z.number().min(1).max(50).default(3).describe("Leverage multiplier"),
  stopLossPercent: z
    .number()
    .min(0)
    .max(50)
    .optional()
    .describe("Stop loss as percentage from entry"),
  takeProfitPercent: z
    .number()
    .min(0)
    .max(200)
    .optional()
    .describe("Take profit as percentage from entry"),
});

const EXTRACT_TEMPLATE = `
Extract the perpetual futures trade parameters from the conversation.

Recent messages:
{{recentMessages}}

Extract these fields:
- symbol: the token to trade (uppercase, e.g. ETH, SOL, BTC, ASTER)
- direction: LONG or SHORT
- sizeUsd: position size in USD (default 100)
- leverage: leverage multiplier (default 3)
- stopLossPercent: optional stop loss percentage from entry
- takeProfitPercent: optional take profit percentage from entry

Respond with a JSON object.
`;

// ─── Action ──────────────────────────────────────────────────────────

export const openPerpAction: Action = {
  name: "OPEN_PERP",
  similes: [
    "OPEN_PERPETUAL",
    "LONG_PERP",
    "SHORT_PERP",
    "OPEN_POSITION",
    "BUY_PERP",
    "SELL_PERP",
  ],
  description:
    "Open a perpetual futures position on Hyperliquid with configurable leverage, stop loss, and take profit.",

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
            text: "🐔 Hyperliquid not configured. Need HYPERLIQUID_PRIVATE_KEY to trade. This chicken can't trade without keys to the coop. 🐔",
          });
        }
        return { text: "Hyperliquid not configured", success: false, data: {} };
      }

      // Extract parameters from conversation using LLM
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
      const params = OpenPerpSchema.parse(extracted);

      // Execute the trade
      const result = await client.openPosition({
        symbol: params.symbol,
        direction: params.direction,
        sizeUsd: params.sizeUsd,
        leverage: params.leverage,
        stopLossPercent: params.stopLossPercent,
        takeProfitPercent: params.takeProfitPercent,
      });

      if (result.success) {
        const slText = params.stopLossPercent
          ? `\n🛑 Stop Loss: ${params.stopLossPercent}%`
          : "";
        const tpText = params.takeProfitPercent
          ? `\n🎯 Take Profit: ${params.takeProfitPercent}%`
          : "";

        if (callback) {
          await callback({
            text: `🐔 POSITION OPENED

📊 ${params.symbol} ${params.direction} @ ${params.leverage}x
💰 Size: $${params.sizeUsd} (${result.size.toFixed(4)} ${params.symbol})
💵 Entry: ~$${result.price.toFixed(2)}${slText}${tpText}

Order ID: ${result.orderId}
Network: ${String(runtime.getSetting("HYPERLIQUID_TESTNET") ?? "") !== "false" ? "TESTNET" : "MAINNET"}

Position is live. This chicken is in the trade. 🐔📈`,
            actions: ["OPEN_PERP"],
          });
        }

        return { text: "Position opened successfully", success: true, data: result as any };
      } else {
        if (callback) {
          await callback({
            text: `🐔 Failed to open position: ${result.error}. This chicken will try again. 🐔`,
            actions: ["OPEN_PERP"],
          });
        }
        return { text: `Failed: ${result.error}`, success: false, data: result as any };
      }
    } catch (error) {
      const errMsg = (error as Error).message;
      console.error("[OpenPerp] Error:", errMsg);

      if (callback) {
        await callback({
          text: `🐔 Error opening perp position: ${errMsg}. Even Wall Street has bad days. 🐔`,
        });
      }
      return { text: `Error: ${errMsg}`, success: false, data: { error: errMsg } };
    }
  },

  examples: [
    [
      { name: "{{user1}}", content: { text: "Open a 3x long on ETH with $200" } },
      {
        name: "{{agent}}",
        content: {
          text: "🐔 Opening a 3x ETH long with $200. Let me execute that...",
          action: "OPEN_PERP",
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "Short SOL at 5x with a 5% stop loss" },
      },
      {
        name: "{{agent}}",
        content: {
          text: "🐔 SOL short at 5x with a 5% stop loss. Executing now...",
          action: "OPEN_PERP",
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: {
          text: "Go long ASTER with $500, 10x leverage, 3% SL and 15% TP",
        },
      },
      {
        name: "{{agent}}",
        content: {
          text: "🐔 ASTER long, $500, 10x, 3% SL, 15% TP. That's a spicy one. Executing...",
          action: "OPEN_PERP",
        },
      },
    ],
  ],
};
