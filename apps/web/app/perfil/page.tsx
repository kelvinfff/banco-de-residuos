import type { Metadata } from "next";
import { Pagina } from "@/components/pagina";
import { EditarPerfil } from "./tela";

export const metadata: Metadata = { title: "Editar perfil" };

export default function PaginaPerfil() {
  return (
    <Pagina estreita>
      <EditarPerfil />
    </Pagina>
  );
}
