import type { Metadata } from "next";
import { Pagina } from "@/components/pagina";
import { TelaTransacao } from "./tela";

export const metadata: Metadata = { title: "Transação" };

export default function PaginaTransacao() {
  return (
    <Pagina>
      <TelaTransacao />
    </Pagina>
  );
}
