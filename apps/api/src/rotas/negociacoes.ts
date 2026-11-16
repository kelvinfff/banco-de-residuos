import { Router } from "express";
import { z } from "zod";
import { prisma, Prisma } from "../db";
import { env } from "../env";
import { StatusNegociacao } from "../generated/prisma/client";
import { calcularValores, VALOR_MAXIMO_CENTAVOS } from "../lib/dinheiro";
import { conflito, ErroHttp, naoEncontrado, proibido, requisicaoInvalida } from "../lib/erros";
import { anuncioResumido, usuarioPublico } from "../lib/selecoes";
import { idDaRota, textoOpcional, validar } from "../lib/validar";
import { exigirLogin, usuarioLogado, type UsuarioSessao } from "../middleware/autenticacao";

export const rotasNegociacoes = Router();
rotasNegociacoes.use(exigirLogin);

const camposOferta = {
  quantidade: z
    .number()
    .positive("Informe uma quantidade maior que zero.")
    .max(100_000_000)
    .multipleOf(0.001, "Use no máximo 3 casas decimais."),
  precoUnitarioCentavos: z.number().int().min(0).max(100_000_000),
  mensagem: textoOpcional(1000),
};

const inclusaoNegociacao = {
  anuncio: { select: anuncioResumido },
  comprador: { select: usuarioPublico },
  transacao: { select: { id: true, status: true } },
} satisfies Prisma.NegociacaoInclude;

type NegociacaoComOfertas = Prisma.NegociacaoGetPayload<{
  include: typeof inclusaoNegociacao & { ofertas: true };
}>;

/** Acrescenta o ponto de vista de quem está olhando: papel e de quem é a vez. */
function apresentar(negociacao: NegociacaoComOfertas, eu: UsuarioSessao) {
  const ultima = negociacao.ofertas.at(-1);
  const souComprador = negociacao.compradorId === eu.id;
  const souVendedor = negociacao.anuncio.vendedorId === eu.id;
  return {
    ...negociacao,
    ultimaOferta: ultima ?? null,
    meuPapel: souComprador ? "comprador" : souVendedor ? "vendedor" : "observador",
    // É a minha vez quando a última oferta veio da outra parte.
    minhaVez:
      negociacao.status === "ABERTA" && (souComprador || souVendedor) && ultima?.autorId !== eu.id,
  };
}

function conferirOferta(
  oferta: { quantidade: number; precoUnitarioCentavos: number },
  anuncio: { quantidadeDisponivel: Prisma.Decimal; status: string },
) {
  if (anuncio.status !== "ATIVO") {
    throw conflito("Este anúncio não está mais disponível para negociação.");
  }
  if (anuncio.quantidadeDisponivel.lt(oferta.quantidade)) {
    throw requisicaoInvalida("A quantidade pedida é maior que a disponível no anúncio.", {
      quantidade: `Disponível: ${anuncio.quantidadeDisponivel.toNumber()}.`,
    });
  }
  const { valorTotalCentavos } = calcularValores(oferta.quantidade, oferta.precoUnitarioCentavos, 0);
  if (valorTotalCentavos > VALOR_MAXIMO_CENTAVOS) {
    throw requisicaoInvalida("O valor total da proposta excede o limite da plataforma.");
  }
}

// ---------------------------------------------------------------------------
// Abrir negociação (primeira proposta do comprador)
// ---------------------------------------------------------------------------

const esquemaAbertura = z.object({ anuncioId: z.number().int().positive(), ...camposOferta });

rotasNegociacoes.post("/", async (req, res) => {
  const eu = usuarioLogado(req);
  const { anuncioId, ...oferta } = validar(esquemaAbertura, req.body);

  const anuncio = await prisma.anuncio.findUnique({
    where: { id: anuncioId },
    include: { vendedor: { select: { ativo: true } } },
  });
  if (!anuncio || anuncio.status === "SUSPENSO" || !anuncio.vendedor.ativo) throw naoEncontrado("Anúncio");
  if (anuncio.vendedorId === eu.id) throw proibido("Você não pode negociar o seu próprio anúncio.");
  conferirOferta(oferta, anuncio);

  try {
    const negociacao = await prisma.negociacao.create({
      data: {
        anuncioId,
        compradorId: eu.id,
        ofertas: { create: { autorId: eu.id, ...oferta } },
      },
      include: { ...inclusaoNegociacao, ofertas: { orderBy: { id: "asc" } } },
    });
    res.status(201).json({ negociacao: apresentar(negociacao, eu) });
  } catch (erro) {
    // O índice único parcial garante uma única negociação aberta por comprador e anúncio.
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
      const existente = await prisma.negociacao.findFirst({
        where: { anuncioId, compradorId: eu.id, status: "ABERTA" },
        select: { id: true },
      });
      // O frontend usa o id para levar o usuário à conversa existente.
      throw new ErroHttp(409, "Você já tem uma negociação aberta para este anúncio.", {
        negociacaoId: existente?.id,
      });
    }
    throw erro;
  }
});

// ---------------------------------------------------------------------------
// Listagem e detalhe
// ---------------------------------------------------------------------------

const esquemaLista = z.object({
  papel: z.enum(["comprador", "vendedor", "todos"]).default("todos"),
  status: z.enum(StatusNegociacao).optional(),
});

rotasNegociacoes.get("/", async (req, res) => {
  const eu = usuarioLogado(req);
  const f = validar(esquemaLista, req.query);

  const comoComprador: Prisma.NegociacaoWhereInput = { compradorId: eu.id };
  const comoVendedor: Prisma.NegociacaoWhereInput = { anuncio: { vendedorId: eu.id } };

  const negociacoes = await prisma.negociacao.findMany({
    where: {
      ...(f.papel === "comprador"
        ? comoComprador
        : f.papel === "vendedor"
          ? comoVendedor
          : { OR: [comoComprador, comoVendedor] }),
      ...(f.status && { status: f.status }),
    },
    include: { ...inclusaoNegociacao, ofertas: { orderBy: { id: "desc" }, take: 1 } },
    orderBy: { atualizadoEm: "desc" },
    take: 200,
  });

  res.json({ itens: negociacoes.map((n) => apresentar(n, eu)) });
});

async function carregarNegociacao(id: number, eu: UsuarioSessao) {
  const negociacao = await prisma.negociacao.findUnique({
    where: { id },
    include: { ...inclusaoNegociacao, ofertas: { orderBy: { id: "asc" } } },
  });
  if (!negociacao) throw naoEncontrado("Negociação");

  const participo = negociacao.compradorId === eu.id || negociacao.anuncio.vendedorId === eu.id;
  // Quem não participa recebe 404 para não revelar que a negociação existe.
  if (!participo && eu.papel !== "ADMIN") throw naoEncontrado("Negociação");
  return { negociacao, participo };
}

rotasNegociacoes.get("/:id", async (req, res) => {
  const eu = usuarioLogado(req);
  const { negociacao } = await carregarNegociacao(idDaRota(req), eu);
  res.json({ negociacao: apresentar(negociacao, eu) });
});

// ---------------------------------------------------------------------------
// Contraproposta
// ---------------------------------------------------------------------------

rotasNegociacoes.post("/:id/ofertas", async (req, res) => {
  const eu = usuarioLogado(req);
  const oferta = validar(z.object(camposOferta), req.body);
  const { negociacao, participo } = await carregarNegociacao(idDaRota(req), eu);

  if (!participo) throw proibido("Apenas comprador e vendedor podem fazer propostas.");
  if (negociacao.status !== "ABERTA") throw conflito("Esta negociação já foi encerrada.");
  if (negociacao.ofertas.at(-1)?.autorId === eu.id) {
    throw conflito("Aguarde a resposta da outra parte antes de enviar uma nova proposta.");
  }
  conferirOferta(oferta, negociacao.anuncio);

  await prisma.$transaction([
    prisma.oferta.create({ data: { negociacaoId: negociacao.id, autorId: eu.id, ...oferta } }),
    // Atualiza `atualizadoEm` para a conversa subir na lista das duas partes.
    prisma.negociacao.update({ where: { id: negociacao.id }, data: { atualizadoEm: new Date() } }),
  ]);

  const atualizada = await carregarNegociacao(negociacao.id, eu);
  res.status(201).json({ negociacao: apresentar(atualizada.negociacao, eu) });
});

// ---------------------------------------------------------------------------
// Aceite: fecha o negócio e gera a transação
// ---------------------------------------------------------------------------

rotasNegociacoes.post("/:id/aceitar", async (req, res) => {
  const eu = usuarioLogado(req);
  const { negociacao, participo } = await carregarNegociacao(idDaRota(req), eu);

  if (!participo) throw proibido("Apenas comprador e vendedor podem aceitar propostas.");
  if (negociacao.status !== "ABERTA") throw conflito("Esta negociação já foi encerrada.");
  const oferta = negociacao.ofertas.at(-1);
  if (!oferta) throw conflito("Não há proposta para aceitar.");
  if (oferta.autorId === eu.id) throw conflito("Você não pode aceitar a sua própria proposta.");

  const valores = calcularValores(oferta.quantidade, oferta.precoUnitarioCentavos, env.COMISSAO_BPS);

  const transacao = await prisma.$transaction(async (tx) => {
    // 1) Reserva o estoque de forma atômica: só desconta se o anúncio segue ativo
    //    e ainda tem a quantidade. Duas aceitações simultâneas não vendem o mesmo lote.
    const reserva = await tx.anuncio.updateMany({
      where: {
        id: negociacao.anuncioId,
        status: "ATIVO",
        quantidadeDisponivel: { gte: oferta.quantidade },
      },
      data: { quantidadeDisponivel: { decrement: oferta.quantidade } },
    });
    if (reserva.count === 0) {
      throw conflito("O anúncio não tem mais essa quantidade disponível. Faça uma nova proposta.");
    }

    // 2) Fecha a negociação somente se ela ainda estiver aberta.
    const fechamento = await tx.negociacao.updateMany({
      where: { id: negociacao.id, status: "ABERTA" },
      data: { status: "ACEITA" },
    });
    if (fechamento.count === 0) throw conflito("Esta negociação já foi encerrada.");

    // 3) Sem saldo restante, o anúncio sai da vitrine.
    await tx.anuncio.updateMany({
      where: { id: negociacao.anuncioId, quantidadeDisponivel: { lte: 0 } },
      data: { status: "ESGOTADO" },
    });

    // 4) Registra a transação com um retrato dos valores acordados.
    const semCobranca = valores.valorTotalCentavos === 0;
    return tx.transacao.create({
      data: {
        negociacaoId: negociacao.id,
        anuncioId: negociacao.anuncioId,
        vendedorId: negociacao.anuncio.vendedorId,
        compradorId: negociacao.compradorId,
        quantidade: oferta.quantidade,
        unidade: negociacao.anuncio.unidade,
        precoUnitarioCentavos: oferta.precoUnitarioCentavos,
        taxaComissaoBps: env.COMISSAO_BPS,
        ...valores,
        // Doações não têm etapa de pagamento.
        status: semCobranca ? "PAGA" : "AGUARDANDO_PAGAMENTO",
        pagoEm: semCobranca ? new Date() : null,
      },
    });
  });

  res.status(201).json({ transacao });
});

// ---------------------------------------------------------------------------
// Encerrar sem acordo: o vendedor recusa, o comprador desiste
// ---------------------------------------------------------------------------

rotasNegociacoes.post("/:id/encerrar", async (req, res) => {
  const eu = usuarioLogado(req);
  const { negociacao, participo } = await carregarNegociacao(idDaRota(req), eu);
  if (!participo) throw proibido("Apenas comprador e vendedor podem encerrar a negociação.");

  const novoStatus = negociacao.compradorId === eu.id ? "CANCELADA" : "RECUSADA";
  const resultado = await prisma.negociacao.updateMany({
    where: { id: negociacao.id, status: "ABERTA" },
    data: { status: novoStatus },
  });
  if (resultado.count === 0) throw conflito("Esta negociação já foi encerrada.");

  const atualizada = await carregarNegociacao(negociacao.id, eu);
  res.json({ negociacao: apresentar(atualizada.negociacao, eu) });
});
