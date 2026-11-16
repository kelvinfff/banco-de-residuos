import { Router } from "express";
import { z } from "zod";
import { prisma, type Prisma } from "../db";
import { StatusTransacao } from "../generated/prisma/client";
import { conflito, naoEncontrado, proibido } from "../lib/erros";
import { anuncioResumido, usuarioComContato, usuarioPublico } from "../lib/selecoes";
import { idDaRota, textoOpcional, validar } from "../lib/validar";
import { exigirLogin, usuarioLogado, type UsuarioSessao } from "../middleware/autenticacao";

export const rotasTransacoes = Router();
rotasTransacoes.use(exigirLogin);

const inclusaoDetalhe = {
  anuncio: { select: anuncioResumido },
  // Com o negócio fechado, as partes passam a ver o contato uma da outra.
  vendedor: { select: usuarioComContato },
  comprador: { select: usuarioComContato },
  avaliacoes: {
    select: { id: true, autorId: true, avaliadoId: true, nota: true, comentario: true, criadoEm: true },
  },
} satisfies Prisma.TransacaoInclude;

type TransacaoDetalhada = Prisma.TransacaoGetPayload<{ include: typeof inclusaoDetalhe }>;

function apresentar(transacao: TransacaoDetalhada, eu: UsuarioSessao) {
  const souComprador = transacao.compradorId === eu.id;
  const souVendedor = transacao.vendedorId === eu.id;
  const jaAvaliei = transacao.avaliacoes.some((a) => a.autorId === eu.id);
  return {
    ...transacao,
    meuPapel: souComprador ? "comprador" : souVendedor ? "vendedor" : "observador",
    possoPagar: souComprador && transacao.status === "AGUARDANDO_PAGAMENTO",
    possoConfirmarRetirada: souComprador && transacao.status === "PAGA",
    possoCancelar: (souComprador || souVendedor) && transacao.status === "AGUARDANDO_PAGAMENTO",
    possoAvaliar: (souComprador || souVendedor) && transacao.status === "CONCLUIDA" && !jaAvaliei,
  };
}

async function carregarTransacao(id: number, eu: UsuarioSessao) {
  const transacao = await prisma.transacao.findUnique({ where: { id }, include: inclusaoDetalhe });
  if (!transacao) throw naoEncontrado("Transação");
  const participo = transacao.compradorId === eu.id || transacao.vendedorId === eu.id;
  if (!participo && eu.papel !== "ADMIN") throw naoEncontrado("Transação");
  return transacao;
}

// ---------------------------------------------------------------------------
// Listagem e detalhe
// ---------------------------------------------------------------------------

const esquemaLista = z.object({
  papel: z.enum(["comprador", "vendedor", "todos"]).default("todos"),
  status: z.enum(StatusTransacao).optional(),
});

rotasTransacoes.get("/", async (req, res) => {
  const eu = usuarioLogado(req);
  const f = validar(esquemaLista, req.query);

  const itens = await prisma.transacao.findMany({
    where: {
      ...(f.papel === "comprador"
        ? { compradorId: eu.id }
        : f.papel === "vendedor"
          ? { vendedorId: eu.id }
          : { OR: [{ compradorId: eu.id }, { vendedorId: eu.id }] }),
      ...(f.status && { status: f.status }),
    },
    include: {
      anuncio: { select: anuncioResumido },
      vendedor: { select: usuarioPublico },
      comprador: { select: usuarioPublico },
      avaliacoes: { select: { autorId: true } },
    },
    orderBy: { criadoEm: "desc" },
    take: 200,
  });

  res.json({
    itens: itens.map(({ avaliacoes, ...t }) => ({
      ...t,
      meuPapel: t.compradorId === eu.id ? "comprador" : "vendedor",
      avaliacaoPendente: t.status === "CONCLUIDA" && !avaliacoes.some((a) => a.autorId === eu.id),
    })),
  });
});

rotasTransacoes.get("/:id", async (req, res) => {
  const eu = usuarioLogado(req);
  const transacao = await carregarTransacao(idDaRota(req), eu);
  res.json({ transacao: apresentar(transacao, eu) });
});

// ---------------------------------------------------------------------------
// Pagamento simulado
// ---------------------------------------------------------------------------
// No MVP nenhum dinheiro real circula: "pagar" apenas registra o pagamento.
// O valor fica retido pela plataforma até o comprador confirmar a retirada;
// então o líquido (total − comissão) é considerado repassado ao vendedor.

rotasTransacoes.post("/:id/pagar", async (req, res) => {
  const eu = usuarioLogado(req);
  const transacao = await carregarTransacao(idDaRota(req), eu);
  if (transacao.compradorId !== eu.id) throw proibido("Apenas o comprador pode pagar.");

  const resultado = await prisma.transacao.updateMany({
    where: { id: transacao.id, status: "AGUARDANDO_PAGAMENTO" },
    data: { status: "PAGA", pagoEm: new Date() },
  });
  if (resultado.count === 0) throw conflito("Esta transação não está aguardando pagamento.");

  res.json({ transacao: apresentar(await carregarTransacao(transacao.id, eu), eu) });
});

rotasTransacoes.post("/:id/confirmar-retirada", async (req, res) => {
  const eu = usuarioLogado(req);
  const transacao = await carregarTransacao(idDaRota(req), eu);
  if (transacao.compradorId !== eu.id) throw proibido("Apenas o comprador confirma a retirada.");

  const resultado = await prisma.transacao.updateMany({
    where: { id: transacao.id, status: "PAGA" },
    data: { status: "CONCLUIDA", concluidaEm: new Date() },
  });
  if (resultado.count === 0) {
    throw conflito("A retirada só pode ser confirmada depois do pagamento.");
  }

  res.json({ transacao: apresentar(await carregarTransacao(transacao.id, eu), eu) });
});

/** Antes do pagamento, qualquer uma das partes pode desistir; o material volta ao anúncio. */
rotasTransacoes.post("/:id/cancelar", async (req, res) => {
  const eu = usuarioLogado(req);
  const transacao = await carregarTransacao(idDaRota(req), eu);
  if (transacao.compradorId !== eu.id && transacao.vendedorId !== eu.id) {
    throw proibido("Apenas comprador e vendedor podem cancelar.");
  }

  await prisma.$transaction(async (tx) => {
    const resultado = await tx.transacao.updateMany({
      where: { id: transacao.id, status: "AGUARDANDO_PAGAMENTO" },
      data: { status: "CANCELADA", canceladaEm: new Date() },
    });
    if (resultado.count === 0) {
      throw conflito("Só é possível cancelar antes do pagamento.");
    }
    await tx.anuncio.update({
      where: { id: transacao.anuncioId },
      data: { quantidadeDisponivel: { increment: transacao.quantidade } },
    });
    // Um anúncio que tinha esgotado por causa desta venda volta à vitrine.
    await tx.anuncio.updateMany({
      where: { id: transacao.anuncioId, status: "ESGOTADO" },
      data: { status: "ATIVO" },
    });
  });

  res.json({ transacao: apresentar(await carregarTransacao(transacao.id, eu), eu) });
});

// ---------------------------------------------------------------------------
// Avaliação mútua
// ---------------------------------------------------------------------------

const esquemaAvaliacao = z.object({
  nota: z.number().int().min(1, "Dê uma nota de 1 a 5.").max(5, "Dê uma nota de 1 a 5."),
  comentario: textoOpcional(600),
});

rotasTransacoes.post("/:id/avaliacoes", async (req, res) => {
  const eu = usuarioLogado(req);
  const dados = validar(esquemaAvaliacao, req.body);
  const transacao = await carregarTransacao(idDaRota(req), eu);

  const souComprador = transacao.compradorId === eu.id;
  const souVendedor = transacao.vendedorId === eu.id;
  if (!souComprador && !souVendedor) throw proibido("Apenas quem participou pode avaliar.");
  if (transacao.status !== "CONCLUIDA") {
    throw conflito("A avaliação fica disponível depois que a retirada é confirmada.");
  }
  if (transacao.avaliacoes.some((a) => a.autorId === eu.id)) {
    throw conflito("Você já avaliou esta transação.");
  }

  const avaliadoId = souComprador ? transacao.vendedorId : transacao.compradorId;

  const avaliacao = await prisma.$transaction(async (tx) => {
    const criada = await tx.avaliacao.create({
      data: { transacaoId: transacao.id, autorId: eu.id, avaliadoId, ...dados },
    });
    // Recalcula a reputação do avaliado a partir de todas as notas recebidas.
    const reputacao = await tx.avaliacao.aggregate({
      where: { avaliadoId },
      _avg: { nota: true },
      _count: true,
    });
    await tx.usuario.update({
      where: { id: avaliadoId },
      data: { notaMedia: reputacao._avg.nota, totalAvaliacoes: reputacao._count },
    });
    return criada;
  });

  res.status(201).json({ avaliacao });
});
