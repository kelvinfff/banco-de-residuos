"use client";

import { ArrowRight, MessagesSquare } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Abas } from "@/components/abas";
import { LinkBotao } from "@/components/botao";
import { CapaAnuncio } from "@/components/capa-anuncio";
import { Alerta, CarregandoPagina, EstadoVazio, Selo, TituloPagina } from "@/components/feedback";
import { Protegido } from "@/components/protegido";
import { SeloNegociacao } from "@/components/selos";
import { mensagemDeErro } from "@/lib/api";
import { formatarDinheiro, formatarPreco, formatarQuantidade, nomeDeExibicao, tempoDesde } from "@/lib/formato";
import type { Negociacao } from "@/lib/tipos";

type Papel = "todos" | "comprador" | "vendedor";

function Lista() {
  const router = useRouter();
  const caminho = usePathname();
  const parametro = useSearchParams().get("papel");
  const papel: Papel = parametro === "comprador" || parametro === "vendedor" ? parametro : "todos";
  const { data, error } = useSWR<{ itens: Negociacao[] }>("/api/negociacoes", { refreshInterval: 20_000 });

  if (error) return <Alerta titulo="Não foi possível carregar as negociações">{mensagemDeErro(error)}</Alerta>;
  if (!data) return <CarregandoPagina rotulo="Carregando negociações" />;

  const itens = data.itens.filter((n) => papel === "todos" || n.meuPapel === papel);
  // Primeiro o que depende de mim, depois o que está aberto, por fim o histórico.
  const peso = (n: Negociacao) => (n.minhaVez ? 0 : n.status === "ABERTA" ? 1 : 2);
  const ordenados = [...itens].sort((a, b) => peso(a) - peso(b));

  return (
    <>
      <TituloPagina titulo="Negociações" descricao="Propostas que você fez e que recebeu nos seus anúncios." />
      <Abas
        rotulo="Filtrar por papel"
        atual={papel}
        aoMudar={(valor) => router.replace(valor === "todos" ? caminho : `${caminho}?papel=${valor}`, { scroll: false })}
        abas={[
          { valor: "todos", rotulo: "Todas", contagem: data.itens.length },
          { valor: "comprador", rotulo: "Estou comprando", contagem: data.itens.filter((n) => n.meuPapel === "comprador").length },
          { valor: "vendedor", rotulo: "Estou vendendo", contagem: data.itens.filter((n) => n.meuPapel === "vendedor").length },
        ]}
      />

      {ordenados.length === 0 ? (
        <EstadoVazio Icone={MessagesSquare} titulo="Nenhuma negociação por aqui" acao={<LinkBotao href="/anuncios">Explorar resíduos</LinkBotao>}>
          Quando você enviar uma proposta, ou receber uma em um anúncio seu, ela aparece nesta lista.
        </EstadoVazio>
      ) : (
        <ul role="list" className="space-y-3">
          {ordenados.map((n) => {
            const outraParte = n.meuPapel === "comprador" ? n.anuncio.vendedor : n.comprador;
            const oferta = n.ultimaOferta;
            return (
              <li key={n.id} className="relative flex flex-col gap-4 rounded-xl border border-areia-200 bg-white p-4 transition-colors hover:border-brand-300 sm:flex-row sm:items-center">
                <CapaAnuncio foto={n.anuncio.fotos[0]} categoria={n.anuncio.categoria} titulo={n.anuncio.titulo} className="hidden size-20 shrink-0 rounded-lg sm:flex" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeloNegociacao status={n.status} />
                    {n.minhaVez && <Selo tom="manga">Aguardando sua resposta</Selo>}
                    {n.status === "ABERTA" && !n.minhaVez && <Selo>Aguardando a outra parte</Selo>}
                  </div>
                  <Link href={`/negociacoes/${n.id}`} className="mt-1 block truncate font-semibold after:absolute after:inset-0 hover:text-brand-700">
                    {n.anuncio.titulo}
                  </Link>
                  <p className="truncate text-sm text-tinta-suave">
                    {n.meuPapel === "comprador" ? "Vendedor" : "Comprador"}: {nomeDeExibicao(outraParte)} · atualizada {tempoDesde(n.atualizadoEm)}
                  </p>
                </div>
                {oferta && (
                  <div className="shrink-0 sm:text-right">
                    <p className="font-display text-lg font-bold tabular-nums">
                      {formatarDinheiro(Math.round(oferta.quantidade * oferta.precoUnitarioCentavos))}
                    </p>
                    <p className="text-sm text-tinta-suave">
                      {formatarQuantidade(oferta.quantidade, n.anuncio.unidade)} a {formatarPreco(oferta.precoUnitarioCentavos, n.anuncio.unidade)}
                    </p>
                  </div>
                )}
                <ArrowRight aria-hidden className="hidden size-5 shrink-0 text-areia-400 sm:block" />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export function Negociacoes() {
  return <Protegido>{() => <Lista />}</Protegido>;
}
