"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSWRConfig } from "swr";
import { api, camposComErro, mensagemDeErro } from "@/lib/api";
import { useCatalogo } from "@/lib/catalogo";
import {
  centavosParaCampo,
  lerDinheiro,
  lerNumero,
  NOME_FREQUENCIA,
  NOME_UNIDADE,
  numeroParaCampo,
  SIGLA_UNIDADE,
} from "@/lib/formato";
import type { Anuncio, Foto, Frequencia, Unidade } from "@/lib/tipos";
import { Botao, LinkBotao } from "./botao";
import { AreaTexto, Campo, Selecao } from "./campos";
import { Alerta, Esqueleto } from "./feedback";
import { Mapa } from "./mapa";

const MAX_FOTOS = 5;
const TAMANHO_MAXIMO = 5 * 1024 * 1024;
const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];

interface Props {
  /** Presente na edição; ausente na criação. */
  anuncio?: Anuncio;
}

export function FormularioAnuncio({ anuncio }: Props) {
  const router = useRouter();
  const catalogo = useCatalogo();
  const { mutate } = useSWRConfig();

  const [dados, setDados] = useState({
    titulo: anuncio?.titulo ?? "",
    descricao: anuncio?.descricao ?? "",
    categoriaId: anuncio ? String(anuncio.categoriaId) : "",
    culturaId: anuncio ? String(anuncio.culturaId) : "",
    quantidade: anuncio ? numeroParaCampo(anuncio.quantidadeDisponivel) : "",
    unidade: (anuncio?.unidade ?? "KG") as Unidade,
    preco: anuncio ? centavosParaCampo(anuncio.precoUnitarioCentavos) : "",
    frequencia: (anuncio?.frequencia ?? "UNICA") as Frequencia,
    condicoesRetirada: anuncio?.condicoesRetirada ?? "",
    municipioId: anuncio ? String(anuncio.municipioId) : "",
  });
  // Ponto exato marcado no mapa; null = usar o centro do município.
  const [ponto, setPonto] = useState<{ latitude: number; longitude: number } | null>(
    anuncio ? { latitude: anuncio.latitude, longitude: anuncio.longitude } : null,
  );
  const [fotosSalvas, setFotosSalvas] = useState<Foto[]>(anuncio?.fotos ?? []);
  const [fotosNovas, setFotosNovas] = useState<File[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  // Miniaturas das fotos escolhidas; as URLs temporárias são liberadas ao trocar ou sair.
  const previas = useMemo(() => fotosNovas.map((arquivo) => URL.createObjectURL(arquivo)), [fotosNovas]);
  useEffect(() => () => previas.forEach((url) => URL.revokeObjectURL(url)), [previas]);

  const mudar = (campo: keyof typeof dados) => (e: { target: { value: string } }) =>
    setDados((atual) => ({ ...atual, [campo]: e.target.value }));

  const municipio = catalogo?.municipios.find((m) => String(m.id) === dados.municipioId);
  const pontoNoMapa = ponto ?? (municipio ? { latitude: municipio.latitude, longitude: municipio.longitude } : null);
  const sigla = SIGLA_UNIDADE[dados.unidade];
  const totalDeFotos = fotosSalvas.length + fotosNovas.length;

  function escolherFotos(arquivos: FileList | null) {
    if (!arquivos) return;
    const validas: File[] = [];
    let aviso: string | null = null;
    for (const arquivo of Array.from(arquivos)) {
      if (!TIPOS_ACEITOS.includes(arquivo.type)) aviso = "Use fotos em JPG, PNG ou WebP.";
      else if (arquivo.size > TAMANHO_MAXIMO) aviso = "Cada foto pode ter no máximo 5 MB.";
      else if (totalDeFotos + validas.length >= MAX_FOTOS) aviso = `Cada anúncio pode ter até ${MAX_FOTOS} fotos.`;
      else validas.push(arquivo);
    }
    setFotosNovas((atuais) => [...atuais, ...validas]);
    setCampos((atuais) => ({ ...atuais, fotos: aviso ?? "" }));
  }

  async function removerFotoSalva(foto: Foto) {
    if (!anuncio) return;
    try {
      await api(`/api/anuncios/${anuncio.id}/fotos/${foto.id}`, { method: "DELETE" });
      setFotosSalvas((atuais) => atuais.filter((f) => f.id !== foto.id));
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    }
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    const quantidade = lerNumero(dados.quantidade);
    const preco = lerDinheiro(dados.preco);
    const erros: Record<string, string> = {};
    if (dados.titulo.trim().length < 5) erros.titulo = "O título precisa ter ao menos 5 caracteres.";
    if (dados.descricao.trim().length < 10) erros.descricao = "Descreva o material com ao menos 10 caracteres.";
    if (!dados.categoriaId) erros.categoriaId = "Selecione o tipo de resíduo.";
    if (!dados.culturaId) erros.culturaId = "Selecione a cultura de origem.";
    if (quantidade === null || quantidade <= 0) erros.quantidadeDisponivel = "Informe uma quantidade maior que zero.";
    if (preco === null) erros.precoUnitarioCentavos = "Informe o preço, por exemplo 0,35. Use 0 para doação.";
    if (!dados.municipioId) erros.municipioId = "Selecione o município.";
    setCampos(erros);
    if (Object.keys(erros).length > 0) {
      setErro("Confira os campos destacados.");
      return;
    }

    const corpo = {
      titulo: dados.titulo,
      descricao: dados.descricao,
      categoriaId: Number(dados.categoriaId),
      culturaId: Number(dados.culturaId),
      quantidadeDisponivel: quantidade,
      unidade: dados.unidade,
      precoUnitarioCentavos: preco,
      frequencia: dados.frequencia,
      condicoesRetirada: dados.condicoesRetirada,
      municipioId: Number(dados.municipioId),
      ...(ponto ?? {}),
    };

    setEnviando(true);
    let salvo: Anuncio;
    try {
      ({ anuncio: salvo } = await api<{ anuncio: Anuncio }>(anuncio ? `/api/anuncios/${anuncio.id}` : "/api/anuncios", {
        method: anuncio ? "PATCH" : "POST",
        corpo,
      }));
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      setCampos(camposComErro(falha));
      setEnviando(false);
      return;
    }

    // As fotos vão em uma segunda requisição; se falharem, o anúncio já está salvo.
    let fotosFalharam = false;
    if (fotosNovas.length > 0) {
      const formulario = new FormData();
      fotosNovas.forEach((arquivo) => formulario.append("fotos", arquivo));
      try {
        await api(`/api/anuncios/${salvo.id}/fotos`, { method: "POST", formulario });
      } catch {
        fotosFalharam = true;
      }
    }

    // Invalida tudo que lista anúncios.
    await mutate((chave) => (Array.isArray(chave) ? chave[0] : chave)?.toString().startsWith("/api/anuncios"), undefined, { revalidate: true });
    router.push(fotosFalharam ? `/anuncios/${salvo.id}/editar?fotos=falha` : `/anuncios/${salvo.id}`);
  }

  if (!catalogo) return <Esqueleto className="h-96" />;

  return (
    <form onSubmit={enviar} className="space-y-8" noValidate>
      {erro && <Alerta>{erro}</Alerta>}

      <fieldset className="space-y-4 rounded-xl border border-areia-200 bg-white p-5 sm:p-6">
        <legend className="px-1 font-display text-lg font-semibold">O material</legend>
        <Campo
          rotulo="Título do anúncio"
          placeholder="Ex.: Casca de manga fresca do despolpamento"
          maxLength={120}
          value={dados.titulo}
          onChange={mudar("titulo")}
          erro={campos.titulo}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Selecao rotulo="Tipo de resíduo" value={dados.categoriaId} onChange={mudar("categoriaId")} erro={campos.categoriaId}>
            <option value="">Selecione…</option>
            {catalogo.categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </Selecao>
          <Selecao rotulo="Cultura de origem" value={dados.culturaId} onChange={mudar("culturaId")} erro={campos.culturaId}>
            <option value="">Selecione…</option>
            {catalogo.culturas.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </Selecao>
        </div>
        <AreaTexto
          rotulo="Descrição"
          rows={5}
          maxLength={2000}
          placeholder="Como o material é gerado, estado (fresco, seco, triturado), umidade, possíveis usos…"
          value={dados.descricao}
          onChange={mudar("descricao")}
          erro={campos.descricao}
        />
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-areia-200 bg-white p-5 sm:p-6">
        <legend className="px-1 font-display text-lg font-semibold">Quantidade e preço</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Quantidade disponível"
            inputMode="decimal"
            placeholder="500"
            sufixo={sigla}
            value={dados.quantidade}
            onChange={mudar("quantidade")}
            erro={campos.quantidadeDisponivel}
          />
          <Selecao rotulo="Unidade" value={dados.unidade} onChange={mudar("unidade")} erro={campos.unidade}>
            {Object.entries(NOME_UNIDADE).map(([valor, nome]) => (
              <option key={valor} value={valor}>{nome}</option>
            ))}
          </Selecao>
          <Campo
            rotulo={`Preço desejado por ${sigla}`}
            inputMode="decimal"
            placeholder="0,35"
            prefixo="R$"
            ajuda="Use 0 para oferecer como doação. O comprador pode fazer contraproposta."
            value={dados.preco}
            onChange={mudar("preco")}
            erro={campos.precoUnitarioCentavos}
          />
          <Selecao rotulo="Frequência de geração" value={dados.frequencia} onChange={mudar("frequencia")} erro={campos.frequencia}>
            {Object.entries(NOME_FREQUENCIA).map(([valor, nome]) => (
              <option key={valor} value={valor}>{nome}</option>
            ))}
          </Selecao>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-areia-200 bg-white p-5 sm:p-6">
        <legend className="px-1 font-display text-lg font-semibold">Local e retirada</legend>
        <Selecao
          rotulo="Município"
          value={dados.municipioId}
          onChange={(e) => {
            mudar("municipioId")(e);
            setPonto(null); // volta ao centro do novo município
          }}
          erro={campos.municipioId}
        >
          <option value="">Selecione…</option>
          {catalogo.municipios.map((m) => (
            <option key={m.id} value={m.id}>{m.nome}/{m.uf}</option>
          ))}
        </Selecao>
        {pontoNoMapa && (
          <div>
            <p className="mb-1.5 text-sm font-semibold">
              Ponto de retirada <span className="font-normal text-tinta-suave">(opcional)</span>
            </p>
            <Mapa
              rotulo="Mapa para marcar o ponto de retirada. Clique para posicionar o marcador."
              className="h-64"
              zoom={11}
              centro={pontoNoMapa}
              pontos={[{ id: "ponto", ...pontoNoMapa, titulo: "Ponto de retirada", destaque: ponto !== null }]}
              aoEscolher={setPonto}
            />
            <p className="mt-1.5 text-sm text-tinta-suave">
              {ponto
                ? "Ponto marcado por você. Clique no mapa para ajustar."
                : "Usando o centro do município. Clique no mapa para marcar o local exato; isso melhora a busca por distância."}
            </p>
          </div>
        )}
        <AreaTexto
          rotulo="Condições de retirada"
          opcional
          rows={3}
          maxLength={500}
          placeholder="Dias e horários, embalagem (a granel, big bag, bombona), acesso para caminhão…"
          value={dados.condicoesRetirada}
          onChange={mudar("condicoesRetirada")}
          erro={campos.condicoesRetirada}
        />
      </fieldset>

      <fieldset className="rounded-xl border border-areia-200 bg-white p-5 sm:p-6">
        <legend className="px-1 font-display text-lg font-semibold">Fotos</legend>
        <p className="text-sm text-tinta-suave">
          Até {MAX_FOTOS} fotos (JPG, PNG ou WebP, 5 MB cada). Anúncios com foto recebem mais propostas.
        </p>
        <ul role="list" className="mt-4 flex flex-wrap gap-3">
          {fotosSalvas.map((foto, i) => (
            <li key={foto.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto.url} alt={`Foto ${i + 1} do anúncio`} className="size-24 rounded-lg border border-areia-200 object-cover" />
              <button
                type="button"
                onClick={() => void removerFotoSalva(foto)}
                aria-label={`Remover foto ${i + 1}`}
                className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full border border-areia-300 bg-white text-perigo-700 hover:bg-perigo-50"
              >
                <Trash2 aria-hidden className="size-4" />
              </button>
            </li>
          ))}
          {fotosNovas.map((arquivo, i) => (
            <li key={previas[i]} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previas[i]} alt={`Nova foto: ${arquivo.name}`} className="size-24 rounded-lg border border-areia-200 object-cover" />
              <button
                type="button"
                onClick={() => setFotosNovas((atuais) => atuais.filter((_, j) => j !== i))}
                aria-label={`Remover ${arquivo.name}`}
                className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full border border-areia-300 bg-white text-perigo-700 hover:bg-perigo-50"
              >
                <Trash2 aria-hidden className="size-4" />
              </button>
            </li>
          ))}
          {totalDeFotos < MAX_FOTOS && (
            <li>
              <label className="flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-areia-300 text-xs font-semibold text-tinta-suave hover:border-brand-500 hover:text-brand-700 has-focus-visible:outline-2 has-focus-visible:outline-brand-600">
                <ImagePlus aria-hidden className="size-6" />
                Adicionar
                <input
                  type="file"
                  accept={TIPOS_ACEITOS.join(",")}
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    escolherFotos(e.target.files);
                    e.target.value = ""; // permite escolher o mesmo arquivo de novo
                  }}
                />
              </label>
            </li>
          )}
        </ul>
        {campos.fotos && <p role="alert" className="mt-3 text-sm text-perigo-700">{campos.fotos}</p>}
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <Botao type="submit" tamanho="lg" enviando={enviando}>
          {anuncio ? "Salvar alterações" : "Publicar anúncio"}
        </Botao>
        <LinkBotao href={anuncio ? `/anuncios/${anuncio.id}` : "/meus-anuncios"} variante="fantasma" tamanho="lg">
          Cancelar
        </LinkBotao>
      </div>
    </form>
  );
}
