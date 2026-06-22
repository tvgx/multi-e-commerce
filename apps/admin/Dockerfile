# Base stage for pruning
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g turbo
WORKDIR /app

# Prune stage
FROM base AS pruner
COPY . .
RUN turbo prune --scope=admin --docker

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

# NEXT_PUBLIC_* được Next.js bake vào bundle TẠI build-time → phải truyền qua
# --build-arg khi build image cho production (mặc định fallback localhost cho dev).
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ARG NEXT_PUBLIC_STOREFRONT_URL
ARG NEXT_PUBLIC_STOREFRONT_HOST
ARG NEXT_PUBLIC_STOREFRONT_PROTOCOL=https
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_STOREFRONT_URL=${NEXT_PUBLIC_STOREFRONT_URL}
ENV NEXT_PUBLIC_STOREFRONT_HOST=${NEXT_PUBLIC_STOREFRONT_HOST}
ENV NEXT_PUBLIC_STOREFRONT_PROTOCOL=${NEXT_PUBLIC_STOREFRONT_PROTOCOL}

RUN turbo run build --filter=admin...

# Runner stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Next.js standalone output is preferred for K8s, but assuming standard build for now
# If standalone is enabled in next.config.ts, we would copy .next/standalone
COPY --from=builder /app/apps/admin/.next ./apps/admin/.next
COPY --from=builder /app/apps/admin/public ./apps/admin/public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npx", "next", "start", "--dir", "apps/admin", "-p", "3000"]
