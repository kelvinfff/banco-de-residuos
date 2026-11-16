"use client";

import { ArrowLeft, CalendarDays, MapPin, Package, PackageX, Pencil, Repeat, Truck } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { LinkBotao } from "@/components/botao";
import { CapaAnuncio } from "@/components/capa-anuncio";
import { Reputacao } from "@/components/estrelas";
import { Alerta, CarregandoPagina, Cartao, EstadoVazio, Selo } from "@/components/feedback";
import { FormularioOferta, type DadosOferta } from "@/components/formulario-oferta";
import { Mapa } from "@/components/mapa";
import { SeloAnuncio } from "@/components/selos";
import { api, ErroApi } from "@/lib/api";
import { useCatalogo } from "@/lib/catalogo";
import { cx } from "@/lib/cx";
import {
  formatarData,
  formatarPreco,
  formatarQuantidade,
  formatarTaxa,
  NOME_FREQUENCIA,
  NOME_ORGANIZACAO,
  nomeDeExibicao,
} from "@/lib/formato";
import { useSessao } from "@/lib/sessao";
import type { Anuncio, Negociacao } from "@/lib/tipos";

interface Resposta {
  anuncio: Anuncio;
  souDono: boolean;
  minhaNegociacaoAbertaId: number | null;
}

export function DetalheAnuncio() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { usuario } = useSessao();
  const catalogo = useCatalogo();
  // A chave inclui o usuário: logado, a resposta diz se já existe negociação aberta.
  const { data, error } = useSWR<Resposta>([`/api/anuncios/${id}`, usuario?.id ?? null], ([url]: [string]) => api<Resposta>(url));
  const [fotoAtual, setFotoAtual] = useState(0);

  if (error) {
    return error instanceof ErroApi && error.status === 404 ? (
      <EstadoVazio Icone={PackageX} titulo="Anúncio não encontrado" acao={<LinkBotao href="/anuncios">Ver anúncios disponíveis</LinkBotao>}>
        Ele pode ter sido removido ou o endereço está incorreto.
      </EstadoVazio>
    ) : (
      <Alerta titulo="Não foi possível carregar o anúncio">{error.message}</Alerta>
    );
  }
  if (!data) return <CarregandoPagina rotulo="Carregando anúncio" />;

  const { anuncio, souDono, minhaNegociacaoAbertaId } = data;
  const foto = anuncio.fotos[fotoAtual] ?? anuncio.fotos[0];
  const taxa = catalogo?.taxaComissaoBps ?? 500;

  async function enviarProposta(oferta: DadosOferta) {
    try {
      const { negociacao } = await api<{ negociacao: Negociacao }>("/api/negociacoes", {
        method: "POST",
        corpo: { anuncioId: anuncio.id, ...oferta },
      });
      router.push(`/negociacoes/${negociacao.id}`);
    } catch (falha) {
      // Já existe uma negociação aberta: leva o usuário até ela.
      if (falha instanceof ErroApi && falha.status === 409 && typeof falha.campos.negociacaoId === "number") {
        router.push(`/negociacoes/${falha.campos.negociacaoId}`);
        return;
      }
      throw falha;
    }
  }

  return (
    <article>
      <Link href="/anuncios" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft aria-hidden className="size-4" /> Voltar para os anúncios
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0">
          <CapaAnuncio foto={foto} categoria={anuncio.categoria} titulo={anuncio.titulo} className={cx("w-full rounded-xl", foto ? "aspect-[16/10]" : "aspect-[16/6]")} />
          {anuncio.fotos.length > 1 && (
            <ul role="list" className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {anuncio.fotos.map((f, i) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => setFotoAtual(i)}
                    aria-label={`Ver foto ${i + 1} de ${anuncio.fotos.length}`}
                    aria-pressed={i === fotoAtual}
                    className={cx("block overflow-hidden rounded-lg border-2", i === fotoAtual ? "border-brand-700" : "border-transparent")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.url} alt="" className="size-16 object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Selo tom="verde">{anuncio.categoria.nome}</Selo>
            <Selo>{anuncio.cultura.nome}</Selo>
            {anuncio.status !== "ATIVO" && <SeloAnuncio status={anuncio.status} />}
          </div>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{anuncio.titulo}</h1>

          <dl className="mt-5 grid gap-x-6 gap-y-4 border-y border-areia-200 py-5 sm:grid-cols-2">
            {[
              { Icone: Package, rotulo: "Quantidade disponível", valor: formatarQuantidade(anuncio.quantidadeDisponivel, anuncio.unidade) },
              { Icone: Repeat, rotulo: "Frequência", valor: NOME_FREQUENCIA[anuncio.frequencia] },
              { Icone: MapPin, rotulo: "Local", valor: `${anuncio.municipio.nome}/${anuncio.municipio.uf}` },
              { Icone: CalendarDays, rotulo: "Anunciado em", valor: formatarData(anuncio.criadoEm) },
            ].map(({ Icone, rotulo, valor }) => (
              <div key={rotulo} className="flex gap-3">
                <Icone aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-600" />
                <div>
                  <dt className="text-sm text-tinta-suave">{rotulo}</dt>
                  <dd className="font-semibold">{valor}</dd>
                </div>
              </div>
            ))}
          </dl>

          <section aria-labelledby="titulo-descricao" className="mt-6">
            <h2 id="titulo-descricao" className="text-lg font-semibold">Sobre o material</h2>
            <p className="mt-2 whitespace-pre-line text-tinta-suave">{anuncio.descricao}</p>
          </section>

          {anuncio.condicoesRetirada && (
            <section aria-labelledby="titulo-retirada" className="mt-6">
              <h2 id="titulo-retirada" className="flex items-center gap-2 text-lg font-semibold">
                <Truck aria-hidden className="size-5 text-brand-600" /> Condições de retirada
              </h2>
              <p className="mt-2 whitespace-pre-line text-tinta-suave">{anuncio.condicoesRetirada}</p>
            </section>
          )}

          <section aria-labelledby="titulo-local" className="mt-6">
            <h2 id="titulo-local" className="text-lg font-semibold">Localização</h2>
            <Mapa
              rotulo={`Mapa com a localização do anúncio em ${anuncio.municipio.nome}`}
              className="mt-3 h-64"
              pontos={[{ id: anuncio.id, latitude: anuncio.latitude, longitude: anuncio.longitude, titulo: anuncio.titulo, subtitulo: `${anuncio.municipio.nome}/${anuncio.municipio.uf}` }]}
            />
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Cartao className="p-5">
            <p className="text-sm text-tinta-suave">Preço desejado</p>
            <p className="font-display text-3xl font-bold text-brand-800">{formatarPreco(anuncio.precoUnitarioCentavos, anuncio.unidade)}</p>

            <div className="mt-5 border-t border-areia-200 pt-5">
              {souDono ? (
                <div className="space-y-3">
                  <Alerta tom="info">Este anúncio é seu.</Alerta>
                  <LinkBotao href={`/anuncios/${anuncio.id}/editar`} variante="secundario" larguraTotal>
                    <Pencil aria-hidden className="size-4" /> Editar anúncio
                  </LinkBotao>
                </div>
              ) : anuncio.status !== "ATIVO" ? (
                <Alerta tom="aviso" titulo="Indisponível no momento">
                  Este anúncio não está recebendo propostas.
                </Alerta>
              ) : minhaNegociacaoAbertaId ? (
                <div className="space-y-3">
                  <Alerta tom="info">Você já está negociando este anúncio.</Alerta>
                  <LinkBotao href={`/negociacoes/${minhaNegociacaoAbertaId}`} larguraTotal>
                    Abrir negociação
                  </LinkBotao>
                </div>
              ) : usuario ? (
                <>
                  <h2 className="mb-3 text-lg font-semibold">Fazer proposta</h2>
                  <FormularioOferta
                    unidade={anuncio.unidade}
                    quantidadeDisponivel={anuncio.quantidadeDisponivel}
                    inicial={{ quantidade: anuncio.quantidadeDisponivel, precoUnitarioCentavos: anuncio.precoUnitarioCentavos }}
                    taxaComissaoBps={taxa}
                    rotuloEnviar="Enviar proposta"
                    aoEnviar={enviarProposta}
                  />
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-tinta-suave">Entre na sua conta para enviar uma proposta ao vendedor.</p>
                  <LinkBotao href={`/entrar?proximo=${encodeURIComponent(`/anuncios/${anuncio.id}`)}`} larguraTotal>
                    Entrar para negociar
                  </LinkBotao>
                  <LinkBotao href={`/cadastro?proximo=${encodeURIComponent(`/anuncios/${anuncio.id}`)}`} variante="secundario" larguraTotal>
                    Criar conta gratuita
                  </LinkBotao>
                </div>
              )}
            </div>
            <p className="mt-4 text-xs text-tinta-suave">
              Comissão de {formatarTaxa(taxa)} sobre a venda, descontada do valor do vendedor. O comprador paga só o combinado.
            </p>
          </Cartao>

          <Cartao className="p-5">
            <h2 className="font-sans text-sm font-semibold tracking-normal text-tinta-suave">Anunciante</h2>
            <Link href={`/usuarios/${anuncio.vendedor.id}`} className="mt-1 block text-lg font-semibold hover:text-brand-700 hover:underline">
              {nomeDeExibicao(anuncio.vendedor)}
            </Link>
            <p className="text-sm text-tinta-suave">
              {NOME_ORGANIZACAO[anuncio.vendedor.tipoOrganizacao]} · {anuncio.vendedor.municipio.nome}/{anuncio.vendedor.municipio.uf}
            </p>
            <div className="mt-2">
              <Reputacao nota={anuncio.vendedor.notaMedia} total={anuncio.vendedor.totalAvaliacoes} />
            </div>
            <p className="mt-3 text-xs text-tinta-suave">
              Telefone e e-mail são liberados para as duas partes quando o negócio é fechado.
            </p>
          </Cartao>
        </aside>
      </div>
    </article>
  );
}
