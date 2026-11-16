"use client";

import { Star } from "lucide-react";
import { useId } from "react";
import { cx } from "@/lib/cx";

/** Reputação de uma conta: "4,8 (12 avaliações)" ou "Sem avaliações". */
export function Reputacao({ nota, total, compacto }: { nota: number | null; total: number; compacto?: boolean }) {
  if (nota === null || total === 0) {
    return <span className="text-sm text-tinta-suave">{compacto ? "Novo" : "Ainda sem avaliações"}</span>;
  }
  const texto = nota.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Star aria-hidden className="size-4 fill-manga-400 text-manga-500" />
      <span className="font-semibold">{texto}</span>
      <span className="text-tinta-suave">
        {compacto ? `(${total})` : `(${total} ${total === 1 ? "avaliação" : "avaliações"})`}
      </span>
      <span className="sr-only">de 5 estrelas</span>
    </span>
  );
}

export function Estrelas({ nota }: { nota: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${nota} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden className={cx("size-4", n <= nota ? "fill-manga-400 text-manga-500" : "text-areia-300")} />
      ))}
    </span>
  );
}

const DESCRICOES = ["Péssimo", "Ruim", "Regular", "Bom", "Excelente"];

/** Escolha de nota de 1 a 5, acessível por teclado (grupo de botões de opção). */
export function EscolhaDeNota({ valor, aoMudar }: { valor: number; aoMudar: (nota: number) => void }) {
  const nome = useId();
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold">Sua nota</legend>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer rounded-md p-1 has-focus-visible:outline-2 has-focus-visible:outline-brand-600">
            <input
              type="radio"
              name={nome}
              value={n}
              checked={valor === n}
              onChange={() => aoMudar(n)}
              className="sr-only"
            />
            <Star aria-hidden className={cx("size-8 transition-colors", n <= valor ? "fill-manga-400 text-manga-500" : "text-areia-300")} />
            <span className="sr-only">{`${n} — ${DESCRICOES[n - 1]}`}</span>
          </label>
        ))}
        <span aria-hidden className="ml-2 text-sm text-tinta-suave">
          {valor > 0 ? DESCRICOES[valor - 1] : "Escolha de 1 a 5"}
        </span>
      </div>
    </fieldset>
  );
}
