"use client";

import { useState, type FormEvent } from "react";
import { Botao } from "@/components/botao";
import { AreaTexto } from "@/components/campos";
import { EscolhaDeNota } from "@/components/estrelas";
import { Alerta } from "@/components/feedback";
import { api, mensagemDeErro } from "@/lib/api";

/** Formulário de avaliação da outra parte, liberado após a retirada. */
export function FormularioAvaliacao({ transacaoId, nomeAvaliado, aoAvaliar }: { transacaoId: number; nomeAvaliado: string; aoAvaliar: () => Promise<unknown> }) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (nota === 0) {
      setErro("Escolha uma nota de 1 a 5 estrelas.");
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await api(`/api/transacoes/${transacaoId}/avaliacoes`, { method: "POST", corpo: { nota, comentario } });
      await aoAvaliar();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <p className="text-sm text-tinta-suave">
        Como foi negociar com <strong className="text-tinta">{nomeAvaliado}</strong>? Sua avaliação fica visível no perfil público.
      </p>
      {erro && <Alerta>{erro}</Alerta>}
      <EscolhaDeNota valor={nota} aoMudar={setNota} />
      <AreaTexto
        rotulo="Comentário"
        opcional
        rows={3}
        maxLength={600}
        placeholder="O material estava conforme o anúncio? A retirada foi no combinado?"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
      />
      <Botao type="submit" enviando={enviando}>Enviar avaliação</Botao>
    </form>
  );
}
