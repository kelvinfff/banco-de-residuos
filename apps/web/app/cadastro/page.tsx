import type { Metadata } from "next";
import { Pagina } from "@/components/pagina";
import { FormularioCadastro } from "./formulario";

export const metadata: Metadata = { title: "Criar conta" };

export default function PaginaCadastro() {
  return (
    <Pagina>
      <FormularioCadastro />
    </Pagina>
  );
}
