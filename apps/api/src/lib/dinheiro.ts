import { Prisma } from "../generated/prisma/client";

export interface ValoresTransacao {
  valorTotalCentavos: number;
  comissaoCentavos: number;
  valorLiquidoCentavos: number;
}

/**
 * Calcula os valores de uma venda.
 *
 * - total = quantidade × preço unitário, arredondado ao centavo;
 * - comissão = total × taxa (em pontos-base; 500 = 5%), arredondada ao centavo;
 * - líquido = total − comissão (o que o vendedor recebe).
 *
 * Toda a conta é feita em decimal exato para não sofrer com ponto flutuante.
 */
export function calcularValores(
  quantidade: Prisma.Decimal | number | string,
  precoUnitarioCentavos: number,
  taxaComissaoBps: number,
): ValoresTransacao {
  const total = new Prisma.Decimal(quantidade)
    .mul(precoUnitarioCentavos)
    .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
  const comissao = total
    .mul(taxaComissaoBps)
    .div(10_000)
    .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);

  const valorTotalCentavos = total.toNumber();
  const comissaoCentavos = comissao.toNumber();
  return {
    valorTotalCentavos,
    comissaoCentavos,
    valorLiquidoCentavos: valorTotalCentavos - comissaoCentavos,
  };
}

/** Limite de segurança: o total precisa caber em um INTEGER do PostgreSQL. */
export const VALOR_MAXIMO_CENTAVOS = 2_000_000_000;
