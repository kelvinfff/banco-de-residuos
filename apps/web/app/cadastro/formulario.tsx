"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Botao } from "@/components/botao";
import { Campo, Selecao } from "@/components/campos";
import { Alerta } from "@/components/feedback";
import { camposComErro, mensagemDeErro } from "@/lib/api";
import { useCatalogo } from "@/lib/catalogo";
import { NOME_ORGANIZACAO } from "@/lib/formato";
import { destinoSeguro } from "@/lib/navegacao";
import { useSessao } from "@/lib/sessao";
import type { TipoOrganizacao } from "@/lib/tipos";

export function FormularioCadastro() {
  const router = useRouter();
  const destino = destinoSeguro(useSearchParams().get("proximo"));
  const catalogo = useCatalogo();
  const { usuario, cadastrar } = useSessao();

  const [dados, setDados] = useState({
    nome: "",
    organizacao: "",
    tipoOrganizacao: "PRODUTOR" as TipoOrganizacao,
    municipioId: "",
    telefone: "",
    email: "",
    senha: "",
  });
  const [erro, setErro] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (usuario) router.replace(destino);
  }, [usuario, router, destino]);

  const mudar = (campo: keyof typeof dados) => (e: { target: { value: string } }) =>
    setDados((atual) => ({ ...atual, [campo]: e.target.value }));

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCampos({});
    if (!dados.municipioId) {
      setCampos({ municipioId: "Selecione o seu município." });
      return;
    }
    setEnviando(true);
    try {
      await cadastrar({ ...dados, municipioId: Number(dados.municipioId) });
      router.replace(destino);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      setCampos(camposComErro(falha));
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold sm:text-3xl">Criar conta</h1>
      <p className="mt-1 text-tinta-suave">
        Com uma única conta você anuncia e compra. Já tem cadastro?{" "}
        <Link href="/entrar" className="font-semibold text-brand-700 underline">
          Entrar
        </Link>
      </p>

      <form onSubmit={enviar} className="mt-6 space-y-4 rounded-xl border border-areia-200 bg-white p-5 sm:p-6" noValidate>
        {erro && <Alerta>{erro}</Alerta>}
        <Campo rotulo="Seu nome" autoComplete="name" required value={dados.nome} onChange={mudar("nome")} erro={campos.nome} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Organização"
            opcional
            placeholder="Fazenda, empresa ou cooperativa"
            autoComplete="organization"
            value={dados.organizacao}
            onChange={mudar("organizacao")}
            erro={campos.organizacao}
          />
          <Selecao rotulo="Tipo de organização" value={dados.tipoOrganizacao} onChange={mudar("tipoOrganizacao")} erro={campos.tipoOrganizacao}>
            {Object.entries(NOME_ORGANIZACAO).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </Selecao>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Selecao rotulo="Município" required value={dados.municipioId} onChange={mudar("municipioId")} erro={campos.municipioId}>
            <option value="">Selecione…</option>
            {catalogo?.municipios.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}/{m.uf}
              </option>
            ))}
          </Selecao>
          <Campo
            rotulo="Telefone / WhatsApp"
            opcional
            type="tel"
            autoComplete="tel"
            placeholder="(87) 90000-0000"
            ajuda="Só é mostrado à outra parte depois que um negócio é fechado."
            value={dados.telefone}
            onChange={mudar("telefone")}
            erro={campos.telefone}
          />
        </div>
        <Campo rotulo="E-mail" type="email" autoComplete="email" required value={dados.email} onChange={mudar("email")} erro={campos.email} />
        <Campo
          rotulo="Senha"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          ajuda="Mínimo de 8 caracteres."
          value={dados.senha}
          onChange={mudar("senha")}
          erro={campos.senha}
        />
        <Botao type="submit" larguraTotal enviando={enviando}>
          Criar conta gratuita
        </Botao>
      </form>
    </div>
  );
}
