"use client";

import { ChevronDown, LogOut, Menu, Plus, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { cx } from "@/lib/cx";
import { nomeDeExibicao } from "@/lib/formato";
import { useSessao } from "@/lib/sessao";
import type { ResumoUsuario } from "@/lib/tipos";
import { LinkBotao } from "./botao";
import { Marca } from "./marca";

interface Item {
  href: string;
  rotulo: string;
  pendencias?: number;
}

function LinkNav({ item, atual, aoClicar, bloco }: { item: Item; atual: boolean; aoClicar?: () => void; bloco?: boolean }) {
  return (
    <Link
      href={item.href}
      onClick={aoClicar}
      aria-current={atual ? "page" : undefined}
      className={cx(
        "inline-flex items-center gap-2 rounded-lg px-3 text-sm font-semibold whitespace-nowrap transition-colors",
        bloco ? "h-11 w-full" : "h-9",
        atual ? "bg-brand-50 text-brand-800" : "text-tinta-suave hover:bg-areia-100 hover:text-tinta",
      )}
    >
      {item.rotulo}
      {!!item.pendencias && (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-manga-400 px-1.5 text-xs font-bold text-brand-900">
          {item.pendencias}
          <span className="sr-only"> pendentes</span>
        </span>
      )}
    </Link>
  );
}

export function Cabecalho() {
  const caminho = usePathname();
  const { usuario, sair } = useSessao();
  const [menuAberto, setMenuAberto] = useState(false);
  const [contaAberta, setContaAberta] = useState(false);
  const refConta = useRef<HTMLDivElement>(null);

  // Pendências do usuário (respostas, pagamentos, retiradas) viram contadores no menu.
  const { data: resumo } = useSWR<ResumoUsuario>(usuario ? "/api/usuarios/eu/resumo" : null, {
    refreshInterval: 30_000,
  });

  // Fecha o menu da conta ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!contaAberta) return;
    const aoClicarFora = (e: MouseEvent) => {
      if (!refConta.current?.contains(e.target as Node)) setContaAberta(false);
    };
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setContaAberta(false);
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [contaAberta]);

  const itens: Item[] = [
    { href: "/anuncios", rotulo: "Explorar" },
    ...(usuario
      ? [
          { href: "/painel", rotulo: "Painel" },
          { href: "/negociacoes", rotulo: "Negociações", pendencias: resumo?.aguardandoMinhaResposta },
          {
            href: "/transacoes",
            rotulo: "Transações",
            pendencias: (resumo?.pagamentosPendentes ?? 0) + (resumo?.retiradasPendentes ?? 0),
          },
        ]
      : [{ href: "/#como-funciona", rotulo: "Como funciona" }]),
    ...(usuario?.papel === "ADMIN" ? [{ href: "/admin", rotulo: "Administração" }] : []),
  ];
  const ehAtual = (href: string) => caminho === href || (href !== "/" && caminho.startsWith(`${href}/`));
  const fecharMenus = () => {
    setMenuAberto(false);
    setContaAberta(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-areia-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Marca />

        <nav aria-label="Principal" className="ml-2 hidden items-center gap-0.5 lg:flex">
          {itens.map((item) => (
            <LinkNav key={item.href} item={item} atual={ehAtual(item.href)} />
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <LinkBotao href="/anuncios/novo" tamanho="sm" variante="destaque">
            <Plus aria-hidden className="size-4" />
            Anunciar resíduo
          </LinkBotao>
          {usuario ? (
            <div ref={refConta} className="relative">
              <button
                type="button"
                onClick={() => setContaAberta((v) => !v)}
                aria-expanded={contaAberta}
                aria-haspopup="true"
                className="inline-flex h-9 max-w-44 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold hover:bg-areia-100"
              >
                <span className="truncate">{nomeDeExibicao(usuario)}</span>
                <ChevronDown aria-hidden className="size-4 shrink-0 text-tinta-suave" />
              </button>
              {contaAberta && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-areia-200 bg-white p-1.5 shadow-lg">
                  <p className="truncate px-3 py-2 text-xs text-tinta-suave">{usuario.email}</p>
                  {[
                    { href: "/meus-anuncios", rotulo: "Meus anúncios" },
                    { href: `/usuarios/${usuario.id}`, rotulo: "Meu perfil público" },
                    { href: "/perfil", rotulo: "Editar perfil" },
                  ].map((item) => (
                    <Link key={item.href} href={item.href} onClick={fecharMenus} className="block rounded-lg px-3 py-2 text-sm hover:bg-areia-100">
                      {item.rotulo}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      fecharMenus();
                      void sair();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-perigo-700 hover:bg-perigo-50"
                  >
                    <LogOut aria-hidden className="size-4" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            usuario === null && (
              <LinkBotao href="/entrar" tamanho="sm" variante="secundario">
                Entrar
              </LinkBotao>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuAberto((v) => !v)}
          aria-expanded={menuAberto}
          aria-controls="menu-movel"
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          className="ml-auto inline-flex size-11 items-center justify-center rounded-lg hover:bg-areia-100 lg:hidden"
        >
          {menuAberto ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
        </button>
      </div>

      {menuAberto && (
        <nav id="menu-movel" aria-label="Principal" className="border-t border-areia-200 bg-white px-4 py-3 lg:hidden">
          <div className="space-y-1">
            {itens.map((item) => (
              <LinkNav key={item.href} item={item} atual={ehAtual(item.href)} aoClicar={fecharMenus} bloco />
            ))}
            {usuario && (
              <>
                <LinkNav item={{ href: "/meus-anuncios", rotulo: "Meus anúncios" }} atual={ehAtual("/meus-anuncios")} aoClicar={fecharMenus} bloco />
                <LinkNav item={{ href: "/perfil", rotulo: "Editar perfil" }} atual={ehAtual("/perfil")} aoClicar={fecharMenus} bloco />
              </>
            )}
          </div>
          <div className="mt-3 grid gap-2 border-t border-areia-200 pt-3">
            <LinkBotao href="/anuncios/novo" variante="destaque" onClick={fecharMenus}>
              <Plus aria-hidden className="size-4" />
              Anunciar resíduo
            </LinkBotao>
            {usuario ? (
              <button
                type="button"
                onClick={() => {
                  fecharMenus();
                  void sair();
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-perigo-700 hover:bg-perigo-50"
              >
                <LogOut aria-hidden className="size-4" />
                Sair ({usuario.nome.split(" ")[0]})
              </button>
            ) : (
              <LinkBotao href="/entrar" variante="secundario" onClick={fecharMenus}>
                Entrar
              </LinkBotao>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

/** Versão estática exibida enquanto o cabeçalho interativo carrega. */
export function CabecalhoEstatico() {
  return (
    <header className="sticky top-0 z-40 border-b border-areia-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
        <Marca />
      </div>
    </header>
  );
}
