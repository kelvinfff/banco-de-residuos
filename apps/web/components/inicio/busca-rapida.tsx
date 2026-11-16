"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { consulta } from "@/lib/api";
import { useCatalogo } from "@/lib/catalogo";
import { Botao } from "../botao";

/** Busca do topo da página inicial: leva à vitrine já filtrada. */
export function BuscaRapida() {
  const router = useRouter();
  const catalogo = useCatalogo();
  const [q, setQ] = useState("");
  const [municipioId, setMunicipioId] = useState("");

  function buscar(e: FormEvent) {
    e.preventDefault();
    router.push(`/anuncios${consulta({ q: q.trim(), municipioId })}`);
  }

  return (
    <form onSubmit={buscar} role="search" className="rounded-xl bg-white p-2 shadow-sm sm:flex sm:items-center sm:gap-2">
      <label className="flex h-12 flex-1 items-center gap-2 rounded-lg px-3 focus-within:outline-2 focus-within:outline-brand-600">
        <Search aria-hidden className="size-5 shrink-0 text-tinta-suave" />
        <span className="sr-only">O que você procura?</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Casca de manga, bagaço de uva…"
          className="h-full w-full min-w-0 bg-transparent text-base text-tinta outline-none placeholder:text-areia-400"
        />
      </label>
      <div className="mx-1 hidden h-8 w-px bg-areia-200 sm:block" />
      <label className="mt-2 block sm:mt-0">
        <span className="sr-only">Município</span>
        <select
          value={municipioId}
          onChange={(e) => setMunicipioId(e.target.value)}
          className="h-12 w-full rounded-lg bg-transparent px-3 text-base text-tinta sm:w-48"
        >
          <option value="">Todo o Vale</option>
          {catalogo?.municipios.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}/{m.uf}
            </option>
          ))}
        </select>
      </label>
      <Botao type="submit" tamanho="lg" className="mt-2 w-full sm:mt-0 sm:w-auto">
        Buscar
      </Botao>
    </form>
  );
}
