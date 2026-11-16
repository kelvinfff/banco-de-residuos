import Link from "next/link";
import { cx } from "@/lib/cx";

/** Símbolo: uma folha que se fecha em ciclo. */
export function Simbolo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="8" className="fill-brand-700" />
      <path
        d="M23 9c-7.4-.3-12.6 3.2-12.9 8.9-.1 1.5.3 2.9 1.1 4 1.1-4.2 3.8-7.2 7.8-8.9-3.2 2.5-5.2 5.7-5.9 9.8 1 .5 2.2.7 3.4.6 5.3-.4 8-5.9 6.5-14.4z"
        className="fill-manga-400"
      />
    </svg>
  );
}

export function Marca({ clara, className }: { clara?: boolean; className?: string }) {
  return (
    <Link href="/" className={cx("inline-flex shrink-0 items-center gap-2.5 rounded-lg whitespace-nowrap", className)}>
      <Simbolo className="size-8 shrink-0" />
      <span className={cx("font-display text-lg leading-none font-bold tracking-tight", clara ? "text-white" : "text-brand-900")}>
        Banco de Resíduos
      </span>
    </Link>
  );
}
