import Link from "next/link";
import { Marca } from "./marca";

export function Rodape() {
  return (
    <footer className="mt-16 bg-brand-900 text-brand-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Marca clara />
          <p className="mt-3 max-w-sm text-sm text-brand-200">
            Infraestrutura para a economia circular no campo: aproxima quem tem materiais disponíveis de quem pode
            dar a eles um novo uso. Começando pelo Vale do São Francisco.
          </p>
        </div>
        <nav aria-label="Plataforma">
          <h2 className="font-sans text-sm font-semibold tracking-normal text-white">Plataforma</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-white hover:underline" href="/anuncios">Explorar resíduos</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/anuncios/novo">Anunciar resíduo</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/#como-funciona">Como funciona</Link></li>
          </ul>
        </nav>
        <nav aria-label="Conta">
          <h2 className="font-sans text-sm font-semibold tracking-normal text-white">Conta</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-white hover:underline" href="/entrar">Entrar</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/cadastro">Criar conta gratuita</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-brand-800">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-brand-200">
          Projeto acadêmico da disciplina de Inovação Tecnológica — FACAPE, Petrolina/PE. MVP de demonstração:
          os pagamentos são simulados e nenhum valor real é movimentado.
        </p>
      </div>
    </footer>
  );
}
