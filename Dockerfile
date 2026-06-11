# ──────────────────────────────────────────────
# Stage 1: Base – shared Alpine Node image
# ──────────────────────────────────────────────
FROM node:20-alpine AS base

# ──────────────────────────────────────────────
# Stage 2: Dependencies – install node_modules
# ──────────────────────────────────────────────
FROM base AS deps

# libc6-compat is required by some native Node modules on Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy lock files first so Docker caches this layer when deps don't change
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ──────────────────────────────────────────────
# Stage 3: Builder – compile the Next.js app
# ──────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars are baked into the client bundle.
# They MUST be provided here (or via docker-compose build args).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build

# ──────────────────────────────────────────────
# Stage 4: Runner – minimal production image
# ──────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Disable Next.js telemetry in production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only what the standalone server needs
COPY --from=builder /app/public ./public

# The standalone output includes a minimal server.js and traced node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
