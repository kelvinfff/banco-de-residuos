import type { Metadata } from "next";
import { Pagina } from "@/components/pagina";
import { Negociacoes } from "./tela";

export const metadata: Metadata = { title: "Negociações" };

export default function PaginaNegociacoes() {
  return (
    <Pagina>
      <Negociacoes />
    </Pagina>
  );
}
