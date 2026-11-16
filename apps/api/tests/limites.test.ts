import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app, criarUsuario, limparBanco } from "./apoio";

const tentar = (email: string, senha: string) => request(app).post("/api/auth/login").send({ email, senha });

describe("limite de tentativas de login", () => {
  let vitima: Awaited<ReturnType<typeof criarUsuario>>;
  let outra: Awaited<ReturnType<typeof criarUsuario>>;

  beforeAll(async () => {
    const catalogo = await limparBanco();
    vitima = await criarUsuario(catalogo);
    outra = await criarUsuario(catalogo);
    process.env.TESTAR_LIMITES = "true";
  });
  afterAll(() => {
    delete process.env.TESTAR_LIMITES;
  });

  it("bloqueia a conta depois de 10 senhas erradas, sem afetar as outras contas", async () => {
    for (let i = 0; i < 10; i++) {
      expect((await tentar(vitima.usuario.email, `errada-${i}`)).status).toBe(401);
    }

    // 11ª tentativa: bloqueada, mesmo com variação de maiúsculas e espaços no e-mail...
    expect((await tentar(` ${vitima.usuario.email.toUpperCase()} `, "errada-de-novo")).status).toBe(429);
    // ...e mesmo que agora a senha esteja certa (o atacante não ganha uma última chance).
    const comSenhaCerta = await tentar(vitima.usuario.email, "senha-segura-123");
    expect(comSenhaCerta.status).toBe(429);
    expect(comSenhaCerta.get("Set-Cookie")).toBeUndefined();

    // Outra conta entra normalmente.
    expect((await tentar(outra.usuario.email, "senha-segura-123")).status).toBe(200);
  });

  it("logins corretos não consomem o limite", async () => {
    for (let i = 0; i < 15; i++) {
      expect((await tentar(outra.usuario.email, "senha-segura-123")).status).toBe(200);
    }
  });
});
