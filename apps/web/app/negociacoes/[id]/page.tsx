import type { Metadata } from "next";
import { Pagina } from "@/components/pagina";
import { TelaNegociacao } from "./tela";

export const metadata: Metadata = { title: "Negociação" };

export default function PaginaNegociacao() {
  return (
    <Pagina>
      <TelaNegociacao />
    </Pagina>
  );
}
