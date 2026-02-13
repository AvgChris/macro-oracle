import { type Project, type ProjectAgent } from "@elizaos/core";
import { character } from "./character.ts";
import macroOraclePlugin from "./plugins/macro-oracle/index.ts";
import hyperliquidPerpsPlugin from "./plugins/hyperliquid-perps/index.ts";
import socialPlugin from "./plugins/social/index.ts";

/**
 * Chicken Buffett — Data-driven poultry trader
 *
 * A Macro Oracle-powered ElizaOS agent that:
 * 1. Monitors market signals via the Macro Oracle API
 * 2. Executes perpetual futures trades on Drift Protocol (Solana)
 * 3. Posts trade alerts and market commentary on Twitter/X
 */
export const projectAgent: ProjectAgent = {
  character,

  init: async (runtime) => {
    console.log("🐔 Chicken Buffett is suiting up...");
    console.log(
      `🐔 Macro Oracle API: ${String(runtime.getSetting("MACRO_ORACLE_API_URL") || "https://macro-oracle-production.up.railway.app")}`
    );
    const testnetVal = String(runtime.getSetting("HYPERLIQUID_TESTNET") ?? process.env.HYPERLIQUID_TESTNET ?? "true");
    console.log(`🐔 Hyperliquid Testnet: ${testnetVal !== "false" ? "YES" : "NO"}`);
    console.log("🐔 Ready to trade. Cluck cluck. 📈");
  },

  plugins: [macroOraclePlugin, hyperliquidPerpsPlugin, socialPlugin],
};

const project: Project = {
  agents: [projectAgent],
};

export default project;
