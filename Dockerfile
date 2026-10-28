FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    OFC2_DATA_DIR=/data \
    OFC2_CHROME=/usr/bin/chromium \
    SIRAAJ_CHROME_PATH=/usr/bin/chromium \
    OFC2_APPLET_DB=/data/applets/siraaj.sqlite
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 poppler-utils chromium fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/next.config.mjs ./next.config.mjs
COPY --from=build /app/public ./public
COPY --from=build /app/lib ./lib
COPY --from=build /app/legacy ./legacy
COPY --from=build /app/fixtures ./fixtures
RUN mkdir -p /data
CMD ["npm", "start"]
