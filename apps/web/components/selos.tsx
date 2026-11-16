import { NOME_STATUS_ANUNCIO, NOME_STATUS_NEGOCIACAO, NOME_STATUS_TRANSACAO } from "@/lib/formato";
import type { StatusAnuncio, StatusNegociacao, StatusTransacao } from "@/lib/tipos";
import { Selo } from "./feedback";

// A situação é sempre escrita por extenso: a cor é só um reforço.

export function SeloAnuncio({ status }: { status: StatusAnuncio }) {
  const tom = { ATIVO: "verde", PAUSADO: "manga", ESGOTADO: "neutro", ENCERRADO: "neutro", SUSPENSO: "perigo" } as const;
  return <Selo tom={tom[status]}>{NOME_STATUS_ANUNCIO[status]}</Selo>;
}

export function SeloNegociacao({ status }: { status: StatusNegociacao }) {
  const tom = { ABERTA: "info", ACEITA: "verde", RECUSADA: "perigo", CANCELADA: "neutro" } as const;
  return <Selo tom={tom[status]}>{NOME_STATUS_NEGOCIACAO[status]}</Selo>;
}

export function SeloTransacao({ status }: { status: StatusTransacao }) {
  const tom = { AGUARDANDO_PAGAMENTO: "manga", PAGA: "info", CONCLUIDA: "verde", CANCELADA: "neutro" } as const;
  return <Selo tom={tom[status]}>{NOME_STATUS_TRANSACAO[status]}</Selo>;
}
