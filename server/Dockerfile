# Build and runtime stage
FROM node:20-bookworm-slim

# Install build dependencies for better-sqlite3 and wget for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    sqlite3 \
    libsqlite3-dev \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Create data directory for SQLite with proper permissions
RUN mkdir -p /app/data && chown -R appuser:appgroup /app/data
RUN chmod -R 777 /app/data

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

USER appuser

CMD ["node", "dist/index.js"]
