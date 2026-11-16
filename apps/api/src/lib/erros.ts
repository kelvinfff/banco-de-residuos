/** Erro de negócio com status HTTP. O middleware de erros o converte em JSON. */
export class ErroHttp extends Error {
  constructor(
    public readonly status: number,
    mensagem: string,
    public readonly detalhes?: unknown,
  ) {
    super(mensagem);
    this.name = "ErroHttp";
  }
}

export const naoEncontrado = (oQue: string) => new ErroHttp(404, `${oQue} não encontrado(a).`);
export const proibido = (mensagem = "Você não tem permissão para esta ação.") =>
  new ErroHttp(403, mensagem);
export const conflito = (mensagem: string) => new ErroHttp(409, mensagem);
export const requisicaoInvalida = (mensagem: string, detalhes?: unknown) =>
  new ErroHttp(400, mensagem, detalhes);
