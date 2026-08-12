# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy root tsconfig and workspace packages needed for build
COPY tsconfig.base.json ./
COPY packages/types ./packages/types
COPY apps/worker/package*.json ./apps/worker/
COPY apps/worker/tsconfig.json ./apps/worker/

WORKDIR /app/apps/worker
RUN npm install

COPY apps/worker/src/ ./src/

RUN npm run build
RUN npm prune --omit=dev

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Install FFmpeg and other runtime deps
RUN apk add --no-cache \
    ffmpeg \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# Chromium env vars required by Remotion
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV REMOTION_CHROME_EXECUTABLE=/usr/bin/chromium-browser

WORKDIR /app

# Copy built files and production node_modules
COPY --from=builder /app/apps/worker/node_modules ./node_modules
COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/apps/worker/package*.json ./
COPY --from=builder /app/packages/types ./packages/types

# Temp directory for renders (also mounted as Docker volume)
RUN mkdir -p /tmp/viraltier

ENV NODE_ENV=production
ENV PORT=3002

EXPOSE 3002

CMD ["node", "dist/index.js"]
