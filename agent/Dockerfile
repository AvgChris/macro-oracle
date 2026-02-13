# ─── Chicken Buffett — ElizaOS Agent ───────────────────────────────────
# Data-driven poultry trader powered by Macro Oracle
# ──────────────────────────────────────────────────────────────────────

FROM node:23-slim AS base

# Install bun
RUN npm install -g bun@1.3.4

WORKDIR /app

# ─── Dependencies ─────────────────────────────────────────────────────
FROM base AS deps

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# ─── Build ────────────────────────────────────────────────────────────
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bun run build

# ─── Runtime ──────────────────────────────────────────────────────────
FROM base AS runner

ENV NODE_ENV=production

# Install ElizaOS CLI globally
RUN npm install -g @elizaos/cli@1.7.2

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

# Start Chicken Buffett
CMD ["elizaos", "start"]
