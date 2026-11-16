"use client";

import { useState, type FormEvent } from "react";
import { Botao } from "@/components/botao";
import { AreaTexto, Campo, Selecao } from "@/components/campos";
import { Alerta, Esqueleto, TituloPagina } from "@/components/feedback";
import { Mapa } from "@/components/mapa";
import { Protegido } from "@/components/protegido";
import { api, camposComErro, mensagemDeErro } from "@/lib/api";
import { useCatalogo } from "@/lib/catalogo";
import { NOME_ORGANIZACAO } from "@/lib/formato";
import { useSessao } from "@/lib/sessao";
import type { TipoOrganizacao, Usuario } from "@/lib/tipos";

function Formulario({ usuario }: { usuario: Usuario }) {
  const catalogo = useCatalogo();
  const { atualizar } = useSessao();
  const [dados, setDados] = useState({
    nome: usuario.nome,
    organizacao: usuario.organizacao ?? "",
    tipoOrganizacao: usuario.tipoOrganizacao as TipoOrganizacao,
    telefone: usuario.telefone ?? "",
    bio: usuario.bio ?? "",
    municipioId: String(usuario.municipio.id),
  });
  const [ponto, setPonto] = useState(
    usuario.latitude !== null && usuario.longitude !== null ? { latitude: usuario.latitude, longitude: usuario.longitude } : null,
  );
  const [erro, setErro] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [salvo, setSalvo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const mudar = (campo: keyof typeof dados) => (e: { target: { value: string } }) => {
    setSalvo(false);
    setDados((atual) => ({ ...atual, [campo]: e.target.value }));
  };

  const municipio = catalogo?.municipios.find((m) => String(m.id) === dados.municipioId);
  const pontoNoMapa = ponto ?? (municipio ? { latitude: municipio.latitude, longitude: municipio.longitude } : null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCampos({});
    setSalvo(false);
    setEnviando(true);
    try {
      const { usuario: atualizado } = await api<{ usuario: Usuario }>("/api/usuarios/eu", {
        method: "PATCH",
        corpo: {
          ...dados,
          municipioId: Number(dados.municipioId),
          latitude: ponto?.latitude ?? null,
          longitude: ponto?.longitude ?? null,
        },
      });
      await atualizar(atualizado);
      setSalvo(true);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      setCampos(camposComErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  if (!catalogo) return <Esqueleto className="h-96" />;

  return (
    <>
      <TituloPagina titulo="Editar perfil" descricao="Estas informações aparecem no seu perfil público e nos seus anúncios." />
      <form onSubmit={enviar} className="space-y-4 rounded-xl border border-areia-200 bg-white p-5 sm:p-6" noValidate>
        {erro && <Alerta>{erro}</Alerta>}
        {salvo && <Alerta tom="sucesso">Perfil atualizado.</Alerta>}
        <Campo rotulo="Seu nome" autoComplete="name" value={dados.nome} onChange={mudar("nome")} erro={campos.nome} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Organização" opcional autoComplete="organization" value={dados.organizacao} onChange={mudar("organizacao")} erro={campos.organizacao} />
          <Selecao rotulo="Tipo de organização" value={dados.tipoOrganizacao} onChange={mudar("tipoOrganizacao")} erro={campos.tipoOrganizacao}>
            {Object.entries(NOME_ORGANIZACAO).map(([valor, nome]) => (
              <option key={valor} value={valor}>{nome}</option>
            ))}
          </Selecao>
        </div>
        <Campo
          rotulo="Telefone / WhatsApp"
          opcional
          type="tel"
          autoComplete="tel"
          ajuda="Só é mostrado à outra parte depois que um negócio é fechado."
          value={dados.telefone}
          onChange={mudar("telefone")}
          erro={campos.telefone}
        />
        <AreaTexto
          rotulo="Sobre"
          opcional
          rows={3}
          maxLength={600}
          placeholder="O que você produz ou que tipo de material procura."
          value={dados.bio}
          onChange={mudar("bio")}
          erro={campos.bio}
        />
        <Selecao
          rotulo="Município"
          value={dados.municipioId}
          onChange={(e) => {
            mudar("municipioId")(e);
            setPonto(null);
          }}
          erro={campos.municipioId}
        >
          {catalogo.municipios.map((m) => (
            <option key={m.id} value={m.id}>{m.nome}/{m.uf}</option>
          ))}
        </Selecao>
        {pontoNoMapa && (
          <div>
            <p className="mb-1.5 text-sm font-semibold">
              Seu endereço no mapa <span className="font-normal text-tinta-suave">(opcional)</span>
            </p>
            <Mapa
              rotulo="Mapa para marcar o seu endereço. Clique para posicionar o marcador."
              className="h-64"
              zoom={11}
              centro={pontoNoMapa}
              pontos={[{ id: "eu", ...pontoNoMapa, titulo: "Seu endereço", destaque: ponto !== null }]}
              aoEscolher={(novo) => {
                setSalvo(false);
                setPonto(novo);
              }}
            />
            <p className="mt-1.5 text-sm text-tinta-suave">
              {ponto
                ? "Ponto marcado. Ele é usado apenas para calcular distâncias na busca e não aparece no seu perfil."
                : "Clique no mapa para marcar seu local e buscar resíduos por distância a partir dele."}
            </p>
          </div>
        )}
        <Botao type="submit" enviando={enviando}>Salvar perfil</Botao>
      </form>
    </>
  );
}

export function EditarPerfil() {
  return <Protegido>{(usuario) => <Formulario key={usuario.id} usuario={usuario} />}</Protegido>;
}
