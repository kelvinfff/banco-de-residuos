import type { Metadata } from "next";
import { Pagina } from "@/components/pagina";
import { TelaPerfilPublico } from "./tela";

export const metadata: Metadata = { title: "Perfil" };

export default function PaginaPerfilPublico() {
  return (
    <Pagina>
      <TelaPerfilPublico />
    </Pagina>
  );
}
