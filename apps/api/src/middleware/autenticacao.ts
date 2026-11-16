import type { CookieOptions, NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { env } from "../env";
import type { Papel } from "../generated/prisma/client";
import { ErroHttp, proibido } from "../lib/erros";

export const COOKIE_SESSAO = "bdr_sessao";
const DURACAO_SESSAO_SEGUNDOS = 60 * 60 * 24 * 7; // 7 dias

export interface UsuarioSessao {
  id: number;
  nome: string;
  papel: Papel;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Preenchido por `carregarSessao` quando há um cookie de sessão válido. */
      usuario?: UsuarioSessao;
    }
  }
}

const opcoesCookie: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.COOKIE_SECURE,
  path: "/",
};

export function iniciarSessao(res: Response, usuarioId: number) {
  const token = jwt.sign({}, env.JWT_SECRET, {
    subject: String(usuarioId),
    expiresIn: DURACAO_SESSAO_SEGUNDOS,
    algorithm: "HS256",
  });
  res.cookie(COOKIE_SESSAO, token, { ...opcoesCookie, maxAge: DURACAO_SESSAO_SEGUNDOS * 1000 });
}

export function encerrarSessao(res: Response) {
  res.clearCookie(COOKIE_SESSAO, opcoesCookie);
}

/**
 * Identifica o usuário a partir do cookie, sem exigir login.
 * A conta é consultada a cada requisição para que desativações e mudanças
 * de papel tenham efeito imediato.
 */
export async function carregarSessao(req: Request, _res: Response, next: NextFunction) {
  const token: unknown = req.cookies?.[COOKIE_SESSAO];
  if (typeof token !== "string" || token === "") return next();

  let usuarioId: number;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
    usuarioId = Number(typeof payload === "string" ? NaN : payload.sub);
  } catch {
    return next(); // token inválido ou expirado: segue como visitante
  }
  if (!Number.isInteger(usuarioId)) return next();

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, nome: true, papel: true, ativo: true },
  });
  if (usuario?.ativo) {
    req.usuario = { id: usuario.id, nome: usuario.nome, papel: usuario.papel };
  }
  next();
}

export function exigirLogin(req: Request, _res: Response, next: NextFunction) {
  if (!req.usuario) throw new ErroHttp(401, "Entre na sua conta para continuar.");
  next();
}

export function exigirAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.usuario) throw new ErroHttp(401, "Entre na sua conta para continuar.");
  if (req.usuario.papel !== "ADMIN") throw proibido("Área restrita a administradores.");
  next();
}

/** Atalho para rotas protegidas: devolve o usuário logado (garantido por `exigirLogin`). */
export function usuarioLogado(req: Request): UsuarioSessao {
  if (!req.usuario) throw new ErroHttp(401, "Entre na sua conta para continuar.");
  return req.usuario;
}
