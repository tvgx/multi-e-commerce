# Base stage for pruning
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g turbo
WORKDIR /app

# Prune stage — keep only what design-agent needs
FROM base AS pruner
COPY . .
RUN turbo prune --scope=design-agent --docker

# Build stage
FROM base AS builder
WORKDIR /app

# Copy pruned lockfile and package.json
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Install dependencies
RUN npm install

# Copy source code and build (also builds @ecommerce/* workspace deps via ^build)
COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json
RUN turbo run build --filter=design-agent...

# Remove devDependencies to save space in the runner stage
RUN npm prune --production

# Runner stage
FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

# App build + production deps
COPY --from=builder /app/apps/design-agent/dist ./apps/design-agent/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# The chatbot reads ui-registry source + master-templates dist at runtime
# (registry is React/CSS and can't be imported — its source is parsed instead),
# so the workspace packages must be present for the @ecommerce/* symlinks.
COPY --from=builder /app/packages ./packages

ENV NODE_ENV=production
ENV DESIGN_AGENT_PORT=3100

EXPOSE 3100

# `serve` boots the HTTP server (POST /design-agent/chat).
# tsc emits src/ + scripts/ under dist, so the entrypoint is dist/src/main.js.
CMD ["node", "apps/design-agent/dist/src/main.js", "serve"]
