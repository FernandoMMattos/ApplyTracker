FROM node:20-alpine AS base

# ─── Dependencies stage ───────────────────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# ─── Builder stage ────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx prisma generate

ARG GIT_HASH=local
ENV GIT_HASH=$GIT_HASH
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── Runner stage ─────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# prisma migrate deploy needs the schema, migrations, CLI, and migration engine.
# The standalone output omits these, so copy them explicitly from the builder.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/engines ./node_modules/@prisma/engines

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
