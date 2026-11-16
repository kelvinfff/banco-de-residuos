"use client";

import { CalendarDays, Handshake, MapPin, UserX } from "lucide-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { LinkBotao } from "@/components/botao";
import { GradeDeAnuncios } from "@/components/cartao-anuncio";
import { Estrelas, Reputacao } from "@/components/estrelas";
import { Alerta, CarregandoPagina, Cartao, EstadoVazio, Selo } from "@/components/feedback";
import { ErroApi, mensagemDeErro } from "@/lib/api";
import { formatarData, NOME_ORGANIZACAO, nomeDeExibicao } from "@/lib/formato";
import { useSessao } from "@/lib/sessao";
import type { PerfilPublico } from "@/lib/tipos";

export function TelaPerfilPublico() {
  const { id } = useParams<{ id: string }>();
  const { usuario: eu } = useSessao();
  const { data, error } = useSWR<PerfilPublico>(`/api/usuarios/${id}`);

  if (error) {
    return error instanceof ErroApi && error.status === 404 ? (
      <EstadoVazio Icone={UserX} titulo="Perfil não encontrado" acao={<LinkBotao href="/anuncios">Explorar resíduos</LinkBotao>}>
        Esta conta não existe ou foi desativada.
      </EstadoVazio>
    ) : (
      <Alerta titulo="Não foi possível carregar o perfil">{mensagemDeErro(error)}</Alerta>
    );
  }
  if (!data) return <CarregandoPagina rotulo="Carregando perfil" />;

  const { usuario, anuncios, avaliacoes, negociosConcluidos } = data;

  return (
    <>
      <Cartao className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Selo tom="verde">{NOME_ORGANIZACAO[usuario.tipoOrganizacao]}</Selo>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{nomeDeExibicao(usuario)}</h1>
            {usuario.organizacao && <p className="text-tinta-suave">Responsável: {usuario.nome}</p>}
          </div>
          {eu?.id === usuario.id && (
            <LinkBotao href="/perfil" variante="secundario" tamanho="sm">Editar perfil</LinkBotao>
          )}
        </div>
        <ul role="list" className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-tinta-suave">
          <li className="inline-flex items-center gap-1.5"><MapPin aria-hidden className="size-4" /> {usuario.municipio.nome}/{usuario.municipio.uf}</li>
          <li className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden className="size-4" /> Na plataforma desde {formatarData(usuario.criadoEm)}</li>
          <li className="inline-flex items-center gap-1.5"><Handshake aria-hidden className="size-4" /> {negociosConcluidos} {negociosConcluidos === 1 ? "negócio concluído" : "negócios concluídos"}</li>
          <li><Reputacao nota={usuario.notaMedia} total={usuario.totalAvaliacoes} /></li>
        </ul>
        {usuario.bio && <p className="mt-4 max-w-2xl whitespace-pre-line">{usuario.bio}</p>}
      </Cartao>

      <section aria-labelledby="titulo-anuncios" className="mt-8">
        <h2 id="titulo-anuncios" className="mb-4 text-xl font-semibold">Anúncios ativos</h2>
        {anuncios.length > 0 ? (
          <GradeDeAnuncios anuncios={anuncios} />
        ) : (
          <p className="rounded-xl border border-dashed border-areia-300 bg-white p-6 text-center text-sm text-tinta-suave">
            Nenhum anúncio ativo no momento.
          </p>
        )}
      </section>

      <section aria-labelledby="titulo-avaliacoes" className="mt-8">
        <h2 id="titulo-avaliacoes" className="mb-4 text-xl font-semibold">Avaliações recebidas</h2>
        {avaliacoes.length > 0 ? (
          <ul role="list" className="grid gap-3 sm:grid-cols-2">
            {avaliacoes.map((a) => (
              <li key={a.id} className="rounded-xl border border-areia-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <Estrelas nota={a.nota} />
                  <time dateTime={a.criadoEm} className="text-xs text-tinta-suave">{formatarData(a.criadoEm)}</time>
                </div>
                {a.comentario && <p className="mt-2 text-sm">{a.comentario}</p>}
                <p className="mt-2 text-xs text-tinta-suave">— {nomeDeExibicao(a.autor)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-areia-300 bg-white p-6 text-center text-sm text-tinta-suave">
            Ainda sem avaliações. Elas aparecem depois do primeiro negócio concluído.
          </p>
        )}
      </section>
    </>
  );
}
