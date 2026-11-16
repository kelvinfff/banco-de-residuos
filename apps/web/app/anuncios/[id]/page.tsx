import type { Metadata } from "next";
import { Pagina } from "@/components/pagina";
import { DetalheAnuncio } from "./detalhe";

export const metadata: Metadata = { title: "Anúncio" };

export default function PaginaAnuncio() {
  return (
    <Pagina>
      <DetalheAnuncio />
    </Pagina>
  );
}
