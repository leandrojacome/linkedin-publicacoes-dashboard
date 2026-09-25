FROM node:26.10.0-alpine3.24 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:26.10.0-alpine3.24 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:26.10.0-alpine3.24 AS runtime
ENV NODE_ENV=production PORT=5682 HOSTNAME=0.0.0.0 PUBLIC_MODE=true CONTENT_ROOT=/app/content
WORKDIR /app
COPY --from=build /app ./
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg \
    && mkdir -p /app/data \
    && chown -R node:node /app
USER node
EXPOSE 5682
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD wget -qO- http://127.0.0.1:5682/api/health || exit 1
CMD ["node","server.mjs","--production"]
