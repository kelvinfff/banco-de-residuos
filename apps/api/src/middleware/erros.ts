import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { Prisma } from "../generated/prisma/client";
import { ErroHttp } from "../lib/erros";

export function rotaNaoEncontrada(_req: Request, res: Response) {
  res.status(404).json({ erro: "Rota não encontrada." });
}

const mensagensUpload: Partial<Record<multer.ErrorCode, string>> = {
  LIMIT_FILE_SIZE: "Cada foto pode ter no máximo 5 MB.",
  LIMIT_FILE_COUNT: "Envie no máximo 5 fotos por anúncio.",
  LIMIT_UNEXPECTED_FILE: "Envie no máximo 5 fotos por anúncio.",
};

/** Converte qualquer erro em uma resposta JSON `{ erro, campos? }`. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function tratarErros(erro: unknown, req: Request, res: Response, _next: NextFunction) {
  if (erro instanceof ErroHttp) {
    return res.status(erro.status).json({ erro: erro.message, campos: erro.detalhes });
  }

  if (erro instanceof multer.MulterError) {
    return res.status(400).json({ erro: mensagensUpload[erro.code] ?? "Falha no envio das fotos." });
  }

  // JSON malformado ou corpo grande demais (erros do body-parser).
  if (typeof erro === "object" && erro !== null && "type" in erro) {
    const tipo = (erro as { type?: string }).type;
    if (tipo === "entity.parse.failed") {
      return res.status(400).json({ erro: "JSON inválido no corpo da requisição." });
    }
    if (tipo === "entity.too.large") {
      return res.status(413).json({ erro: "Requisição grande demais." });
    }
  }

  if (erro instanceof Prisma.PrismaClientKnownRequestError) {
    if (erro.code === "P2025") return res.status(404).json({ erro: "Registro não encontrado." });
    if (erro.code === "P2003") {
      return res.status(400).json({ erro: "Referência inválida a outro registro." });
    }
  }

  console.error(`[erro] ${req.method} ${req.originalUrl}`, erro);
  res.status(500).json({ erro: "Erro interno. Tente novamente em instantes." });
}
