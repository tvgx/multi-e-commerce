# Base stage for pruning
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g turbo
WORKDIR /app

# Prune stage
FROM base AS pruner
COPY . .
RUN turbo prune --scope=storefront --docker

# Build stage
FROM base AS builder
WORKDIR /app

# Copy pruned lockfile and package.json
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Install dependencies
RUN npm install

# Copy source code and build
COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json
RUN turbo run build --filter=storefront...

# Runner stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Automatically leverage output traces to reduce image size
COPY --from=builder /app/apps/storefront/public ./apps/storefront/public

# Set the correct permission for prerender cache
RUN mkdir -p apps/storefront/.next
RUN chown nextjs:nodejs apps/storefront/.next

# Copy the standalone output and static folder
COPY --from=builder --chown=nextjs:nodejs /app/apps/storefront/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/storefront/.next/static ./apps/storefront/.next/static

USER nextjs

EXPOSE 3002

ENV PORT=3002
# server.js is created by next build from the standalone output
CMD ["node", "apps/storefront/server.js"]
