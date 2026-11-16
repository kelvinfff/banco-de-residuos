"use client";

import { LayoutGrid, Map as IconeMapa, SearchX, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { Botao } from "@/components/botao";
import { Selecao } from "@/components/campos";
import { GradeDeAnuncios, GradeDeAnunciosCarregando } from "@/components/cartao-anuncio";
import { Alerta, EstadoVazio } from "@/components/feedback";
import { Mapa, type PontoNoMapa } from "@/components/mapa";
import { Paginacao } from "@/components/paginacao";
import { consulta, mensagemDeErro } from "@/lib/api";
import { useCatalogo } from "@/lib/catalogo";
import { cx } from "@/lib/cx";
import { formatarPreco, formatarQuantidade } from "@/lib/formato";
import { useSessao } from "@/lib/sessao";
import type { Anuncio, Paginado } from "@/lib/tipos";

const ORDENACOES = [
  { valor: "recentes", nome: "Mais recentes" },
  { valor: "mais_proximos", nome: "Mais próximos" },
  { valor: "menor_preco", nome: "Menor preço" },
  { valor: "maior_quantidade", nome: "Maior quantidade" },
];
const RAIOS = [25, 50, 100, 200];

/** Anúncios no mesmo ponto (mesmo vendedor, em geral) dividem um marcador; o balão lista todos. */
function agruparPorLocal(anuncios: Anuncio[]): PontoNoMapa[] {
  const porLocal = new Map<string, PontoNoMapa>();
  for (const a of anuncios) {
    const item = {
      titulo: a.titulo,
      subtitulo: `${formatarPreco(a.precoUnitarioCentavos, a.unidade)} · ${formatarQuantidade(a.quantidadeDisponivel, a.unidade)}`,
      href: `/anuncios/${a.id}`,
    };
    const chave = `${a.latitude.toFixed(4)},${a.longitude.toFixed(4)}`;
    const existente = porLocal.get(chave);
    if (existente) existente.outros = [...(existente.outros ?? []), item];
    else porLocal.set(chave, { id: a.id, latitude: a.latitude, longitude: a.longitude, ...item });
  }
  return [...porLocal.values()];
}

/**
 * Vitrine de anúncios. Os filtros moram na URL (?categoria=cascas&raioKm=50),
 * então toda busca pode ser compartilhada por link e o botão "voltar" funciona.
 */
export function Vitrine() {
  const router = useRouter();
  const caminho = usePathname();
  const parametros = useSearchParams();
  const catalogo = useCatalogo();
  const { usuario } = useSessao();
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const filtros = {
    q: parametros.get("q") ?? "",
    categoria: parametros.get("categoria") ?? "",
    cultura: parametros.get("cultura") ?? "",
    municipioId: parametros.get("municipioId") ?? "",
    perto: parametros.get("perto") ?? "",
    raioKm: parametros.get("raioKm") ?? "",
    ordenar: parametros.get("ordenar") ?? "recentes",
    pagina: Number(parametros.get("pagina") ?? 1),
    visao: parametros.get("visao") === "mapa" ? "mapa" : "lista",
  };

  function aplicar(mudancas: Record<string, string | number>) {
    const proximos = { ...filtros, pagina: 1, ...mudancas };
    router.replace(
      `${caminho}${consulta({
        ...proximos,
        ordenar: proximos.ordenar === "recentes" ? "" : proximos.ordenar,
        pagina: proximos.pagina === 1 ? "" : proximos.pagina,
        visao: proximos.visao === "lista" ? "" : proximos.visao,
      })}`,
      { scroll: false },
    );
  }

  // Ponto de referência para distância: um município escolhido ou o endereço da conta.
  const municipioDeReferencia = catalogo?.municipios.find((m) => String(m.id) === filtros.perto);
  const origem =
    filtros.perto === "eu" && usuario
      ? { latitude: usuario.latitude ?? usuario.municipio.latitude, longitude: usuario.longitude ?? usuario.municipio.longitude }
      : municipioDeReferencia
        ? { latitude: municipioDeReferencia.latitude, longitude: municipioDeReferencia.longitude }
        : null;
  // "perto=eu" depende da sessão; enquanto ela carrega, a busca espera.
  const aguardandoOrigem = filtros.perto !== "" && !origem && (filtros.perto !== "eu" || usuario === undefined || !catalogo);

  const noMapa = filtros.visao === "mapa";
  const chave = aguardandoOrigem
    ? null
    : `/api/anuncios${consulta({
        q: filtros.q,
        categoria: filtros.categoria,
        cultura: filtros.cultura,
        municipioId: filtros.municipioId,
        lat: origem?.latitude,
        lng: origem?.longitude,
        raioKm: origem ? filtros.raioKm : "",
        ordenar: filtros.ordenar === "mais_proximos" && !origem ? "recentes" : filtros.ordenar,
        pagina: noMapa ? 1 : filtros.pagina,
        porPagina: noMapa ? 200 : 12,
      })}`;
  const { data, error } = useSWR<Paginado<Anuncio>>(chave, { keepPreviousData: true });

  const filtrosAtivos = [filtros.q, filtros.categoria, filtros.cultura, filtros.municipioId, filtros.perto].filter(Boolean).length;
  const limpar = () => router.replace(`${caminho}${consulta({ visao: noMapa ? "mapa" : "" })}`, { scroll: false });

  return (
    <div>
      <h1 className="text-2xl font-bold sm:text-3xl">Explorar resíduos</h1>
      <p className="mt-1 text-tinta-suave">Materiais disponíveis de produtores, agroindústrias e cooperativas do Vale.</p>

      <form
        role="search"
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          aplicar({ q: String(new FormData(e.currentTarget).get("q") ?? "").trim() });
        }}
      >
        <div className="flex-1">
          <label htmlFor="busca-texto" className="sr-only">Buscar por material</label>
          <input
            id="busca-texto"
            // A URL só muda ao enviar; `key` repõe o texto quando a busca muda por fora (voltar, limpar).
            key={filtros.q}
            name="q"
            type="search"
            defaultValue={filtros.q}
            placeholder="Casca de manga, bagaço de uva, semente…"
            className="h-11 w-full rounded-lg border border-areia-300 bg-white px-3 text-base placeholder:text-areia-400"
          />
        </div>
        <Botao type="submit">Buscar</Botao>
        <Botao
          variante="secundario"
          className="lg:hidden"
          aria-expanded={filtrosAbertos}
          aria-controls="painel-filtros"
          onClick={() => setFiltrosAbertos((v) => !v)}
        >
          <SlidersHorizontal aria-hidden className="size-4" />
          Filtros{filtrosAtivos > 0 && ` (${filtrosAtivos})`}
        </Botao>
      </form>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside id="painel-filtros" aria-label="Filtros" className={cx("space-y-4 lg:block", !filtrosAbertos && "hidden")}>
          <Selecao rotulo="Tipo de resíduo" value={filtros.categoria} onChange={(e) => aplicar({ categoria: e.target.value })}>
            <option value="">Todos</option>
            {catalogo?.categorias.map((c) => (
              <option key={c.id} value={c.slug}>{c.nome}</option>
            ))}
          </Selecao>
          <Selecao rotulo="Cultura de origem" value={filtros.cultura} onChange={(e) => aplicar({ cultura: e.target.value })}>
            <option value="">Todas</option>
            {catalogo?.culturas.map((c) => (
              <option key={c.id} value={c.slug}>{c.nome}</option>
            ))}
          </Selecao>
          <Selecao rotulo="Município do anúncio" value={filtros.municipioId} onChange={(e) => aplicar({ municipioId: e.target.value })}>
            <option value="">Todos</option>
            {catalogo?.municipios.map((m) => (
              <option key={m.id} value={m.id}>{m.nome}/{m.uf}</option>
            ))}
          </Selecao>

          <fieldset className="space-y-4 rounded-xl border border-areia-200 bg-white p-4">
            <legend className="px-1 text-sm font-semibold">Distância</legend>
            <Selecao
              rotulo="Perto de"
              value={filtros.perto}
              onChange={(e) =>
                aplicar({
                  perto: e.target.value,
                  raioKm: e.target.value ? filtros.raioKm || 50 : "",
                  ordenar: e.target.value ? "mais_proximos" : filtros.ordenar === "mais_proximos" ? "recentes" : filtros.ordenar,
                })
              }
            >
              <option value="">Qualquer lugar</option>
              {usuario && <option value="eu">Meu endereço</option>}
              {catalogo?.municipios.map((m) => (
                <option key={m.id} value={m.id}>{m.nome}/{m.uf}</option>
              ))}
            </Selecao>
            <Selecao rotulo="Raio máximo" value={filtros.raioKm} disabled={!filtros.perto} onChange={(e) => aplicar({ raioKm: e.target.value })}>
              <option value="">Sem limite</option>
              {RAIOS.map((km) => (
                <option key={km} value={km}>Até {km} km</option>
              ))}
            </Selecao>
          </fieldset>

          {filtrosAtivos > 0 && (
            <Botao variante="fantasma" tamanho="sm" onClick={limpar}>
              Limpar filtros
            </Botao>
          )}
        </aside>

        <section aria-label="Resultados" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p role="status" aria-live="polite" className="text-sm text-tinta-suave">
              {data ? `${data.total} ${data.total === 1 ? "anúncio encontrado" : "anúncios encontrados"}` : "Buscando…"}
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="ordenar" className="sr-only">Ordenar por</label>
              <select
                id="ordenar"
                value={filtros.ordenar}
                onChange={(e) => aplicar({ ordenar: e.target.value })}
                className="h-9 rounded-lg border border-areia-300 bg-white px-2 text-sm"
              >
                {ORDENACOES.filter((o) => o.valor !== "mais_proximos" || filtros.perto).map((o) => (
                  <option key={o.valor} value={o.valor}>{o.nome}</option>
                ))}
              </select>
              <div role="group" aria-label="Modo de exibição" className="flex rounded-lg border border-areia-300 bg-white p-0.5">
                {[
                  { visao: "lista", rotulo: "Lista", Icone: LayoutGrid },
                  { visao: "mapa", rotulo: "Mapa", Icone: IconeMapa },
                ].map(({ visao, rotulo, Icone }) => (
                  <button
                    key={visao}
                    type="button"
                    aria-pressed={filtros.visao === visao}
                    onClick={() => aplicar({ visao, pagina: filtros.pagina })}
                    className={cx(
                      "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold",
                      filtros.visao === visao ? "bg-brand-700 text-white" : "text-tinta-suave hover:bg-areia-100",
                    )}
                  >
                    <Icone aria-hidden className="size-4" />
                    {rotulo}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error ? (
            <Alerta titulo="Não foi possível carregar os anúncios">{mensagemDeErro(error)}</Alerta>
          ) : !data ? (
            <GradeDeAnunciosCarregando />
          ) : data.itens.length === 0 ? (
            <EstadoVazio
              Icone={SearchX}
              titulo="Nenhum anúncio com esses filtros"
              acao={filtrosAtivos > 0 ? <Botao variante="secundario" onClick={limpar}>Limpar filtros</Botao> : undefined}
            >
              Tente ampliar o raio de distância ou buscar por outro tipo de resíduo.
            </EstadoVazio>
          ) : noMapa ? (
            <>
              <Mapa
                rotulo="Mapa dos anúncios encontrados"
                className="h-[520px]"
                pontos={agruparPorLocal(data.itens)}
              />
              <p className="mt-2 text-sm text-tinta-suave">
                Clique em um marcador para ver o anúncio. O mapa precisa de internet para carregar as imagens de fundo.
              </p>
            </>
          ) : (
            <>
              <GradeDeAnuncios anuncios={data.itens} />
              <Paginacao pagina={data.pagina} totalPaginas={data.totalPaginas} aoMudar={(pagina) => aplicar({ pagina })} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
