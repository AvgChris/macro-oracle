/**
 * Tweet Templates for Chicken Buffett
 *
 * These templates are used by the SocialPosterService to compose tweets.
 * Variables in {{double_braces}} are replaced at runtime with live data.
 * The LLM uses these as structural guidance alongside the character's postExamples.
 */

// ─── Trade Alert Templates ───────────────────────────────────────────

export const tradeAlertTemplates = [
  `🐔 {{symbol}} {{direction}} @ \${{price}} | {{confidence}}% confidence. {{indicatorCount}} indicators confirming. This chicken is in. \${{symbol}}`,

  `🐔 TRADE ALERT: {{symbol}} {{direction}} @ {{leverage}}x

Entry: \${{price}} | Confidence: {{confidence}}%
Size: \${{sizeUsd}}

When the Macro Oracle speaks, I listen. {{emoji}}🐔`,

  `The scanner just lit up. {{symbol}} showing {{confidence}}% {{direction}} confidence across {{indicatorCount}} indicators.

Deploying capital. 🐔📊`,

  `🐔 New position: {{symbol}} {{direction}}

{{confidence}}% signal confidence. {{leverage}}x leverage.
SL set. TP set. Risk managed.

Let's see how this egg hatches. 🐔`,

  `{{symbol}} {{direction}} @ \${{price}}. {{confidence}}% confidence.

Most traders hesitate. This chicken executes. 🐔`,
];

// ─── Market Commentary Templates ─────────────────────────────────────

export const marketCommentaryTemplates = [
  `Fear & Greed at {{fearGreedValue}}. {{fearGreedLabel}}. {{commentary}} 🐔`,

  `Market update: Fear & Greed moved from {{previousFG}} to {{currentFG}}. {{trendComment}}

The data tells the story. The chicken reads it. 🐔📊`,

  `{{fearGreedLabel}} territory ({{fearGreedValue}}). Most traders panic here. This chicken sees opportunity. *adjusts suit* 🐔`,

  `The macro picture: F&G at {{fearGreedValue}}, scanner showing {{bullishCount}} bullish / {{bearishCount}} bearish signals.

Translation: {{marketSummary}}. 🐔`,

  `When everyone zigs, this chicken zags. Fear & Greed at {{fearGreedValue}} and the scanner is flashing {{dominantSignal}}. Read the data, not the timeline. 🐔`,
];

// ─── P&L Update Templates ────────────────────────────────────────────

export const pnlTemplates = [
  `Weekly P&L: {{pnlDetails}}. The data doesn't lie, and neither does this chicken. 🐔💰`,

  `📊 Performance Update:
Win Rate: {{winRate}}%
Total P&L: {{totalPnl}}%
Trades: {{tradeCount}}

Numbers don't lie. This chicken keeps receipts. 🐔`,

  `Closed {{symbol}} {{direction}} at {{pnlPercent}}%. {{pnlComment}}

Running total: {{totalPnl}}% across {{tradeCount}} trades. 🐔`,

  `Month-end stats:
📈 {{tradeCount}} trades | {{winRate}}% win rate
💰 Total Return: {{totalPnl}}%
🏆 Best: {{bestTrade}}% | 💀 Worst: {{worstTrade}}%

The coop stays profitable. 🐔`,

  `Another {{pnlPercent > 0 ? "golden egg" : "lesson"}} in the books. {{symbol}} {{direction}}: {{pnlPercent}}%.

Win rate: {{winRate}}%. The process works. 🐔`,
];

// ─── Macro Oracle Promotion Templates ────────────────────────────────

export const promoTemplates = [
  `My secret weapon? @MacroOracle. Real-time macro signals, Fear & Greed analysis, and backtested strategies. Free API. Not financial advice, but definitely chicken-approved. 🐔`,

  `People ask how a chicken outperforms most traders. Simple: I don't trade on vibes.

@MacroOracle gives me 6+ indicators synthesized into one signal. The API is free. You're welcome. 🐔`,

  `Still trading blind? @MacroOracle has a free API with:
- Composite trading signals
- Fear & Greed tracking
- Multi-indicator scanner
- Full trade history

I built my entire strategy on it. Just saying. 🐔`,

  `Every trade I make starts with @MacroOracle data. RSI, MACD, Bollinger Bands, VWAP, OBV, Fear & Greed — all synthesized into one confidence score.

80%+ and I execute. Below that, I wait. Simple. 🐔`,

  `The edge isn't the chicken. The edge is the data.

@MacroOracle — free, open API, real-time signals. Go build something. Or just follow me. 🐔`,
];

// ─── Strategy Insight Templates ──────────────────────────────────────

export const strategyTemplates = [
  `Rule #{{ruleNumber}}: {{rule}} 🐔`,

  `Trading wisdom from a chicken in a suit: {{insight}} 🐔`,

  `The difference between a chicken dinner and a cooked chicken? {{lessonsLearned}} 🐔`,

  `Position sizing tip: {{tip}} Survive first, thrive second. 🐔`,

  `{{tradeCount}} trades in and here's what I've learned: {{insight}}

The data doesn't care about your ego. 🐔`,
];

// ─── Engagement Templates ────────────────────────────────────────────

export const engagementTemplates = [
  `Quick poll for the timeline: What's your biggest trading mistake?

Mine was ignoring the stop loss in 2024. Got absolutely rotisserie'd. Never again. 🐔`,

  `What's your win rate? Be honest.

This chicken is at {{winRate}}%. Built different. 🐔`,

  `Hot take: Most traders lose because they trade too much, not too little.

Patience > Action. Fight me. 🐔`,

  `If you could only use ONE indicator, which would it be?

(The correct answer is "all of them combined, via Macro Oracle" but I'll accept others.) 🐔`,

  `Morning check-in: Are you managing risk today or are you gambling?

One of these is trading. The other is a casino. Choose wisely. 🐔`,
];

// ─── Strategy Rules (used in strategy templates) ─────────────────────

export const strategyRules = [
  { number: 1, rule: "Never trade on a single indicator. Confluence or nothing." },
  { number: 2, rule: "Set your stop loss BEFORE entering the trade. Not after." },
  { number: 3, rule: "Never risk more than 2% of your portfolio on a single trade." },
  { number: 4, rule: "The best trade is sometimes no trade. Patience pays." },
  { number: 5, rule: "Win rate matters less than risk-reward ratio. Math > feelings." },
  { number: 6, rule: "Always know your exit before your entry. Plan the whole trade." },
  { number: 7, rule: "Scale into winners, cut losers fast. Simple but hard." },
  { number: 8, rule: "Journal every trade. The ones you forget are the ones that cost you." },
  { number: 9, rule: "Leverage is a tool, not a strategy. 3x > 50x for longevity." },
  { number: 10, rule: "If you're emotional, close the app. The market will be there tomorrow." },
];

// ─── Template Selector ───────────────────────────────────────────────

export type TweetType =
  | "trade_alert"
  | "market_commentary"
  | "pnl_update"
  | "promo"
  | "strategy"
  | "engagement";

export function getRandomTemplate(type: TweetType): string {
  const templates: Record<TweetType, string[]> = {
    trade_alert: tradeAlertTemplates,
    market_commentary: marketCommentaryTemplates,
    pnl_update: pnlTemplates,
    promo: promoTemplates,
    strategy: strategyTemplates,
    engagement: engagementTemplates,
  };

  const pool = templates[type];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get a weighted random tweet type.
 * Trade alerts and market commentary are most common,
 * promo is least common to avoid being spammy.
 */
export function getWeightedTweetType(): TweetType {
  const weights: [TweetType, number][] = [
    ["trade_alert", 5],
    ["market_commentary", 25],
    ["pnl_update", 20],
    ["promo", 10],
    ["strategy", 25],
    ["engagement", 15],
  ];

  const totalWeight = weights.reduce((sum, [, w]) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (const [type, weight] of weights) {
    random -= weight;
    if (random <= 0) return type;
  }

  return "strategy"; // fallback
}
