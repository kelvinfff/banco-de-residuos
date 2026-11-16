// Tipos dos dados devolvidos pela API (espelham apps/api).

export type TipoOrganizacao = "PRODUTOR" | "AGROINDUSTRIA" | "COOPERATIVA" | "EMPRESA" | "OUTRO";
export type Papel = "USUARIO" | "ADMIN";
export type Unidade = "KG" | "TONELADA" | "LITRO" | "M3" | "UNIDADE";
export type Frequencia = "UNICA" | "SEMANAL" | "QUINZENAL" | "MENSAL" | "SAFRA";
export type StatusAnuncio = "ATIVO" | "PAUSADO" | "ESGOTADO" | "ENCERRADO" | "SUSPENSO";
export type StatusNegociacao = "ABERTA" | "ACEITA" | "RECUSADA" | "CANCELADA";
export type StatusTransacao = "AGUARDANDO_PAGAMENTO" | "PAGA" | "CONCLUIDA" | "CANCELADA";

export interface Municipio {
  id: number;
  nome: string;
  uf: string;
  latitude: number;
  longitude: number;
}
export type MunicipioResumido = Pick<Municipio, "id" | "nome" | "uf">;

export interface Categoria {
  id: number;
  nome: string;
  slug: string;
  descricao: string | null;
}

export interface Cultura {
  id: number;
  nome: string;
  slug: string;
}

export interface Catalogo {
  categorias: Categoria[];
  culturas: Cultura[];
  municipios: Municipio[];
  taxaComissaoBps: number;
}

export interface UsuarioPublico {
  id: number;
  nome: string;
  organizacao: string | null;
  tipoOrganizacao: TipoOrganizacao;
  notaMedia: number | null;
  totalAvaliacoes: number;
  criadoEm: string;
  municipio: MunicipioResumido;
}

export interface UsuarioComContato extends UsuarioPublico {
  email: string;
  telefone: string | null;
}

export interface Usuario extends UsuarioPublico {
  email: string;
  telefone: string | null;
  bio: string | null;
  papel: Papel;
  latitude: number | null;
  longitude: number | null;
  municipio: Municipio;
}

export interface Foto {
  id: number;
  url: string;
  ordem: number;
}

export interface Anuncio {
  id: number;
  vendedorId: number;
  titulo: string;
  descricao: string;
  categoriaId: number;
  culturaId: number;
  quantidadeDisponivel: number;
  unidade: Unidade;
  precoUnitarioCentavos: number;
  frequencia: Frequencia;
  condicoesRetirada: string | null;
  municipioId: number;
  latitude: number;
  longitude: number;
  status: StatusAnuncio;
  criadoEm: string;
  categoria: Categoria;
  cultura: Cultura;
  municipio: MunicipioResumido;
  fotos: Foto[];
  vendedor: UsuarioPublico;
  distanciaKm?: number | null;
  _count?: { negociacoes: number; transacoes: number };
}

export interface AnuncioResumido {
  id: number;
  titulo: string;
  unidade: Unidade;
  status: StatusAnuncio;
  quantidadeDisponivel: number;
  precoUnitarioCentavos: number;
  vendedorId: number;
  categoria: { nome: string; slug: string };
  cultura: { nome: string; slug: string };
  municipio: MunicipioResumido;
  fotos: Foto[];
  vendedor: UsuarioPublico;
  criadoEm?: string;
}

export interface Paginado<T> {
  itens: T[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

export interface Oferta {
  id: number;
  autorId: number;
  quantidade: number;
  precoUnitarioCentavos: number;
  mensagem: string | null;
  criadoEm: string;
}

export type PapelNoNegocio = "comprador" | "vendedor" | "observador";

export interface Negociacao {
  id: number;
  anuncioId: number;
  compradorId: number;
  status: StatusNegociacao;
  criadoEm: string;
  atualizadoEm: string;
  anuncio: AnuncioResumido;
  comprador: UsuarioPublico;
  ofertas: Oferta[];
  ultimaOferta: Oferta | null;
  transacao: { id: number; status: StatusTransacao } | null;
  meuPapel: PapelNoNegocio;
  minhaVez: boolean;
}

export interface Avaliacao {
  id: number;
  autorId: number;
  avaliadoId: number;
  nota: number;
  comentario: string | null;
  criadoEm: string;
}

export interface TransacaoBase {
  id: number;
  negociacaoId: number;
  anuncioId: number;
  vendedorId: number;
  compradorId: number;
  quantidade: number;
  unidade: Unidade;
  precoUnitarioCentavos: number;
  valorTotalCentavos: number;
  taxaComissaoBps: number;
  comissaoCentavos: number;
  valorLiquidoCentavos: number;
  status: StatusTransacao;
  pagoEm: string | null;
  concluidaEm: string | null;
  canceladaEm: string | null;
  criadoEm: string;
}

export interface TransacaoNaLista extends TransacaoBase {
  anuncio: AnuncioResumido;
  vendedor: UsuarioPublico;
  comprador: UsuarioPublico;
  meuPapel: PapelNoNegocio;
  avaliacaoPendente: boolean;
}

export interface Transacao extends TransacaoBase {
  anuncio: AnuncioResumido;
  vendedor: UsuarioComContato;
  comprador: UsuarioComContato;
  avaliacoes: Avaliacao[];
  meuPapel: PapelNoNegocio;
  possoPagar: boolean;
  possoConfirmarRetirada: boolean;
  possoCancelar: boolean;
  possoAvaliar: boolean;
}

export interface ResumoUsuario {
  anunciosAtivos: number;
  negociacoesAbertas: number;
  aguardandoMinhaResposta: number;
  pagamentosPendentes: number;
  retiradasPendentes: number;
  vendas: { quantidade: number; valorTotalCentavos: number; valorLiquidoCentavos: number; comissaoCentavos: number };
  compras: { quantidade: number; valorTotalCentavos: number };
}

export interface Estatisticas {
  anunciosAtivos: number;
  organizacoes: number;
  negociosFechados: number;
  municipiosComOferta: number;
}

export interface PerfilPublico {
  usuario: UsuarioPublico & { bio: string | null };
  anuncios: Anuncio[];
  avaliacoes: {
    id: number;
    nota: number;
    comentario: string | null;
    criadoEm: string;
    autor: { id: number; nome: string; organizacao: string | null };
  }[];
  negociosConcluidos: number;
}

export interface ResumoAdmin {
  usuarios: number;
  anuncios: Record<StatusAnuncio, number>;
  negociacoesAbertas: number;
  transacoes: Record<StatusTransacao, { quantidade: number; valorTotalCentavos: number; comissaoCentavos: number }>;
  comissaoRealizadaCentavos: number;
  comissaoAReceberCentavos: number;
  volumeNegociadoCentavos: number;
  porMes: { mes: string; volumeCentavos: number; comissaoCentavos: number; quantidade: number }[];
  porCategoria: { categoria: string; volumeCentavos: number; quantidade: number }[];
}

export interface UsuarioAdmin extends UsuarioPublico {
  email: string;
  telefone: string | null;
  papel: Papel;
  ativo: boolean;
  _count: { anuncios: number; vendas: number; compras: number };
}

export interface TransacaoAdmin extends TransacaoBase {
  anuncio: { id: number; titulo: string };
  vendedor: { id: number; nome: string; organizacao: string | null };
  comprador: { id: number; nome: string; organizacao: string | null };
}
