import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/db";
import { criarAdmin, criarAnuncio, criarUsuario, limparBanco, type Catalogo } from "./apoio";

type Conta = Awaited<ReturnType<typeof criarUsuario>>;

let catalogo: Catalogo;
let vendedor: Conta;
let comprador: Conta;
let terceiro: Conta;
let anuncio: Awaited<ReturnType<typeof criarAnuncio>>;

beforeAll(async () => {
  catalogo = await limparBanco();
  vendedor = await criarUsuario(catalogo, { telefone: "(87) 91111-1111" });
  comprador = await criarUsuario(catalogo, { telefone: "(87) 92222-2222" });
  terceiro = await criarUsuario(catalogo);
});

beforeEach(async () => {
  // Cada teste começa com um anúncio novo de 500 kg a R$ 0,35/kg.
  anuncio = await criarAnuncio(vendedor.agente, catalogo);
});

const propor = (conta: Conta, corpo: Record<string, unknown>) =>
  conta.agente.post("/api/negociacoes").send({ anuncioId: anuncio.id, quantidade: 200, precoUnitarioCentavos: 30, ...corpo });

const estoque = async () =>
  (await prisma.anuncio.findUniqueOrThrow({ where: { id: anuncio.id } })).quantidadeDisponivel.toNumber();

describe("propostas", () => {
  it("comprador abre a negociação e a vez passa para o vendedor", async () => {
    const resposta = await propor(comprador, { mensagem: "Retiro na quinta." });
    expect(resposta.status).toBe(201);
    expect(resposta.body.negociacao).toMatchObject({ status: "ABERTA", meuPapel: "comprador", minhaVez: false });

    const visaoVendedor = await vendedor.agente.get(`/api/negociacoes/${resposta.body.negociacao.id}`);
    expect(visaoVendedor.body.negociacao).toMatchObject({ meuPapel: "vendedor", minhaVez: true });
    expect(visaoVendedor.body.negociacao.ofertas[0]).toMatchObject({ quantidade: 200, precoUnitarioCentavos: 30, mensagem: "Retiro na quinta." });
  });

  it("ninguém negocia o próprio anúncio", async () => {
    expect((await propor(vendedor, {})).status).toBe(403);
  });

  it("recusa quantidade acima do disponível e anúncio fora do ar", async () => {
    expect((await propor(comprador, { quantidade: 501 })).status).toBe(400);
    await vendedor.agente.patch(`/api/anuncios/${anuncio.id}`).send({ status: "PAUSADO" });
    expect((await propor(comprador, {})).status).toBe(409);
  });

  it("permite uma única negociação aberta por comprador e anúncio", async () => {
    const primeira = await propor(comprador, {});
    const segunda = await propor(comprador, {});
    expect(segunda.status).toBe(409);
    expect(segunda.body.campos.negociacaoId).toBe(primeira.body.negociacao.id);
    // Outro comprador pode negociar o mesmo anúncio em paralelo.
    expect((await propor(terceiro, {})).status).toBe(201);
  });

  it("quem não participa não enxerga a negociação", async () => {
    const { body } = await propor(comprador, {});
    expect((await terceiro.agente.get(`/api/negociacoes/${body.negociacao.id}`)).status).toBe(404);
    expect((await terceiro.agente.post(`/api/negociacoes/${body.negociacao.id}/aceitar`)).status).toBe(404);
    const listaDoTerceiro = (await terceiro.agente.get("/api/negociacoes")).body.itens as { id: number }[];
    expect(listaDoTerceiro.map((n) => n.id)).not.toContain(body.negociacao.id);
  });

  it("contraproposta alterna a vez; ninguém faz duas ofertas seguidas", async () => {
    const { body } = await propor(comprador, {});
    const id = body.negociacao.id;

    const repetida = await comprador.agente.post(`/api/negociacoes/${id}/ofertas`).send({ quantidade: 200, precoUnitarioCentavos: 31 });
    expect(repetida.status).toBe(409);

    const contra = await vendedor.agente.post(`/api/negociacoes/${id}/ofertas`).send({ quantidade: 200, precoUnitarioCentavos: 33, mensagem: "Por 0,33 eu fecho." });
    expect(contra.status).toBe(201);
    expect(contra.body.negociacao).toMatchObject({ minhaVez: false });
    expect(contra.body.negociacao.ofertas).toHaveLength(2);

    const visaoComprador = await comprador.agente.get(`/api/negociacoes/${id}`);
    expect(visaoComprador.body.negociacao.minhaVez).toBe(true);
  });

  it("ninguém aceita a própria proposta", async () => {
    const { body } = await propor(comprador, {});
    expect((await comprador.agente.post(`/api/negociacoes/${body.negociacao.id}/aceitar`)).status).toBe(409);
  });

  it("vendedor recusa; comprador desiste; negociação encerrada não aceita mais nada", async () => {
    const a = await propor(comprador, {});
    const recusa = await vendedor.agente.post(`/api/negociacoes/${a.body.negociacao.id}/encerrar`);
    expect(recusa.body.negociacao.status).toBe("RECUSADA");
    expect((await vendedor.agente.post(`/api/negociacoes/${a.body.negociacao.id}/aceitar`)).status).toBe(409);

    // Com a anterior encerrada, o comprador pode abrir outra.
    const b = await propor(comprador, {});
    expect(b.status).toBe(201);
    const desistencia = await comprador.agente.post(`/api/negociacoes/${b.body.negociacao.id}/encerrar`);
    expect(desistencia.body.negociacao.status).toBe("CANCELADA");
    expect(await estoque()).toBe(500);
  });
});

describe("do aceite à avaliação", () => {
  it("fluxo completo: aceite → pagamento simulado → retirada → avaliações", async () => {
    // Comprador propõe 200 kg a R$ 0,30; vendedor contrapropõe R$ 0,33; comprador aceita.
    const { body } = await propor(comprador, {});
    const negociacaoId = body.negociacao.id;
    await vendedor.agente.post(`/api/negociacoes/${negociacaoId}/ofertas`).send({ quantidade: 200, precoUnitarioCentavos: 33 });
    const aceite = await comprador.agente.post(`/api/negociacoes/${negociacaoId}/aceitar`);

    expect(aceite.status).toBe(201);
    // 200 × 33 = 6.600 centavos; 5% = 330; líquido = 6.270.
    expect(aceite.body.transacao).toMatchObject({
      status: "AGUARDANDO_PAGAMENTO",
      quantidade: 200,
      precoUnitarioCentavos: 33,
      valorTotalCentavos: 6600,
      taxaComissaoBps: 500,
      comissaoCentavos: 330,
      valorLiquidoCentavos: 6270,
      vendedorId: vendedor.usuario.id,
      compradorId: comprador.usuario.id,
    });
    expect(await estoque()).toBe(300);
    const transacaoId = aceite.body.transacao.id;

    // Com o negócio fechado, cada parte vê o contato da outra.
    const detalhe = await comprador.agente.get(`/api/transacoes/${transacaoId}`);
    expect(detalhe.body.transacao.vendedor).toMatchObject({ email: vendedor.usuario.email, telefone: "(87) 91111-1111" });
    expect(detalhe.body.transacao).toMatchObject({ meuPapel: "comprador", possoPagar: true, possoAvaliar: false });
    expect((await terceiro.agente.get(`/api/transacoes/${transacaoId}`)).status).toBe(404);

    // Só o comprador paga, e a retirada só é confirmada depois do pagamento.
    expect((await vendedor.agente.post(`/api/transacoes/${transacaoId}/pagar`)).status).toBe(403);
    expect((await comprador.agente.post(`/api/transacoes/${transacaoId}/confirmar-retirada`)).status).toBe(409);
    expect((await comprador.agente.post(`/api/transacoes/${transacaoId}/avaliacoes`).send({ nota: 5 })).status).toBe(409);

    const pagamento = await comprador.agente.post(`/api/transacoes/${transacaoId}/pagar`);
    expect(pagamento.body.transacao).toMatchObject({ status: "PAGA", possoConfirmarRetirada: true, possoCancelar: false });
    expect((await comprador.agente.post(`/api/transacoes/${transacaoId}/pagar`)).status).toBe(409); // não paga duas vezes
    expect((await vendedor.agente.post(`/api/transacoes/${transacaoId}/cancelar`)).status).toBe(409); // pago não cancela

    const retirada = await comprador.agente.post(`/api/transacoes/${transacaoId}/confirmar-retirada`);
    expect(retirada.body.transacao).toMatchObject({ status: "CONCLUIDA", possoAvaliar: true });

    // Avaliação mútua, uma por participante.
    const notaDoComprador = await comprador.agente.post(`/api/transacoes/${transacaoId}/avaliacoes`).send({ nota: 4, comentario: "Material conforme o anúncio." });
    expect(notaDoComprador.status).toBe(201);
    expect(notaDoComprador.body.avaliacao).toMatchObject({ autorId: comprador.usuario.id, avaliadoId: vendedor.usuario.id });
    expect((await comprador.agente.post(`/api/transacoes/${transacaoId}/avaliacoes`).send({ nota: 1 })).status).toBe(409);
    expect((await terceiro.agente.post(`/api/transacoes/${transacaoId}/avaliacoes`).send({ nota: 1 })).status).toBe(404);
    expect((await vendedor.agente.post(`/api/transacoes/${transacaoId}/avaliacoes`).send({ nota: 6 })).status).toBe(400);
    expect((await vendedor.agente.post(`/api/transacoes/${transacaoId}/avaliacoes`).send({ nota: 5 })).status).toBe(201);

    const perfil = await comprador.agente.get(`/api/usuarios/${vendedor.usuario.id}`);
    expect(perfil.body.usuario).toMatchObject({ notaMedia: 4, totalAvaliacoes: 1 });
    expect(perfil.body.avaliacoes[0]).toMatchObject({ nota: 4, comentario: "Material conforme o anúncio." });
  });

  it("vender todo o estoque esgota o anúncio; cancelar antes do pagamento devolve o material", async () => {
    const { body } = await propor(comprador, { quantidade: 500 });
    const aceite = await vendedor.agente.post(`/api/negociacoes/${body.negociacao.id}/aceitar`);
    expect(aceite.status).toBe(201);

    let atual = await prisma.anuncio.findUniqueOrThrow({ where: { id: anuncio.id } });
    expect(atual.status).toBe("ESGOTADO");
    expect(atual.quantidadeDisponivel.toNumber()).toBe(0);

    const cancelamento = await vendedor.agente.post(`/api/transacoes/${aceite.body.transacao.id}/cancelar`);
    expect(cancelamento.body.transacao.status).toBe("CANCELADA");
    atual = await prisma.anuncio.findUniqueOrThrow({ where: { id: anuncio.id } });
    expect(atual.status).toBe("ATIVO");
    expect(atual.quantidadeDisponivel.toNumber()).toBe(500);

    expect((await vendedor.agente.post(`/api/transacoes/${aceite.body.transacao.id}/cancelar`)).status).toBe(409);
    expect(await estoque()).toBe(500); // cancelar duas vezes não devolve em dobro
  });

  it("o mesmo lote não é vendido duas vezes, mesmo com aceites simultâneos", async () => {
    // Dois compradores pedem 300 kg cada, de um anúncio com 500 kg.
    const a = await propor(comprador, { quantidade: 300 });
    const b = await propor(terceiro, { quantidade: 300 });

    const [r1, r2] = await Promise.all([
      vendedor.agente.post(`/api/negociacoes/${a.body.negociacao.id}/aceitar`),
      vendedor.agente.post(`/api/negociacoes/${b.body.negociacao.id}/aceitar`),
    ]);

    expect([r1.status, r2.status].sort()).toEqual([201, 409]);
    expect(await estoque()).toBe(200);
    expect(await prisma.transacao.count({ where: { anuncioId: anuncio.id } })).toBe(1);
    // A negociação que perdeu a corrida continua aberta para uma nova proposta.
    expect(await prisma.negociacao.count({ where: { anuncioId: anuncio.id, status: "ABERTA" } })).toBe(1);
  });

  it("aceitar duas vezes a mesma negociação gera uma única transação", async () => {
    const { body } = await propor(comprador, { quantidade: 100 });
    const [r1, r2] = await Promise.all([
      vendedor.agente.post(`/api/negociacoes/${body.negociacao.id}/aceitar`),
      vendedor.agente.post(`/api/negociacoes/${body.negociacao.id}/aceitar`),
    ]);
    expect([r1.status, r2.status].sort()).toEqual([201, 409]);
    expect(await estoque()).toBe(400);
  });

  it("doação (preço zero) pula a etapa de pagamento", async () => {
    const { body } = await propor(comprador, { quantidade: 50, precoUnitarioCentavos: 0 });
    const aceite = await vendedor.agente.post(`/api/negociacoes/${body.negociacao.id}/aceitar`);
    expect(aceite.body.transacao).toMatchObject({ status: "PAGA", valorTotalCentavos: 0, comissaoCentavos: 0 });
    const retirada = await comprador.agente.post(`/api/transacoes/${aceite.body.transacao.id}/confirmar-retirada`);
    expect(retirada.body.transacao.status).toBe("CONCLUIDA");
  });
});

describe("administração", () => {
  it("usuário comum e visitante não acessam o painel", async () => {
    expect((await comprador.agente.get("/api/admin/resumo")).status).toBe(403);
    expect((await comprador.agente.get("/api/admin/usuarios")).status).toBe(403);
    expect((await comprador.agente.patch(`/api/admin/usuarios/${vendedor.usuario.id}`).send({ ativo: false })).status).toBe(403);
  });

  it("resumo soma volume e comissões por situação", async () => {
    const admin = await criarAdmin(catalogo);
    const resumo = await admin.agente.get("/api/admin/resumo");
    expect(resumo.status).toBe(200);

    const pagasOuConcluidas = await prisma.transacao.aggregate({
      where: { status: { in: ["PAGA", "CONCLUIDA"] } },
      _sum: { valorTotalCentavos: true },
    });
    const concluidas = await prisma.transacao.aggregate({ where: { status: "CONCLUIDA" }, _sum: { comissaoCentavos: true } });

    expect(resumo.body.volumeNegociadoCentavos).toBe(pagasOuConcluidas._sum.valorTotalCentavos);
    expect(resumo.body.comissaoRealizadaCentavos).toBe(concluidas._sum.comissaoCentavos);
    expect(resumo.body.comissaoRealizadaCentavos).toBe(330); // do fluxo completo acima
    expect(resumo.body.porMes).toHaveLength(6);
    expect(resumo.body.porMes.at(-1).comissaoCentavos).toBe(330);
  });

  it("suspende e libera anúncios; desativa usuários, mas não a si mesmo", async () => {
    const admin = await criarAdmin(catalogo);

    const suspensao = await admin.agente.patch(`/api/admin/anuncios/${anuncio.id}`).send({ suspenso: true });
    expect(suspensao.body.anuncio.status).toBe("SUSPENSO");
    expect((await propor(comprador, {})).status).toBe(404);
    const liberacao = await admin.agente.patch(`/api/admin/anuncios/${anuncio.id}`).send({ suspenso: false });
    expect(liberacao.body.anuncio.status).toBe("ATIVO");

    expect((await admin.agente.patch(`/api/admin/usuarios/${admin.usuario.id}`).send({ ativo: false })).status).toBe(409);
    const desativacao = await admin.agente.patch(`/api/admin/usuarios/${terceiro.usuario.id}`).send({ ativo: false });
    expect(desativacao.body.usuario.ativo).toBe(false);
    expect((await terceiro.agente.get("/api/auth/eu")).status).toBe(401);
  });
});
