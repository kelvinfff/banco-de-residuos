import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/db";
import { app, criarUsuario, limparBanco, type Catalogo } from "./apoio";

let catalogo: Catalogo;
beforeAll(async () => {
  catalogo = await limparBanco();
});

describe("cadastro e login", () => {
  it("cadastra, inicia a sessão por cookie httpOnly e nunca devolve a senha", async () => {
    const agente = request.agent(app);
    const resposta = await agente.post("/api/auth/cadastro").send({
      nome: "Maria Souza",
      email: "  Maria@Exemplo.com ",
      senha: "senha-segura-123",
      tipoOrganizacao: "PRODUTOR",
      organizacao: "Fazenda Boa Esperança",
      municipioId: catalogo.petrolina.id,
    });

    expect(resposta.status).toBe(201);
    expect(resposta.body.usuario.email).toBe("maria@exemplo.com"); // normalizado
    expect(JSON.stringify(resposta.body)).not.toMatch(/senha/i);
    const cookie = resposta.get("Set-Cookie")?.join(";") ?? "";
    expect(cookie).toMatch(/bdr_sessao=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);

    const eu = await agente.get("/api/auth/eu");
    expect(eu.status).toBe(200);
    expect(eu.body.usuario.nome).toBe("Maria Souza");

    const gravado = await prisma.usuario.findUniqueOrThrow({ where: { email: "maria@exemplo.com" } });
    expect(gravado.senhaHash).not.toContain("senha-segura-123");
    expect(gravado.papel).toBe("USUARIO");
  });

  it("recusa e-mail repetido, mesmo com outra caixa", async () => {
    const resposta = await request(app).post("/api/auth/cadastro").send({
      nome: "Outra Maria",
      email: "MARIA@exemplo.com",
      senha: "senha-segura-123",
      tipoOrganizacao: "EMPRESA",
      municipioId: catalogo.petrolina.id,
    });
    expect(resposta.status).toBe(409);
  });

  it("valida os campos e aponta o que está errado", async () => {
    const resposta = await request(app).post("/api/auth/cadastro").send({
      nome: "X",
      email: "nao-e-email",
      senha: "curta",
      tipoOrganizacao: "INVALIDO",
      municipioId: catalogo.petrolina.id,
    });
    expect(resposta.status).toBe(400);
    expect(Object.keys(resposta.body.campos).sort()).toEqual(["email", "nome", "senha", "tipoOrganizacao"]);
  });

  it("não permite se cadastrar como administrador", async () => {
    const agente = request.agent(app);
    const resposta = await agente.post("/api/auth/cadastro").send({
      nome: "Esperto",
      email: "esperto@teste.com",
      senha: "senha-segura-123",
      tipoOrganizacao: "EMPRESA",
      municipioId: catalogo.petrolina.id,
      papel: "ADMIN",
      ativo: true,
    });
    expect(resposta.status).toBe(201);
    expect(resposta.body.usuario.papel).toBe("USUARIO");
    expect((await agente.get("/api/admin/resumo")).status).toBe(403);
  });

  it("login com senha errada e com e-mail inexistente dão a mesma resposta", async () => {
    const errada = await request(app).post("/api/auth/login").send({ email: "maria@exemplo.com", senha: "errada-123" });
    const inexistente = await request(app).post("/api/auth/login").send({ email: "ninguem@exemplo.com", senha: "errada-123" });
    expect(errada.status).toBe(401);
    expect(inexistente.status).toBe(401);
    expect(errada.body).toEqual(inexistente.body);
  });

  it("login correto inicia a sessão; logout encerra", async () => {
    const agente = request.agent(app);
    const login = await agente.post("/api/auth/login").send({ email: "maria@exemplo.com", senha: "senha-segura-123" });
    expect(login.status).toBe(200);
    expect((await agente.get("/api/auth/eu")).status).toBe(200);

    expect((await agente.post("/api/auth/logout")).status).toBe(204);
    expect((await agente.get("/api/auth/eu")).status).toBe(401);
  });

  it("rejeita cookie de sessão forjado", async () => {
    const resposta = await request(app).get("/api/auth/eu").set("Cookie", "bdr_sessao=token.falso.aqui");
    expect(resposta.status).toBe(401);
  });

  it("conta desativada perde o acesso imediatamente e não consegue entrar de novo", async () => {
    const { agente, usuario } = await criarUsuario(catalogo);
    expect((await agente.get("/api/auth/eu")).status).toBe(200);

    await prisma.usuario.update({ where: { id: usuario.id }, data: { ativo: false } });

    expect((await agente.get("/api/auth/eu")).status).toBe(401);
    const login = await request(app).post("/api/auth/login").send({ email: usuario.email, senha: "senha-segura-123" });
    expect(login.status).toBe(403);
  });
});

describe("perfil", () => {
  it("atualiza o próprio perfil, mas ignora campos protegidos", async () => {
    const { agente } = await criarUsuario(catalogo);
    const resposta = await agente.patch("/api/usuarios/eu").send({
      organizacao: "BioAdubo Sertão",
      bio: "Compostagem.",
      latitude: -9.4,
      longitude: -40.5,
      papel: "ADMIN",
      notaMedia: 5,
    });
    expect(resposta.status).toBe(200);
    expect(resposta.body.usuario).toMatchObject({ organizacao: "BioAdubo Sertão", latitude: -9.4, papel: "USUARIO", notaMedia: null });
  });

  it("perfil público não expõe e-mail nem telefone", async () => {
    const { usuario } = await criarUsuario(catalogo, { telefone: "(87) 99999-0000" });
    const resposta = await request(app).get(`/api/usuarios/${usuario.id}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body.usuario.nome).toBe(usuario.nome);
    expect(JSON.stringify(resposta.body)).not.toContain(usuario.email);
    expect(JSON.stringify(resposta.body)).not.toContain("99999-0000");
  });
});
