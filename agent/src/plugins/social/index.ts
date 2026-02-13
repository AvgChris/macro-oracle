import type { Plugin } from "@elizaos/core";
import { SocialPosterService } from "./services/social-poster.ts";

/**
 * Social Plugin for Chicken Buffett
 *
 * Handles scheduled social media posting:
 * - Trade alerts (triggered by signal watcher)
 * - Market commentary (Fear & Greed changes, macro shifts)
 * - P&L updates (daily/weekly recaps)
 * - Macro Oracle promotion
 * - Strategy insights and lessons learned
 * - Engagement posts (questions, discussions)
 *
 * Works alongside @elizaos/plugin-twitter which handles the actual
 * Twitter API integration and autonomous posting loop.
 */
const socialPlugin: Plugin = {
  name: "social",
  description:
    "Social media posting service for Chicken Buffett — scheduled trade alerts, market commentary, and engagement content",

  config: {
    TWITTER_API_KEY: process.env.TWITTER_API_KEY,
    TWITTER_ENABLE_POST: process.env.TWITTER_ENABLE_POST,
    SOCIAL_POST_MIN_INTERVAL_MS: process.env.SOCIAL_POST_MIN_INTERVAL_MS,
    SOCIAL_POST_MAX_INTERVAL_MS: process.env.SOCIAL_POST_MAX_INTERVAL_MS,
  },

  async init(config: Record<string, string>) {
    const twitterConfigured = !!config.TWITTER_API_KEY;
    const postEnabled = config.TWITTER_ENABLE_POST === "true";
    console.log(
      `[Social] 🐔 Plugin initialized. Twitter: ${twitterConfigured ? "✅" : "❌"} | Posting: ${postEnabled ? "ON" : "OFF"}`
    );
  },

  actions: [],
  providers: [],
  services: [SocialPosterService],
  events: {},
  routes: [],
};

export default socialPlugin;
