import { ArrowRight, Handshake, ListChecks, PackagePlus, Search } from "lucide-react";
import Link from "next/link";
import { LinkBotao } from "@/components/botao";
import { BuscaRapida } from "@/components/inicio/busca-rapida";
import { NavegarPorCategoria } from "@/components/inicio/categorias";
import { DisponivelAgora } from "@/components/inicio/disponivel-agora";
import { Numeros } from "@/components/inicio/numeros";
import { AnunciosRecentes } from "@/components/inicio/recentes";

const PASSOS = [
  {
    Icone: PackagePlus,
    titulo: "Quem tem, anuncia",
    texto: "O produtor ou a agroindústria cadastra o material: 500 kg de casca de manga, por exemplo. É gratuito.",
  },
  {
    Icone: ListChecks,
    titulo: "A plataforma organiza",
    texto: "Tipo de material, quantidade, localização, frequência, condições de retirada e preço desejado, tudo no mesmo lugar.",
  },
  {
    Icone: Search,
    titulo: "Quem precisa, encontra",
    texto: "O comprador busca por tipo de resíduo, cultura e distância, e compara as ofertas próximas.",
  },
  {
    Icone: Handshake,
    titulo: "Os dois negociam",
    texto: "Proposta, contraproposta e aceite ficam registrados. O contato é liberado quando o negócio fecha.",
  },
];

export default function PaginaInicial() {
  return (
    <>
      {/* Abertura: proposta, busca e o que há disponível agora */}
      <section className="bg-brand-800 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:py-16">
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-wide text-manga-300 uppercase">Vale do São Francisco</p>
            <h1 className="mt-3 text-4xl leading-[1.05] font-bold text-balance sm:text-5xl">
              Resíduos do campo viram novas oportunidades de negócio.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-brand-100">
              Cascas, bagaços, sementes e frutas fora do padrão têm valor para alguém perto de você. O Banco de
              Resíduos aproxima quem tem o material de quem pode dar a ele um novo uso.
            </p>
            <div className="mt-7 max-w-xl">
              <BuscaRapida />
            </div>
            <p className="mt-4 text-sm text-brand-200">
              Tem material sobrando?{" "}
              <Link href="/anuncios/novo" className="font-semibold text-white underline underline-offset-4 hover:text-manga-300">
                Anuncie gratuitamente
              </Link>
            </p>
          </div>
          <DisponivelAgora />
        </div>
      </section>

      {/* Números: atividade da plataforma e tamanho do mercado */}
      <section aria-label="Números" className="border-b border-areia-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <Numeros />
          <p className="border-l-4 border-manga-400 pl-4 text-sm text-tinta-suave">
            Em 2024, o Vale do São Francisco produziu{" "}
            <strong className="text-tinta">4,42 milhões de toneladas</strong> de produtos agrícolas, com valor bruto de{" "}
            <strong className="text-tinta">R$ 8,15 bilhões</strong>. O valor não termina na fruta que chega ao consumidor.
            <span className="mt-1 block text-xs">Fonte: Codevasf, dados de 2024.</span>
          </p>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" aria-labelledby="titulo-como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14">
        <h2 id="titulo-como-funciona" className="text-2xl font-bold sm:text-3xl">Como funciona</h2>
        <p className="mt-2 max-w-2xl text-tinta-suave">
          Quem possui o material nem sempre sabe quem poderia utilizá-lo. A plataforma faz essa ponte em quatro passos.
        </p>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PASSOS.map(({ Icone, titulo, texto }, i) => (
            <li key={titulo} className="border-t-2 border-brand-700 pt-4">
              <div className="flex items-center gap-2 text-brand-700">
                <Icone aria-hidden className="size-5" />
                <span className="text-sm font-bold tabular-nums">Passo {i + 1}</span>
              </div>
              <h3 className="mt-2 text-lg font-semibold">{titulo}</h3>
              <p className="mt-1 text-sm text-tinta-suave">{texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Navegação por tipo de resíduo */}
      <section aria-labelledby="titulo-categorias" className="mx-auto max-w-6xl px-4 pb-14">
        <h2 id="titulo-categorias" className="text-2xl font-bold sm:text-3xl">Procure por tipo de resíduo</h2>
        <div className="mt-6">
          <NavegarPorCategoria />
        </div>
      </section>

      {/* Anúncios recentes */}
      <section aria-labelledby="titulo-recentes" className="mx-auto max-w-6xl px-4 pb-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="titulo-recentes" className="text-2xl font-bold sm:text-3xl">Anunciados recentemente</h2>
          <LinkBotao href="/anuncios" variante="fantasma" tamanho="sm">
            Ver todos os anúncios <ArrowRight aria-hidden className="size-4" />
          </LinkBotao>
        </div>
        <div className="mt-6">
          <AnunciosRecentes />
        </div>
      </section>

      {/* Modelo: gratuito para anunciar, 5% quando vende */}
      <section aria-labelledby="titulo-modelo" className="mx-auto max-w-6xl px-4">
        <div className="grid gap-8 rounded-2xl bg-manga-50 p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <h2 id="titulo-modelo" className="text-2xl font-bold sm:text-3xl">
              Anunciar é gratuito. Você só paga quando vende.
            </h2>
            <p className="mt-3 text-tinta-suave">
              Cadastro e divulgação não custam nada. A plataforma fica com uma comissão de 5% sobre cada venda
              concluída, descontada do valor recebido pelo vendedor.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkBotao href="/cadastro" tamanho="lg">Criar conta gratuita</LinkBotao>
              <LinkBotao href="/anuncios" tamanho="lg" variante="secundario">Explorar resíduos</LinkBotao>
            </div>
          </div>
          <dl className="rounded-xl border border-manga-300 bg-white p-5 text-sm">
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-tinta-suave">Venda de exemplo</dt>
              <dd className="font-semibold tabular-nums">R$ 1.000,00</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-areia-200 py-2">
              <dt className="text-tinta-suave">Comissão da plataforma (5%)</dt>
              <dd className="font-semibold tabular-nums">− R$ 50,00</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-areia-200 pt-3 pb-1 text-base">
              <dt className="font-semibold">O vendedor recebe</dt>
              <dd className="font-display font-bold text-brand-800 tabular-nums">R$ 950,00</dd>
            </div>
          </dl>
        </div>
      </section>
    </>
  );
}
