"use client";

import { PackagePlus, Pause, Pencil, Play, Plus, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Botao, LinkBotao } from "@/components/botao";
import { CapaAnuncio } from "@/components/capa-anuncio";
import { DialogoConfirmacao } from "@/components/dialogo";
import { Alerta, CarregandoPagina, EstadoVazio, TituloPagina } from "@/components/feedback";
import { Protegido } from "@/components/protegido";
import { SeloAnuncio } from "@/components/selos";
import { api, mensagemDeErro } from "@/lib/api";
import { formatarPreco, formatarQuantidade, tempoDesde } from "@/lib/formato";
import type { Anuncio } from "@/lib/tipos";

function Lista() {
  const { data, error, mutate } = useSWR<{ itens: Anuncio[] }>("/api/anuncios/meus");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [aEncerrar, setAEncerrar] = useState<Anuncio | null>(null);

  async function mudarStatus(anuncio: Anuncio, status: "ATIVO" | "PAUSADO" | "ENCERRADO") {
    setErro(null);
    setOcupado(anuncio.id);
    try {
      await api(`/api/anuncios/${anuncio.id}`, { method: "PATCH", corpo: { status } });
      await mutate();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setOcupado(null);
      setAEncerrar(null);
    }
  }

  if (error) return <Alerta titulo="Não foi possível carregar seus anúncios">{mensagemDeErro(error)}</Alerta>;
  if (!data) return <CarregandoPagina rotulo="Carregando seus anúncios" />;

  return (
    <>
      <TituloPagina
        titulo="Meus anúncios"
        descricao="Pause quando o material acabar por um tempo; encerre quando não for mais oferecer."
        acao={
          <LinkBotao href="/anuncios/novo">
            <Plus aria-hidden className="size-4" /> Novo anúncio
          </LinkBotao>
        }
      />
      {erro && <Alerta className="mb-4">{erro}</Alerta>}

      {data.itens.length === 0 ? (
        <EstadoVazio Icone={PackagePlus} titulo="Você ainda não anunciou nada" acao={<LinkBotao href="/anuncios/novo">Anunciar resíduo</LinkBotao>}>
          Cadastre o material que sobra na sua produção e receba propostas de compradores da região.
        </EstadoVazio>
      ) : (
        <ul role="list" className="space-y-3">
          {data.itens.map((anuncio) => {
            const editavel = anuncio.status !== "ENCERRADO" && anuncio.status !== "SUSPENSO";
            return (
              <li key={anuncio.id} className="flex flex-col gap-4 rounded-xl border border-areia-200 bg-white p-4 sm:flex-row sm:items-center">
                <CapaAnuncio foto={anuncio.fotos[0]} categoria={anuncio.categoria} titulo={anuncio.titulo} className="aspect-[16/10] w-full shrink-0 rounded-lg sm:w-36" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeloAnuncio status={anuncio.status} />
                    <span className="text-xs text-tinta-suave">Publicado {tempoDesde(anuncio.criadoEm)}</span>
                  </div>
                  <Link href={`/anuncios/${anuncio.id}`} className="mt-1 block truncate font-semibold hover:text-brand-700 hover:underline">
                    {anuncio.titulo}
                  </Link>
                  <p className="text-sm text-tinta-suave">
                    {formatarQuantidade(anuncio.quantidadeDisponivel, anuncio.unidade)} · {formatarPreco(anuncio.precoUnitarioCentavos, anuncio.unidade)}
                  </p>
                  <p className="mt-1 text-sm">
                    {anuncio._count?.negociacoes ? (
                      <Link href="/negociacoes?papel=vendedor" className="font-semibold text-brand-700 underline">
                        {anuncio._count.negociacoes} {anuncio._count.negociacoes === 1 ? "negociação aberta" : "negociações abertas"}
                      </Link>
                    ) : (
                      <span className="text-tinta-suave">Sem negociações abertas</span>
                    )}
                    <span className="text-tinta-suave"> · {anuncio._count?.transacoes ?? 0} vendas</span>
                  </p>
                </div>
                {editavel && (
                  <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
                    <LinkBotao href={`/anuncios/${anuncio.id}/editar`} variante="secundario" tamanho="sm">
                      <Pencil aria-hidden className="size-4" /> Editar
                    </LinkBotao>
                    {anuncio.status === "ATIVO" && (
                      <Botao variante="secundario" tamanho="sm" enviando={ocupado === anuncio.id} onClick={() => void mudarStatus(anuncio, "PAUSADO")}>
                        <Pause aria-hidden className="size-4" /> Pausar
                      </Botao>
                    )}
                    {anuncio.status === "PAUSADO" && (
                      <Botao variante="secundario" tamanho="sm" enviando={ocupado === anuncio.id} onClick={() => void mudarStatus(anuncio, "ATIVO")}>
                        <Play aria-hidden className="size-4" /> Reativar
                      </Botao>
                    )}
                    <Botao variante="perigo" tamanho="sm" onClick={() => setAEncerrar(anuncio)}>
                      <XCircle aria-hidden className="size-4" /> Encerrar
                    </Botao>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <DialogoConfirmacao
        aberto={aEncerrar !== null}
        titulo="Encerrar este anúncio?"
        rotuloConfirmar="Encerrar anúncio"
        perigo
        enviando={ocupado !== null}
        aoConfirmar={() => aEncerrar && void mudarStatus(aEncerrar, "ENCERRADO")}
        aoFechar={() => setAEncerrar(null)}
      >
        “{aEncerrar?.titulo}” sairá da vitrine e não poderá ser reaberto. Negócios já fechados não são afetados.
      </DialogoConfirmacao>
    </>
  );
}

export function MeusAnuncios() {
  return <Protegido>{() => <Lista />}</Protegido>;
}
