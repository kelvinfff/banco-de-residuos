import type { Metadata } from "next";
import { Pagina } from "@/components/pagina";
import { EditarAnuncio } from "./tela";

export const metadata: Metadata = { title: "Editar anúncio" };

export default function PaginaEditarAnuncio() {
  return (
    <Pagina estreita>
      <EditarAnuncio />
    </Pagina>
  );
}
