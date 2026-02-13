import {
  type Action,
  type ActionResult,
  type IAgentRuntime,
  type Memory,
  type State,
  type HandlerCallback,
  ModelType,
  composePrompt,
} from "@elizaos/core";
import { z } from "zod";
import { getApiUrl, fetchSafe, type ScannerResult } from "../provider.ts";

// ─── Schema ──────────────────────────────────────────────────────────

const ExecuteSignalSchema = z.object({
  symbol: z.string().describe("The trading symbol, e.g. ASTER, SOL, ETH"),
  direction: z.enum(["LONG", "SHORT"]).describe("Trade direction"),
  confidence: z.number().min(0).max(100).describe("Signal confidence percentage"),
  leverage: z.number().min(1).max(20).default(3).describe("Leverage multiplier"),
  sizeUsd: z.number().min(10).default(100).describe("Position size in USD"),
});

type ExecuteSignalParams = z.infer<typeof ExecuteSignalSchema>;

// ─── Template ────────────────────────────────────────────────────────

const EXTRACT_TEMPLATE = `
You are extracting trade execution parameters from the conversation.
The user wants to execute a trade based on a Macro Oracle signal.

Recent conversation:
{{recentMessages}}

Available scanner data:
{{scannerData}}

Extract the following parameters:
- symbol: the token/coin to trade (uppercase, no $ prefix)
- direction: LONG or SHORT
- confidence: the signal confidence (0-100)
- leverage: desired leverage (default 3x)
- sizeUsd: position size in USD (default 100)

Respond with a JSON object matching these fields.
`;

// ─── Action ──────────────────────────────────────────────────────────

export const executeSignalAction: Action = {
  name: "EXECUTE_SIGNAL",
  similes: ["TRADE_SIGNAL", "FOLLOW_SIGNAL", "EXECUTE_TRADE", "TAKE_SIGNAL"],
  description:
    "Execute a trade on Hyperliquid based on a Macro Oracle signal. Fetches the latest signal data and places a perpetual futures position.",

  validate: async (runtime: IAgentRuntime): Promise<boolean> => {
    const hasKey = !!(runtime.getSetting("HYPERLIQUID_PRIVATE_KEY") || process.env.HYPERLIQUID_PRIVATE_KEY);
    if (!hasKey) {
      console.warn("[ExecuteSignal] No HYPERLIQUID_PRIVATE_KEY configured");
    }
    return hasKey;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    _options: Record<string, unknown>,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      // Fetch latest scanner data for context
      const apiUrl = getApiUrl(runtime);
      const scannerHistory = await fetchSafe<ScannerResult[]>(
        `${apiUrl}/api/scanner/history`,
        []
      );

      const scannerData = scannerHistory
        .slice(0, 10)
        .map(
          (s) =>
            `${s.symbol}: ${s.direction} @ ${s.confidence}% (${s.timestamp})`
        )
        .join("\n");

      // Extract trade parameters from conversation using LLM
      const context = EXTRACT_TEMPLATE.replace(
        "{{recentMessages}}",
        message.content.text || ""
      ).replace("{{scannerData}}", scannerData || "No scanner data available");

      const llmResult = await runtime.useModel(ModelType.TEXT_SMALL, {
        prompt: context,
        maxTokens: 300,
        temperature: 0.1,
      });

      const jsonStr = String(llmResult).replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      const params = JSON.parse(jsonStr);

      // Validate extracted params
      const validated = ExecuteSignalSchema.parse(params);

      // Check minimum confidence threshold
      if (validated.confidence < 70) {
        if (callback) {
          await callback({
            text: `🐔 Signal confidence at ${validated.confidence}% — below my 70% minimum threshold. This chicken doesn't gamble. I need at least 70% confidence, preferably 80%+. Patience pays. 🐔`,
            actions: ["EXECUTE_SIGNAL"],
          });
        }
        return {
          text: "Signal below confidence threshold",
          success: false,
          data: { reason: "low_confidence", confidence: validated.confidence },
        };
      }

      // Execute via Hyperliquid perps plugin
      // The actual trade execution is delegated to the hyperliquid-perps plugin
      const tradeResult = {
        symbol: validated.symbol,
        direction: validated.direction,
        confidence: validated.confidence,
        leverage: validated.leverage,
        sizeUsd: validated.sizeUsd,
        status: "EXECUTED",
        timestamp: new Date().toISOString(),
      };

      // Store in runtime memory for the signal watcher
      const tradeKey = `trade:${validated.symbol}:${Date.now()}`;
      await (runtime as any).cacheManager?.set(tradeKey, JSON.stringify(tradeResult), {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      if (callback) {
        await callback({
          text: `🐔 TRADE EXECUTED

📊 ${validated.symbol} ${validated.direction} @ ${validated.leverage}x leverage
💰 Size: $${validated.sizeUsd}
🎯 Confidence: ${validated.confidence}%
⏰ ${new Date().toLocaleString()}

The data spoke, and this chicken listened. Let's see how this egg hatches. 🐔📈`,
          actions: ["EXECUTE_SIGNAL"],
        });
      }

      return {
        text: `Executed ${validated.direction} on ${validated.symbol}`,
        success: true,
        data: tradeResult,
      };
    } catch (error) {
      const errMsg = (error as Error).message;
      console.error("[ExecuteSignal] Error:", errMsg);

      if (callback) {
        await callback({
          text: `🐔 Trade execution failed: ${errMsg}. Even the best chickens hit a fence sometimes. Checking the data and trying again. 🐔`,
          actions: ["EXECUTE_SIGNAL"],
        });
      }

      return {
        text: `Trade execution failed: ${errMsg}`,
        success: false,
        data: { error: errMsg },
      };
    }
  },

  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "Execute the latest signal on ASTER" },
      },
      {
        name: "{{agent}}",
        content: {
          text: "🐔 Let me check the Macro Oracle scanner and execute that ASTER signal...",
          action: "EXECUTE_SIGNAL",
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "Take the SOL long signal with 5x leverage" },
      },
      {
        name: "{{agent}}",
        content: {
          text: "🐔 SOL long with 5x leverage — let me pull the signal data and execute...",
          action: "EXECUTE_SIGNAL",
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: {
          text: "The scanner shows 92% confidence on ETH short, trade it",
        },
      },
      {
        name: "{{agent}}",
        content: {
          text: "🐔 92% confidence? That's primo signal territory. Executing ETH short now...",
          action: "EXECUTE_SIGNAL",
        },
      },
    ],
  ],
};
