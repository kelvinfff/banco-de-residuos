import type { Request } from "express";
import { z } from "zod";
import { ErroHttp } from "./erros";

// Mensagens de validação em português.
z.config(z.locales.pt());

/** Valida `dados` com o esquema; em caso de falha lança 400 com os erros por campo. */
export function validar<T extends z.ZodType>(esquema: T, dados: unknown): z.infer<T> {
  const resultado = esquema.safeParse(dados);
  if (resultado.success) return resultado.data;

  const campos: Record<string, string> = {};
  for (const problema of resultado.error.issues) {
    const caminho = problema.path.join(".") || "_";
    campos[caminho] ??= problema.message;
  }
  throw new ErroHttp(400, "Dados inválidos. Confira os campos destacados.", campos);
}

/** Lê um parâmetro de rota numérico (ex.: /anuncios/:id). */
export function idDaRota(req: Request, nome = "id"): number {
  const valor = Number(req.params[nome]);
  if (!Number.isInteger(valor) || valor <= 0) {
    throw new ErroHttp(404, "Recurso não encontrado.");
  }
  return valor;
}

/** Número inteiro vindo de query string ("12" → 12). */
export const inteiroDeTexto = z.coerce.number().int();

export const paginacao = {
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(200).default(12),
};

/** Texto opcional: string vazia ou só com espaços vira `undefined`. */
export const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? undefined : v))
    .optional();

/** Texto opcional em atualizações: string vazia vira `null` (limpa o campo). */
export const textoAnulavel = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((v) => (v === "" ? null : v))
    .optional();

// Limites aproximados do território brasileiro.
export const latitude = z.number().min(-34).max(6);
export const longitude = z.number().min(-74).max(-34);
