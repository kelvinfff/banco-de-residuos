"use client";

import { ArrowRight, CircleCheck, CreditCard, MessagesSquare, PackageCheck, Plus, Star } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import useSWR from "swr";
import { LinkBotao } from "@/components/botao";
import { Reputacao } from "@/components/estrelas";
import { Alerta, CarregandoPagina, Cartao } from "@/components/feedback";
import { Protegido } from "@/components/protegido";
import { mensagemDeErro } from "@/lib/api";
import { formatarDinheiro, nomeDeExibicao } from "@/lib/formato";
import type { ResumoUsuario, TransacaoNaLista, Usuario } from "@/lib/tipos";

function Indicador({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="flex flex-col-reverse justify-end rounded-xl border border-areia-200 bg-white p-4">
      {detalhe && <p className="text-xs text-tinta-suave">{detalhe}</p>}
      <dt className="text-sm text-tinta-suave">{rotulo}</dt>
      <dd className="font-display text-2xl font-bold tabular-nums">{valor}</dd>
    </div>
  );
}

function Pendencia({ href, Icone, children }: { href: string; Icone: typeof Star; children: ReactNode }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 rounded-lg border border-manga-300 bg-manga-50 p-3 text-sm font-semibold text-manga-800 hover:bg-manga-100">
        <Icone aria-hidden className="size-5 shrink-0" />
        <span className="flex-1">{children}</span>
        <ArrowRight aria-hidden className="size-4 shrink-0" />
      </Link>
    </li>
  );
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

function Conteudo({ usuario }: { usuario: Usuario }) {
  const { data: resumo, error } = useSWR<ResumoUsuario>("/api/usuarios/eu/resumo");
  const { data: transacoes } = useSWR<{ itens: TransacaoNaLista[] }>("/api/transacoes");

  if (error) return <Alerta titulo="Não foi possível carregar o painel">{mensagemDeErro(error)}</Alerta>;
  if (!resumo) return <CarregandoPagina rotulo="Carregando painel" />;

  const avaliacoesPendentes = transacoes?.itens.filter((t) => t.avaliacaoPendente).length ?? 0;
  const temPendencias =
    resumo.aguardandoMinhaResposta + resumo.pagamentosPendentes + resumo.retiradasPendentes + avaliacoesPendentes > 0;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Olá, {usuario.nome.split(" ")[0]}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-tinta-suave">
            {nomeDeExibicao(usuario)} <Reputacao nota={usuario.notaMedia} total={usuario.totalAvaliacoes} />
          </p>
        </div>
        <LinkBotao href="/anuncios/novo">
          <Plus aria-hidden className="size-4" /> Anunciar resíduo
        </LinkBotao>
      </div>

      <section aria-labelledby="titulo-pendencias" className="mb-8">
        <h2 id="titulo-pendencias" className="mb-3 text-lg font-semibold">O que precisa de você</h2>
        {temPendencias ? (
          <ul role="list" className="grid gap-2 sm:grid-cols-2">
            {resumo.aguardandoMinhaResposta > 0 && (
              <Pendencia href="/negociacoes" Icone={MessagesSquare}>
                {plural(resumo.aguardandoMinhaResposta, "proposta aguarda", "propostas aguardam")} sua resposta
              </Pendencia>
            )}
            {resumo.pagamentosPendentes > 0 && (
              <Pendencia href="/transacoes?papel=comprador" Icone={CreditCard}>
                {plural(resumo.pagamentosPendentes, "compra aguarda", "compras aguardam")} pagamento
              </Pendencia>
            )}
            {resumo.retiradasPendentes > 0 && (
              <Pendencia href="/transacoes?papel=comprador" Icone={PackageCheck}>
                {plural(resumo.retiradasPendentes, "retirada", "retiradas")} para confirmar
              </Pendencia>
            )}
            {avaliacoesPendentes > 0 && (
              <Pendencia href="/transacoes" Icone={Star}>
                {plural(avaliacoesPendentes, "negócio concluído", "negócios concluídos")} para avaliar
              </Pendencia>
            )}
          </ul>
        ) : (
          <p className="flex items-center gap-2 rounded-lg border border-areia-200 bg-white p-3 text-sm text-tinta-suave">
            <CircleCheck aria-hidden className="size-5 text-brand-600" /> Tudo em dia. Nenhuma pendência no momento.
          </p>
        )}
      </section>

      <section aria-labelledby="titulo-vendas" className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="titulo-vendas" className="text-lg font-semibold">Suas vendas</h2>
          <Link href="/meus-anuncios" className="text-sm font-semibold text-brand-700 hover:underline">Meus anúncios</Link>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Indicador rotulo="Anúncios ativos" valor={String(resumo.anunciosAtivos)} />
          <Indicador rotulo="Vendas realizadas" valor={String(resumo.vendas.quantidade)} />
          <Indicador rotulo="Total vendido" valor={formatarDinheiro(resumo.vendas.valorTotalCentavos)} />
          <Indicador
            rotulo="Você recebe (líquido)"
            valor={formatarDinheiro(resumo.vendas.valorLiquidoCentavos)}
            detalhe={`Comissão da plataforma: ${formatarDinheiro(resumo.vendas.comissaoCentavos)}`}
          />
        </dl>
      </section>

      <section aria-labelledby="titulo-compras">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="titulo-compras" className="text-lg font-semibold">Suas compras</h2>
          <Link href="/anuncios" className="text-sm font-semibold text-brand-700 hover:underline">Explorar resíduos</Link>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Indicador rotulo="Negociações abertas" valor={String(resumo.negociacoesAbertas)} />
          <Indicador rotulo="Compras realizadas" valor={String(resumo.compras.quantidade)} />
          <Indicador rotulo="Total comprado" valor={formatarDinheiro(resumo.compras.valorTotalCentavos)} />
        </dl>
      </section>

      {usuario.latitude === null && (
        <Cartao className="mt-8 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-tinta-suave">
            Marque seu endereço no mapa para buscar resíduos por distância a partir do seu local.
          </p>
          <LinkBotao href="/perfil" variante="secundario" tamanho="sm">Completar perfil</LinkBotao>
        </Cartao>
      )}
    </>
  );
}

export function Painel() {
  return <Protegido>{(usuario) => <Conteudo usuario={usuario} />}</Protegido>;
}
