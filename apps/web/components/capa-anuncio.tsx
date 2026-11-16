import { Apple, Grape, Leaf, Recycle, Scissors, Sprout, Wheat, type LucideIcon, type LucideProps } from "lucide-react";
import { cx } from "@/lib/cx";

const ICONES: Record<string, LucideIcon> = {
  cascas: Leaf,
  bagacos: Grape,
  "sementes-e-carocos": Sprout,
  "restos-de-poda": Scissors,
  "frutas-fora-do-padrao": Apple,
  "engacos-e-talos": Wheat,
  "palhadas-e-folhas": Wheat,
};

/** Ícone do tipo de resíduo (com um genérico para tipos sem ícone próprio). */
export function IconeDaCategoria({ slug, ...props }: { slug: string } & LucideProps) {
  const Icone = ICONES[slug] ?? Recycle;
  return <Icone aria-hidden {...props} />;
}

interface Props {
  foto?: { url: string } | null;
  categoria: { nome: string; slug: string };
  titulo: string;
  className?: string;
}

/** Foto principal do anúncio; sem foto, mostra o ícone do tipo de resíduo. */
export function CapaAnuncio({ foto, categoria, titulo, className }: Props) {
  if (foto) {
    return (
      // As fotos vêm da API (pasta de uploads), por isso <img> simples em vez de next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={foto.url} alt={`Foto de ${titulo}`} loading="lazy" className={cx("bg-areia-100 object-cover", className)} />
    );
  }
  return (
    <div
      role="img"
      aria-label={`${categoria.nome} — anúncio sem foto`}
      className={cx("flex flex-col items-center justify-center gap-2 bg-brand-50 text-brand-600", className)}
    >
      <IconeDaCategoria slug={categoria.slug} className="size-1/4 max-h-14 min-h-6" strokeWidth={1.5} />
      <span aria-hidden className="text-xs font-semibold text-brand-700">{categoria.nome}</span>
    </div>
  );
}
