"use client";

import useSWR from "swr";
import type { Anuncio, Paginado } from "@/lib/tipos";
import { GradeDeAnuncios, GradeDeAnunciosCarregando } from "../cartao-anuncio";

export function AnunciosRecentes() {
  const { data } = useSWR<Paginado<Anuncio>>("/api/anuncios?porPagina=6");
  if (!data) return <GradeDeAnunciosCarregando />;
  if (data.itens.length === 0) return null;
  return <GradeDeAnuncios anuncios={data.itens} />;
}
