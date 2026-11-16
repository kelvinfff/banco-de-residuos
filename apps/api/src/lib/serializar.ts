import { Prisma } from "../generated/prisma/client";

/**
 * Prepara dados do Prisma para JSON: converte Decimal em number.
 * (Por padrão um Decimal viraria string, o que complica o frontend.)
 */
export function serializar<T>(valor: T): T {
  if (valor === null || valor === undefined) return valor;
  if (Prisma.Decimal.isDecimal(valor)) return (valor as Prisma.Decimal).toNumber() as T;
  if (valor instanceof Date) return valor;
  if (Array.isArray(valor)) return valor.map(serializar) as T;
  if (typeof valor === "object") {
    const saida: Record<string, unknown> = {};
    for (const [chave, item] of Object.entries(valor as Record<string, unknown>)) {
      saida[chave] = serializar(item);
    }
    return saida as T;
  }
  return valor;
}
