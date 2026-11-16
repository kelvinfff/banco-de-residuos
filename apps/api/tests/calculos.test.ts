import { describe, expect, it } from "vitest";
import { calcularValores } from "../src/lib/dinheiro";
import { caixaDelimitadora, distanciaKm } from "../src/lib/geo";

describe("calcularValores", () => {
  it("aplica 5% de comissão: venda de R$ 1.000 gera R$ 50 para a plataforma", () => {
    // 2.000 kg a R$ 0,50 = R$ 1.000,00 (exemplo do pitch)
    expect(calcularValores(2000, 50, 500)).toEqual({
      valorTotalCentavos: 100_000,
      comissaoCentavos: 5_000,
      valorLiquidoCentavos: 95_000,
    });
  });

  it("não sofre com imprecisão de ponto flutuante em quantidades fracionadas", () => {
    // 0,1 + 0,2 em float daria 0,30000000000000004; aqui o cálculo é decimal exato.
    expect(calcularValores("1.005", 1000, 500).valorTotalCentavos).toBe(1005);
    expect(calcularValores(0.3, 10, 500).valorTotalCentavos).toBe(3);
  });

  it("arredonda total e comissão ao centavo mais próximo (meio para cima)", () => {
    // 333 kg × 35 centavos = 11.655 → comissão 582,75 → 583
    expect(calcularValores(333, 35, 500)).toEqual({
      valorTotalCentavos: 11_655,
      comissaoCentavos: 583,
      valorLiquidoCentavos: 11_072,
    });
    // 1,5 kg × 33 centavos = 49,5 → 50
    expect(calcularValores(1.5, 33, 500).valorTotalCentavos).toBe(50);
  });

  it("total sempre fecha com comissão + líquido", () => {
    for (const [qtd, preco] of [[7.777, 123], [0.001, 1], [12, 12000], [999.999, 99999]] as const) {
      const v = calcularValores(qtd, preco, 500);
      expect(v.comissaoCentavos + v.valorLiquidoCentavos).toBe(v.valorTotalCentavos);
    }
  });

  it("doação (preço zero) não gera comissão", () => {
    expect(calcularValores(5, 0, 500)).toEqual({
      valorTotalCentavos: 0,
      comissaoCentavos: 0,
      valorLiquidoCentavos: 0,
    });
  });
});

describe("geo", () => {
  const petrolina = { latitude: -9.3891, longitude: -40.503 };
  const lagoaGrande = { latitude: -8.9966, longitude: -40.2719 };
  const recife = { latitude: -8.0476, longitude: -34.877 };

  it("distância entre um ponto e ele mesmo é zero", () => {
    expect(distanciaKm(petrolina, petrolina)).toBe(0);
  });

  it("calcula distâncias conhecidas com boa aproximação", () => {
    expect(distanciaKm(petrolina, lagoaGrande)).toBeGreaterThan(45);
    expect(distanciaKm(petrolina, lagoaGrande)).toBeLessThan(55);
    // Petrolina–Recife em linha reta: cerca de 635 km.
    expect(distanciaKm(petrolina, recife)).toBeGreaterThan(620);
    expect(distanciaKm(petrolina, recife)).toBeLessThan(650);
  });

  it("é simétrica", () => {
    expect(distanciaKm(petrolina, recife)).toBeCloseTo(distanciaKm(recife, petrolina), 9);
  });

  it("a caixa delimitadora contém todo ponto dentro do raio", () => {
    const caixa = caixaDelimitadora(petrolina, 60);
    expect(lagoaGrande.latitude).toBeGreaterThan(caixa.latMin);
    expect(lagoaGrande.latitude).toBeLessThan(caixa.latMax);
    expect(lagoaGrande.longitude).toBeGreaterThan(caixa.lngMin);
    expect(lagoaGrande.longitude).toBeLessThan(caixa.lngMax);
    expect(recife.longitude).toBeGreaterThan(caixa.lngMax);
  });
});
