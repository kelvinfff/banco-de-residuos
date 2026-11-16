"use client";

import useSWR from "swr";
import { buscar } from "./api";
import type { Catalogo } from "./tipos";

/** Tipos de resíduo, culturas e municípios. Mudam raramente: uma busca por sessão basta. */
export function useCatalogo() {
  const { data } = useSWR<Catalogo>("/api/catalogo", buscar, {
    revalidateOnFocus: false,
    dedupingInterval: 10 * 60 * 1000,
  });
  return data;
}
