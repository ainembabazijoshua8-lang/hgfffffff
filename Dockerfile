# Dockerfile — for Fly.io, a VPS, or any container host.
# Debian (glibc) base so the better-sqlite3 prebuilt binary installs cleanly.
FROM node:20-bookworm-slim

WORKDIR /app

# Native build toolchain (fallback if no prebuilt better-sqlite3 binary).
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 8787

CMD ["node", "server/index.js", "--prod"]
