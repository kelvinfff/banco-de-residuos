import { cx } from "@/lib/cx";

interface Aba<T extends string> {
  valor: T;
  rotulo: string;
  contagem?: number;
}

/** Filtro em forma de abas (grupo de botões com `aria-pressed`). */
export function Abas<T extends string>({ rotulo, abas, atual, aoMudar }: { rotulo: string; abas: Aba<T>[]; atual: T; aoMudar: (valor: T) => void }) {
  return (
    <div role="group" aria-label={rotulo} className="mb-5 flex flex-wrap gap-1 border-b border-areia-200">
      {abas.map((aba) => (
        <button
          key={aba.valor}
          type="button"
          aria-pressed={aba.valor === atual}
          onClick={() => aoMudar(aba.valor)}
          className={cx(
            "-mb-px inline-flex h-11 items-center gap-2 border-b-2 px-3 text-sm font-semibold",
            aba.valor === atual ? "border-brand-700 text-brand-800" : "border-transparent text-tinta-suave hover:text-tinta",
          )}
        >
          {aba.rotulo}
          {aba.contagem !== undefined && aba.contagem > 0 && (
            <span className="rounded-full bg-areia-200 px-2 text-xs tabular-nums">{aba.contagem}</span>
          )}
        </button>
      ))}
    </div>
  );
}
