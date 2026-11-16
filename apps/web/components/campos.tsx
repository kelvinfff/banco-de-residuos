"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { cx } from "@/lib/cx";

const CONTROLE =
  "block w-full rounded-lg border bg-white px-3 text-base text-tinta placeholder:text-areia-400 " +
  "disabled:bg-areia-100 disabled:text-tinta-suave";
const borda = (erro?: string) => (erro ? "border-perigo-600" : "border-areia-300");

interface Moldura {
  rotulo: string;
  /** Texto de ajuda abaixo do campo. */
  ajuda?: string;
  erro?: string;
  opcional?: boolean;
}

function MolduraCampo({ id, rotulo, ajuda, erro, opcional, children }: Moldura & { id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-tinta">
        {rotulo}
        {opcional && <span className="ml-1 font-normal text-tinta-suave">(opcional)</span>}
      </label>
      {children}
      {erro ? (
        <p id={`${id}-erro`} role="alert" className="mt-1.5 text-sm text-perigo-700">
          {erro}
        </p>
      ) : (
        ajuda && (
          <p id={`${id}-ajuda`} className="mt-1.5 text-sm text-tinta-suave">
            {ajuda}
          </p>
        )
      )}
    </div>
  );
}

const descricao = (id: string, { erro, ajuda }: Pick<Moldura, "erro" | "ajuda">) =>
  erro ? `${id}-erro` : ajuda ? `${id}-ajuda` : undefined;

type CampoProps = Moldura & Omit<ComponentProps<"input">, "id"> & { sufixo?: string; prefixo?: string };

export function Campo({ rotulo, ajuda, erro, opcional, className, sufixo, prefixo, ...resto }: CampoProps) {
  const id = useId();
  const entrada = (
    <input
      id={id}
      className={cx(CONTROLE, "h-11", borda(erro), prefixo && "pl-10", sufixo && "pr-12", className)}
      aria-invalid={erro ? true : undefined}
      aria-describedby={descricao(id, { erro, ajuda })}
      {...resto}
    />
  );
  return (
    <MolduraCampo id={id} rotulo={rotulo} ajuda={ajuda} erro={erro} opcional={opcional}>
      {prefixo || sufixo ? (
        <div className="relative">
          {prefixo && (
            <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-tinta-suave">
              {prefixo}
            </span>
          )}
          {entrada}
          {sufixo && (
            <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-tinta-suave">
              {sufixo}
            </span>
          )}
        </div>
      ) : (
        entrada
      )}
    </MolduraCampo>
  );
}

type SelecaoProps = Moldura & Omit<ComponentProps<"select">, "id">;

export function Selecao({ rotulo, ajuda, erro, opcional, className, children, ...resto }: SelecaoProps) {
  const id = useId();
  return (
    <MolduraCampo id={id} rotulo={rotulo} ajuda={ajuda} erro={erro} opcional={opcional}>
      <select
        id={id}
        className={cx(CONTROLE, "h-11 pr-8", borda(erro), className)}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricao(id, { erro, ajuda })}
        {...resto}
      >
        {children}
      </select>
    </MolduraCampo>
  );
}

type AreaTextoProps = Moldura & Omit<ComponentProps<"textarea">, "id">;

export function AreaTexto({ rotulo, ajuda, erro, opcional, className, rows = 4, ...resto }: AreaTextoProps) {
  const id = useId();
  return (
    <MolduraCampo id={id} rotulo={rotulo} ajuda={ajuda} erro={erro} opcional={opcional}>
      <textarea
        id={id}
        rows={rows}
        className={cx(CONTROLE, "py-2.5", borda(erro), className)}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricao(id, { erro, ajuda })}
        {...resto}
      />
    </MolduraCampo>
  );
}
