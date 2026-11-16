#!/bin/sh
# Inicialização do contêiner da API: segredo de sessão, migrations e dados iniciais.
set -e

# Sem JWT_SECRET definido, gera um segredo aleatório na primeira execução e o guarda
# em um volume. Assim não existe segredo padrão no repositório e as sessões
# continuam válidas entre reinícios.
if [ -z "$JWT_SECRET" ]; then
  ARQUIVO=/app/segredos/jwt_secret
  if [ ! -s "$ARQUIVO" ]; then
    node -e "process.stdout.write(require('node:crypto').randomBytes(48).toString('hex'))" > "$ARQUIVO"
    chmod 600 "$ARQUIVO"
    echo "Segredo de sessão gerado em $ARQUIVO."
  fi
  JWT_SECRET="$(cat "$ARQUIVO")"
  export JWT_SECRET
fi

echo "Aplicando migrations..."
npx prisma migrate deploy

# Catálogo sempre; dados de demonstração só em banco vazio. SEED=false pula esta etapa.
if [ "${SEED:-true}" = "true" ]; then
  npm run --silent db:seed
fi

exec "$@"
