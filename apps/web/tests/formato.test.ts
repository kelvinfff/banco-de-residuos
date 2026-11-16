import { describe, expect, it } from "vitest";
import {
  centavosParaCampo,
  formatarDinheiro,
  formatarPreco,
  formatarQuantidade,
  formatarTaxa,
  lerDinheiro,
  lerNumero,
  numeroParaCampo,
} from "@/lib/formato";
import { consulta } from "@/lib/api";
import { destinoSeguro } from "@/lib/navegacao";

// O Intl usa espaço não separável entre "R$" e o valor; normalizamos para comparar.
const limpo = (texto: string) => texto.replace(/ /g, " ");

describe("leitura de valores digitados", () => {
  it("lê dinheiro no formato brasileiro e devolve centavos", () => {
    expect(lerDinheiro("0,35")).toBe(35);
    expect(lerDinheiro("1.234,56")).toBe(123456);
    expect(lerDinheiro("R$ 180")).toBe(18000);
    expect(lerDinheiro("0")).toBe(0);
  });

  it("aceita ponto como separador decimal quando não há vírgula", () => {
    expect(lerDinheiro("0.35")).toBe(35);
    expect(lerNumero("2.5")).toBe(2.5);
  });

  it("não sofre com ponto flutuante ao converter para centavos", () => {
    expect(lerDinheiro("1,15")).toBe(115); // 1.15 * 100 = 114.99999999999999
    expect(lerDinheiro("19,99")).toBe(1999);
  });

  it("recusa texto que não é número", () => {
    for (const texto of ["", "  ", "abc", "1,2,3", "-5", "1e3", "12kg"]) {
      expect(lerDinheiro(texto)).toBeNull();
      expect(lerNumero(texto)).toBeNull();
    }
  });

  it("ida e volta entre campo e valor preserva o número", () => {
    expect(lerDinheiro(centavosParaCampo(123456))).toBe(123456);
    expect(lerDinheiro(centavosParaCampo(35))).toBe(35);
    expect(lerNumero(numeroParaCampo(1500.125))).toBe(1500.125);
    expect(lerNumero(numeroParaCampo(3.5))).toBe(3.5);
  });
});

describe("formatação", () => {
  it("formata dinheiro, preço por unidade e quantidade", () => {
    expect(limpo(formatarDinheiro(123456))).toBe("R$ 1.234,56");
    expect(limpo(formatarPreco(35, "KG"))).toBe("R$ 0,35/kg");
    expect(limpo(formatarPreco(12000, "TONELADA"))).toBe("R$ 120,00/t");
    expect(formatarPreco(0, "KG")).toBe("Doação");
    expect(formatarQuantidade(3.5, "TONELADA")).toBe("3,5 t");
    expect(formatarQuantidade(1500, "KG")).toBe("1.500 kg");
    expect(formatarTaxa(500)).toBe("5%");
    expect(formatarTaxa(750)).toBe("7,5%");
  });
});

describe("consulta", () => {
  it("monta a query string ignorando valores vazios", () => {
    expect(consulta({ q: "casca de manga", categoria: "", pagina: 2, raioKm: null, lat: undefined })).toBe(
      "?q=casca+de+manga&pagina=2",
    );
    expect(consulta({ q: "" })).toBe("");
  });
});

describe("destinoSeguro", () => {
  it("aceita caminhos internos", () => {
    expect(destinoSeguro("/anuncios/3")).toBe("/anuncios/3");
    expect(destinoSeguro("/negociacoes?papel=vendedor")).toBe("/negociacoes?papel=vendedor");
  });

  it("recusa redirecionamento para outros sites", () => {
    for (const malicioso of ["https://site-falso.com", "//site-falso.com", "/\\site-falso.com", "javascript:alert(1)", "", null]) {
      expect(destinoSeguro(malicioso)).toBe("/painel");
    }
  });
});
