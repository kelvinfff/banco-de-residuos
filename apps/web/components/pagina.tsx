import { Suspense, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { CarregandoPagina } from "./feedback";

/**
 * Moldura padrão das páginas internas: largura, respiro e limite de Suspense
 * (exigido pelo Next.js para componentes que leem a URL).
 */
export function Pagina({ children, estreita }: { children: ReactNode; estreita?: boolean }) {
  return (
    <div className={cx("mx-auto w-full px-4 py-8", estreita ? "max-w-3xl" : "max-w-6xl")}>
      <Suspense fallback={<CarregandoPagina />}>{children}</Suspense>
    </div>
  );
}
