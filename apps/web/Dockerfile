# Frontend Next.js em três estágios: dependências, build e uma imagem final enxuta.

FROM node:24-slim AS dependencias
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-slim AS build
WORKDIR /app
COPY --from=dependencias /app/node_modules ./node_modules
COPY . .
# Os rewrites (/api e /uploads → API) são fixados no build: o endereço da API
# precisa ser conhecido aqui. No docker compose é o nome do serviço.
ARG API_URL=http://api:3333
ENV API_URL=$API_URL NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-slim AS execucao
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
# `output: "standalone"` gera um servidor mínimo; estáticos e public são copiados à parte.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
