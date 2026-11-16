"use client";

import Link from "next/link";
import { useCatalogo } from "@/lib/catalogo";
import { IconeDaCategoria } from "../capa-anuncio";
import { Esqueleto } from "../feedback";

export function NavegarPorCategoria() {
  const catalogo = useCatalogo();
  if (!catalogo) return <Esqueleto className="h-24" />;
  return (
    <ul role="list" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {catalogo.categorias
        .filter((c) => c.slug !== "outros")
        .map((categoria) => {
          return (
            <li key={categoria.id}>
              <Link
                href={`/anuncios?categoria=${categoria.slug}`}
                className="flex h-full items-center gap-3 rounded-xl border border-areia-200 bg-white p-3 transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <IconeDaCategoria slug={categoria.slug} className="size-5" strokeWidth={1.75} />
                </span>
                <span className="text-sm leading-tight font-semibold">{categoria.nome}</span>
              </Link>
            </li>
          );
        })}
    </ul>
  );
}
