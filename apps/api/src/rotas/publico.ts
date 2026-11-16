import { Router } from "express";
import { prisma } from "../db";
import { env } from "../env";

export const rotasPublicas = Router();

/** Listas de apoio para filtros e formulários. */
rotasPublicas.get("/catalogo", async (_req, res) => {
  const [categorias, culturas, municipios] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { nome: "asc" } }),
    prisma.cultura.findMany({ orderBy: { nome: "asc" } }),
    prisma.municipio.findMany({ orderBy: [{ nome: "asc" }] }),
  ]);
  res.json({ categorias, culturas, municipios, taxaComissaoBps: env.COMISSAO_BPS });
});

/** Números gerais exibidos na página inicial. */
rotasPublicas.get("/estatisticas", async (_req, res) => {
  const [anunciosAtivos, organizacoes, negociosFechados, municipios] = await Promise.all([
    prisma.anuncio.count({ where: { status: "ATIVO", vendedor: { ativo: true } } }),
    prisma.usuario.count({ where: { ativo: true, papel: "USUARIO" } }),
    prisma.transacao.count({ where: { status: { in: ["PAGA", "CONCLUIDA"] } } }),
    prisma.anuncio.findMany({
      where: { status: "ATIVO", vendedor: { ativo: true } },
      distinct: ["municipioId"],
      select: { municipioId: true },
    }),
  ]);
  res.json({
    anunciosAtivos,
    organizacoes,
    negociosFechados,
    municipiosComOferta: municipios.length,
  });
});

rotasPublicas.get("/saude", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok" });
});
