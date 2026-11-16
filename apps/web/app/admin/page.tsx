import type { Metadata } from "next";
import { Pagina } from "@/components/pagina";
import { Administracao } from "./tela";

export const metadata: Metadata = { title: "Administração" };

export default function PaginaAdmin() {
  return (
    <Pagina>
      <Administracao />
    </Pagina>
  );
}
