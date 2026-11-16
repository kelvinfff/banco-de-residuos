"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { Abas } from "@/components/abas";
import { Botao } from "@/components/botao";
import { Alerta, CarregandoPagina, Cartao, Selo, TituloPagina } from "@/components/feedback";
import { Paginacao } from "@/components/paginacao";
import { Protegido } from "@/components/protegido";
import { SeloAnuncio, SeloTransacao } from "@/components/selos";
import { api, mensagemDeErro } from "@/lib/api";
import {
  formatarData,
  formatarDinheiro,
  formatarQuantidade,
  NOME_ORGANIZACAO,
  NOME_STATUS_ANUNCIO,
  nomeDeExibicao,
} from "@/lib/formato";
import type { AnuncioResumido, Paginado, ResumoAdmin, TransacaoAdmin, UsuarioAdmin } from "@/lib/tipos";
import { GraficoDeBarras } from "./grafico";

type Aba = "resumo" | "usuarios" | "anuncios" | "transacoes";

const mesCurto = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

const CELULA = "px-3 py-2.5 text-left align-middle";
const CABECALHO = `${CELULA} text-xs font-semibold tracking-wide text-tinta-suave uppercase`;

function Tabela({ rotulo, cabecalhos, children }: { rotulo: string; cabecalhos: string[]; children: React.ReactNode }) {
  return (
    // Tabelas largas rolam na horizontal em telas pequenas, sem quebrar a página.
    <div className="overflow-x-auto rounded-xl border border-areia-200 bg-white" tabIndex={0} role="region" aria-label={rotulo}>
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-areia-200 bg-areia-50">
          <tr>
            {cabecalhos.map((c) => (
              <th key={c} scope="col" className={CABECALHO}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-areia-200">{children}</tbody>
      </table>
    </div>
  );
}

function Indicador({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="flex flex-col-reverse justify-end rounded-xl border border-areia-200 bg-white p-4">
      {detalhe && <p className="text-xs text-tinta-suave">{detalhe}</p>}
      <dt className="text-sm text-tinta-suave">{rotulo}</dt>
      <dd className="font-display text-2xl font-bold tabular-nums">{valor}</dd>
    </div>
  );
}

function VisaoGeral() {
  const { data, error } = useSWR<ResumoAdmin>("/api/admin/resumo", { refreshInterval: 30_000 });
  if (error) return <Alerta>{mensagemDeErro(error)}</Alerta>;
  if (!data) return <CarregandoPagina />;

  const meses = data.porMes.map((m) => ({ ...m, rotulo: mesCurto.format(new Date(m.mes)).replace(".", "") }));
  const maiorCategoria = Math.max(...data.porCategoria.map((c) => c.volumeCentavos), 1);

  return (
    <div className="space-y-6">
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          rotulo="Comissão realizada"
          valor={formatarDinheiro(data.comissaoRealizadaCentavos)}
          detalhe={`A receber (pagas, aguardando retirada): ${formatarDinheiro(data.comissaoAReceberCentavos)}`}
        />
        <Indicador
          rotulo="Volume negociado"
          valor={formatarDinheiro(data.volumeNegociadoCentavos)}
          detalhe={`${data.transacoes.PAGA.quantidade + data.transacoes.CONCLUIDA.quantidade} transações pagas ou concluídas`}
        />
        <Indicador rotulo="Organizações cadastradas" valor={String(data.usuarios)} />
        <Indicador rotulo="Anúncios ativos" valor={String(data.anuncios.ATIVO)} detalhe={`${data.negociacoesAbertas} negociações em andamento`} />
      </dl>

      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao className="p-5">
          <GraficoDeBarras titulo="Comissão por mês" pontos={meses.map((m) => ({ rotulo: m.rotulo, valor: m.comissaoCentavos }))} formatar={formatarDinheiro} />
        </Cartao>
        <Cartao className="p-5">
          <GraficoDeBarras titulo="Volume negociado por mês" pontos={meses.map((m) => ({ rotulo: m.rotulo, valor: m.volumeCentavos }))} formatar={formatarDinheiro} />
        </Cartao>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao className="p-5">
          <h2 className="font-sans text-sm font-semibold tracking-normal">Volume por tipo de resíduo</h2>
          {data.porCategoria.length === 0 ? (
            <p className="mt-3 text-sm text-tinta-suave">Ainda não há vendas registradas.</p>
          ) : (
            <ul role="list" className="mt-3 space-y-3">
              {data.porCategoria.map((c) => (
                <li key={c.categoria} className="text-sm">
                  <div className="flex justify-between gap-3">
                    <span>{c.categoria}</span>
                    <span className="tabular-nums">
                      <strong>{formatarDinheiro(c.volumeCentavos)}</strong>
                      <span className="text-tinta-suave"> · {c.quantidade} {c.quantidade === 1 ? "venda" : "vendas"}</span>
                    </span>
                  </div>
                  <div aria-hidden className="mt-1 h-2 rounded-full bg-areia-100">
                    <div className="h-2 rounded-full bg-brand-600" style={{ width: `${(c.volumeCentavos / maiorCategoria) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
        <Cartao className="p-5">
          <h2 className="font-sans text-sm font-semibold tracking-normal">Situação das transações</h2>
          <dl className="mt-3 divide-y divide-areia-200 text-sm">
            {(["AGUARDANDO_PAGAMENTO", "PAGA", "CONCLUIDA", "CANCELADA"] as const).map((status) => (
              <div key={status} className="flex items-center justify-between gap-3 py-2">
                <dt><SeloTransacao status={status} /></dt>
                <dd className="tabular-nums">
                  <strong>{data.transacoes[status].quantidade}</strong>
                  <span className="text-tinta-suave"> · {formatarDinheiro(data.transacoes[status].valorTotalCentavos)}</span>
                </dd>
              </div>
            ))}
          </dl>
          <h2 className="mt-5 font-sans text-sm font-semibold tracking-normal">Anúncios por situação</h2>
          <ul role="list" className="mt-2 flex flex-wrap gap-2 text-sm">
            {Object.entries(data.anuncios).map(([status, quantidade]) => (
              <li key={status}><Selo>{NOME_STATUS_ANUNCIO[status as keyof typeof NOME_STATUS_ANUNCIO]}: {quantidade}</Selo></li>
            ))}
          </ul>
        </Cartao>
      </div>
    </div>
  );
}

function ListaUsuarios({ meuId }: { meuId: number }) {
  const [pagina, setPagina] = useState(1);
  const { data, error, mutate } = useSWR<Paginado<UsuarioAdmin>>(`/api/admin/usuarios?pagina=${pagina}&porPagina=20`);
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function alternar(usuario: UsuarioAdmin) {
    setErro(null);
    setOcupado(usuario.id);
    try {
      await api(`/api/admin/usuarios/${usuario.id}`, { method: "PATCH", corpo: { ativo: !usuario.ativo } });
      await mutate();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setOcupado(null);
    }
  }

  if (error) return <Alerta>{mensagemDeErro(error)}</Alerta>;
  if (!data) return <CarregandoPagina />;

  return (
    <>
      {erro && <Alerta className="mb-4">{erro}</Alerta>}
      <Tabela rotulo="Usuários" cabecalhos={["Conta", "Tipo", "Município", "Anúncios", "Vendas / compras", "Situação", "Ação"]}>
        {data.itens.map((u) => (
          <tr key={u.id}>
            <td className={CELULA}>
              <Link href={`/usuarios/${u.id}`} className="font-semibold hover:text-brand-700 hover:underline">{nomeDeExibicao(u)}</Link>
              <div className="text-xs text-tinta-suave">{u.email}</div>
            </td>
            <td className={CELULA}>{u.papel === "ADMIN" ? "Administração" : NOME_ORGANIZACAO[u.tipoOrganizacao]}</td>
            <td className={CELULA}>{u.municipio.nome}/{u.municipio.uf}</td>
            <td className={`${CELULA} tabular-nums`}>{u._count.anuncios}</td>
            <td className={`${CELULA} tabular-nums`}>{u._count.vendas} / {u._count.compras}</td>
            <td className={CELULA}><Selo tom={u.ativo ? "verde" : "perigo"}>{u.ativo ? "Ativa" : "Desativada"}</Selo></td>
            <td className={CELULA}>
              {u.id !== meuId && (
                <Botao variante={u.ativo ? "perigo" : "secundario"} tamanho="sm" enviando={ocupado === u.id} onClick={() => void alternar(u)}>
                  {u.ativo ? "Desativar" : "Reativar"}
                  <span className="sr-only"> {nomeDeExibicao(u)}</span>
                </Botao>
              )}
            </td>
          </tr>
        ))}
      </Tabela>
      <Paginacao pagina={data.pagina} totalPaginas={data.totalPaginas} aoMudar={setPagina} />
    </>
  );
}

function ListaAnuncios() {
  const [pagina, setPagina] = useState(1);
  const { data, error, mutate } = useSWR<Paginado<AnuncioResumido>>(`/api/admin/anuncios?pagina=${pagina}&porPagina=20`);
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function alternar(anuncio: AnuncioResumido) {
    setErro(null);
    setOcupado(anuncio.id);
    try {
      await api(`/api/admin/anuncios/${anuncio.id}`, { method: "PATCH", corpo: { suspenso: anuncio.status !== "SUSPENSO" } });
      await mutate();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setOcupado(null);
    }
  }

  if (error) return <Alerta>{mensagemDeErro(error)}</Alerta>;
  if (!data) return <CarregandoPagina />;

  return (
    <>
      {erro && <Alerta className="mb-4">{erro}</Alerta>}
      <Tabela rotulo="Anúncios" cabecalhos={["Anúncio", "Anunciante", "Disponível", "Publicado", "Situação", "Moderação"]}>
        {data.itens.map((a) => (
          <tr key={a.id}>
            <td className={CELULA}>
              <Link href={`/anuncios/${a.id}`} className="font-semibold hover:text-brand-700 hover:underline">{a.titulo}</Link>
              <div className="text-xs text-tinta-suave">{a.categoria.nome} · {a.cultura.nome} · {a.municipio.nome}/{a.municipio.uf}</div>
            </td>
            <td className={CELULA}>{nomeDeExibicao(a.vendedor)}</td>
            <td className={`${CELULA} tabular-nums`}>{formatarQuantidade(a.quantidadeDisponivel, a.unidade)}</td>
            <td className={CELULA}>{a.criadoEm ? formatarData(a.criadoEm) : "—"}</td>
            <td className={CELULA}><SeloAnuncio status={a.status} /></td>
            <td className={CELULA}>
              {a.status !== "ENCERRADO" && (
                <Botao variante={a.status === "SUSPENSO" ? "secundario" : "perigo"} tamanho="sm" enviando={ocupado === a.id} onClick={() => void alternar(a)}>
                  {a.status === "SUSPENSO" ? "Liberar" : "Suspender"}
                  <span className="sr-only"> {a.titulo}</span>
                </Botao>
              )}
            </td>
          </tr>
        ))}
      </Tabela>
      <Paginacao pagina={data.pagina} totalPaginas={data.totalPaginas} aoMudar={setPagina} />
    </>
  );
}

function ListaTransacoes() {
  const [pagina, setPagina] = useState(1);
  const { data, error } = useSWR<Paginado<TransacaoAdmin>>(`/api/admin/transacoes?pagina=${pagina}&porPagina=20`);

  if (error) return <Alerta>{mensagemDeErro(error)}</Alerta>;
  if (!data) return <CarregandoPagina />;

  return (
    <>
      <Tabela rotulo="Transações" cabecalhos={["Nº", "Data", "Anúncio", "Vendedor → comprador", "Total", "Comissão", "Situação"]}>
        {data.itens.map((t) => (
          <tr key={t.id}>
            <td className={`${CELULA} tabular-nums`}>
              <Link href={`/transacoes/${t.id}`} className="font-semibold text-brand-700 hover:underline">{t.id}</Link>
            </td>
            <td className={CELULA}>{formatarData(t.criadoEm)}</td>
            <td className={CELULA}>
              {t.anuncio.titulo}
              <div className="text-xs text-tinta-suave">{formatarQuantidade(t.quantidade, t.unidade)}</div>
            </td>
            <td className={CELULA}>{nomeDeExibicao(t.vendedor)} → {nomeDeExibicao(t.comprador)}</td>
            <td className={`${CELULA} tabular-nums`}>{formatarDinheiro(t.valorTotalCentavos)}</td>
            <td className={`${CELULA} font-semibold tabular-nums`}>{formatarDinheiro(t.comissaoCentavos)}</td>
            <td className={CELULA}><SeloTransacao status={t.status} /></td>
          </tr>
        ))}
      </Tabela>
      <Paginacao pagina={data.pagina} totalPaginas={data.totalPaginas} aoMudar={setPagina} />
    </>
  );
}

function Conteudo({ meuId }: { meuId: number }) {
  const router = useRouter();
  const caminho = usePathname();
  const parametro = useSearchParams().get("aba");
  const aba: Aba = parametro === "usuarios" || parametro === "anuncios" || parametro === "transacoes" ? parametro : "resumo";

  return (
    <>
      <TituloPagina titulo="Administração" descricao="Visão da plataforma: comissões, contas, moderação de anúncios e transações." />
      <Abas
        rotulo="Seções da administração"
        atual={aba}
        aoMudar={(valor) => router.replace(valor === "resumo" ? caminho : `${caminho}?aba=${valor}`, { scroll: false })}
        abas={[
          { valor: "resumo", rotulo: "Visão geral" },
          { valor: "usuarios", rotulo: "Usuários" },
          { valor: "anuncios", rotulo: "Anúncios" },
          { valor: "transacoes", rotulo: "Transações" },
        ]}
      />
      {aba === "resumo" && <VisaoGeral />}
      {aba === "usuarios" && <ListaUsuarios meuId={meuId} />}
      {aba === "anuncios" && <ListaAnuncios />}
      {aba === "transacoes" && <ListaTransacoes />}
    </>
  );
}

export function Administracao() {
  return <Protegido apenasAdmin>{(usuario) => <Conteudo meuId={usuario.id} />}</Protegido>;
}
