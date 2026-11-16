import { CircleAlert, CircleCheck, Info, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type TomAlerta = "erro" | "sucesso" | "info" | "aviso";

const ALERTAS: Record<TomAlerta, { classes: string; Icone: LucideIcon }> = {
  erro: { classes: "border-perigo-600/30 bg-perigo-50 text-perigo-700", Icone: CircleAlert },
  sucesso: { classes: "border-brand-300 bg-brand-50 text-brand-800", Icone: CircleCheck },
  info: { classes: "border-info-700/25 bg-info-50 text-info-700", Icone: Info },
  aviso: { classes: "border-manga-300 bg-manga-50 text-manga-800", Icone: CircleAlert },
};

export function Alerta({ tom = "erro", titulo, children, className }: { tom?: TomAlerta; titulo?: string; children?: ReactNode; className?: string }) {
  const { classes, Icone } = ALERTAS[tom];
  return (
    <div role={tom === "erro" ? "alert" : "status"} className={cx("flex gap-3 rounded-lg border p-3 text-sm", classes, className)}>
      <Icone aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        {titulo && <p className="font-semibold">{titulo}</p>}
        {children && <div className={cx(titulo && "mt-0.5")}>{children}</div>}
      </div>
    </div>
  );
}

export function EstadoVazio({ Icone, titulo, children, acao }: { Icone: LucideIcon; titulo: string; children?: ReactNode; acao?: ReactNode }) {
  return (
    <div role="status" className="rounded-xl border border-dashed border-areia-300 bg-white px-6 py-12 text-center">
      <Icone aria-hidden className="mx-auto size-10 text-areia-400" strokeWidth={1.5} />
      <h3 className="mt-3 text-lg font-semibold">{titulo}</h3>
      {children && <p className="mx-auto mt-1 max-w-md text-sm text-tinta-suave">{children}</p>}
      {acao && <div className="mt-5 flex justify-center">{acao}</div>}
    </div>
  );
}

export function Esqueleto({ className }: { className?: string }) {
  return <div aria-hidden className={cx("animate-pulse rounded-lg bg-areia-200", className)} />;
}

/** Marcador de carregamento de página inteira, anunciado a leitores de tela. */
export function CarregandoPagina({ rotulo = "Carregando" }: { rotulo?: string }) {
  return (
    <div aria-busy="true" aria-label={rotulo} className="space-y-4">
      <Esqueleto className="h-9 w-64" />
      <Esqueleto className="h-40" />
      <Esqueleto className="h-40" />
    </div>
  );
}

type TomSelo = "verde" | "manga" | "terra" | "neutro" | "info" | "perigo";

const SELOS: Record<TomSelo, string> = {
  verde: "bg-brand-100 text-brand-800",
  manga: "bg-manga-100 text-manga-800",
  terra: "bg-terra-100 text-terra-800",
  neutro: "bg-areia-200 text-tinta-suave",
  info: "bg-info-50 text-info-700",
  perigo: "bg-perigo-50 text-perigo-700",
};

export function Selo({ tom = "neutro", children, className }: { tom?: TomSelo; children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", SELOS[tom], className)}>
      {children}
    </span>
  );
}

export function Cartao({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-xl border border-areia-200 bg-white", className)}>{children}</div>;
}

export function TituloPagina({ titulo, descricao, acao }: { titulo: string; descricao?: string; acao?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{titulo}</h1>
        {descricao && <p className="mt-1 text-tinta-suave">{descricao}</p>}
      </div>
      {acao}
    </div>
  );
}
