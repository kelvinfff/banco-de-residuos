"use client";

import useSWR from "swr";
import type { Estatisticas } from "@/lib/tipos";

/** Faixa de números: atividade real da plataforma ao lado do tamanho do mercado. */
export function Numeros() {
  const { data } = useSWR<Estatisticas>("/api/estatisticas");
  const itens = [
    { valor: data?.anunciosAtivos, rotulo: "anúncios ativos" },
    { valor: data?.organizacoes, rotulo: "organizações cadastradas" },
    { valor: data?.negociosFechados, rotulo: "negócios fechados" },
    { valor: data?.municipiosComOferta, rotulo: "municípios com oferta" },
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4">
      {itens.map((item) => (
        <div key={item.rotulo} className="flex flex-col-reverse justify-end">
          <dt className="text-sm text-tinta-suave">{item.rotulo}</dt>
          <dd className="font-display text-3xl font-bold text-brand-800 tabular-nums">{item.valor ?? "–"}</dd>
        </div>
      ))}
    </dl>
  );
}
