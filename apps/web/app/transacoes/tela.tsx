"use client";

import { ArrowRight, Receipt } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Abas } from "@/components/abas";
import { LinkBotao } from "@/components/botao";
import { Alerta, CarregandoPagina, EstadoVazio, Selo, TituloPagina } from "@/components/feedback";
import { Protegido } from "@/components/protegido";
import { SeloTransacao } from "@/components/selos";
import { mensagemDeErro } from "@/lib/api";
import { formatarData, formatarDinheiro, formatarQuantidade, nomeDeExibicao } from "@/lib/formato";
import type { TransacaoNaLista } from "@/lib/tipos";

type Papel = "todos" | "comprador" | "vendedor";

/** Pendência do usuário em uma transação, se houver. */
function pendencia(t: TransacaoNaLista): string | null {
  if (t.meuPapel === "comprador" && t.status === "AGUARDANDO_PAGAMENTO") return "Pagar";
  if (t.meuPapel === "comprador" && t.status === "PAGA") return "Confirmar retirada";
  if (t.avaliacaoPendente) return "Avaliar";
  return null;
}

function Lista() {
  const router = useRouter();
  const caminho = usePathname();
  const parametro = useSearchParams().get("papel");
  const papel: Papel = parametro === "comprador" || parametro === "vendedor" ? parametro : "todos";
  const { data, error } = useSWR<{ itens: TransacaoNaLista[] }>("/api/transacoes", { refreshInterval: 20_000 });

  if (error) return <Alerta titulo="Não foi possível carregar as transações">{mensagemDeErro(error)}</Alerta>;
  if (!data) return <CarregandoPagina rotulo="Carregando transações" />;

  const itens = data.itens.filter((t) => papel === "todos" || t.meuPapel === papel);

  return (
    <>
      <TituloPagina titulo="Transações" descricao="Negócios fechados: pagamento, retirada e avaliação." />
      <Abas
        rotulo="Filtrar por papel"
        atual={papel}
        aoMudar={(valor) => router.replace(valor === "todos" ? caminho : `${caminho}?papel=${valor}`, { scroll: false })}
        abas={[
          { valor: "todos", rotulo: "Todas", contagem: data.itens.length },
          { valor: "comprador", rotulo: "Compras", contagem: data.itens.filter((t) => t.meuPapel === "comprador").length },
          { valor: "vendedor", rotulo: "Vendas", contagem: data.itens.filter((t) => t.meuPapel === "vendedor").length },
        ]}
      />

      {itens.length === 0 ? (
        <EstadoVazio Icone={Receipt} titulo="Nenhuma transação ainda" acao={<LinkBotao href="/negociacoes">Ver negociações</LinkBotao>}>
          Quando uma proposta é aceita, o negócio aparece aqui para pagamento e retirada.
        </EstadoVazio>
      ) : (
        <ul role="list" className="space-y-3">
          {itens.map((t) => {
            const souComprador = t.meuPapel === "comprador";
            const outraParte = souComprador ? t.vendedor : t.comprador;
            const aFazer = pendencia(t);
            return (
              <li key={t.id} className="relative flex flex-col gap-3 rounded-xl border border-areia-200 bg-white p-4 transition-colors hover:border-brand-300 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeloTransacao status={t.status} />
                    <Selo>{souComprador ? "Compra" : "Venda"}</Selo>
                    {aFazer && <Selo tom="manga">Pendente: {aFazer.toLowerCase()}</Selo>}
                  </div>
                  <Link href={`/transacoes/${t.id}`} className="mt-1 block truncate font-semibold after:absolute after:inset-0 hover:text-brand-700">
                    {t.anuncio.titulo}
                  </Link>
                  <p className="truncate text-sm text-tinta-suave">
                    {formatarQuantidade(t.quantidade, t.unidade)} · {souComprador ? "de" : "para"} {nomeDeExibicao(outraParte)} · {formatarData(t.criadoEm)}
                  </p>
                </div>
                <div className="shrink-0 sm:text-right">
                  <p className="font-display text-lg font-bold tabular-nums">
                    {formatarDinheiro(souComprador ? t.valorTotalCentavos : t.valorLiquidoCentavos)}
                  </p>
                  <p className="text-sm text-tinta-suave">{souComprador ? "valor pago" : `líquido (total ${formatarDinheiro(t.valorTotalCentavos)})`}</p>
                </div>
                <ArrowRight aria-hidden className="hidden size-5 shrink-0 text-areia-400 sm:block" />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export function Transacoes() {
  return <Protegido>{() => <Lista />}</Protegido>;
}
