import type { Plugin } from "@elizaos/core";
import { openPerpAction } from "./actions/open-perp.ts";
import { closePerpAction } from "./actions/close-perp.ts";
import { getPositionsAction } from "./actions/get-positions.ts";

/**
 * Hyperliquid Perpetual Futures Plugin
 *
 * Custom perps trading plugin for Chicken Buffett.
 * The existing @elizaos/plugin-hyperliquid only supports spot trading.
 * This plugin adds full perpetual futures support using the hyperliquid SDK:
 *
 * - Open positions (long/short) with configurable leverage
 * - Close positions (full or partial)
 * - Get live position data with P&L
 * - Support for stop loss and take profit orders
 * - Cross-margin mode
 * - Testnet support for safe development
 */
const hyperliquidPerpsPlugin: Plugin = {
  name: "hyperliquid-perps",
  description:
    "Hyperliquid perpetual futures trading — open/close perps with leverage, stop loss, and take profit",

  config: {
    HYPERLIQUID_PRIVATE_KEY: process.env.HYPERLIQUID_PRIVATE_KEY,
    HYPERLIQUID_TESTNET: process.env.HYPERLIQUID_TESTNET,
  },

  async init(config: Record<string, string>) {
    const hasKey = !!config.HYPERLIQUID_PRIVATE_KEY;
    const testnet = config.HYPERLIQUID_TESTNET !== "false";
    console.log(
      `[HyperliquidPerps] 🐔 Plugin initialized. Key: ${hasKey ? "✅" : "❌"} | Testnet: ${testnet ? "YES" : "NO"}`
    );
    if (!hasKey) {
      console.warn(
        "[HyperliquidPerps] 🐔 No private key — trading actions will be unavailable"
      );
    }
  },

  actions: [openPerpAction, closePerpAction, getPositionsAction],

  providers: [],
  services: [],
  events: {},
  routes: [],
};

export default hyperliquidPerpsPlugin;
