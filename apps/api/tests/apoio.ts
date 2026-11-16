import request from "supertest";
import { criarApp } from "../src/app";
import { prisma } from "../src/db";

export const app = criarApp();

/** Apaga todos os dados e recria um catálogo mínimo. */
export async function limparBanco() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE avaliacoes, transacoes, ofertas, negociacoes, fotos_anuncio, anuncios,
             usuarios, categorias, culturas, municipios
    RESTART IDENTITY CASCADE`);

  const [petrolina, juazeiro, remanso] = await Promise.all([
    prisma.municipio.create({ data: { nome: "Petrolina", uf: "PE", latitude: -9.3891, longitude: -40.503 } }),
    prisma.municipio.create({ data: { nome: "Juazeiro", uf: "BA", latitude: -9.4164, longitude: -40.5033 } }),
    prisma.municipio.create({ data: { nome: "Remanso", uf: "BA", latitude: -9.6217, longitude: -42.0817 } }),
  ]);
  const cascas = await prisma.categoria.create({ data: { nome: "Cascas", slug: "cascas" } });
  const bagacos = await prisma.categoria.create({ data: { nome: "Bagaços", slug: "bagacos" } });
  const manga = await prisma.cultura.create({ data: { nome: "Manga", slug: "manga" } });
  const uva = await prisma.cultura.create({ data: { nome: "Uva", slug: "uva" } });
  return { petrolina, juazeiro, remanso, cascas, bagacos, manga, uva };
}

export type Catalogo = Awaited<ReturnType<typeof limparBanco>>;

let contador = 0;

/** Cadastra um usuário e devolve um agente supertest já autenticado (com o cookie de sessão). */
export async function criarUsuario(catalogo: Catalogo, dados: Record<string, unknown> = {}) {
  contador += 1;
  const agente = request.agent(app);
  const resposta = await agente.post("/api/auth/cadastro").send({
    nome: `Usuário ${contador}`,
    email: `usuario${contador}@teste.com`,
    senha: "senha-segura-123",
    tipoOrganizacao: "PRODUTOR",
    municipioId: catalogo.petrolina.id,
    ...dados,
  });
  if (resposta.status !== 201) {
    throw new Error(`Falha ao cadastrar usuário de teste: ${JSON.stringify(resposta.body)}`);
  }
  return { agente, usuario: resposta.body.usuario as { id: number; email: string; nome: string } };
}

export async function criarAdmin(catalogo: Catalogo) {
  const admin = await criarUsuario(catalogo);
  await prisma.usuario.update({ where: { id: admin.usuario.id }, data: { papel: "ADMIN" } });
  return admin;
}

export function dadosAnuncio(catalogo: Catalogo, extras: Record<string, unknown> = {}) {
  return {
    titulo: "Casca de manga fresca",
    descricao: "Casca de manga separada na linha de polpa.",
    categoriaId: catalogo.cascas.id,
    culturaId: catalogo.manga.id,
    quantidadeDisponivel: 500,
    unidade: "KG",
    precoUnitarioCentavos: 35,
    frequencia: "SEMANAL",
    municipioId: catalogo.petrolina.id,
    ...extras,
  };
}

export async function criarAnuncio(
  agente: ReturnType<typeof request.agent>,
  catalogo: Catalogo,
  extras: Record<string, unknown> = {},
) {
  const resposta = await agente.post("/api/anuncios").send(dadosAnuncio(catalogo, extras));
  if (resposta.status !== 201) {
    throw new Error(`Falha ao criar anúncio de teste: ${JSON.stringify(resposta.body)}`);
  }
  return resposta.body.anuncio as { id: number; quantidadeDisponivel: number; status: string };
}
