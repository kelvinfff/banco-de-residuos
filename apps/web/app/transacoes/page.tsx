import type { Metadata } from "next";
import { Pagina } from "@/components/pagina";
import { Transacoes } from "./tela";

export const metadata: Metadata = { title: "Transações" };

export default function PaginaTransacoes() {
  return (
    <Pagina>
      <Transacoes />
    </Pagina>
  );
}
