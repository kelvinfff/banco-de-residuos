"use client";

import { ArrowLeft, Check, MessagesSquare, Reply, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Botao, LinkBotao } from "@/components/botao";
import { CapaAnuncio } from "@/components/capa-anuncio";
import { DialogoConfirmacao } from "@/components/dialogo";
import { Reputacao } from "@/components/estrelas";
import { Alerta, CarregandoPagina, Cartao, EstadoVazio } from "@/components/feedback";
import { FormularioOferta, type DadosOferta } from "@/components/formulario-oferta";
import { Protegido } from "@/components/protegido";
import { SeloNegociacao } from "@/components/selos";
import { api, ErroApi, mensagemDeErro } from "@/lib/api";
import { useCatalogo } from "@/lib/catalogo";
import { cx } from "@/lib/cx";
import {
  formatarDataHora,
  formatarDinheiro,
  formatarPreco,
  formatarQuantidade,
  formatarTaxa,
  NOME_ORGANIZACAO,
  nomeDeExibicao,
} from "@/lib/formato";
import type { Negociacao, Transacao, Usuario } from "@/lib/tipos";

type Confirmacao = "aceitar" | "encerrar" | null;

function Conversa({ usuario }: { usuario: Usuario }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const catalogo = useCatalogo();
  const { mutate: mutarGlobal } = useSWRConfig();
  const chave = `/api/negociacoes/${id}`;
  const { data, error, mutate } = useSWR<{ negociacao: Negociacao }>(chave, { refreshInterval: 15_000 });

  const [contrapropondo, setContrapropondo] = useState(false);
  const [confirmacao, setConfirmacao] = useState<Confirmacao>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (error) {
    return error instanceof ErroApi && error.status === 404 ? (
      <EstadoVazio Icone={MessagesSquare} titulo="Negociação não encontrada" acao={<LinkBotao href="/negociacoes">Ver minhas negociações</LinkBotao>}>
        Ela não existe ou você não participa dela.
      </EstadoVazio>
    ) : (
      <Alerta titulo="Não foi possível carregar a negociação">{mensagemDeErro(error)}</Alerta>
    );
  }
  if (!data) return <CarregandoPagina rotulo="Carregando negociação" />;

  const n = data.negociacao;
  const { anuncio } = n;
  const taxa = catalogo?.taxaComissaoBps ?? 500;
  const souComprador = n.meuPapel === "comprador";
  const outraParte = souComprador ? anuncio.vendedor : n.comprador;
  const ultima = n.ultimaOferta;
  const total = ultima ? Math.round(ultima.quantidade * ultima.precoUnitarioCentavos) : 0;
  const comissao = Math.round((total * taxa) / 10_000);

  /** Atualiza contadores do cabeçalho e listas que dependem desta negociação. */
  const atualizarResto = () =>
    mutarGlobal((k) => typeof k === "string" && (k === "/api/negociacoes" || k === "/api/usuarios/eu/resumo" || k.startsWith("/api/transacoes")));

  async function contrapropor(oferta: DadosOferta) {
    const resposta = await api<{ negociacao: Negociacao }>(`${chave}/ofertas`, { method: "POST", corpo: oferta });
    await mutate(resposta, { revalidate: false });
    setContrapropondo(false);
    void atualizarResto();
  }

  async function confirmar() {
    setErro(null);
    setEnviando(true);
    try {
      if (confirmacao === "aceitar") {
        const { transacao } = await api<{ transacao: Transacao }>(`${chave}/aceitar`, { method: "POST" });
        void atualizarResto();
        router.push(`/transacoes/${transacao.id}`);
        return;
      }
      const resposta = await api<{ negociacao: Negociacao }>(`${chave}/encerrar`, { method: "POST" });
      await mutate(resposta, { revalidate: false });
      void atualizarResto();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      void mutate();
    } finally {
      setEnviando(false);
      setConfirmacao(null);
    }
  }

  return (
    <>
      <Link href="/negociacoes" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft aria-hidden className="size-4" /> Todas as negociações
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SeloNegociacao status={n.status} />
            <span className="text-sm text-tinta-suave">Negociação nº {n.id}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold">{anuncio.titulo}</h1>
          <p className="text-tinta-suave">
            Você é {souComprador ? "o comprador" : n.meuPapel === "vendedor" ? "o vendedor" : "observador (administração)"} · com{" "}
            <Link href={`/usuarios/${outraParte.id}`} className="font-semibold text-brand-700 underline">
              {nomeDeExibicao(outraParte)}
            </Link>
          </p>

          {erro && <Alerta className="mt-4">{erro}</Alerta>}

          {/* Histórico de propostas, da mais antiga para a mais recente */}
          <section aria-labelledby="titulo-historico" className="mt-6">
            <h2 id="titulo-historico" className="sr-only">Histórico de propostas</h2>
            <ol className="space-y-3">
              {n.ofertas.map((oferta, i) => {
                const minha = oferta.autorId === usuario.id;
                const doComprador = oferta.autorId === n.compradorId;
                const autor = doComprador ? n.comprador : anuncio.vendedor;
                const atual = i === n.ofertas.length - 1;
                return (
                  <li key={oferta.id} className={cx("flex", minha ? "justify-end" : "justify-start")}>
                    <div
                      className={cx(
                        "w-full max-w-md rounded-xl border p-4",
                        minha ? "border-brand-200 bg-brand-50" : "border-areia-200 bg-white",
                        !atual && "opacity-75",
                      )}
                    >
                      <p className="text-xs text-tinta-suave">
                        <span className="font-semibold text-tinta">{minha ? "Você" : nomeDeExibicao(autor)}</span>
                        {" · "}
                        {i === 0 ? "proposta inicial" : "contraproposta"}
                        {" · "}
                        <time dateTime={oferta.criadoEm}>{formatarDataHora(oferta.criadoEm)}</time>
                      </p>
                      <p className="mt-1 font-display text-lg font-bold">
                        {formatarQuantidade(oferta.quantidade, anuncio.unidade)}{" "}
                        <span className="font-sans text-base font-normal text-tinta-suave">a</span>{" "}
                        {formatarPreco(oferta.precoUnitarioCentavos, anuncio.unidade)}
                      </p>
                      <p className="text-sm text-tinta-suave">
                        Total: {formatarDinheiro(Math.round(oferta.quantidade * oferta.precoUnitarioCentavos))}
                      </p>
                      {oferta.mensagem && <p className="mt-2 border-t border-areia-200 pt-2 text-sm whitespace-pre-line">{oferta.mensagem}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* O que fazer agora */}
          <section aria-labelledby="titulo-acao" className="mt-6">
            <h2 id="titulo-acao" className="sr-only">Próximo passo</h2>
            {n.status === "ACEITA" && n.transacao ? (
              <Alerta tom="sucesso" titulo="Negócio fechado">
                <p>A proposta foi aceita e virou uma transação.</p>
                <LinkBotao href={`/transacoes/${n.transacao.id}`} tamanho="sm" className="mt-3">
                  Ver transação
                </LinkBotao>
              </Alerta>
            ) : n.status === "RECUSADA" ? (
              <Alerta tom="aviso" titulo="Proposta recusada pelo vendedor">
                {souComprador && anuncio.status === "ATIVO" ? (
                  <>
                    Você pode{" "}
                    <Link href={`/anuncios/${anuncio.id}`} className="font-semibold underline">
                      enviar uma nova proposta
                    </Link>{" "}
                    pelo anúncio.
                  </>
                ) : (
                  "Esta negociação foi encerrada sem acordo."
                )}
              </Alerta>
            ) : n.status === "CANCELADA" ? (
              <Alerta tom="aviso" titulo="Negociação cancelada pelo comprador">Esta negociação foi encerrada sem acordo.</Alerta>
            ) : n.meuPapel === "observador" ? (
              <Alerta tom="info">Negociação em andamento entre as partes.</Alerta>
            ) : anuncio.status !== "ATIVO" ? (
              <Alerta tom="aviso" titulo="O anúncio saiu do ar">
                <p>Não é possível aceitar ou propor enquanto o anúncio não estiver ativo.</p>
                <Botao variante="perigo" tamanho="sm" className="mt-3" onClick={() => setConfirmacao("encerrar")}>
                  Encerrar negociação
                </Botao>
              </Alerta>
            ) : contrapropondo && ultima ? (
              <Cartao className="p-5">
                <h3 className="mb-3 text-lg font-semibold">Sua contraproposta</h3>
                <FormularioOferta
                  unidade={anuncio.unidade}
                  quantidadeDisponivel={anuncio.quantidadeDisponivel}
                  inicial={{ quantidade: Math.min(ultima.quantidade, anuncio.quantidadeDisponivel), precoUnitarioCentavos: ultima.precoUnitarioCentavos }}
                  taxaComissaoBps={taxa}
                  rotuloEnviar="Enviar contraproposta"
                  aoEnviar={contrapropor}
                  aoCancelar={() => setContrapropondo(false)}
                />
              </Cartao>
            ) : n.minhaVez && ultima ? (
              <Cartao className="p-5">
                <h3 className="text-lg font-semibold">É a sua vez de responder</h3>
                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-tinta-suave">Total da proposta</dt>
                    <dd className="font-semibold tabular-nums">{formatarDinheiro(total)}</dd>
                  </div>
                  {total > 0 && (
                    <>
                      <div className="flex justify-between gap-4">
                        <dt className="text-tinta-suave">Comissão da plataforma ({formatarTaxa(taxa)})</dt>
                        <dd className="tabular-nums">− {formatarDinheiro(comissao)}</dd>
                      </div>
                      <div className="flex justify-between gap-4 border-t border-areia-200 pt-1">
                        <dt className="font-semibold">{souComprador ? "Vendedor recebe" : "Você recebe"}</dt>
                        <dd className="font-semibold tabular-nums">{formatarDinheiro(total - comissao)}</dd>
                      </div>
                    </>
                  )}
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Botao onClick={() => setConfirmacao("aceitar")}>
                    <Check aria-hidden className="size-4" /> Aceitar proposta
                  </Botao>
                  <Botao variante="secundario" onClick={() => setContrapropondo(true)}>
                    <Reply aria-hidden className="size-4" /> Contrapropor
                  </Botao>
                  <Botao variante="perigo" onClick={() => setConfirmacao("encerrar")}>
                    <X aria-hidden className="size-4" /> {souComprador ? "Desistir" : "Recusar"}
                  </Botao>
                </div>
              </Cartao>
            ) : (
              <Alerta tom="info" titulo={`Aguardando resposta de ${nomeDeExibicao(outraParte)}`}>
                <p>Você será avisado aqui quando houver uma resposta. Esta página se atualiza sozinha.</p>
                <Botao variante="perigo" tamanho="sm" className="mt-3" onClick={() => setConfirmacao("encerrar")}>
                  {souComprador ? "Desistir da negociação" : "Recusar e encerrar"}
                </Botao>
              </Alerta>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <Cartao className="overflow-hidden">
            <CapaAnuncio foto={anuncio.fotos[0]} categoria={anuncio.categoria} titulo={anuncio.titulo} className="aspect-[16/9] w-full" />
            <div className="p-4">
              <h2 className="font-sans text-sm font-semibold tracking-normal text-tinta-suave">Anúncio</h2>
              <Link href={`/anuncios/${anuncio.id}`} className="font-semibold hover:text-brand-700 hover:underline">
                {anuncio.titulo}
              </Link>
              <dl className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-tinta-suave">Preço anunciado</dt>
                  <dd className="font-semibold">{formatarPreco(anuncio.precoUnitarioCentavos, anuncio.unidade)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-tinta-suave">Disponível</dt>
                  <dd className="font-semibold">{formatarQuantidade(anuncio.quantidadeDisponivel, anuncio.unidade)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-tinta-suave">Local</dt>
                  <dd className="font-semibold">{anuncio.municipio.nome}/{anuncio.municipio.uf}</dd>
                </div>
              </dl>
            </div>
          </Cartao>
          <Cartao className="p-4">
            <h2 className="font-sans text-sm font-semibold tracking-normal text-tinta-suave">{souComprador ? "Vendedor" : "Comprador"}</h2>
            <Link href={`/usuarios/${outraParte.id}`} className="font-semibold hover:text-brand-700 hover:underline">
              {nomeDeExibicao(outraParte)}
            </Link>
            <p className="text-sm text-tinta-suave">
              {NOME_ORGANIZACAO[outraParte.tipoOrganizacao]} · {outraParte.municipio.nome}/{outraParte.municipio.uf}
            </p>
            <div className="mt-1">
              <Reputacao nota={outraParte.notaMedia} total={outraParte.totalAvaliacoes} />
            </div>
            <p className="mt-2 text-xs text-tinta-suave">O contato é liberado quando o negócio for fechado.</p>
          </Cartao>
        </aside>
      </div>

      <DialogoConfirmacao
        aberto={confirmacao === "aceitar"}
        titulo="Aceitar esta proposta?"
        rotuloConfirmar="Aceitar e fechar negócio"
        enviando={enviando}
        aoConfirmar={() => void confirmar()}
        aoFechar={() => setConfirmacao(null)}
      >
        {ultima && (
          <>
            {formatarQuantidade(ultima.quantidade, anuncio.unidade)} a {formatarPreco(ultima.precoUnitarioCentavos, anuncio.unidade)}, total de{" "}
            <strong className="text-tinta">{formatarDinheiro(total)}</strong>. A quantidade é reservada no anúncio e o contato das duas partes é liberado.
          </>
        )}
      </DialogoConfirmacao>
      <DialogoConfirmacao
        aberto={confirmacao === "encerrar"}
        titulo={souComprador ? "Desistir desta negociação?" : "Recusar esta negociação?"}
        rotuloConfirmar={souComprador ? "Desistir" : "Recusar"}
        perigo
        enviando={enviando}
        aoConfirmar={() => void confirmar()}
        aoFechar={() => setConfirmacao(null)}
      >
        A negociação será encerrada sem acordo. {souComprador ? "Você poderá abrir outra pelo anúncio." : "O comprador poderá enviar uma nova proposta pelo anúncio."}
      </DialogoConfirmacao>
    </>
  );
}

export function TelaNegociacao() {
  return <Protegido>{(usuario) => <Conversa usuario={usuario} />}</Protegido>;
}
