import type { Metadata } from "next";
import { Pagina } from "@/components/pagina";
import { NovoAnuncio } from "./tela";

export const metadata: Metadata = { title: "Anunciar resíduo" };

export default function PaginaNovoAnuncio() {
  return (
    <Pagina estreita>
      <NovoAnuncio />
    </Pagina>
  );
}
