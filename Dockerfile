# ---- base image --------------------------------------------------------
# Node 24 slim (matches engines field in package.json).
# Uses the built-in SQLite module (experimental, available in Node 22+).
FROM node:24-slim AS base
WORKDIR /app

# ---- dependency layer --------------------------------------------------
# Copy manifests first so this layer is cached unless deps change.
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Keep devDependencies (including TypeScript types) for the seed step.
FROM base AS deps-full
COPY package.json package-lock.json ./
RUN npm ci

# ---- seed layer --------------------------------------------------------
# Run the seed script at build time so the DB is baked into the image.
# The data/ directory will be carried into the final image.
FROM deps-full AS seeder
COPY . .
RUN mkdir -p data && node_modules/.bin/tsx scripts/seed.ts

# ---- production image --------------------------------------------------
FROM base AS production

# Copy production dependencies only.
COPY --from=deps /app/node_modules ./node_modules

# Copy application source and static files. package.json is required so tsx
# detects "type": "module" and preserves top-level await as ESM.
COPY package.json ./
COPY src        ./src
COPY public     ./public
COPY seed       ./seed
COPY scripts    ./scripts
COPY tsconfig.json ./

# Copy the pre-seeded database from the seeder stage.
COPY --from=seeder /app/data ./data

# Non-root user for security.
RUN groupadd -r appgroup && useradd -r -g appgroup appuser \
 && chown -R appuser:appgroup /app
USER appuser

# Expose the HTTP/WS port (override via PORT env var at runtime).
EXPOSE 3000

# Environment defaults — override with --env / docker-compose environment.
ENV PORT=3000 \
    NODE_ENV=production \
    DB_PATH=data/app.sqlite

# Health check: poll the server's root every 30 s.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+process.env.PORT).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node_modules/.bin/tsx", "src/server.ts"]
