"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import { api, ErroApi } from "./api";
import type { Usuario } from "./tipos";

const CHAVE_SESSAO = "/api/auth/eu";

/** Visitante (401) não é erro: vira `null`. */
async function buscarSessao(): Promise<Usuario | null> {
  try {
    return (await api<{ usuario: Usuario }>(CHAVE_SESSAO)).usuario;
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 401) return null;
    throw erro;
  }
}

/**
 * Conta logada.
 * - `usuario === undefined`: ainda carregando;
 * - `usuario === null`: visitante.
 */
export function useSessao() {
  const { data, isLoading, mutate } = useSWR(CHAVE_SESSAO, buscarSessao, {
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });
  const { mutate: mutarTudo } = useSWRConfig();
  const router = useRouter();

  const entrar = useCallback(
    async (email: string, senha: string) => {
      const { usuario } = await api<{ usuario: Usuario }>("/api/auth/login", {
        method: "POST",
        corpo: { email, senha },
      });
      // Descarta dados em cache de uma eventual sessão anterior.
      await mutarTudo(() => true, undefined, { revalidate: false });
      await mutate(usuario, { revalidate: false });
      return usuario;
    },
    [mutate, mutarTudo],
  );

  const cadastrar = useCallback(
    async (dados: Record<string, unknown>) => {
      const { usuario } = await api<{ usuario: Usuario }>("/api/auth/cadastro", {
        method: "POST",
        corpo: dados,
      });
      await mutarTudo(() => true, undefined, { revalidate: false });
      await mutate(usuario, { revalidate: false });
      return usuario;
    },
    [mutate, mutarTudo],
  );

  const sair = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" });
    await mutarTudo(() => true, undefined, { revalidate: false });
    await mutate(null, { revalidate: false });
    router.push("/");
  }, [mutate, mutarTudo, router]);

  return {
    usuario: data,
    carregando: isLoading,
    entrar,
    cadastrar,
    sair,
    /** Atualiza os dados da conta em cache (ex.: depois de editar o perfil). */
    atualizar: (usuario: Usuario) => mutate(usuario, { revalidate: false }),
  };
}
