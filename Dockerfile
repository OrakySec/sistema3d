# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# ─────────────────────────────────────────
# STAGE 1: Dependências
# ─────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ─────────────────────────────────────────
# STAGE 2: Build
# ─────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gerar cliente Prisma
RUN npx prisma generate

# Build Next.js (standalone)
ENV NEXT_TELEMETRY_DISABLED=1
# Variáveis dummy apenas para o build não quebrar — valores reais vêm em runtime
ENV DATABASE_URL="postgresql://x:x@localhost:5432/x"
ENV AUTH_SECRET="build-placeholder-secret-32chars!!"
RUN npm run build

# ─────────────────────────────────────────
# STAGE 3: Runner
# ─────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Aplicação Next.js standalone
COPY --from=builder /app/public                          ./public
COPY --from=builder /app/prisma                         ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

# Prisma CLI + cliente gerado (necessário para migrate deploy no startup)
COPY --from=builder /app/node_modules/.prisma           ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma           ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma            ./node_modules/prisma

# Entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./docker-entrypoint.sh"]
