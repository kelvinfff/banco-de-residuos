import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { TipoOrganizacao } from "../generated/prisma/client";
import { naoEncontrado, requisicaoInvalida } from "../lib/erros";
import { anuncioCompleto, usuarioPrivado, usuarioPublico } from "../lib/selecoes";
import { idDaRota, latitude, longitude, textoAnulavel, validar } from "../lib/validar";
import { exigirLogin, usuarioLogado } from "../middleware/autenticacao";

export const rotasUsuarios = Router();

const esquemaPerfil = z
  .object({
    nome: z.string().trim().min(2).max(120),
    telefone: textoAnulavel(20),
    organizacao: textoAnulavel(120),
    tipoOrganizacao: z.enum(TipoOrganizacao),
    bio: textoAnulavel(600),
    municipioId: z.number().int().positive(),
    latitude: latitude.nullable(),
    longitude: longitude.nullable(),
  })
  .partial()
  .refine((d) => (d.latitude == null) === (d.longitude == null), {
    message: "Informe latitude e longitude juntas.",
    path: ["latitude"],
  });

rotasUsuarios.patch("/eu", exigirLogin, async (req, res) => {
  const dados = validar(esquemaPerfil, req.body);
  if (dados.municipioId !== undefined) {
    const municipio = await prisma.municipio.findUnique({ where: { id: dados.municipioId } });
    if (!municipio) throw requisicaoInvalida("Município inválido.");
  }
  const usuario = await prisma.usuario.update({
    where: { id: usuarioLogado(req).id },
    data: dados,
    select: usuarioPrivado,
  });
  res.json({ usuario });
});

/** Números do painel do usuário logado. */
rotasUsuarios.get("/eu/resumo", exigirLogin, async (req, res) => {
  const eu = usuarioLogado(req).id;

  const [anunciosAtivos, negociacoesAbertas, vendas, compras, pagamentosPendentes, retiradasPendentes] =
    await Promise.all([
      prisma.anuncio.count({ where: { vendedorId: eu, status: "ATIVO" } }),
      prisma.negociacao.findMany({
        where: { status: "ABERTA", OR: [{ compradorId: eu }, { anuncio: { vendedorId: eu } }] },
        select: { ofertas: { orderBy: { id: "desc" }, take: 1, select: { autorId: true } } },
      }),
      prisma.transacao.aggregate({
        where: { vendedorId: eu, status: { in: ["PAGA", "CONCLUIDA"] } },
        _sum: { valorTotalCentavos: true, valorLiquidoCentavos: true, comissaoCentavos: true },
        _count: true,
      }),
      prisma.transacao.aggregate({
        where: { compradorId: eu, status: { in: ["PAGA", "CONCLUIDA"] } },
        _sum: { valorTotalCentavos: true },
        _count: true,
      }),
      prisma.transacao.count({ where: { compradorId: eu, status: "AGUARDANDO_PAGAMENTO" } }),
      prisma.transacao.count({ where: { compradorId: eu, status: "PAGA" } }),
    ]);

  res.json({
    anunciosAtivos,
    negociacoesAbertas: negociacoesAbertas.length,
    aguardandoMinhaResposta: negociacoesAbertas.filter((n) => n.ofertas[0]?.autorId !== eu).length,
    pagamentosPendentes,
    retiradasPendentes,
    vendas: {
      quantidade: vendas._count,
      valorTotalCentavos: vendas._sum.valorTotalCentavos ?? 0,
      valorLiquidoCentavos: vendas._sum.valorLiquidoCentavos ?? 0,
      comissaoCentavos: vendas._sum.comissaoCentavos ?? 0,
    },
    compras: {
      quantidade: compras._count,
      valorTotalCentavos: compras._sum.valorTotalCentavos ?? 0,
    },
  });
});

/** Perfil público: dados básicos, reputação, anúncios ativos e avaliações recebidas. */
rotasUsuarios.get("/:id", async (req, res) => {
  const id = idDaRota(req);
  const usuario = await prisma.usuario.findFirst({
    where: { id, ativo: true },
    select: { ...usuarioPublico, bio: true },
  });
  if (!usuario) throw naoEncontrado("Usuário");

  const [anuncios, avaliacoes, negociosConcluidos] = await Promise.all([
    prisma.anuncio.findMany({
      where: { vendedorId: id, status: "ATIVO" },
      include: anuncioCompleto,
      orderBy: { criadoEm: "desc" },
      take: 12,
    }),
    prisma.avaliacao.findMany({
      where: { avaliadoId: id },
      orderBy: { criadoEm: "desc" },
      take: 20,
      select: {
        id: true,
        nota: true,
        comentario: true,
        criadoEm: true,
        autor: { select: { id: true, nome: true, organizacao: true } },
      },
    }),
    prisma.transacao.count({
      where: { status: "CONCLUIDA", OR: [{ vendedorId: id }, { compradorId: id }] },
    }),
  ]);

  res.json({ usuario, anuncios, avaliacoes, negociosConcluidos });
});
