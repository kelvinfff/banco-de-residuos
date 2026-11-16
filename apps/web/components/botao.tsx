import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";

type Variante = "primario" | "secundario" | "fantasma" | "perigo" | "destaque";
type Tamanho = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors " +
  "disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-brand-700 text-white hover:bg-brand-800",
  secundario: "border border-areia-300 bg-white text-tinta hover:bg-areia-100",
  fantasma: "text-brand-700 hover:bg-brand-50",
  perigo: "border border-perigo-600 bg-white text-perigo-700 hover:bg-perigo-50",
  destaque: "bg-manga-400 text-brand-900 hover:bg-manga-300",
};

const TAMANHOS: Record<Tamanho, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

interface Estilo {
  variante?: Variante;
  tamanho?: Tamanho;
  larguraTotal?: boolean;
}

const classes = ({ variante = "primario", tamanho = "md", larguraTotal }: Estilo, extra?: string) =>
  cx(BASE, VARIANTES[variante], TAMANHOS[tamanho], larguraTotal && "w-full", extra);

interface BotaoProps extends Estilo, Omit<ComponentProps<"button">, "children"> {
  children: ReactNode;
  /** Mostra o estado de espera e desabilita o botão. */
  enviando?: boolean;
}

export function Botao({ variante, tamanho, larguraTotal, enviando, className, children, disabled, type = "button", ...resto }: BotaoProps) {
  return (
    <button
      type={type}
      className={classes({ variante, tamanho, larguraTotal }, className)}
      disabled={disabled || enviando}
      aria-busy={enviando || undefined}
      {...resto}
    >
      {enviando && (
        <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      )}
      {children}
    </button>
  );
}

interface LinkBotaoProps extends Estilo, Omit<ComponentProps<typeof Link>, "children"> {
  children: ReactNode;
}

/** Link com aparência de botão (navegação). */
export function LinkBotao({ variante, tamanho, larguraTotal, className, children, ...resto }: LinkBotaoProps) {
  return (
    <Link className={classes({ variante, tamanho, larguraTotal }, className)} {...resto}>
      {children}
    </Link>
  );
}
