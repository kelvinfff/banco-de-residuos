"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Botao } from "./botao";

interface Props {
  aberto: boolean;
  titulo: string;
  children?: ReactNode;
  rotuloConfirmar: string;
  /** Ação destrutiva (encerrar, cancelar, recusar): botão em tom de perigo. */
  perigo?: boolean;
  enviando?: boolean;
  aoConfirmar: () => void;
  aoFechar: () => void;
}

/**
 * Confirmação modal sobre o <dialog> nativo: o navegador cuida de prender o foco,
 * fechar com Esc e devolver o foco ao elemento que abriu.
 */
export function DialogoConfirmacao({ aberto, titulo, children, rotuloConfirmar, perigo, enviando, aoConfirmar, aoFechar }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (aberto && !dialogo.open) dialogo.showModal();
    if (!aberto && dialogo.open) dialogo.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      onClose={aoFechar}
      aria-labelledby="titulo-dialogo"
      className="m-auto w-[min(92vw,28rem)] rounded-xl border border-areia-200 bg-white p-6 text-tinta backdrop:bg-brand-900/50"
    >
      <h2 id="titulo-dialogo" className="text-lg font-semibold">{titulo}</h2>
      {children && <div className="mt-2 text-sm text-tinta-suave">{children}</div>}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Botao variante="secundario" onClick={aoFechar} disabled={enviando}>
          Voltar
        </Botao>
        <Botao variante={perigo ? "perigo" : "primario"} onClick={aoConfirmar} enviando={enviando}>
          {rotuloConfirmar}
        </Botao>
      </div>
    </dialog>
  );
}
