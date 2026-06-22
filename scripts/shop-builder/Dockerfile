# syntax=docker/dockerfile:1
#
# Worker image — shop-builder (Bull queue consumer cho queue 'shop-build').
#
# worker.ts import trực tiếp TỪ apps/api-core/src/... và chạy qua ts-node
# (npm run worker:shop-builder). Vì vậy image cần FULL workspace install +
# các package @ecommerce/* đã build (dist) + Prisma client đã generate.
# Worker KHÔNG nằm trong turbo workspace nên không dùng `turbo prune` được —
# ta copy nguyên repo (đã loại node_modules/.next/dist qua .dockerignore).
#
# BUILD TRÊN CI (ghcr.io), KHÔNG build trên box production (sẽ OOM).
FROM node:22-alpine

# libc6-compat + openssl: cần cho Prisma engine và sharp trên Alpine (musl).
RUN apk add --no-cache libc6-compat openssl
RUN npm install -g turbo
WORKDIR /app

# Copy toàn bộ monorepo (root package.json giữ script worker:shop-builder + ts-node).
COPY . .

# npm install (KHÔNG dùng `npm ci`) để regenerate native binding đúng nền alpine/musl.
# prisma:generate → build schema.prisma rồi generate client (engine musl).
# turbo build api-core^... → build các @ecommerce/* mà api-core (và worker) import.
RUN npm install \
 && npm run prisma:generate \
 && turbo run build --filter=api-core^...

# Chạy non-root (file thuộc root nhưng world-readable; worker chỉ đọc/exec + ghi network).
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 worker
USER worker

ENV NODE_ENV=production
# Worker đọc REDIS_HOST / REDIS_PORT (KHÔNG phải REDIS_URL) + SHOP_BUILD_CONCURRENCY.
CMD ["npm", "run", "worker:shop-builder"]
