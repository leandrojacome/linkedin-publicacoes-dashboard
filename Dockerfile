FROM node:22.14-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22.14-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22.14-alpine AS runtime
ENV NODE_ENV=production PORT=5682 HOSTNAME=0.0.0.0 PUBLIC_MODE=true CONTENT_ROOT=/app/content
WORKDIR /app
COPY --from=build /app ./
RUN mkdir -p /app/data && chown -R node:node /app
USER node
EXPOSE 5682
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD wget -qO- http://127.0.0.1:5682/api/health || exit 1
CMD ["npm","run","start"]

