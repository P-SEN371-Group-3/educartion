# -------------------------
# Stage 1 - Install dependencies
# -------------------------
FROM node:22-alpine AS deps

RUN corepack enable pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

# -------------------------
# Stage 2 - Build application
# -------------------------
FROM node:22-alpine AS builder

RUN corepack enable pnpm

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production

RUN pnpm build

# -------------------------
# Stage 3 - Production image
# -------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy the standalone server
COPY --from=builder /app/.next/standalone ./

# Copy static assets
COPY --from=builder /app/.next/static ./.next/static

# Copy public folder (if it exists)
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
