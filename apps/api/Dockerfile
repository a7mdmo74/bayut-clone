# Multi-stage Dockerfile for Bayara API
# Stage 1: Dependencies
FROM oven/bun:1 AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Stage 2: Builder
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lockb ./

# Copy source code and Prisma schema
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Build TypeScript
RUN bun run build

# Stage 3: Runner
FROM oven/bun:1 AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 bun && \
    adduser --system --uid 1001 bun

# Copy package files
COPY package.json bun.lockb ./

# Install production dependencies only
RUN bun install --frozen-lockfile --production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set permissions
RUN chown -R bun:bun /app

# Switch to non-root user
USER bun

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["bun", "run", "start"]
