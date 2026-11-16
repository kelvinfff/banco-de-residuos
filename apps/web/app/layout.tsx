import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { Suspense } from "react";
import { Cabecalho, CabecalhoEstatico } from "@/components/cabecalho";
import { Provedores } from "@/components/provedores";
import { Rodape } from "@/components/rodape";
import "./globals.css";

const fonteCorpo = Figtree({ variable: "--font-corpo", subsets: ["latin"] });
const fonteTitulo = Bricolage_Grotesque({ variable: "--font-titulo", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Banco de Resíduos", template: "%s · Banco de Resíduos" },
  description:
    "Marketplace de resíduos e subprodutos agrícolas do Vale do São Francisco. Conecta produtores, agroindústrias e cooperativas a quem pode dar um novo uso ao material.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${fonteCorpo.variable} ${fonteTitulo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold"
        >
          Pular para o conteúdo
        </a>
        <Provedores>
          <Suspense fallback={<CabecalhoEstatico />}>
            <Cabecalho />
          </Suspense>
          <main id="conteudo" className="flex-1">
            {children}
          </main>
          <Rodape />
        </Provedores>
      </body>
    </html>
  );
}
