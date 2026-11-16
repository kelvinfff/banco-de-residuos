# API Express + Prisma. O TypeScript roda direto com tsx (sem etapa de compilação),
# por isso as devDependencies também são instaladas.

FROM node:24-slim
# O motor de migrations do Prisma precisa do OpenSSL.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
# O postinstall gera o Prisma Client a partir do schema.
RUN npm ci

COPY . .
# Pastas que recebem volumes: precisam pertencer ao usuário sem privilégios.
RUN mkdir -p uploads segredos && chown -R node:node /app
USER node

ENV NODE_ENV=production PORT=3333
EXPOSE 3333
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
CMD ["npm", "start"]
