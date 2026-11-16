import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { Frequencia, Unidade, type Prisma } from "../generated/prisma/client";
import { conflito, naoEncontrado, proibido, requisicaoInvalida } from "../lib/erros";
import { caixaDelimitadora, distanciaKm } from "../lib/geo";
import { anuncioCompleto } from "../lib/selecoes";
import {
  apagarArquivos,
  caminhoDaFoto,
  MAX_FOTOS_POR_ANUNCIO,
  receberFotos,
  urlPublicaDaFoto,
  validarConteudoDasFotos,
} from "../lib/uploads";
import { idDaRota, latitude, longitude, paginacao, textoAnulavel, validar } from "../lib/validar";
import { exigirLogin, usuarioLogado } from "../middleware/autenticacao";

export const rotasAnuncios = Router();

/** Teto de anúncios considerados quando a busca é ordenada/filtrada por distância. */
const LIMITE_BUSCA_GEOGRAFICA = 1000;

// ---------------------------------------------------------------------------
// Busca pública
// ---------------------------------------------------------------------------

const esquemaBusca = z
  .object({
    q: z.string().trim().max(100).optional(),
    categoria: z.string().trim().max(60).optional(),
    cultura: z.string().trim().max(60).optional(),
    municipioId: z.coerce.number().int().positive().optional(),
    vendedorId: z.coerce.number().int().positive().optional(),
    frequencia: z.enum(Frequencia).optional(),
    precoMaxCentavos: z.coerce.number().int().min(0).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    raioKm: z.coerce.number().positive().max(2000).optional(),
    ordenar: z.enum(["recentes", "menor_preco", "maior_quantidade", "mais_proximos"]).default("recentes"),
    ...paginacao,
  })
  .refine((d) => (d.lat === undefined) === (d.lng === undefined), {
    message: "Informe lat e lng juntas.",
    path: ["lat"],
  });

rotasAnuncios.get("/", async (req, res) => {
  const f = validar(esquemaBusca, req.query);
  const origem = f.lat !== undefined && f.lng !== undefined ? { latitude: f.lat, longitude: f.lng } : null;

  const where: Prisma.AnuncioWhereInput = {
    status: "ATIVO",
    vendedor: { ativo: true },
    ...(f.categoria && { categoria: { slug: f.categoria } }),
    ...(f.cultura && { cultura: { slug: f.cultura } }),
    ...(f.municipioId && { municipioId: f.municipioId }),
    ...(f.vendedorId && { vendedorId: f.vendedorId }),
    ...(f.frequencia && { frequencia: f.frequencia }),
    ...(f.precoMaxCentavos !== undefined && { precoUnitarioCentavos: { lte: f.precoMaxCentavos } }),
    ...(f.q && {
      OR: [
        { titulo: { contains: f.q, mode: "insensitive" } },
        { descricao: { contains: f.q, mode: "insensitive" } },
        { categoria: { nome: { contains: f.q, mode: "insensitive" } } },
        { cultura: { nome: { contains: f.q, mode: "insensitive" } } },
      ],
    }),
  };

  const usarDistancia = origem !== null && (f.raioKm !== undefined || f.ordenar === "mais_proximos");

  const orderBy: Prisma.AnuncioOrderByWithRelationInput[] =
    f.ordenar === "menor_preco"
      ? [{ precoUnitarioCentavos: "asc" }, { id: "desc" }]
      : f.ordenar === "maior_quantidade"
        ? [{ quantidadeDisponivel: "desc" }, { id: "desc" }]
        : [{ criadoEm: "desc" }, { id: "desc" }];

  if (!usarDistancia) {
    const [total, itens] = await Promise.all([
      prisma.anuncio.count({ where }),
      prisma.anuncio.findMany({
        where,
        include: anuncioCompleto,
        orderBy,
        skip: (f.pagina - 1) * f.porPagina,
        take: f.porPagina,
      }),
    ]);
    return res.json({
      itens: itens.map((a) => ({ ...a, distanciaKm: origem ? arredondar(distanciaKm(origem, a)) : null })),
      total,
      pagina: f.pagina,
      porPagina: f.porPagina,
      totalPaginas: Math.max(1, Math.ceil(total / f.porPagina)),
    });
  }

  // Busca por proximidade: o banco pré-filtra por um retângulo e a distância exata
  // (Haversine) é calculada aqui. Suficiente para o volume de um MVP regional.
  if (f.raioKm !== undefined) {
    const caixa = caixaDelimitadora(origem, f.raioKm);
    where.latitude = { gte: caixa.latMin, lte: caixa.latMax };
    where.longitude = { gte: caixa.lngMin, lte: caixa.lngMax };
  }
  const candidatos = await prisma.anuncio.findMany({
    where,
    include: anuncioCompleto,
    orderBy,
    take: LIMITE_BUSCA_GEOGRAFICA,
  });
  let comDistancia = candidatos.map((a) => ({ ...a, distanciaKm: distanciaKm(origem, a) }));
  if (f.raioKm !== undefined) {
    const raio = f.raioKm;
    comDistancia = comDistancia.filter((a) => a.distanciaKm <= raio);
  }
  if (f.ordenar === "mais_proximos") {
    comDistancia.sort((a, b) => a.distanciaKm - b.distanciaKm || b.id - a.id);
  }
  const total = comDistancia.length;
  const inicio = (f.pagina - 1) * f.porPagina;
  res.json({
    itens: comDistancia
      .slice(inicio, inicio + f.porPagina)
      .map((a) => ({ ...a, distanciaKm: arredondar(a.distanciaKm) })),
    total,
    pagina: f.pagina,
    porPagina: f.porPagina,
    totalPaginas: Math.max(1, Math.ceil(total / f.porPagina)),
  });
});

const arredondar = (km: number) => Math.round(km * 10) / 10;

// ---------------------------------------------------------------------------
// Anúncios do usuário logado
// ---------------------------------------------------------------------------

rotasAnuncios.get("/meus", exigirLogin, async (req, res) => {
  const itens = await prisma.anuncio.findMany({
    where: { vendedorId: usuarioLogado(req).id },
    include: {
      ...anuncioCompleto,
      _count: { select: { negociacoes: { where: { status: "ABERTA" } }, transacoes: true } },
    },
    orderBy: { criadoEm: "desc" },
  });
  res.json({ itens });
});

// ---------------------------------------------------------------------------
// Detalhe
// ---------------------------------------------------------------------------

rotasAnuncios.get("/:id", async (req, res) => {
  const id = idDaRota(req);
  const anuncio = await prisma.anuncio.findUnique({ where: { id }, include: anuncioCompleto });
  if (!anuncio) throw naoEncontrado("Anúncio");

  const eu = req.usuario;
  const souDono = eu?.id === anuncio.vendedorId;
  const souAdmin = eu?.papel === "ADMIN";
  // Anúncios suspensos pela moderação só aparecem para o dono e para administradores.
  if (anuncio.status === "SUSPENSO" && !souDono && !souAdmin) throw naoEncontrado("Anúncio");

  // Se o visitante já negocia este anúncio, o frontend leva direto para a conversa.
  const minhaNegociacao =
    eu && !souDono
      ? await prisma.negociacao.findFirst({
          where: { anuncioId: id, compradorId: eu.id, status: "ABERTA" },
          select: { id: true },
        })
      : null;

  res.json({ anuncio, souDono, minhaNegociacaoAbertaId: minhaNegociacao?.id ?? null });
});

// ---------------------------------------------------------------------------
// Criação e edição
// ---------------------------------------------------------------------------

const camposAnuncio = {
  titulo: z.string().trim().min(5, "O título precisa ter ao menos 5 caracteres.").max(120),
  descricao: z.string().trim().min(10, "Descreva o material com ao menos 10 caracteres.").max(2000),
  categoriaId: z.number().int().positive(),
  culturaId: z.number().int().positive(),
  quantidadeDisponivel: z
    .number()
    .positive("Informe uma quantidade maior que zero.")
    .max(100_000_000)
    .multipleOf(0.001, "Use no máximo 3 casas decimais."),
  unidade: z.enum(Unidade),
  precoUnitarioCentavos: z.number().int().min(0).max(100_000_000),
  frequencia: z.enum(Frequencia),
  condicoesRetirada: textoAnulavel(500),
  municipioId: z.number().int().positive(),
  latitude: latitude.optional(),
  longitude: longitude.optional(),
};

const coordenadasJuntas = (d: { latitude?: number; longitude?: number }) =>
  (d.latitude === undefined) === (d.longitude === undefined);

const esquemaCriacao = z.object(camposAnuncio).refine(coordenadasJuntas, {
  message: "Informe latitude e longitude juntas.",
  path: ["latitude"],
});

const esquemaEdicao = z
  .object({
    ...camposAnuncio,
    // O dono alterna entre ativo e pausado, ou encerra de vez.
    status: z.enum(["ATIVO", "PAUSADO", "ENCERRADO"]),
  })
  .partial()
  .refine(coordenadasJuntas, { message: "Informe latitude e longitude juntas.", path: ["latitude"] });

async function conferirReferencias(dados: { categoriaId?: number; culturaId?: number; municipioId?: number }) {
  const [categoria, cultura, municipio] = await Promise.all([
    dados.categoriaId ? prisma.categoria.findUnique({ where: { id: dados.categoriaId } }) : undefined,
    dados.culturaId ? prisma.cultura.findUnique({ where: { id: dados.culturaId } }) : undefined,
    dados.municipioId ? prisma.municipio.findUnique({ where: { id: dados.municipioId } }) : undefined,
  ]);
  const campos: Record<string, string> = {};
  if (categoria === null) campos.categoriaId = "Selecione um tipo de resíduo.";
  if (cultura === null) campos.culturaId = "Selecione uma cultura.";
  if (municipio === null) campos.municipioId = "Selecione um município.";
  if (Object.keys(campos).length > 0) throw requisicaoInvalida("Dados inválidos.", campos);
  return { municipio };
}

rotasAnuncios.post("/", exigirLogin, async (req, res) => {
  const dados = validar(esquemaCriacao, req.body);
  const { municipio } = await conferirReferencias(dados);

  const anuncio = await prisma.anuncio.create({
    data: {
      ...dados,
      vendedorId: usuarioLogado(req).id,
      // Sem ponto exato, o anúncio fica no centro do município.
      latitude: dados.latitude ?? municipio!.latitude,
      longitude: dados.longitude ?? municipio!.longitude,
    },
    include: anuncioCompleto,
  });
  res.status(201).json({ anuncio });
});

/** Carrega o anúncio da rota e garante que pertence ao usuário logado. */
async function carregarMeuAnuncio(req: Request) {
  const anuncio = await prisma.anuncio.findUnique({
    where: { id: idDaRota(req) },
    include: { fotos: true },
  });
  if (!anuncio) throw naoEncontrado("Anúncio");
  if (anuncio.vendedorId !== usuarioLogado(req).id) throw proibido("Este anúncio não é seu.");
  return anuncio;
}

rotasAnuncios.patch("/:id", exigirLogin, async (req, res) => {
  const atual = await carregarMeuAnuncio(req);
  const dados = validar(esquemaEdicao, req.body);

  if (atual.status === "SUSPENSO") {
    throw proibido("Este anúncio foi suspenso pela moderação e não pode ser alterado.");
  }
  if (atual.status === "ENCERRADO") throw conflito("Anúncios encerrados não podem ser alterados.");

  const { municipio } = await conferirReferencias(dados);

  const data: Prisma.AnuncioUncheckedUpdateInput = { ...dados };
  // Trocou de município sem marcar um ponto: reposiciona no centro do novo município.
  if (municipio && dados.latitude === undefined && dados.municipioId !== atual.municipioId) {
    data.latitude = municipio.latitude;
    data.longitude = municipio.longitude;
  }
  // Repor estoque reativa um anúncio esgotado.
  if (atual.status === "ESGOTADO" && dados.status === undefined) {
    if (dados.quantidadeDisponivel !== undefined) data.status = "ATIVO";
  }
  if (dados.status === "ATIVO" && atual.status === "ESGOTADO" && dados.quantidadeDisponivel === undefined) {
    throw conflito("Informe a nova quantidade disponível para reativar um anúncio esgotado.");
  }

  const anuncio = await prisma.anuncio.update({
    where: { id: atual.id },
    data,
    include: anuncioCompleto,
  });
  res.json({ anuncio });
});

// ---------------------------------------------------------------------------
// Fotos
// ---------------------------------------------------------------------------

/** Confere a posse do anúncio antes de o multer gravar qualquer arquivo em disco. */
async function exigirMeuAnuncio(req: Request, _res: Response, next: NextFunction) {
  await carregarMeuAnuncio(req);
  next();
}

rotasAnuncios.post("/:id/fotos", exigirLogin, exigirMeuAnuncio, receberFotos, async (req, res) => {
  const arquivos = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (arquivos.length === 0) throw requisicaoInvalida("Nenhuma foto enviada.");
  await validarConteudoDasFotos(arquivos);

  const anuncio = await carregarMeuAnuncio(req);
  if (anuncio.fotos.length + arquivos.length > MAX_FOTOS_POR_ANUNCIO) {
    await apagarArquivos(arquivos.map((a) => a.path));
    throw requisicaoInvalida(`Cada anúncio pode ter no máximo ${MAX_FOTOS_POR_ANUNCIO} fotos.`);
  }

  const proximaOrdem = Math.max(-1, ...anuncio.fotos.map((f) => f.ordem)) + 1;
  await prisma.fotoAnuncio.createMany({
    data: arquivos.map((arquivo, i) => ({
      anuncioId: anuncio.id,
      url: urlPublicaDaFoto(arquivo.filename),
      ordem: proximaOrdem + i,
    })),
  });

  const fotos = await prisma.fotoAnuncio.findMany({
    where: { anuncioId: anuncio.id },
    orderBy: [{ ordem: "asc" }, { id: "asc" }],
  });
  res.status(201).json({ fotos });
});

rotasAnuncios.delete("/:id/fotos/:fotoId", exigirLogin, async (req, res) => {
  const anuncio = await carregarMeuAnuncio(req);
  const fotoId = idDaRota(req, "fotoId");
  const foto = anuncio.fotos.find((f) => f.id === fotoId);
  if (!foto) throw naoEncontrado("Foto");

  await prisma.fotoAnuncio.delete({ where: { id: foto.id } });
  await apagarArquivos([caminhoDaFoto(foto.url)]);
  res.status(204).end();
});
