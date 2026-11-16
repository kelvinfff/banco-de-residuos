import { MapPin, Repeat } from "lucide-react";
import Link from "next/link";
import { formatarDistancia, formatarPreco, formatarQuantidade, NOME_FREQUENCIA, nomeDeExibicao } from "@/lib/formato";
import type { Anuncio } from "@/lib/tipos";
import { CapaAnuncio } from "./capa-anuncio";
import { Reputacao } from "./estrelas";
import { Esqueleto, Selo } from "./feedback";

export function CartaoAnuncio({ anuncio }: { anuncio: Anuncio }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-areia-200 bg-white transition-colors hover:border-brand-300">
      <CapaAnuncio foto={anuncio.fotos[0]} categoria={anuncio.categoria} titulo={anuncio.titulo} className="aspect-[16/10] w-full" />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap gap-1.5">
          <Selo tom="verde">{anuncio.categoria.nome}</Selo>
          <Selo>{anuncio.cultura.nome}</Selo>
        </div>
        <h3 className="mt-2 text-base leading-snug font-semibold">
          {/* O link cobre o cartão inteiro, mas o nome acessível é só o título. */}
          <Link href={`/anuncios/${anuncio.id}`} className="after:absolute after:inset-0 group-hover:text-brand-700">
            {anuncio.titulo}
          </Link>
        </h3>
        <p className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-xl font-bold text-brand-800">
            {formatarPreco(anuncio.precoUnitarioCentavos, anuncio.unidade)}
          </span>
          <span className="text-sm text-tinta-suave">
            {formatarQuantidade(anuncio.quantidadeDisponivel, anuncio.unidade)} disponíveis
          </span>
        </p>
        <dl className="mt-3 space-y-1 text-sm text-tinta-suave">
          <div className="flex items-center gap-1.5">
            <dt><MapPin aria-hidden className="size-4" /><span className="sr-only">Local</span></dt>
            <dd>
              {anuncio.municipio.nome}/{anuncio.municipio.uf}
              {anuncio.distanciaKm != null && <span> · {formatarDistancia(anuncio.distanciaKm)}</span>}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt><Repeat aria-hidden className="size-4" /><span className="sr-only">Frequência</span></dt>
            <dd>{NOME_FREQUENCIA[anuncio.frequencia]}</dd>
          </div>
        </dl>
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-2 border-t border-areia-200 pt-3 text-sm">
            <span className="truncate font-medium">{nomeDeExibicao(anuncio.vendedor)}</span>
            <Reputacao nota={anuncio.vendedor.notaMedia} total={anuncio.vendedor.totalAvaliacoes} compacto />
          </div>
        </div>
      </div>
    </article>
  );
}

export function GradeDeAnuncios({ anuncios }: { anuncios: Anuncio[] }) {
  return (
    <ul role="list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {anuncios.map((anuncio) => (
        <li key={anuncio.id} className="flex min-w-0 [&>article]:w-full [&>article]:min-w-0">
          <CartaoAnuncio anuncio={anuncio} />
        </li>
      ))}
    </ul>
  );
}

export function GradeDeAnunciosCarregando({ quantidade = 6 }: { quantidade?: number }) {
  return (
    <div aria-busy="true" aria-label="Carregando anúncios" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: quantidade }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-areia-200 bg-white">
          <Esqueleto className="aspect-[16/10] rounded-none" />
          <div className="space-y-3 p-4">
            <Esqueleto className="h-5 w-24" />
            <Esqueleto className="h-5 w-full" />
            <Esqueleto className="h-7 w-32" />
            <Esqueleto className="h-4 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}
