"use client";

import { ArrowLeft, CreditCard, Mail, PackageCheck, Phone, Receipt } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Botao, LinkBotao } from "@/components/botao";
import { DialogoConfirmacao } from "@/components/dialogo";
import { Estrelas } from "@/components/estrelas";
import { Alerta, CarregandoPagina, Cartao, EstadoVazio } from "@/components/feedback";
import { Protegido } from "@/components/protegido";
import { SeloTransacao } from "@/components/selos";
import { api, ErroApi, mensagemDeErro } from "@/lib/api";
import { formatarDinheiro, formatarPreco, formatarQuantidade, formatarTaxa, NOME_ORGANIZACAO, nomeDeExibicao } from "@/lib/formato";
import type { Transacao, Usuario } from "@/lib/tipos";
import { FormularioAvaliacao } from "./avaliacao";
import { Etapas } from "./etapas";

type Acao = "pagar" | "confirmar-retirada" | "cancelar";

const DIALOGOS: Record<Acao, { titulo: string; confirmar: string; perigo?: boolean }> = {
  pagar: { titulo: "Confirmar pagamento simulado?", confirmar: "Pagar agora" },
  "confirmar-retirada": { titulo: "Confirmar que retirou o material?", confirmar: "Confirmar retirada" },
  cancelar: { titulo: "Cancelar esta transação?", confirmar: "Cancelar transação", perigo: true },
};

function Detalhe({ usuario }: { usuario: Usuario }) {
  const { id } = useParams<{ id: string }>();
  const chave = `/api/transacoes/${id}`;
  const { data, error, mutate } = useSWR<{ transacao: Transacao }>(chave, { refreshInterval: 15_000 });
  const { mutate: mutarGlobal } = useSWRConfig();
  const [acao, setAcao] = useState<Acao | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (error) {
    return error instanceof ErroApi && error.status === 404 ? (
      <EstadoVazio Icone={Receipt} titulo="Transação não encontrada" acao={<LinkBotao href="/transacoes">Ver minhas transações</LinkBotao>}>
        Ela não existe ou você não participa dela.
      </EstadoVazio>
    ) : (
      <Alerta titulo="Não foi possível carregar a transação">{mensagemDeErro(error)}</Alerta>
    );
  }
  if (!data) return <CarregandoPagina rotulo="Carregando transação" />;

  const t = data.transacao;
  const souComprador = t.meuPapel === "comprador";
  const souVendedor = t.meuPapel === "vendedor";
  const outraParte = souComprador ? t.vendedor : t.comprador;
  const minhaAvaliacao = t.avaliacoes.find((a) => a.autorId === usuario.id);
  const avaliacaoRecebida = t.avaliacoes.find((a) => a.avaliadoId === usuario.id);

  const atualizarResto = () =>
    mutarGlobal((k) => typeof k === "string" && (k === "/api/transacoes" || k === "/api/usuarios/eu/resumo" || k.startsWith("/api/anuncios")));

  async function executar() {
    if (!acao) return;
    setErro(null);
    setEnviando(true);
    try {
      const resposta = await api<{ transacao: Transacao }>(`${chave}/${acao}`, { method: "POST" });
      await mutate(resposta, { revalidate: false });
      void atualizarResto();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      void mutate();
    } finally {
      setEnviando(false);
      setAcao(null);
    }
  }

  return (
    <>
      <Link href="/transacoes" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft aria-hidden className="size-4" /> Todas as transações
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SeloTransacao status={t.status} />
        <span className="text-sm text-tinta-suave">
          Transação nº {t.id} · {souComprador ? "sua compra" : souVendedor ? "sua venda" : "visão da administração"}
        </span>
      </div>
      <h1 className="mt-2 text-2xl font-bold">{t.anuncio.titulo}</h1>

      <Cartao className="mt-6 p-5">
        <Etapas transacao={t} />
        {t.status === "CANCELADA" && (
          <Alerta tom="aviso" titulo="Transação cancelada">
            A quantidade voltou a ficar disponível no anúncio. Nenhum valor foi cobrado.
          </Alerta>
        )}
      </Cartao>

      {erro && <Alerta className="mt-4">{erro}</Alerta>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-6">
          {/* Próximo passo */}
          {t.possoPagar && (
            <Cartao className="p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <CreditCard aria-hidden className="size-5 text-brand-600" /> Pagamento
              </h2>
              <p className="mt-1 text-sm text-tinta-suave">
                O valor fica retido pela plataforma e só é repassado ao vendedor depois que você confirmar a retirada.
              </p>
              <Alerta tom="info" className="mt-3">
                Ambiente de demonstração: o pagamento é simulado e nenhum valor real é cobrado.
              </Alerta>
              <div className="mt-4 flex flex-wrap gap-2">
                <Botao onClick={() => setAcao("pagar")}>Pagar {formatarDinheiro(t.valorTotalCentavos)} (simulado)</Botao>
                <Botao variante="perigo" onClick={() => setAcao("cancelar")}>Cancelar compra</Botao>
              </div>
            </Cartao>
          )}
          {souVendedor && t.status === "AGUARDANDO_PAGAMENTO" && (
            <Cartao className="p-5">
              <h2 className="text-lg font-semibold">Aguardando o pagamento do comprador</h2>
              <p className="mt-1 text-sm text-tinta-suave">
                Combine a retirada pelo contato ao lado. Entregue o material somente depois que o pagamento aparecer aqui.
              </p>
              <Botao variante="perigo" tamanho="sm" className="mt-4" onClick={() => setAcao("cancelar")}>
                Cancelar venda
              </Botao>
            </Cartao>
          )}
          {t.possoConfirmarRetirada && (
            <Cartao className="p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <PackageCheck aria-hidden className="size-5 text-brand-600" /> Retirada
              </h2>
              <p className="mt-1 text-sm text-tinta-suave">
                {t.valorTotalCentavos > 0
                  ? "Pagamento registrado. Depois de retirar o material e conferir a quantidade, confirme aqui para liberar o valor ao vendedor."
                  : "Depois de retirar o material e conferir a quantidade, confirme aqui para concluir a doação."}
              </p>
              <Botao className="mt-4" onClick={() => setAcao("confirmar-retirada")}>Confirmar retirada</Botao>
            </Cartao>
          )}
          {souVendedor && t.status === "PAGA" && (
            <Alerta tom="info" titulo="Pagamento registrado">
              O valor de {formatarDinheiro(t.valorLiquidoCentavos)} será liberado quando o comprador confirmar a retirada.
            </Alerta>
          )}

          {/* Avaliações */}
          {t.status === "CONCLUIDA" && t.meuPapel !== "observador" && (
            <Cartao className="p-5">
              <h2 className="text-lg font-semibold">Avaliação</h2>
              {minhaAvaliacao ? (
                <div className="mt-2 text-sm">
                  <p className="text-tinta-suave">Sua avaliação para {nomeDeExibicao(outraParte)}:</p>
                  <div className="mt-1"><Estrelas nota={minhaAvaliacao.nota} /></div>
                  {minhaAvaliacao.comentario && <p className="mt-1">{minhaAvaliacao.comentario}</p>}
                </div>
              ) : (
                <div className="mt-3">
                  <FormularioAvaliacao transacaoId={t.id} nomeAvaliado={nomeDeExibicao(outraParte)} aoAvaliar={() => Promise.all([mutate(), atualizarResto()])} />
                </div>
              )}
              {avaliacaoRecebida && (
                <div className="mt-4 border-t border-areia-200 pt-4 text-sm">
                  <p className="text-tinta-suave">{nomeDeExibicao(outraParte)} avaliou você:</p>
                  <div className="mt-1"><Estrelas nota={avaliacaoRecebida.nota} /></div>
                  {avaliacaoRecebida.comentario && <p className="mt-1">{avaliacaoRecebida.comentario}</p>}
                </div>
              )}
            </Cartao>
          )}

          {/* Valores */}
          <Cartao className="p-5">
            <h2 className="text-lg font-semibold">Valores</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-tinta-suave">
                  {formatarQuantidade(t.quantidade, t.unidade)} × {formatarPreco(t.precoUnitarioCentavos, t.unidade)}
                </dt>
                <dd className="font-semibold tabular-nums">{formatarDinheiro(t.valorTotalCentavos)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-tinta-suave">Comissão da plataforma ({formatarTaxa(t.taxaComissaoBps)})</dt>
                <dd className="tabular-nums">− {formatarDinheiro(t.comissaoCentavos)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-areia-200 pt-2 text-base">
                <dt className="font-semibold">{souComprador ? "Vendedor recebe" : "Você recebe"}</dt>
                <dd className="font-display font-bold tabular-nums">{formatarDinheiro(t.valorLiquidoCentavos)}</dd>
              </div>
              {souComprador && (
                <div className="flex justify-between gap-4 text-base">
                  <dt className="font-semibold">Você paga</dt>
                  <dd className="font-display font-bold text-brand-800 tabular-nums">{formatarDinheiro(t.valorTotalCentavos)}</dd>
                </div>
              )}
            </dl>
          </Cartao>
        </div>

        <aside className="space-y-4">
          <Cartao className="p-5">
            <h2 className="font-sans text-sm font-semibold tracking-normal text-tinta-suave">{souComprador ? "Vendedor" : "Comprador"}</h2>
            <Link href={`/usuarios/${outraParte.id}`} className="text-lg font-semibold hover:text-brand-700 hover:underline">
              {nomeDeExibicao(outraParte)}
            </Link>
            <p className="text-sm text-tinta-suave">
              {outraParte.organizacao ? `${outraParte.nome} · ` : ""}
              {NOME_ORGANIZACAO[outraParte.tipoOrganizacao]} · {outraParte.municipio.nome}/{outraParte.municipio.uf}
            </p>
            <ul role="list" className="mt-3 space-y-2 text-sm">
              {outraParte.telefone && (
                <li>
                  <a href={`tel:${outraParte.telefone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 font-semibold text-brand-700 hover:underline">
                    <Phone aria-hidden className="size-4" /> {outraParte.telefone}
                  </a>
                </li>
              )}
              <li>
                <a href={`mailto:${outraParte.email}`} className="inline-flex items-center gap-2 font-semibold break-all text-brand-700 hover:underline">
                  <Mail aria-hidden className="size-4 shrink-0" /> {outraParte.email}
                </a>
              </li>
            </ul>
            <p className="mt-3 text-xs text-tinta-suave">Use o contato para combinar a retirada do material.</p>
          </Cartao>
          <Cartao className="p-5 text-sm">
            <h2 className="font-sans text-sm font-semibold tracking-normal text-tinta-suave">Origem</h2>
            <ul role="list" className="mt-2 space-y-1.5">
              <li><Link href={`/anuncios/${t.anuncioId}`} className="font-semibold text-brand-700 hover:underline">Ver anúncio</Link></li>
              <li><Link href={`/negociacoes/${t.negociacaoId}`} className="font-semibold text-brand-700 hover:underline">Ver histórico da negociação</Link></li>
            </ul>
          </Cartao>
        </aside>
      </div>

      <DialogoConfirmacao
        aberto={acao !== null}
        titulo={acao ? DIALOGOS[acao].titulo : ""}
        rotuloConfirmar={acao ? DIALOGOS[acao].confirmar : ""}
        perigo={acao ? DIALOGOS[acao].perigo : false}
        enviando={enviando}
        aoConfirmar={() => void executar()}
        aoFechar={() => setAcao(null)}
      >
        {acao === "pagar" && <>Será registrado o pagamento de <strong className="text-tinta">{formatarDinheiro(t.valorTotalCentavos)}</strong>. Nenhum valor real é cobrado nesta demonstração.</>}
        {acao === "confirmar-retirada" && "Confirme somente depois de receber o material. Esta ação conclui a transação e não pode ser desfeita."}
        {acao === "cancelar" && "A quantidade volta a ficar disponível no anúncio. Esta ação não pode ser desfeita."}
      </DialogoConfirmacao>
    </>
  );
}

export function TelaTransacao() {
  return <Protegido>{(usuario) => <Detalhe usuario={usuario} />}</Protegido>;
}
