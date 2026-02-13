import type { Plugin } from "@elizaos/core";

/**
 * Drift Protocol Perpetual Futures Plugin
 *
 * Solana-native perps trading plugin for Chicken Buffett.
 * Uses @drift-labs/sdk to trade on Drift Protocol (devnet or mainnet).
 *
 * - Open positions (long/short) with configurable leverage
 * - Close positions (full or partial)
 * - Get live position data with P&L
 * - Stop loss and take profit via trigger orders
 * - 50+ markets on mainnet, ~29 on devnet
 */
const driftPerpsPlugin: Plugin = {
  name: "drift-perps",
  description: "Trade perpetual futures on Drift Protocol (Solana)",
  actions: [],
  providers: [],
  services: [],
};

export default driftPerpsPlugin;
