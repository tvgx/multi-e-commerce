# Base stage for pruning
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g turbo
WORKDIR /app

# Prune stage
FROM base AS pruner
COPY . .
RUN turbo prune --scope=api-core --docker

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
RUN turbo run build --filter=api-core...

# Remove devDependencies to save space in the runner stage
RUN npm prune --production

# Runner stage
FROM node:22-alpine AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

# Only copy necessary files and production node_modules
COPY --from=builder /app/apps/api-core/dist ./apps/api-core/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "apps/api-core/dist/main"]
