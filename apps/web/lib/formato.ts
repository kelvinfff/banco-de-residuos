import type {
  Frequencia,
  StatusAnuncio,
  StatusNegociacao,
  StatusTransacao,
  TipoOrganizacao,
  Unidade,
} from "./tipos";

const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });
const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const dataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const relativo = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

/** 123456 → "R$ 1.234,56" */
export const formatarDinheiro = (centavos: number) => reais.format(centavos / 100);

export const formatarNumero = (valor: number) => numero.format(valor);

export const SIGLA_UNIDADE: Record<Unidade, string> = {
  KG: "kg",
  TONELADA: "t",
  LITRO: "L",
  M3: "m³",
  UNIDADE: "un",
};

export const NOME_UNIDADE: Record<Unidade, string> = {
  KG: "Quilo (kg)",
  TONELADA: "Tonelada (t)",
  LITRO: "Litro (L)",
  M3: "Metro cúbico (m³)",
  UNIDADE: "Unidade",
};

/** (500, "KG") → "500 kg" */
export const formatarQuantidade = (valor: number, unidade: Unidade) =>
  `${formatarNumero(valor)} ${SIGLA_UNIDADE[unidade]}`;

/** (35, "KG") → "R$ 0,35/kg"; preço zero → "Doação" */
export const formatarPreco = (centavos: number, unidade: Unidade) =>
  centavos === 0 ? "Doação" : `${formatarDinheiro(centavos)}/${SIGLA_UNIDADE[unidade]}`;

export const formatarData = (iso: string) => dataCurta.format(new Date(iso));
export const formatarDataHora = (iso: string) => dataHora.format(new Date(iso));

/** "há 2 dias", "ontem", "há 3 horas" */
export function tempoDesde(iso: string): string {
  const segundos = (new Date(iso).getTime() - Date.now()) / 1000;
  const faixas: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["day", 86_400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unidade, tamanho] of faixas) {
    if (Math.abs(segundos) >= tamanho) return relativo.format(Math.round(segundos / tamanho), unidade);
  }
  return "agora há pouco";
}

export const formatarDistancia = (km: number) =>
  km < 1 ? "a menos de 1 km" : `a ${numero.format(Math.round(km))} km`;

/** 500 → "5%" */
export const formatarTaxa = (bps: number) => `${numero.format(bps / 100)}%`;

/** "1.234,56" ou "1234.56" → 123456 centavos. Devolve null se não for um valor válido. */
export function lerDinheiro(texto: string): number | null {
  const valor = lerNumero(texto);
  return valor === null ? null : Math.round(valor * 100);
}

/** Lê um número no formato brasileiro ("1.500,5") ou com ponto decimal ("1500.5"). */
export function lerNumero(texto: string): number | null {
  const limpo = texto.trim().replace(/\s|R\$/g, "");
  if (limpo === "") return null;
  const normalizado = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  if (!/^\d+(\.\d+)?$/.test(normalizado)) return null;
  const valor = Number(normalizado);
  return Number.isFinite(valor) ? valor : null;
}

/** 35 centavos → "0,35" (para preencher campos de formulário). */
export const centavosParaCampo = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false });

export const numeroParaCampo = (valor: number) =>
  valor.toLocaleString("pt-BR", { maximumFractionDigits: 3, useGrouping: false });

export const NOME_FREQUENCIA: Record<Frequencia, string> = {
  UNICA: "Lote único",
  SEMANAL: "Toda semana",
  QUINZENAL: "A cada 15 dias",
  MENSAL: "Todo mês",
  SAFRA: "Durante a safra",
};

export const NOME_ORGANIZACAO: Record<TipoOrganizacao, string> = {
  PRODUTOR: "Produtor rural",
  AGROINDUSTRIA: "Agroindústria",
  COOPERATIVA: "Cooperativa",
  EMPRESA: "Empresa compradora",
  OUTRO: "Outro",
};

export const NOME_STATUS_ANUNCIO: Record<StatusAnuncio, string> = {
  ATIVO: "Ativo",
  PAUSADO: "Pausado",
  ESGOTADO: "Esgotado",
  ENCERRADO: "Encerrado",
  SUSPENSO: "Suspenso",
};

export const NOME_STATUS_NEGOCIACAO: Record<StatusNegociacao, string> = {
  ABERTA: "Em negociação",
  ACEITA: "Negócio fechado",
  RECUSADA: "Recusada",
  CANCELADA: "Cancelada",
};

export const NOME_STATUS_TRANSACAO: Record<StatusTransacao, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGA: "Paga, aguardando retirada",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

/** Nome de exibição de uma conta: a organização, se houver; senão a pessoa. */
export const nomeDeExibicao = (u: { nome: string; organizacao: string | null }) => u.organizacao || u.nome;
