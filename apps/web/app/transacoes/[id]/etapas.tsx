import { Check } from "lucide-react";
import { cx } from "@/lib/cx";
import { formatarDataHora } from "@/lib/formato";
import type { Transacao } from "@/lib/tipos";

/** Linha do tempo da transação: negócio fechado → pagamento → retirada → avaliação. */
export function Etapas({ transacao: t }: { transacao: Transacao }) {
  if (t.status === "CANCELADA") return null;
  const avaliada = t.avaliacoes.length > 0;
  const etapas = [
    { nome: "Negócio fechado", feita: true, quando: t.criadoEm },
    { nome: "Pagamento", feita: t.pagoEm !== null, quando: t.pagoEm },
    { nome: "Retirada", feita: t.concluidaEm !== null, quando: t.concluidaEm },
    { nome: "Avaliação", feita: avaliada, quando: null },
  ];
  const atual = etapas.findIndex((e) => !e.feita);

  return (
    <ol aria-label="Andamento da transação" className="grid grid-cols-4">
      {etapas.map((etapa, i) => (
        <li key={etapa.nome} aria-current={i === atual ? "step" : undefined} className="relative flex flex-col items-center text-center">
          {i > 0 && (
            <span aria-hidden className={cx("absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2", etapa.feita ? "bg-brand-600" : "bg-areia-200")} />
          )}
          <span
            className={cx(
              "relative flex size-8 items-center justify-center rounded-full border-2 text-sm font-bold",
              etapa.feita
                ? "border-brand-600 bg-brand-600 text-white"
                : i === atual
                  ? "border-brand-600 bg-white text-brand-700"
                  : "border-areia-300 bg-white text-tinta-suave",
            )}
          >
            {etapa.feita ? <Check aria-hidden className="size-4" /> : i + 1}
          </span>
          <span className={cx("mt-2 text-xs font-semibold sm:text-sm", !etapa.feita && i !== atual && "text-tinta-suave")}>
            {etapa.nome}
            <span className="sr-only">{etapa.feita ? " — concluída" : i === atual ? " — etapa atual" : " — pendente"}</span>
          </span>
          {etapa.quando && <time dateTime={etapa.quando} className="hidden text-xs text-tinta-suave sm:block">{formatarDataHora(etapa.quando)}</time>}
        </li>
      ))}
    </ol>
  );
}
