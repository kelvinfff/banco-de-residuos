import type { Metadata } from "next";
import { Pagina } from "@/components/pagina";
import { FormularioEntrar } from "./formulario";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaEntrar() {
  return (
    <Pagina>
      <FormularioEntrar />
    </Pagina>
  );
}
