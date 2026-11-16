import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/db";
import { app, criarAnuncio, criarUsuario, dadosAnuncio, limparBanco, type Catalogo } from "./apoio";

let catalogo: Catalogo;
let vendedor: Awaited<ReturnType<typeof criarUsuario>>;
let outro: Awaited<ReturnType<typeof criarUsuario>>;

beforeAll(async () => {
  catalogo = await limparBanco();
  vendedor = await criarUsuario(catalogo);
  outro = await criarUsuario(catalogo);
});

describe("criação e edição", () => {
  it("exige login para anunciar", async () => {
    const resposta = await request(app).post("/api/anuncios").send(dadosAnuncio(catalogo));
    expect(resposta.status).toBe(401);
  });

  it("cria o anúncio no centro do município quando não há ponto exato", async () => {
    const anuncio = await criarAnuncio(vendedor.agente, catalogo);
    const detalhe = await request(app).get(`/api/anuncios/${anuncio.id}`);
    expect(detalhe.status).toBe(200);
    expect(detalhe.body.anuncio).toMatchObject({
      status: "ATIVO",
      quantidadeDisponivel: 500, // número, não string
      latitude: catalogo.petrolina.latitude,
      longitude: catalogo.petrolina.longitude,
      vendedor: { id: vendedor.usuario.id },
    });
    expect(detalhe.body.anuncio.vendedor.email).toBeUndefined();
  });

  it("valida quantidade, preço e referências", async () => {
    const resposta = await vendedor.agente.post("/api/anuncios").send(
      dadosAnuncio(catalogo, { quantidadeDisponivel: 0, precoUnitarioCentavos: -1, categoriaId: 9999 }),
    );
    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toHaveProperty("quantidadeDisponivel");
    expect(resposta.body.campos).toHaveProperty("precoUnitarioCentavos");

    const semCategoria = await vendedor.agente.post("/api/anuncios").send(dadosAnuncio(catalogo, { categoriaId: 9999 }));
    expect(semCategoria.status).toBe(400);
    expect(semCategoria.body.campos).toHaveProperty("categoriaId");
  });

  it("só o dono edita; vendedorId não pode ser trocado", async () => {
    const anuncio = await criarAnuncio(vendedor.agente, catalogo);

    const alheio = await outro.agente.patch(`/api/anuncios/${anuncio.id}`).send({ titulo: "Agora é meu anúncio" });
    expect(alheio.status).toBe(403);

    const proprio = await vendedor.agente
      .patch(`/api/anuncios/${anuncio.id}`)
      .send({ precoUnitarioCentavos: 40, status: "PAUSADO", vendedorId: outro.usuario.id });
    expect(proprio.status).toBe(200);
    expect(proprio.body.anuncio).toMatchObject({ precoUnitarioCentavos: 40, status: "PAUSADO", vendedorId: vendedor.usuario.id });
  });

  it("o dono não consegue reativar um anúncio suspenso pela moderação", async () => {
    const anuncio = await criarAnuncio(vendedor.agente, catalogo);
    await prisma.anuncio.update({ where: { id: anuncio.id }, data: { status: "SUSPENSO" } });

    const tentativa = await vendedor.agente.patch(`/api/anuncios/${anuncio.id}`).send({ status: "ATIVO" });
    expect(tentativa.status).toBe(403);

    // Suspenso some para o público, mas o dono continua vendo.
    expect((await request(app).get(`/api/anuncios/${anuncio.id}`)).status).toBe(404);
    expect((await vendedor.agente.get(`/api/anuncios/${anuncio.id}`)).status).toBe(200);
  });
});

describe("busca", () => {
  beforeAll(async () => {
    await prisma.anuncio.deleteMany();
    await criarAnuncio(vendedor.agente, catalogo, { titulo: "Casca de manga Tommy", precoUnitarioCentavos: 35 });
    await criarAnuncio(vendedor.agente, catalogo, {
      titulo: "Bagaço de uva tinta",
      categoriaId: catalogo.bagacos.id,
      culturaId: catalogo.uva.id,
      precoUnitarioCentavos: 12000,
      unidade: "TONELADA",
      quantidadeDisponivel: 12,
      municipioId: catalogo.juazeiro.id,
    });
    await criarAnuncio(outro.agente, catalogo, {
      titulo: "Casca de uva de Remanso",
      culturaId: catalogo.uva.id,
      precoUnitarioCentavos: 20,
      municipioId: catalogo.remanso.id,
    });
    const pausado = await criarAnuncio(vendedor.agente, catalogo, { titulo: "Casca pausada" });
    await vendedor.agente.patch(`/api/anuncios/${pausado.id}`).send({ status: "PAUSADO" });
  });

  const titulos = (corpo: { itens: { titulo: string }[] }) => corpo.itens.map((a) => a.titulo);

  it("lista apenas anúncios ativos", async () => {
    const resposta = await request(app).get("/api/anuncios");
    expect(resposta.status).toBe(200);
    expect(resposta.body.total).toBe(3);
    expect(titulos(resposta.body)).not.toContain("Casca pausada");
  });

  it("filtra por texto (sem diferenciar maiúsculas), categoria, cultura e município", async () => {
    expect(titulos((await request(app).get("/api/anuncios?q=BAGAÇO")).body)).toEqual(["Bagaço de uva tinta"]);
    expect((await request(app).get("/api/anuncios?categoria=cascas")).body.total).toBe(2);
    expect((await request(app).get("/api/anuncios?cultura=uva")).body.total).toBe(2);
    expect((await request(app).get("/api/anuncios?categoria=cascas&cultura=uva")).body.total).toBe(1);
    expect(titulos((await request(app).get(`/api/anuncios?municipioId=${catalogo.juazeiro.id}`)).body)).toEqual(["Bagaço de uva tinta"]);
  });

  it("ordena por menor preço e pagina", async () => {
    const pagina1 = await request(app).get("/api/anuncios?ordenar=menor_preco&porPagina=2");
    expect(titulos(pagina1.body)).toEqual(["Casca de uva de Remanso", "Casca de manga Tommy"]);
    expect(pagina1.body).toMatchObject({ total: 3, totalPaginas: 2 });
    const pagina2 = await request(app).get("/api/anuncios?ordenar=menor_preco&porPagina=2&pagina=2");
    expect(titulos(pagina2.body)).toEqual(["Bagaço de uva tinta"]);
  });

  it("filtra por raio e ordena por proximidade a partir de um ponto", async () => {
    const { latitude, longitude } = catalogo.petrolina;
    const perto = await request(app).get(`/api/anuncios?lat=${latitude}&lng=${longitude}&raioKm=30&ordenar=mais_proximos`);
    expect(titulos(perto.body)).toEqual(["Casca de manga Tommy", "Bagaço de uva tinta"]);
    expect(perto.body.itens[0].distanciaKm).toBe(0);
    expect(perto.body.itens[1].distanciaKm).toBeLessThan(5);

    // Remanso fica a ~175 km de Petrolina: entra só com raio maior.
    const longe = await request(app).get(`/api/anuncios?lat=${latitude}&lng=${longitude}&raioKm=250&ordenar=mais_proximos`);
    expect(titulos(longe.body).at(-1)).toBe("Casca de uva de Remanso");
    expect(longe.body.itens.at(-1).distanciaKm).toBeGreaterThan(150);
  });

  it("anúncios de contas desativadas saem da vitrine", async () => {
    await prisma.usuario.update({ where: { id: outro.usuario.id }, data: { ativo: false } });
    expect((await request(app).get("/api/anuncios")).body.total).toBe(2);
    await prisma.usuario.update({ where: { id: outro.usuario.id }, data: { ativo: true } });
  });

  it("rejeita parâmetros de busca inválidos", async () => {
    expect((await request(app).get("/api/anuncios?porPagina=100000")).status).toBe(400);
    expect((await request(app).get("/api/anuncios?lat=-9")).status).toBe(400);
  });
});

describe("fotos", () => {
  // Menor PNG válido (1×1 pixel).
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );

  it("envia, lista e remove fotos do próprio anúncio", async () => {
    const anuncio = await criarAnuncio(vendedor.agente, catalogo);
    const envio = await vendedor.agente
      .post(`/api/anuncios/${anuncio.id}/fotos`)
      .attach("fotos", png, { filename: "../../foto maliciosa.png", contentType: "image/png" });
    expect(envio.status).toBe(201);
    expect(envio.body.fotos).toHaveLength(1);

    const { url, id } = envio.body.fotos[0];
    // O nome em disco é aleatório: nada do nome original é aproveitado.
    expect(url).toMatch(/^\/uploads\/[0-9a-f]{32}\.png$/);
    const arquivo = await request(app).get(url);
    expect(arquivo.status).toBe(200);
    expect(arquivo.get("Content-Type")).toBe("image/png");

    const remocao = await vendedor.agente.delete(`/api/anuncios/${anuncio.id}/fotos/${id}`);
    expect(remocao.status).toBe(204);
    expect(fs.existsSync(path.join("tests/.uploads", path.basename(url)))).toBe(false);
  });

  it("recusa arquivo que diz ser imagem mas não é", async () => {
    const anuncio = await criarAnuncio(vendedor.agente, catalogo);
    const envio = await vendedor.agente
      .post(`/api/anuncios/${anuncio.id}/fotos`)
      .attach("fotos", Buffer.from("<script>alert(1)</script> conteúdo qualquer"), { filename: "x.png", contentType: "image/png" });
    expect(envio.status).toBe(400);
    expect(await prisma.fotoAnuncio.count({ where: { anuncioId: anuncio.id } })).toBe(0);
  });

  it("recusa tipos não suportados e fotos em anúncio alheio, sem gravar nada", async () => {
    const anuncio = await criarAnuncio(vendedor.agente, catalogo);
    const antes = fs.readdirSync("tests/.uploads").length;

    const svg = await vendedor.agente
      .post(`/api/anuncios/${anuncio.id}/fotos`)
      .attach("fotos", Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"), { filename: "x.svg", contentType: "image/svg+xml" });
    expect(svg.status).toBe(400);

    const alheio = await outro.agente
      .post(`/api/anuncios/${anuncio.id}/fotos`)
      .attach("fotos", png, { filename: "x.png", contentType: "image/png" });
    expect(alheio.status).toBe(403);

    expect(fs.readdirSync("tests/.uploads").length).toBe(antes);
  });

  it("limita a 5 fotos por anúncio", async () => {
    const anuncio = await criarAnuncio(vendedor.agente, catalogo);
    let envio = vendedor.agente.post(`/api/anuncios/${anuncio.id}/fotos`);
    for (let i = 0; i < 4; i++) envio = envio.attach("fotos", png, { filename: `${i}.png`, contentType: "image/png" });
    expect((await envio).status).toBe(201);

    let excesso = vendedor.agente.post(`/api/anuncios/${anuncio.id}/fotos`);
    for (let i = 0; i < 2; i++) excesso = excesso.attach("fotos", png, { filename: `${i}.png`, contentType: "image/png" });
    expect((await excesso).status).toBe(400);
    expect(await prisma.fotoAnuncio.count({ where: { anuncioId: anuncio.id } })).toBe(4);
  });
});
