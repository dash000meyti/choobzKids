# syntax=docker/dockerfile:1.7
# Choobz Kids — Next.js standalone server. SQLite DB, uploads and the image cache live on one volume (/data).
ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# ---- dependencies ----
# better-sqlite3 downloads a prebuilt binary from GitHub; where that is blocked or times out
# (Iranian build hosts) it compiles from source, which needs python3, make and g++. They stay in
# this stage only: the runtime image gets the finished .node file, not the toolchain.
FROM base AS deps
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# ---- build: a throwaway seeded DB lets prerendering run (TECH.md §2.9); it is not shipped ----
FROM base AS builder
ARG SITE_URL=https://choobz.kids
ENV SITE_URL=${SITE_URL} \
    CI=1 \
    DATABASE_PATH=/tmp/build/choobz.db \
    UPLOAD_DIR=/tmp/build/uploads
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx tsx scripts/migrate.ts && npx tsx scripts/seed.ts
RUN --mount=type=cache,target=/app/.next/cache npm run build && npm run build:scripts

# ---- runtime ----
FROM base AS runner
# Also needed at run time: pages re-rendered after a content edit build canonicals from it.
ARG SITE_URL=https://choobz.kids
ENV SITE_URL=${SITE_URL} \
    NODE_ENV=production \
    CHOOBZ_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_PATH=/data/choobz.db \
    UPLOAD_DIR=/data/uploads \
    SEED_DIR=/app/seed/content \
    SEED_MEDIA_DIR=/app/seed/uploads \
    MIGRATIONS_DIR=/app/drizzle \
    FONTCONFIG_FILE=/app/assets/og/fonts.conf \
    MALLOC_ARENA_MAX=2
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/assets ./assets
COPY --from=builder --chown=node:node /app/drizzle ./drizzle
COPY --from=builder --chown=node:node /app/.scripts ./scripts
COPY --from=builder --chown=node:node /app/seed ./seed
COPY --chmod=0755 docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN mkdir -p /data /app/.next/cache \
 && ln -s /data/cache/images /app/.next/cache/images \
 && chown -R node:node /data /app/.next/cache
USER node
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "server.js"]
