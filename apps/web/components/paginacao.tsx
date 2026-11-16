import { ChevronLeft, ChevronRight } from "lucide-react";
import { Botao } from "./botao";

export function Paginacao({ pagina, totalPaginas, aoMudar }: { pagina: number; totalPaginas: number; aoMudar: (pagina: number) => void }) {
  if (totalPaginas <= 1) return null;
  return (
    <nav aria-label="Paginação" className="mt-6 flex items-center justify-center gap-3">
      <Botao variante="secundario" tamanho="sm" disabled={pagina <= 1} onClick={() => aoMudar(pagina - 1)}>
        <ChevronLeft aria-hidden className="size-4" />
        Anterior
      </Botao>
      <span className="text-sm text-tinta-suave" aria-current="page">
        Página {pagina} de {totalPaginas}
      </span>
      <Botao variante="secundario" tamanho="sm" disabled={pagina >= totalPaginas} onClick={() => aoMudar(pagina + 1)}>
        Próxima
        <ChevronRight aria-hidden className="size-4" />
      </Botao>
    </nav>
  );
}
