import { Router } from "express";
import { z } from "zod";
import { prisma, type Prisma } from "../db";
import { StatusAnuncio, StatusTransacao } from "../generated/prisma/client";
import { conflito, naoEncontrado } from "../lib/erros";
import { anuncioResumido, usuarioPublico } from "../lib/selecoes";
import { idDaRota, paginacao, validar } from "../lib/validar";
import { exigirAdmin, usuarioLogado } from "../middleware/autenticacao";

export const rotasAdmin = Router();
rotasAdmin.use(exigirAdmin);

const pagina = (total: number, p: { pagina: number; porPagina: number }) => ({
  total,
  pagina: p.pagina,
  porPagina: p.porPagina,
  totalPaginas: Math.max(1, Math.ceil(total / p.porPagina)),
});

// ---------------------------------------------------------------------------
// Visão geral da plataforma
// ---------------------------------------------------------------------------

rotasAdmin.get("/resumo", async (_req, res) => {
  const [
    usuarios,
    anunciosPorStatus,
    negociacoesAbertas,
    transacoesPorStatus,
    porMes,
    porCategoria,
  ] = await Promise.all([
    prisma.usuario.count({ where: { papel: "USUARIO" } }),
    prisma.anuncio.groupBy({ by: ["status"], _count: true }),
    prisma.negociacao.count({ where: { status: "ABERTA" } }),
    prisma.transacao.groupBy({
      by: ["status"],
      _count: true,
      _sum: { valorTotalCentavos: true, comissaoCentavos: true },
    }),
    // Últimos 6 meses de volume negociado e comissão (transações pagas ou concluídas).
    prisma.$queryRaw<{ mes: Date; volume: bigint; comissao: bigint; quantidade: bigint }[]>`
      SELECT m.mes,
             COALESCE(SUM(t.valor_total_centavos), 0) AS volume,
             COALESCE(SUM(t.comissao_centavos), 0)    AS comissao,
             COUNT(t.id)                              AS quantidade
        FROM generate_series(
               date_trunc('month', now()) - interval '5 months',
               date_trunc('month', now()),
               interval '1 month'
             ) AS m(mes)
        LEFT JOIN transacoes t
               ON date_trunc('month', t.criado_em) = m.mes
              AND t.status IN ('PAGA', 'CONCLUIDA')
       GROUP BY m.mes
       ORDER BY m.mes`,
    prisma.$queryRaw<{ categoria: string; volume: bigint; quantidade: bigint }[]>`
      SELECT c.nome AS categoria,
             COALESCE(SUM(t.valor_total_centavos), 0) AS volume,
             COUNT(t.id)                              AS quantidade
        FROM transacoes t
        JOIN anuncios a   ON a.id = t.anuncio_id
        JOIN categorias c ON c.id = a.categoria_id
       WHERE t.status IN ('PAGA', 'CONCLUIDA')
       GROUP BY c.nome
       ORDER BY volume DESC
       LIMIT 6`,
  ]);

  const transacoes = Object.fromEntries(
    Object.values(StatusTransacao).map((status) => {
      const linha = transacoesPorStatus.find((t) => t.status === status);
      return [
        status,
        {
          quantidade: linha?._count ?? 0,
          valorTotalCentavos: linha?._sum.valorTotalCentavos ?? 0,
          comissaoCentavos: linha?._sum.comissaoCentavos ?? 0,
        },
      ];
    }),
  ) as Record<StatusTransacao, { quantidade: number; valorTotalCentavos: number; comissaoCentavos: number }>;

  const anuncios = Object.fromEntries(
    Object.values(StatusAnuncio).map((status) => [
      status,
      anunciosPorStatus.find((a) => a.status === status)?._count ?? 0,
    ]),
  ) as Record<StatusAnuncio, number>;

  res.json({
    usuarios,
    anuncios,
    negociacoesAbertas,
    transacoes,
    // Comissão realizada: negócios concluídos. A receber: pagos, aguardando retirada.
    comissaoRealizadaCentavos: transacoes.CONCLUIDA.comissaoCentavos,
    comissaoAReceberCentavos: transacoes.PAGA.comissaoCentavos,
    volumeNegociadoCentavos: transacoes.PAGA.valorTotalCentavos + transacoes.CONCLUIDA.valorTotalCentavos,
    porMes: porMes.map((m) => ({
      mes: m.mes,
      volumeCentavos: Number(m.volume),
      comissaoCentavos: Number(m.comissao),
      quantidade: Number(m.quantidade),
    })),
    porCategoria: porCategoria.map((c) => ({
      categoria: c.categoria,
      volumeCentavos: Number(c.volume),
      quantidade: Number(c.quantidade),
    })),
  });
});

// ---------------------------------------------------------------------------
// Usuários
// ---------------------------------------------------------------------------

const esquemaListaUsuarios = z.object({ q: z.string().trim().max(100).optional(), ...paginacao });

rotasAdmin.get("/usuarios", async (req, res) => {
  const f = validar(esquemaListaUsuarios, req.query);
  const where: Prisma.UsuarioWhereInput = f.q
    ? {
        OR: [
          { nome: { contains: f.q, mode: "insensitive" } },
          { email: { contains: f.q, mode: "insensitive" } },
          { organizacao: { contains: f.q, mode: "insensitive" } },
        ],
      }
    : {};
  const [total, itens] = await Promise.all([
    prisma.usuario.count({ where }),
    prisma.usuario.findMany({
      where,
      select: {
        ...usuarioPublico,
        email: true,
        telefone: true,
        papel: true,
        ativo: true,
        _count: { select: { anuncios: true, vendas: true, compras: true } },
      },
      orderBy: { criadoEm: "desc" },
      skip: (f.pagina - 1) * f.porPagina,
      take: f.porPagina,
    }),
  ]);
  res.json({ itens, ...pagina(total, f) });
});

rotasAdmin.patch("/usuarios/:id", async (req, res) => {
  const id = idDaRota(req);
  const { ativo } = validar(z.object({ ativo: z.boolean() }), req.body);
  if (id === usuarioLogado(req).id) throw conflito("Você não pode desativar a sua própria conta.");

  const existe = await prisma.usuario.findUnique({ where: { id }, select: { id: true } });
  if (!existe) throw naoEncontrado("Usuário");

  const usuario = await prisma.usuario.update({
    where: { id },
    data: { ativo },
    select: { id: true, nome: true, ativo: true },
  });
  res.json({ usuario });
});

// ---------------------------------------------------------------------------
// Moderação de anúncios
// ---------------------------------------------------------------------------

const esquemaListaAnuncios = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(StatusAnuncio).optional(),
  ...paginacao,
});

rotasAdmin.get("/anuncios", async (req, res) => {
  const f = validar(esquemaListaAnuncios, req.query);
  const where: Prisma.AnuncioWhereInput = {
    ...(f.status && { status: f.status }),
    ...(f.q && { titulo: { contains: f.q, mode: "insensitive" } }),
  };
  const [total, itens] = await Promise.all([
    prisma.anuncio.count({ where }),
    prisma.anuncio.findMany({
      where,
      select: { ...anuncioResumido, criadoEm: true },
      orderBy: { criadoEm: "desc" },
      skip: (f.pagina - 1) * f.porPagina,
      take: f.porPagina,
    }),
  ]);
  res.json({ itens, ...pagina(total, f) });
});

/** Suspende um anúncio (some da vitrine) ou libera um anúncio suspenso. */
rotasAdmin.patch("/anuncios/:id", async (req, res) => {
  const id = idDaRota(req);
  const { suspenso } = validar(z.object({ suspenso: z.boolean() }), req.body);

  const atual = await prisma.anuncio.findUnique({ where: { id } });
  if (!atual) throw naoEncontrado("Anúncio");

  if (suspenso) {
    if (atual.status === "ENCERRADO") throw conflito("Este anúncio já está encerrado.");
  } else if (atual.status !== "SUSPENSO") {
    throw conflito("Este anúncio não está suspenso.");
  }

  const anuncio = await prisma.anuncio.update({
    where: { id },
    data: {
      status: suspenso ? "SUSPENSO" : atual.quantidadeDisponivel.gt(0) ? "ATIVO" : "ESGOTADO",
    },
    select: { id: true, titulo: true, status: true },
  });
  res.json({ anuncio });
});

// ---------------------------------------------------------------------------
// Transações e comissões
// ---------------------------------------------------------------------------

const esquemaListaTransacoes = z.object({ status: z.enum(StatusTransacao).optional(), ...paginacao });

rotasAdmin.get("/transacoes", async (req, res) => {
  const f = validar(esquemaListaTransacoes, req.query);
  const where: Prisma.TransacaoWhereInput = f.status ? { status: f.status } : {};
  const [total, itens] = await Promise.all([
    prisma.transacao.count({ where }),
    prisma.transacao.findMany({
      where,
      include: {
        anuncio: { select: { id: true, titulo: true } },
        vendedor: { select: { id: true, nome: true, organizacao: true } },
        comprador: { select: { id: true, nome: true, organizacao: true } },
      },
      orderBy: { criadoEm: "desc" },
      skip: (f.pagina - 1) * f.porPagina,
      take: f.porPagina,
    }),
  ]);
  res.json({ itens, ...pagina(total, f) });
});
