"use client";

import { TituloPagina } from "@/components/feedback";
import { FormularioAnuncio } from "@/components/formulario-anuncio";
import { Protegido } from "@/components/protegido";

export function NovoAnuncio() {
  return (
    <Protegido>
      {() => (
        <>
          <TituloPagina titulo="Anunciar resíduo" descricao="Publicar é gratuito. Você só paga a comissão quando a venda acontece." />
          <FormularioAnuncio />
        </>
      )}
    </Protegido>
  );
}
