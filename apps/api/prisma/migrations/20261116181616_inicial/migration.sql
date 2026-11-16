-- CreateEnum
CREATE TYPE "tipo_organizacao" AS ENUM ('PRODUTOR', 'AGROINDUSTRIA', 'COOPERATIVA', 'EMPRESA', 'OUTRO');

-- CreateEnum
CREATE TYPE "papel" AS ENUM ('USUARIO', 'ADMIN');

-- CreateEnum
CREATE TYPE "unidade" AS ENUM ('KG', 'TONELADA', 'LITRO', 'M3', 'UNIDADE');

-- CreateEnum
CREATE TYPE "frequencia" AS ENUM ('UNICA', 'SEMANAL', 'QUINZENAL', 'MENSAL', 'SAFRA');

-- CreateEnum
CREATE TYPE "status_anuncio" AS ENUM ('ATIVO', 'PAUSADO', 'ESGOTADO', 'ENCERRADO', 'SUSPENSO');

-- CreateEnum
CREATE TYPE "status_negociacao" AS ENUM ('ABERTA', 'ACEITA', 'RECUSADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "status_transacao" AS ENUM ('AGUARDANDO_PAGAMENTO', 'PAGA', 'CONCLUIDA', 'CANCELADA');

-- CreateTable
CREATE TABLE "municipios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "municipios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "culturas" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "culturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "telefone" TEXT,
    "organizacao" TEXT,
    "tipo_organizacao" "tipo_organizacao" NOT NULL DEFAULT 'PRODUTOR',
    "papel" "papel" NOT NULL DEFAULT 'USUARIO',
    "bio" TEXT,
    "municipio_id" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "nota_media" DOUBLE PRECISION,
    "total_avaliacoes" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anuncios" (
    "id" SERIAL NOT NULL,
    "vendedor_id" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "cultura_id" INTEGER NOT NULL,
    "quantidade_disponivel" DECIMAL(12,3) NOT NULL,
    "unidade" "unidade" NOT NULL DEFAULT 'KG',
    "preco_unitario_centavos" INTEGER NOT NULL,
    "frequencia" "frequencia" NOT NULL DEFAULT 'UNICA',
    "condicoes_retirada" TEXT,
    "municipio_id" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" "status_anuncio" NOT NULL DEFAULT 'ATIVO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anuncios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos_anuncio" (
    "id" SERIAL NOT NULL,
    "anuncio_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fotos_anuncio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negociacoes" (
    "id" SERIAL NOT NULL,
    "anuncio_id" INTEGER NOT NULL,
    "comprador_id" INTEGER NOT NULL,
    "status" "status_negociacao" NOT NULL DEFAULT 'ABERTA',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "negociacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ofertas" (
    "id" SERIAL NOT NULL,
    "negociacao_id" INTEGER NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL,
    "preco_unitario_centavos" INTEGER NOT NULL,
    "mensagem" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ofertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacoes" (
    "id" SERIAL NOT NULL,
    "negociacao_id" INTEGER NOT NULL,
    "anuncio_id" INTEGER NOT NULL,
    "vendedor_id" INTEGER NOT NULL,
    "comprador_id" INTEGER NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL,
    "unidade" "unidade" NOT NULL,
    "preco_unitario_centavos" INTEGER NOT NULL,
    "valor_total_centavos" INTEGER NOT NULL,
    "taxa_comissao_bps" INTEGER NOT NULL,
    "comissao_centavos" INTEGER NOT NULL,
    "valor_liquido_centavos" INTEGER NOT NULL,
    "status" "status_transacao" NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
    "pago_em" TIMESTAMP(3),
    "concluida_em" TIMESTAMP(3),
    "cancelada_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" SERIAL NOT NULL,
    "transacao_id" INTEGER NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "avaliado_id" INTEGER NOT NULL,
    "nota" SMALLINT NOT NULL,
    "comentario" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "municipios_nome_uf_key" ON "municipios"("nome", "uf");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nome_key" ON "categorias"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_slug_key" ON "categorias"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "culturas_nome_key" ON "culturas"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "culturas_slug_key" ON "culturas"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_municipio_id_idx" ON "usuarios"("municipio_id");

-- CreateIndex
CREATE INDEX "anuncios_status_criado_em_idx" ON "anuncios"("status", "criado_em" DESC);

-- CreateIndex
CREATE INDEX "anuncios_categoria_id_idx" ON "anuncios"("categoria_id");

-- CreateIndex
CREATE INDEX "anuncios_cultura_id_idx" ON "anuncios"("cultura_id");

-- CreateIndex
CREATE INDEX "anuncios_municipio_id_idx" ON "anuncios"("municipio_id");

-- CreateIndex
CREATE INDEX "anuncios_vendedor_id_idx" ON "anuncios"("vendedor_id");

-- CreateIndex
CREATE INDEX "fotos_anuncio_anuncio_id_idx" ON "fotos_anuncio"("anuncio_id");

-- CreateIndex
CREATE INDEX "negociacoes_anuncio_id_idx" ON "negociacoes"("anuncio_id");

-- CreateIndex
CREATE INDEX "negociacoes_comprador_id_idx" ON "negociacoes"("comprador_id");

-- CreateIndex
CREATE INDEX "ofertas_negociacao_id_idx" ON "ofertas"("negociacao_id");

-- CreateIndex
CREATE UNIQUE INDEX "transacoes_negociacao_id_key" ON "transacoes"("negociacao_id");

-- CreateIndex
CREATE INDEX "transacoes_vendedor_id_idx" ON "transacoes"("vendedor_id");

-- CreateIndex
CREATE INDEX "transacoes_comprador_id_idx" ON "transacoes"("comprador_id");

-- CreateIndex
CREATE INDEX "transacoes_status_idx" ON "transacoes"("status");

-- CreateIndex
CREATE INDEX "avaliacoes_avaliado_id_idx" ON "avaliacoes"("avaliado_id");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacoes_transacao_id_autor_id_key" ON "avaliacoes"("transacao_id", "autor_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anuncios" ADD CONSTRAINT "anuncios_vendedor_id_fkey" FOREIGN KEY ("vendedor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anuncios" ADD CONSTRAINT "anuncios_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anuncios" ADD CONSTRAINT "anuncios_cultura_id_fkey" FOREIGN KEY ("cultura_id") REFERENCES "culturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anuncios" ADD CONSTRAINT "anuncios_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos_anuncio" ADD CONSTRAINT "fotos_anuncio_anuncio_id_fkey" FOREIGN KEY ("anuncio_id") REFERENCES "anuncios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negociacoes" ADD CONSTRAINT "negociacoes_anuncio_id_fkey" FOREIGN KEY ("anuncio_id") REFERENCES "anuncios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negociacoes" ADD CONSTRAINT "negociacoes_comprador_id_fkey" FOREIGN KEY ("comprador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_negociacao_id_fkey" FOREIGN KEY ("negociacao_id") REFERENCES "negociacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_negociacao_id_fkey" FOREIGN KEY ("negociacao_id") REFERENCES "negociacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_anuncio_id_fkey" FOREIGN KEY ("anuncio_id") REFERENCES "anuncios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_vendedor_id_fkey" FOREIGN KEY ("vendedor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_comprador_id_fkey" FOREIGN KEY ("comprador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_transacao_id_fkey" FOREIGN KEY ("transacao_id") REFERENCES "transacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_avaliado_id_fkey" FOREIGN KEY ("avaliado_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Regras de integridade escritas à mão (o Prisma não as declara no schema).
-- ---------------------------------------------------------------------------

-- Quantidades e preços nunca negativos.
ALTER TABLE "anuncios" ADD CONSTRAINT "anuncios_quantidade_nao_negativa" CHECK ("quantidade_disponivel" >= 0);
ALTER TABLE "anuncios" ADD CONSTRAINT "anuncios_preco_nao_negativo" CHECK ("preco_unitario_centavos" >= 0);
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_quantidade_positiva" CHECK ("quantidade" > 0);
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_preco_nao_negativo" CHECK ("preco_unitario_centavos" >= 0);

-- Os valores da transação precisam fechar: total = comissão + líquido.
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_quantidade_positiva" CHECK ("quantidade" > 0);
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_valores_consistentes" CHECK (
  "valor_total_centavos" >= 0
  AND "comissao_centavos" >= 0
  AND "valor_liquido_centavos" >= 0
  AND "valor_total_centavos" = "comissao_centavos" + "valor_liquido_centavos"
);
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_partes_distintas" CHECK ("vendedor_id" <> "comprador_id");

-- Nota de 1 a 5 e ninguém avalia a si mesmo.
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_nota_valida" CHECK ("nota" BETWEEN 1 AND 5);
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_autor_diferente_do_avaliado" CHECK ("autor_id" <> "avaliado_id");

-- Um comprador só pode ter uma negociação aberta por anúncio.
CREATE UNIQUE INDEX "negociacoes_uma_aberta_por_comprador" ON "negociacoes" ("anuncio_id", "comprador_id") WHERE "status" = 'ABERTA';
