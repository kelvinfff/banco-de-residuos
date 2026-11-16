"use client";

import { useState } from "react";
import { cx } from "@/lib/cx";

interface Ponto {
  rotulo: string;
  valor: number;
}

interface Props {
  titulo: string;
  pontos: Ponto[];
  formatar: (valor: number) => string;
}

/**
 * Barras verticais de uma única série (um eixo, uma cor).
 * O valor aparece ao passar o mouse ou focar a barra; a mesma informação
 * existe em uma tabela para leitores de tela.
 */
export function GraficoDeBarras({ titulo, pontos, formatar }: Props) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const maximo = Math.max(...pontos.map((p) => p.valor), 1);
  const destaque = ativo ?? pontos.length - 1;

  return (
    <figure>
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold">{titulo}</span>
        <span className="text-sm text-tinta-suave tabular-nums" aria-hidden>
          {pontos[destaque]?.rotulo}: <strong className="text-tinta">{formatar(pontos[destaque]?.valor ?? 0)}</strong>
        </span>
      </figcaption>

      <div aria-hidden className="mt-3 flex h-40 items-end gap-2 border-b border-areia-300" onMouseLeave={() => setAtivo(null)}>
        {pontos.map((ponto, i) => (
          <div key={ponto.rotulo} className="flex h-full flex-1 items-end justify-center" onMouseEnter={() => setAtivo(i)}>
            <div
              className={cx("w-full max-w-10 rounded-t transition-colors", i === destaque ? "bg-brand-700" : "bg-brand-300")}
              // Altura mínima de 2px para que meses sem movimento ainda marquem a linha de base.
              style={{ height: `max(2px, ${(ponto.valor / maximo) * 100}%)` }}
            />
          </div>
        ))}
      </div>
      <div aria-hidden className="mt-1.5 flex gap-2">
        {pontos.map((ponto, i) => (
          <span key={ponto.rotulo} className={cx("flex-1 text-center text-xs", i === destaque ? "font-semibold text-tinta" : "text-tinta-suave")}>
            {ponto.rotulo}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>{titulo}</caption>
        <thead>
          <tr><th scope="col">Mês</th><th scope="col">Valor</th></tr>
        </thead>
        <tbody>
          {pontos.map((ponto) => (
            <tr key={ponto.rotulo}><th scope="row">{ponto.rotulo}</th><td>{formatar(ponto.valor)}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
