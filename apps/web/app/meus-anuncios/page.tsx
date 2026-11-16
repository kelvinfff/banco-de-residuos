import type { Metadata } from "next";
import { Pagina } from "@/components/pagina";
import { MeusAnuncios } from "./tela";

export const metadata: Metadata = { title: "Meus anúncios" };

export default function PaginaMeusAnuncios() {
  return (
    <Pagina>
      <MeusAnuncios />
    </Pagina>
  );
}
