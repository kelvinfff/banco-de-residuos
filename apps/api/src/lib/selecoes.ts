import type { Prisma } from "../generated/prisma/client";

/** Dados de usuário que qualquer visitante pode ver. Nunca inclui e-mail, telefone ou senha. */
export const usuarioPublico = {
  id: true,
  nome: true,
  organizacao: true,
  tipoOrganizacao: true,
  notaMedia: true,
  totalAvaliacoes: true,
  criadoEm: true,
  municipio: { select: { id: true, nome: true, uf: true } },
} satisfies Prisma.UsuarioSelect;

/** Dados que o próprio usuário vê sobre sua conta. */
export const usuarioPrivado = {
  ...usuarioPublico,
  email: true,
  telefone: true,
  bio: true,
  papel: true,
  latitude: true,
  longitude: true,
  municipio: { select: { id: true, nome: true, uf: true, latitude: true, longitude: true } },
} satisfies Prisma.UsuarioSelect;

/** Contato liberado para a outra parte somente depois do negócio fechado. */
export const usuarioComContato = {
  ...usuarioPublico,
  email: true,
  telefone: true,
} satisfies Prisma.UsuarioSelect;

export const anuncioCompleto = {
  categoria: true,
  cultura: true,
  municipio: { select: { id: true, nome: true, uf: true } },
  fotos: { orderBy: [{ ordem: "asc" }, { id: "asc" }] },
  vendedor: { select: usuarioPublico },
} satisfies Prisma.AnuncioInclude;

/** Versão enxuta do anúncio para aparecer dentro de negociações e transações. */
export const anuncioResumido = {
  id: true,
  titulo: true,
  unidade: true,
  status: true,
  quantidadeDisponivel: true,
  precoUnitarioCentavos: true,
  vendedorId: true,
  categoria: { select: { nome: true, slug: true } },
  cultura: { select: { nome: true, slug: true } },
  municipio: { select: { id: true, nome: true, uf: true } },
  fotos: { orderBy: [{ ordem: "asc" }, { id: "asc" }], take: 1 },
  vendedor: { select: usuarioPublico },
} satisfies Prisma.AnuncioSelect;
