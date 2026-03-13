FROM node:18-alpine AS alpine
RUN apk update
RUN apk add --no-cache libc6-compat

# Setup pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM alpine as builder
WORKDIR /app
RUN pnpm install -g turbo
COPY . .
RUN turbo prune api-core --docker

FROM alpine AS installer
WORKDIR /app

# First install dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/package.json ./package.json

RUN pnpm install

# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm turbo run build --filter=api-core...

FROM alpine AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

COPY --from=installer /app .

CMD ["node", "apps/api-core/dist/main.js"]
