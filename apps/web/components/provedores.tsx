"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { buscar, ErroApi } from "@/lib/api";

/** Configuração global de dados: fetcher padrão e sem insistir em erros 4xx. */
export function Provedores({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: buscar,
        onErrorRetry: (erro, _chave, _config, revalidar, { retryCount }) => {
          if (erro instanceof ErroApi && erro.status >= 400 && erro.status < 500) return;
          if (retryCount >= 3) return;
          setTimeout(() => revalidar({ retryCount }), 2000 * (retryCount + 1));
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
