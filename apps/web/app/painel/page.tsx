import type { Metadata } from "next";
import { Pagina } from "@/components/pagina";
import { Painel } from "./tela";

export const metadata: Metadata = { title: "Painel" };

export default function PaginaPainel() {
  return (
    <Pagina>
      <Painel />
    </Pagina>
  );
}
