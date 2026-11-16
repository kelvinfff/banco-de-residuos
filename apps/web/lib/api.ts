/** Erro devolvido pela API: mensagem pronta para exibir e, se houver, erros por campo. */
export class ErroApi extends Error {
  constructor(
    public readonly status: number,
    mensagem: string,
    public readonly campos: Record<string, string | number | undefined> = {},
  ) {
    super(mensagem);
    this.name = "ErroApi";
  }
}

interface Opcoes {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** Corpo JSON. */
  corpo?: unknown;
  /** Corpo multipart (envio de fotos). */
  formulario?: FormData;
}

/**
 * Chama a API. O caminho é sempre relativo (/api/...): o Next.js repassa à API,
 * então o cookie de sessão acompanha a requisição automaticamente.
 */
export async function api<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const { method = "GET", corpo, formulario } = opcoes;

  let resposta: Response;
  try {
    resposta = await fetch(caminho, {
      method,
      headers: corpo !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: formulario ?? (corpo !== undefined ? JSON.stringify(corpo) : undefined),
      credentials: "same-origin",
    });
  } catch {
    throw new ErroApi(0, "Não foi possível falar com o servidor. Verifique sua conexão.");
  }

  if (resposta.status === 204) return undefined as T;

  const dados: unknown = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const erro = (dados ?? {}) as { erro?: string; campos?: Record<string, string> };
    throw new ErroApi(
      resposta.status,
      erro.erro ?? "Algo deu errado. Tente novamente em instantes.",
      erro.campos ?? {},
    );
  }
  return dados as T;
}

/** Fetcher padrão do SWR. */
export const buscar = <T,>(caminho: string) => api<T>(caminho);

/** Mensagem amigável a partir de qualquer erro. */
export const mensagemDeErro = (erro: unknown) =>
  erro instanceof Error ? erro.message : "Algo deu errado. Tente novamente em instantes.";

/** Erros por campo (somente os que são texto), para formulários. */
export function camposComErro(erro: unknown): Record<string, string> {
  if (!(erro instanceof ErroApi)) return {};
  return Object.fromEntries(
    Object.entries(erro.campos).filter((par): par is [string, string] => typeof par[1] === "string"),
  );
}

/** Monta uma query string ignorando valores vazios. */
export function consulta(parametros: Record<string, string | number | null | undefined>): string {
  const busca = new URLSearchParams();
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor !== null && valor !== undefined && valor !== "") busca.set(chave, String(valor));
  }
  const texto = busca.toString();
  return texto ? `?${texto}` : "";
}
