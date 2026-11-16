"use client";

import { useParams, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Alerta, CarregandoPagina, TituloPagina } from "@/components/feedback";
import { FormularioAnuncio } from "@/components/formulario-anuncio";
import { Protegido } from "@/components/protegido";
import { api, mensagemDeErro } from "@/lib/api";
import type { Anuncio, Usuario } from "@/lib/tipos";

function Edicao({ usuario }: { usuario: Usuario }) {
  const { id } = useParams<{ id: string }>();
  const fotosFalharam = useSearchParams().get("fotos") === "falha";
  const { data, error } = useSWR<{ anuncio: Anuncio }>([`/api/anuncios/${id}`, usuario.id], ([url]: [string]) => api<{ anuncio: Anuncio }>(url), {
    // O formulário é preenchido uma vez; revalidar em segundo plano apagaria o que foi digitado.
    revalidateOnFocus: false,
  });

  if (error) return <Alerta titulo="Não foi possível carregar o anúncio">{mensagemDeErro(error)}</Alerta>;
  if (!data) return <CarregandoPagina rotulo="Carregando anúncio" />;
  if (data.anuncio.vendedorId !== usuario.id) {
    return <Alerta titulo="Este anúncio não é seu">Somente quem publicou pode editar.</Alerta>;
  }
  if (data.anuncio.status === "ENCERRADO" || data.anuncio.status === "SUSPENSO") {
    return (
      <Alerta tom="aviso" titulo="Este anúncio não pode ser editado">
        {data.anuncio.status === "SUSPENSO"
          ? "Ele foi suspenso pela moderação da plataforma."
          : "Anúncios encerrados não podem ser alterados. Publique um novo anúncio."}
      </Alerta>
    );
  }

  return (
    <>
      <TituloPagina titulo="Editar anúncio" descricao={data.anuncio.titulo} />
      {fotosFalharam && (
        <Alerta tom="aviso" titulo="O anúncio foi salvo, mas as fotos não foram enviadas" className="mb-6">
          Tente adicioná-las novamente abaixo.
        </Alerta>
      )}
      {/* `key` recria o formulário se o usuário abrir outro anúncio. */}
      <FormularioAnuncio key={data.anuncio.id} anuncio={data.anuncio} />
    </>
  );
}

export function EditarAnuncio() {
  return <Protegido>{(usuario) => <Edicao usuario={usuario} />}</Protegido>;
}
