"use client";

import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { formatarPreco, formatarQuantidade, tempoDesde } from "@/lib/formato";
import type { Anuncio, Paginado } from "@/lib/tipos";
import { IconeDaCategoria } from "../capa-anuncio";
import { Esqueleto } from "../feedback";

/** Painel do topo da página inicial: os anúncios mais recentes, direto do banco. */
export function DisponivelAgora() {
  const { data } = useSWR<Paginado<Anuncio>>("/api/anuncios?porPagina=4");

  return (
    <section aria-labelledby="disponivel-agora" className="min-w-0 rounded-2xl bg-white p-5 text-tinta shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 id="disponivel-agora" className="flex items-center gap-2 font-sans text-sm font-semibold tracking-normal">
          <span aria-hidden className="size-2 rounded-full bg-brand-500" />
          Disponível agora no Vale
        </h2>
        <Link href="/anuncios" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
          Ver todos <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>

      {!data ? (
        <div aria-busy="true" aria-label="Carregando anúncios" className="mt-4 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Esqueleto key={i} className="h-16" />
          ))}
        </div>
      ) : data.itens.length === 0 ? (
        <p className="mt-4 text-sm text-tinta-suave">
          Ainda não há anúncios ativos. <Link href="/anuncios/novo" className="font-semibold text-brand-700 underline">Seja o primeiro a anunciar.</Link>
        </p>
      ) : (
        <ul role="list" className="mt-3 divide-y divide-areia-200">
          {data.itens.map((anuncio) => {
            return (
              <li key={anuncio.id} className="relative flex items-center gap-3 py-3">
                <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <IconeDaCategoria slug={anuncio.categoria.slug} className="size-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/anuncios/${anuncio.id}`} className="block truncate text-sm font-semibold after:absolute after:inset-0 hover:text-brand-700">
                    {anuncio.titulo}
                  </Link>
                  <p className="flex items-center gap-1 truncate text-xs text-tinta-suave">
                    <MapPin aria-hidden className="size-3.5 shrink-0" />
                    {anuncio.municipio.nome}/{anuncio.municipio.uf} · {tempoDesde(anuncio.criadoEm)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-brand-800">{formatarPreco(anuncio.precoUnitarioCentavos, anuncio.unidade)}</p>
                  <p className="text-xs text-tinta-suave">{formatarQuantidade(anuncio.quantidadeDisponivel, anuncio.unidade)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
