"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useSessao } from "@/lib/sessao";
import type { Usuario } from "@/lib/tipos";
import { Alerta, CarregandoPagina } from "./feedback";

/**
 * Exibe o conteúdo apenas para quem está logado; visitantes vão para /entrar
 * e voltam para a página de origem depois do login.
 * A proteção de verdade é feita pela API; isto é só navegação.
 */
export function Protegido({ children, apenasAdmin }: { children: (usuario: Usuario) => ReactNode; apenasAdmin?: boolean }) {
  const { usuario } = useSessao();
  const router = useRouter();
  const caminho = usePathname();

  useEffect(() => {
    if (usuario === null) router.replace(`/entrar?proximo=${encodeURIComponent(caminho)}`);
  }, [usuario, router, caminho]);

  if (!usuario) return <CarregandoPagina rotulo="Verificando sua sessão" />;
  if (apenasAdmin && usuario.papel !== "ADMIN") {
    return <Alerta titulo="Área restrita">Esta página é exclusiva da administração da plataforma.</Alerta>;
  }
  return <>{children(usuario)}</>;
}
