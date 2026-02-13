import type { Plugin } from "@elizaos/core";
import { macroOracleProvider } from "./provider.ts";
import { executeSignalAction } from "./actions/execute-signal.ts";
import { checkPositionsAction } from "./actions/check-positions.ts";
import { analyzeMarketAction } from "./actions/analyze-market.ts";
import { SignalWatcherService } from "./services/signal-watcher.ts";

/**
 * Macro Oracle Plugin for Chicken Buffett
 *
 * Integrates with the Macro Oracle API to provide:
 * - Real-time market signal context (provider)
 * - Trade execution from signals (action)
 * - Position checking (action)
 * - Market analysis (action)
 * - Background signal monitoring & auto-trading (service)
 */
const macroOraclePlugin: Plugin = {
  name: "macro-oracle",
  description:
    "Macro Oracle integration — market signals, trade execution, and automated signal-following for Chicken Buffett",

  config: {
    MACRO_ORACLE_API_URL: process.env.MACRO_ORACLE_API_URL,
    AUTO_TRADE_ENABLED: process.env.AUTO_TRADE_ENABLED,
    DEFAULT_LEVERAGE: process.env.DEFAULT_LEVERAGE,
    DEFAULT_SIZE_USD: process.env.DEFAULT_SIZE_USD,
  },

  async init(config: Record<string, string>) {
    const apiUrl =
      config.MACRO_ORACLE_API_URL ||
      "https://macro-oracle-production.up.railway.app";
    console.log(`[MacroOracle] 🐔 Plugin initialized. API: ${apiUrl}`);
  },

  providers: [macroOracleProvider],

  actions: [executeSignalAction, checkPositionsAction, analyzeMarketAction],

  services: [SignalWatcherService],

  events: {},
  routes: [],
};

export default macroOraclePlugin;
