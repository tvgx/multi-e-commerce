# Base stage for pruning
FROM node:22-alpine AS base
# openssl: lets Prisma detect the right libssl and generate the correct musl query engine.
RUN apk add --no-cache libc6-compat openssl
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

# Generate Prisma Client BEFORE building. api-core depends on @ecommerce/database,
# whose tsc build needs the real client (aggregates, Prisma.sql, typed $transaction).
# Without this, tsc fails with ~70 type errors. Builds schema from models/ then generates.
RUN npm run prisma:generate

RUN turbo run build --filter=api-core...

# Remove devDependencies to save space in the runner stage
RUN npm prune --production

# Runner stage
FROM node:22-alpine AS runner
WORKDIR /app

# Prisma query engine is a musl binary that needs libssl/libc6-compat at RUNTIME.
RUN apk add --no-cache libc6-compat openssl

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
ENV PORT=3000

EXPOSE 3000

CMD ["node", "apps/api-core/dist/main"]
