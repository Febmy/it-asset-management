# Multi-stage Dockerfile for Next.js IT Asset Management
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies only when needed
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time placeholder environment variables
# These are only used during the build phase and don't carry over to the runner stage
ENV JWT_SECRET="build-time-placeholder-secret-min-32-characters-long"
ENV CRON_SECRET_TOKEN="build-time-placeholder-cron-secret"
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/it_assets"
ENV REDIS_URL="redis://localhost:6379"
ENV CSRF_SECRET="build-time-placeholder-secret-min-32-characters-long"
ENV NODE_ENV="production"
ENV NEXT_PHASE="phase-production-build"

# Generate Prisma client if needed (not applicable here, but keeping pattern)
# RUN npx prisma generate

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy database migration files
COPY --from=builder --chown=nextjs:nodejs /app/db ./db
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrate.js ./scripts/migrate.js

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]