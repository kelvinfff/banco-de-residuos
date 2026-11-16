import bcrypt from "bcryptjs";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../db";
import { env } from "../env";
import { TipoOrganizacao } from "../generated/prisma/client";
import { conflito, ErroHttp, requisicaoInvalida } from "../lib/erros";
import { usuarioPrivado } from "../lib/selecoes";
import { textoOpcional, validar } from "../lib/validar";
import { encerrarSessao, exigirLogin, iniciarSessao, usuarioLogado } from "../middleware/autenticacao";

export const rotasAuth = Router();

const CUSTO_BCRYPT = env.NODE_ENV === "test" ? 4 : 12;
// Hash usado quando o e-mail não existe, para o login levar o mesmo tempo nos dois casos.
const HASH_FALSO = bcrypt.hashSync("senha-inexistente", CUSTO_BCRYPT);

// Sobre limites de requisição: o navegador fala com o Next.js, que repassa as chamadas
// à API. Por isso a API enxerga sempre o IP do frontend, não o do visitante, e limites
// "por IP" valem para todos de uma vez. As regras abaixo foram pensadas para isso.

/** Os limites ficam desligados na suíte de testes, exceto no teste que os verifica. */
const limitesDesligados = () => env.NODE_ENV === "test" && process.env.TESTAR_LIMITES !== "true";

/**
 * Protege cada conta contra adivinhação de senha: 10 senhas erradas para o mesmo
 * e-mail a cada 15 minutos, venham de onde vierem. Tentativas certas não contam.
 */
const limiteDeLoginPorConta = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: limitesDesligados,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email: unknown = (req.body as { email?: unknown } | undefined)?.email;
    return `conta:${typeof email === "string" ? email.trim().toLowerCase().slice(0, 254) : ""}`;
  },
  message: { erro: "Muitas tentativas para esta conta. Aguarde 15 minutos e tente novamente." },
});

/** Teto global de cadastros por hora: freia a criação de contas em massa por robôs. */
const limiteDeCadastro = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: limitesDesligados,
  keyGenerator: () => "global",
  message: { erro: "Muitos cadastros na última hora. Tente novamente mais tarde." },
});

const esquemaCadastro = z.object({
  nome: z.string().trim().min(2, "Informe seu nome.").max(120),
  // Normaliza (sem espaços, minúsculas) antes de validar o formato.
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Informe um e-mail válido.")),
  // bcrypt considera apenas os primeiros 72 bytes da senha.
  senha: z.string().min(8, "A senha precisa ter ao menos 8 caracteres.").max(72),
  telefone: textoOpcional(20),
  organizacao: textoOpcional(120),
  tipoOrganizacao: z.enum(TipoOrganizacao),
  municipioId: z.number().int().positive(),
});

rotasAuth.post("/cadastro", limiteDeCadastro, async (req, res) => {
  const dados = validar(esquemaCadastro, req.body);

  const municipio = await prisma.municipio.findUnique({ where: { id: dados.municipioId } });
  if (!municipio) throw requisicaoInvalida("Município inválido.", { municipioId: "Selecione um município." });

  const jaExiste = await prisma.usuario.findUnique({ where: { email: dados.email } });
  if (jaExiste) throw conflito("Já existe uma conta com este e-mail.");

  const { senha, ...resto } = dados;
  const usuario = await prisma.usuario.create({
    data: { ...resto, senhaHash: await bcrypt.hash(senha, CUSTO_BCRYPT) },
    select: usuarioPrivado,
  });

  iniciarSessao(res, usuario.id);
  res.status(201).json({ usuario });
});

const esquemaLogin = z.object({
  email: z.string().trim().toLowerCase().max(254),
  senha: z.string().max(72),
});

rotasAuth.post("/login", limiteDeLoginPorConta, async (req, res) => {
  const { email, senha } = validar(esquemaLogin, req.body);

  const conta = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true, senhaHash: true, ativo: true },
  });
  const senhaConfere = await bcrypt.compare(senha, conta?.senhaHash ?? HASH_FALSO);
  if (!conta || !senhaConfere) throw new ErroHttp(401, "E-mail ou senha incorretos.");
  if (!conta.ativo) {
    throw new ErroHttp(403, "Esta conta foi desativada. Fale com a administração da plataforma.");
  }

  const usuario = await prisma.usuario.findUniqueOrThrow({
    where: { id: conta.id },
    select: usuarioPrivado,
  });
  iniciarSessao(res, usuario.id);
  res.json({ usuario });
});

rotasAuth.post("/logout", (_req, res) => {
  encerrarSessao(res);
  res.status(204).end();
});

/** Dados da conta logada. Responde 401 para visitantes. */
rotasAuth.get("/eu", exigirLogin, async (req, res) => {
  const usuario = await prisma.usuario.findUniqueOrThrow({
    where: { id: usuarioLogado(req).id },
    select: usuarioPrivado,
  });
  res.json({ usuario });
});
