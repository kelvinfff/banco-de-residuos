"use client";

import { useState, type FormEvent } from "react";
import { camposComErro, mensagemDeErro } from "@/lib/api";
import {
  centavosParaCampo,
  formatarDinheiro,
  formatarQuantidade,
  formatarTaxa,
  lerDinheiro,
  lerNumero,
  numeroParaCampo,
  SIGLA_UNIDADE,
} from "@/lib/formato";
import type { Unidade } from "@/lib/tipos";
import { Botao } from "./botao";
import { AreaTexto, Campo } from "./campos";
import { Alerta } from "./feedback";

export interface DadosOferta {
  quantidade: number;
  precoUnitarioCentavos: number;
  mensagem?: string;
}

interface Props {
  unidade: Unidade;
  quantidadeDisponivel: number;
  /** Valores sugeridos ao abrir o formulário (preço do anúncio ou da última oferta). */
  inicial: { quantidade: number; precoUnitarioCentavos: number };
  taxaComissaoBps: number;
  rotuloEnviar: string;
  /** Deve lançar erro em caso de falha; o formulário exibe a mensagem. */
  aoEnviar: (oferta: DadosOferta) => Promise<void>;
  aoCancelar?: () => void;
}

/** Valores de uma venda, com o mesmo arredondamento usado pelo servidor. */
function simular(quantidade: number, precoCentavos: number, bps: number) {
  const total = Math.round(quantidade * precoCentavos);
  const comissao = Math.round((total * bps) / 10_000);
  return { total, comissao, liquido: total - comissao };
}

/** Proposta ou contraproposta: quantidade, preço por unidade e mensagem, com o total calculado ao digitar. */
export function FormularioOferta({ unidade, quantidadeDisponivel, inicial, taxaComissaoBps, rotuloEnviar, aoEnviar, aoCancelar }: Props) {
  const [quantidade, setQuantidade] = useState(numeroParaCampo(inicial.quantidade));
  const [preco, setPreco] = useState(centavosParaCampo(inicial.precoUnitarioCentavos));
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  const sigla = SIGLA_UNIDADE[unidade];
  const qtd = lerNumero(quantidade);
  const precoCentavos = lerDinheiro(preco);
  const previa = qtd !== null && qtd > 0 && precoCentavos !== null ? simular(qtd, precoCentavos, taxaComissaoBps) : null;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    const erros: Record<string, string> = {};
    if (qtd === null || qtd <= 0) erros.quantidade = "Informe uma quantidade maior que zero.";
    else if (qtd > quantidadeDisponivel) erros.quantidade = `O anúncio tem ${formatarQuantidade(quantidadeDisponivel, unidade)} disponíveis.`;
    if (precoCentavos === null) erros.precoUnitarioCentavos = "Informe o preço, por exemplo 0,35.";
    setCampos(erros);
    if (Object.keys(erros).length > 0 || qtd === null || precoCentavos === null) return;

    setEnviando(true);
    try {
      await aoEnviar({ quantidade: qtd, precoUnitarioCentavos: precoCentavos, mensagem: mensagem.trim() || undefined });
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      setCampos(camposComErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      {erro && <Alerta>{erro}</Alerta>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          rotulo="Quantidade"
          inputMode="decimal"
          sufixo={sigla}
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          ajuda={`Disponível: ${formatarQuantidade(quantidadeDisponivel, unidade)}`}
          erro={campos.quantidade}
        />
        <Campo
          rotulo={`Preço por ${sigla}`}
          inputMode="decimal"
          prefixo="R$"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          ajuda="Use 0 para doação."
          erro={campos.precoUnitarioCentavos}
        />
      </div>
      <AreaTexto
        rotulo="Mensagem"
        opcional
        rows={3}
        maxLength={1000}
        placeholder="Combine retirada, prazo ou peça mais detalhes do material."
        value={mensagem}
        onChange={(e) => setMensagem(e.target.value)}
        erro={campos.mensagem}
      />

      <dl aria-live="polite" className="rounded-lg bg-areia-100 p-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="font-semibold">Total da proposta</dt>
          <dd className="font-display text-lg font-bold tabular-nums">{previa ? formatarDinheiro(previa.total) : "—"}</dd>
        </div>
        {previa && previa.total > 0 && (
          <>
            <div className="mt-1 flex justify-between gap-4 text-tinta-suave">
              <dt>Comissão da plataforma ({formatarTaxa(taxaComissaoBps)})</dt>
              <dd className="tabular-nums">− {formatarDinheiro(previa.comissao)}</dd>
            </div>
            <div className="mt-1 flex justify-between gap-4 text-tinta-suave">
              <dt>Vendedor recebe</dt>
              <dd className="tabular-nums">{formatarDinheiro(previa.liquido)}</dd>
            </div>
          </>
        )}
      </dl>

      <div className="flex flex-wrap gap-2">
        <Botao type="submit" enviando={enviando}>{rotuloEnviar}</Botao>
        {aoCancelar && (
          <Botao variante="fantasma" onClick={aoCancelar} disabled={enviando}>
            Cancelar
          </Botao>
        )}
      </div>
    </form>
  );
}
