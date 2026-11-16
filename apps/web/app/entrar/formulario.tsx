"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Botao } from "@/components/botao";
import { Campo } from "@/components/campos";
import { Alerta } from "@/components/feedback";
import { mensagemDeErro } from "@/lib/api";
import { destinoSeguro } from "@/lib/navegacao";
import { useSessao } from "@/lib/sessao";

const CONTAS_DEMO = [
  { rotulo: "Vendedor (agroindústria)", email: "joao@exemplo.com", senha: "demo1234" },
  { rotulo: "Compradora (compostagem)", email: "fernanda@exemplo.com", senha: "demo1234" },
  { rotulo: "Administração", email: "admin@bancoderesiduos.com.br", senha: "admin1234" },
];

export function FormularioEntrar() {
  const router = useRouter();
  const destino = destinoSeguro(useSearchParams().get("proximo"));
  const { usuario, entrar } = useSessao();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Quem já está logado não precisa ver o formulário.
  useEffect(() => {
    if (usuario) router.replace(destino);
  }, [usuario, router, destino]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await entrar(email, senha);
      router.replace(destino);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold sm:text-3xl">Entrar</h1>
      <p className="mt-1 text-tinta-suave">
        Ainda não tem conta?{" "}
        <Link href={`/cadastro?proximo=${encodeURIComponent(destino)}`} className="font-semibold text-brand-700 underline">
          Cadastre-se gratuitamente
        </Link>
      </p>

      <form onSubmit={enviar} className="mt-6 space-y-4 rounded-xl border border-areia-200 bg-white p-5 sm:p-6" noValidate>
        {erro && <Alerta>{erro}</Alerta>}
        <Campo rotulo="E-mail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Campo rotulo="Senha" type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
        <Botao type="submit" larguraTotal enviando={enviando}>
          Entrar
        </Botao>
      </form>

      <section aria-labelledby="contas-demo" className="mt-6 rounded-xl border border-dashed border-areia-300 p-4">
        <h2 id="contas-demo" className="font-sans text-sm font-semibold tracking-normal">Contas de demonstração</h2>
        <p className="mt-1 text-sm text-tinta-suave">Escolha uma para preencher o formulário.</p>
        <ul role="list" className="mt-3 flex flex-wrap gap-2">
          {CONTAS_DEMO.map((conta) => (
            <li key={conta.email}>
              <Botao
                variante="secundario"
                tamanho="sm"
                onClick={() => {
                  setEmail(conta.email);
                  setSenha(conta.senha);
                  setErro(null);
                }}
              >
                {conta.rotulo}
              </Botao>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
