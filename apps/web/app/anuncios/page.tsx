import type { Metadata } from "next";
import { Pagina } from "@/components/pagina";
import { Vitrine } from "./vitrine";

export const metadata: Metadata = { title: "Explorar resíduos" };

export default function PaginaAnuncios() {
  return (
    <Pagina>
      <Vitrine />
    </Pagina>
  );
}
