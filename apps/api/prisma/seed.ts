/**
 * Popula o banco.
 *
 * - Catálogo (municípios, tipos de resíduo, culturas): sempre sincronizado.
 * - Dados de demonstração (contas, anúncios, negociações, transações):
 *   criados apenas se ainda não existir nenhum usuário.
 *
 * Uso: npm run db:seed
 */
import bcrypt from "bcryptjs";
import { prisma } from "../src/db";
import type { Frequencia, StatusTransacao, TipoOrganizacao, Unidade } from "../src/generated/prisma/client";
import { calcularValores } from "../src/lib/dinheiro";

const COMISSAO_BPS = Number(process.env.COMISSAO_BPS ?? 500);
const SENHA_DEMO = "demo1234";
const SENHA_ADMIN = "admin1234";

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

const MUNICIPIOS = [
  { nome: "Petrolina", uf: "PE", latitude: -9.3891, longitude: -40.503 },
  { nome: "Juazeiro", uf: "BA", latitude: -9.4164, longitude: -40.5033 },
  { nome: "Lagoa Grande", uf: "PE", latitude: -8.9966, longitude: -40.2719 },
  { nome: "Santa Maria da Boa Vista", uf: "PE", latitude: -8.8078, longitude: -39.8256 },
  { nome: "Casa Nova", uf: "BA", latitude: -9.1622, longitude: -40.9706 },
  { nome: "Sobradinho", uf: "BA", latitude: -9.4553, longitude: -40.8233 },
  { nome: "Curaçá", uf: "BA", latitude: -8.9925, longitude: -39.9094 },
  { nome: "Orocó", uf: "PE", latitude: -8.6103, longitude: -39.6025 },
  { nome: "Cabrobó", uf: "PE", latitude: -8.5144, longitude: -39.3094 },
  { nome: "Belém do São Francisco", uf: "PE", latitude: -8.7575, longitude: -38.9658 },
  { nome: "Dormentes", uf: "PE", latitude: -8.4472, longitude: -40.7711 },
  { nome: "Afrânio", uf: "PE", latitude: -8.5111, longitude: -41.005 },
  { nome: "Sento Sé", uf: "BA", latitude: -9.7414, longitude: -41.8786 },
  { nome: "Remanso", uf: "BA", latitude: -9.6217, longitude: -42.0817 },
];

const CATEGORIAS = [
  { slug: "cascas", nome: "Cascas", descricao: "Cascas de frutas e hortaliças separadas no beneficiamento." },
  { slug: "bagacos", nome: "Bagaços", descricao: "Bagaço resultante da extração de suco, polpa ou vinho." },
  { slug: "sementes-e-carocos", nome: "Sementes e caroços", descricao: "Sementes, caroços e amêndoas." },
  { slug: "restos-de-poda", nome: "Restos de poda", descricao: "Galhos, ramos e sarmentos de poda." },
  { slug: "frutas-fora-do-padrao", nome: "Frutas fora do padrão", descricao: "Frutas sem padrão comercial, próprias para processamento." },
  { slug: "engacos-e-talos", nome: "Engaços e talos", descricao: "Engaços de uva, talos e pedúnculos." },
  { slug: "palhadas-e-folhas", nome: "Palhadas e folhas", descricao: "Folhas, palhas e restos de cultura." },
  { slug: "restos-de-processamento", nome: "Restos de processamento", descricao: "Tortas, borras e outros subprodutos da agroindústria." },
  { slug: "outros", nome: "Outros", descricao: "Outros materiais reaproveitáveis do campo." },
];

const CULTURAS = [
  ["uva", "Uva"],
  ["manga", "Manga"],
  ["goiaba", "Goiaba"],
  ["banana", "Banana"],
  ["coco", "Coco"],
  ["acerola", "Acerola"],
  ["melao", "Melão"],
  ["melancia", "Melancia"],
  ["maracuja", "Maracujá"],
  ["cebola", "Cebola"],
  ["cana-de-acucar", "Cana-de-açúcar"],
  ["outras", "Outras"],
] as const;

async function sincronizarCatalogo() {
  for (const m of MUNICIPIOS) {
    await prisma.municipio.upsert({
      where: { nome_uf: { nome: m.nome, uf: m.uf } },
      update: { latitude: m.latitude, longitude: m.longitude },
      create: m,
    });
  }
  for (const c of CATEGORIAS) {
    await prisma.categoria.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  for (const [slug, nome] of CULTURAS) {
    await prisma.cultura.upsert({ where: { slug }, update: { nome }, create: { slug, nome } });
  }
}

// ---------------------------------------------------------------------------
// Dados de demonstração
// ---------------------------------------------------------------------------

interface ContaDemo {
  chave: string;
  nome: string;
  email: string;
  telefone: string;
  organizacao: string;
  tipoOrganizacao: TipoOrganizacao;
  municipio: string;
  bio: string;
}

const CONTAS: ContaDemo[] = [
  {
    chave: "maria",
    nome: "Maria do Carmo Souza",
    email: "maria@exemplo.com",
    telefone: "(87) 99911-0001",
    organizacao: "Fazenda Boa Esperança",
    tipoOrganizacao: "PRODUTOR",
    municipio: "Petrolina",
    bio: "Produção de manga e uva de mesa no Projeto Senador Nilo Coelho. Packing house próprio.",
  },
  {
    chave: "joao",
    nome: "João Batista Lima",
    email: "joao@exemplo.com",
    telefone: "(87) 99911-0002",
    organizacao: "Vale Polpas Agroindústria",
    tipoOrganizacao: "AGROINDUSTRIA",
    municipio: "Petrolina",
    bio: "Processamos manga, goiaba e acerola em polpa congelada. Geramos casca, caroço e bagaço o ano todo.",
  },
  {
    chave: "ana",
    nome: "Ana Paula Ribeiro",
    email: "ana@exemplo.com",
    telefone: "(74) 99911-0003",
    organizacao: "Cooperativa dos Fruticultores do Salitre",
    tipoOrganizacao: "COOPERATIVA",
    municipio: "Juazeiro",
    bio: "Reunimos 48 pequenos produtores de manga, goiaba e banana no Vale do Salitre.",
  },
  {
    chave: "carlos",
    nome: "Carlos Menezes",
    email: "carlos@exemplo.com",
    telefone: "(87) 99911-0004",
    organizacao: "Vinícola Sertão Verde",
    tipoOrganizacao: "AGROINDUSTRIA",
    municipio: "Lagoa Grande",
    bio: "Vinhos e sucos de uva do Vale. Duas safras por ano, com bagaço e engaço em volume.",
  },
  {
    chave: "jose",
    nome: "José Antônio Barros",
    email: "jose@exemplo.com",
    telefone: "(74) 99911-0005",
    organizacao: "Sítio Santa Luzia",
    tipoOrganizacao: "PRODUTOR",
    municipio: "Casa Nova",
    bio: "Coco verde e banana irrigados na borda do lago de Sobradinho.",
  },
  {
    chave: "fernanda",
    nome: "Fernanda Alves",
    email: "fernanda@exemplo.com",
    telefone: "(87) 99911-0006",
    organizacao: "BioAdubo Sertão",
    tipoOrganizacao: "EMPRESA",
    municipio: "Petrolina",
    bio: "Compostagem e adubo orgânico. Compramos cascas, bagaços e restos de poda da região.",
  },
  {
    chave: "ricardo",
    nome: "Ricardo Nunes",
    email: "ricardo@exemplo.com",
    telefone: "(74) 99911-0007",
    organizacao: "Ração Forte Nutrição Animal",
    tipoOrganizacao: "EMPRESA",
    municipio: "Juazeiro",
    bio: "Rações para caprinos e ovinos com subprodutos da fruticultura.",
  },
  {
    chave: "juliana",
    nome: "Juliana Castro",
    email: "juliana@exemplo.com",
    telefone: "(87) 99911-0008",
    organizacao: "Flor do Sertão Cosméticos",
    tipoOrganizacao: "EMPRESA",
    municipio: "Petrolina",
    bio: "Óleos e extratos vegetais a partir de sementes de uva, manga e maracujá.",
  },
];

interface AnuncioDemo {
  chave: string;
  vendedor: string;
  titulo: string;
  descricao: string;
  categoria: string;
  cultura: string;
  quantidade: number;
  unidade: Unidade;
  /** Preço por unidade em centavos. */
  preco: number;
  frequencia: Frequencia;
  retirada: string;
  /** Deslocamento em graus a partir do centro do município, para espalhar os pontos no mapa. */
  desloc: [number, number];
  diasAtras: number;
}

const ANUNCIOS: AnuncioDemo[] = [
  {
    chave: "casca-manga",
    vendedor: "joao",
    titulo: "Casca de manga fresca do despolpamento",
    descricao:
      "Casca de manga Tommy e Palmer separada na linha de polpa, sem contaminação com outros resíduos. Material fresco, gerado diariamente durante a safra. Ideal para compostagem, ração ou extração de pectina.",
    categoria: "cascas",
    cultura: "manga",
    quantidade: 500,
    unidade: "KG",
    preco: 35,
    frequencia: "SEMANAL",
    retirada: "Retirada na agroindústria, de segunda a sexta, das 7h às 16h. Carregamos em bombonas ou a granel.",
    desloc: [0.021, -0.034],
    diasAtras: 2,
  },
  {
    chave: "caroco-manga",
    vendedor: "joao",
    titulo: "Caroço de manga limpo",
    descricao:
      "Caroços de manga com pouca polpa aderida, secos ao sol por 3 dias. Amêndoa rica em gordura vegetal, com uso em cosméticos e ração.",
    categoria: "sementes-e-carocos",
    cultura: "manga",
    quantidade: 1.2,
    unidade: "TONELADA",
    preco: 18000,
    frequencia: "QUINZENAL",
    retirada: "Ensacado em big bags de 600 kg. Empilhadeira disponível no local.",
    desloc: [0.021, -0.034],
    diasAtras: 5,
  },
  {
    chave: "bagaco-goiaba",
    vendedor: "joao",
    titulo: "Bagaço de goiaba com sementes",
    descricao:
      "Resíduo da despolpadeira de goiaba: sementes e fibra. Umidade em torno de 60%. Bom para ração de ruminantes e compostagem.",
    categoria: "bagacos",
    cultura: "goiaba",
    quantidade: 800,
    unidade: "KG",
    preco: 22,
    frequencia: "SEMANAL",
    retirada: "Retirada no mesmo dia do processamento. Avisamos por telefone na véspera.",
    desloc: [0.021, -0.034],
    diasAtras: 9,
  },
  {
    chave: "manga-refugo",
    vendedor: "maria",
    titulo: "Manga Palmer fora do padrão de exportação",
    descricao:
      "Frutas com manchas de látex, calibre irregular ou pequenos defeitos de casca. Polpa perfeita para suco, polpa, doce e desidratados.",
    categoria: "frutas-fora-do-padrao",
    cultura: "manga",
    quantidade: 3.5,
    unidade: "TONELADA",
    preco: 45000,
    frequencia: "SAFRA",
    retirada: "Em contentores plásticos no packing house. Devolução dos contentores em até 7 dias.",
    desloc: [-0.052, 0.061],
    diasAtras: 1,
  },
  {
    chave: "sarmento-uva",
    vendedor: "maria",
    titulo: "Sarmentos de poda de videira",
    descricao:
      "Ramos da poda de produção de uva de mesa, triturados grosseiramente. Excelente para cobertura morta, compostagem ou biomassa.",
    categoria: "restos-de-poda",
    cultura: "uva",
    quantidade: 6,
    unidade: "TONELADA",
    preco: 8000,
    frequencia: "SAFRA",
    retirada: "Material enleirado na borda do parreiral. O comprador traz o caminhão; ajudamos no carregamento.",
    desloc: [-0.052, 0.061],
    diasAtras: 12,
  },
  {
    chave: "uva-refugo",
    vendedor: "maria",
    titulo: "Uva de mesa de descarte do packing",
    descricao:
      "Bagas soltas e cachos fora de padrão das variedades Vitória e Arra 15. Fruta sã, doce, ótima para suco, geleia e passas.",
    categoria: "frutas-fora-do-padrao",
    cultura: "uva",
    quantidade: 900,
    unidade: "KG",
    preco: 90,
    frequencia: "SEMANAL",
    retirada: "Caixas plásticas de 20 kg. Retirada pela manhã, até as 10h.",
    desloc: [-0.052, 0.061],
    diasAtras: 3,
  },
  {
    chave: "bagaco-uva",
    vendedor: "carlos",
    titulo: "Bagaço de uva tinta da vinificação",
    descricao:
      "Cascas e sementes de uva Syrah e Cabernet após a prensagem. Rico em polifenóis e fibras. Usado em ração, compostagem e extração de óleo de semente.",
    categoria: "bagacos",
    cultura: "uva",
    quantidade: 12,
    unidade: "TONELADA",
    preco: 12000,
    frequencia: "SAFRA",
    retirada: "Carregamento a granel com pá carregadeira. Agendar com 48 h de antecedência.",
    desloc: [0.015, 0.022],
    diasAtras: 4,
  },
  {
    chave: "engaco-uva",
    vendedor: "carlos",
    titulo: "Engaço de uva desengaçado",
    descricao:
      "Engaços separados na desengaçadeira, sem bagas. Material lenhoso e leve, bom estruturante para compostagem.",
    categoria: "engacos-e-talos",
    cultura: "uva",
    quantidade: 4,
    unidade: "TONELADA",
    preco: 5000,
    frequencia: "SAFRA",
    retirada: "Disponível no pátio da vinícola durante a vindima.",
    desloc: [0.015, 0.022],
    diasAtras: 15,
  },
  {
    chave: "semente-uva",
    vendedor: "carlos",
    titulo: "Semente de uva seca e peneirada",
    descricao:
      "Sementes separadas do bagaço, secas a 8% de umidade. Matéria-prima para óleo de semente de uva e farinha funcional.",
    categoria: "sementes-e-carocos",
    cultura: "uva",
    quantidade: 350,
    unidade: "KG",
    preco: 280,
    frequencia: "MENSAL",
    retirada: "Sacos de ráfia de 25 kg. Enviamos por transportadora, com frete por conta do comprador.",
    desloc: [0.015, 0.022],
    diasAtras: 6,
  },
  {
    chave: "goiaba-refugo",
    vendedor: "ana",
    titulo: "Goiaba Paluma madura para indústria",
    descricao:
      "Goiabas maduras fora do padrão de mesa, colhidas pelos cooperados. Indicadas para polpa, doce em massa e goiabada.",
    categoria: "frutas-fora-do-padrao",
    cultura: "goiaba",
    quantidade: 2,
    unidade: "TONELADA",
    preco: 60000,
    frequencia: "SEMANAL",
    retirada: "Ponto de coleta na sede da cooperativa, às terças e sextas.",
    desloc: [-0.078, -0.115],
    diasAtras: 2,
  },
  {
    chave: "pseudocaule-banana",
    vendedor: "ana",
    titulo: "Pseudocaule e folhas de bananeira",
    descricao:
      "Pseudocaules cortados após a colheita do cacho. Fonte de fibra para artesanato, papel e cobertura de solo.",
    categoria: "palhadas-e-folhas",
    cultura: "banana",
    quantidade: 5,
    unidade: "TONELADA",
    preco: 0,
    frequencia: "MENSAL",
    retirada: "Doação. O interessado faz o corte e o transporte, com acompanhamento de um cooperado.",
    desloc: [-0.078, -0.115],
    diasAtras: 20,
  },
  {
    chave: "casca-banana",
    vendedor: "ana",
    titulo: "Casca de banana da produção de doces",
    descricao:
      "Cascas de banana prata geradas na cozinha comunitária da cooperativa. Material limpo, separado na origem.",
    categoria: "cascas",
    cultura: "banana",
    quantidade: 180,
    unidade: "KG",
    preco: 15,
    frequencia: "SEMANAL",
    retirada: "Bombonas de 50 L com tampa. Trazer bombonas vazias para troca.",
    desloc: [-0.078, -0.115],
    diasAtras: 7,
  },
  {
    chave: "casca-coco",
    vendedor: "jose",
    titulo: "Casca de coco verde",
    descricao:
      "Cascas de coco verde após a extração da água. Matéria-prima para fibra, substrato agrícola e pó de coco.",
    categoria: "cascas",
    cultura: "coco",
    quantidade: 15,
    unidade: "M3",
    preco: 2500,
    frequencia: "SEMANAL",
    retirada: "Amontoado no galpão. Acesso para caminhão toco.",
    desloc: [0.034, 0.047],
    diasAtras: 8,
  },
  {
    chave: "palha-cebola",
    vendedor: "jose",
    titulo: "Palha e refugo de cebola",
    descricao:
      "Palha da cura e bulbos miúdos da classificação. Uso em compostagem e extração de corantes naturais.",
    categoria: "palhadas-e-folhas",
    cultura: "cebola",
    quantidade: 700,
    unidade: "KG",
    preco: 10,
    frequencia: "SAFRA",
    retirada: "Ensacado em sacos de malha. Retirada combinada por telefone.",
    desloc: [0.034, 0.047],
    diasAtras: 18,
  },
];

const dias = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function criarDadosDeDemonstracao() {
  const municipios = new Map((await prisma.municipio.findMany()).map((m) => [m.nome, m]));
  const categorias = new Map((await prisma.categoria.findMany()).map((c) => [c.slug, c]));
  const culturas = new Map((await prisma.cultura.findMany()).map((c) => [c.slug, c]));

  const petrolina = municipios.get("Petrolina")!;

  await prisma.usuario.create({
    data: {
      nome: "Administração",
      email: "admin@bancoderesiduos.com.br",
      senhaHash: await bcrypt.hash(SENHA_ADMIN, 12),
      organizacao: "Banco de Resíduos",
      tipoOrganizacao: "OUTRO",
      papel: "ADMIN",
      municipioId: petrolina.id,
    },
  });

  const senhaHash = await bcrypt.hash(SENHA_DEMO, 12);
  const usuarios = new Map<string, { id: number }>();
  for (const [i, conta] of CONTAS.entries()) {
    const { chave, municipio, ...dados } = conta;
    const m = municipios.get(municipio)!;
    const usuario = await prisma.usuario.create({
      data: {
        ...dados,
        senhaHash,
        municipioId: m.id,
        latitude: m.latitude,
        longitude: m.longitude,
        criadoEm: dias(170 - i * 9),
      },
    });
    usuarios.set(chave, usuario);
  }

  const anuncios = new Map<string, { id: number; vendedorId: number; unidade: Unidade }>();
  for (const a of ANUNCIOS) {
    const vendedor = CONTAS.find((c) => c.chave === a.vendedor)!;
    const m = municipios.get(vendedor.municipio)!;
    const anuncio = await prisma.anuncio.create({
      data: {
        vendedorId: usuarios.get(a.vendedor)!.id,
        titulo: a.titulo,
        descricao: a.descricao,
        categoriaId: categorias.get(a.categoria)!.id,
        culturaId: culturas.get(a.cultura)!.id,
        quantidadeDisponivel: a.quantidade,
        unidade: a.unidade,
        precoUnitarioCentavos: a.preco,
        frequencia: a.frequencia,
        condicoesRetirada: a.retirada,
        municipioId: m.id,
        latitude: m.latitude + a.desloc[0],
        longitude: m.longitude + a.desloc[1],
        criadoEm: dias(a.diasAtras),
      },
    });
    anuncios.set(a.chave, anuncio);
  }

  // --- Histórico de negócios fechados (alimenta gráficos, extratos e reputação) ---

  interface NegocioDemo {
    anuncio: string;
    comprador: string;
    quantidade: number;
    preco: number;
    diasAtras: number;
    status: StatusTransacao;
    /** [nota do comprador para o vendedor, nota do vendedor para o comprador] */
    notas?: [number, number];
    comentarios?: [string, string];
  }

  const NEGOCIOS: NegocioDemo[] = [
    { anuncio: "bagaco-uva", comprador: "ricardo", quantidade: 8, preco: 11000, diasAtras: 150, status: "CONCLUIDA", notas: [5, 5], comentarios: ["Material conforme o anúncio e carregamento rápido.", "Pagou em dia e retirou no horário combinado."] },
    { anuncio: "casca-manga", comprador: "fernanda", quantidade: 1500, preco: 30, diasAtras: 128, status: "CONCLUIDA", notas: [5, 4], comentarios: ["Casca bem separada, sem lixo misturado.", "Boa negociação. Atrasou um pouco na retirada."] },
    { anuncio: "semente-uva", comprador: "juliana", quantidade: 200, preco: 300, diasAtras: 101, status: "CONCLUIDA", notas: [4, 5], comentarios: ["Sementes secas e limpas. Umidade um pouco acima do informado.", "Cliente excelente."] },
    { anuncio: "manga-refugo", comprador: "joao", quantidade: 4, preco: 42000, diasAtras: 86, status: "CONCLUIDA", notas: [5, 5], comentarios: ["Fruta doce e sã, rendeu muito bem na polpa.", "Parceiro de confiança."] },
    { anuncio: "sarmento-uva", comprador: "fernanda", quantidade: 10, preco: 7000, diasAtras: 64, status: "CONCLUIDA", notas: [4, 5], comentarios: ["Bom volume. O acesso ao parreiral é difícil para carreta.", "Tudo certo."] },
    { anuncio: "bagaco-goiaba", comprador: "ricardo", quantidade: 2000, preco: 20, diasAtras: 47, status: "CONCLUIDA", notas: [5, 5], comentarios: ["Os animais aceitaram bem. Vamos repetir.", "Retirada organizada."] },
    { anuncio: "goiaba-refugo", comprador: "joao", quantidade: 3, preco: 58000, diasAtras: 33, status: "CONCLUIDA", notas: [5, 4], comentarios: ["Goiaba madura no ponto, pouca perda.", "Negociação tranquila."] },
    { anuncio: "caroco-manga", comprador: "juliana", quantidade: 0.8, preco: 17500, diasAtras: 21, status: "CONCLUIDA", notas: [5, 5], comentarios: ["Caroço limpo, ótimo para extrair a manteiga.", "Recomendo."] },
    { anuncio: "bagaco-uva", comprador: "fernanda", quantidade: 5, preco: 12000, diasAtras: 12, status: "CONCLUIDA", notas: [5, 5], comentarios: ["Bagaço fresco, sem mofo.", "Compradora pontual."] },
    { anuncio: "casca-coco", comprador: "fernanda", quantidade: 10, preco: 2500, diasAtras: 6, status: "PAGA" },
    { anuncio: "uva-refugo", comprador: "joao", quantidade: 400, preco: 85, diasAtras: 1, status: "AGUARDANDO_PAGAMENTO" },
  ];

  for (const n of NEGOCIOS) {
    const anuncio = anuncios.get(n.anuncio)!;
    const compradorId = usuarios.get(n.comprador)!.id;
    const quando = dias(n.diasAtras);
    const valores = calcularValores(n.quantidade, n.preco, COMISSAO_BPS);

    const negociacao = await prisma.negociacao.create({
      data: {
        anuncioId: anuncio.id,
        compradorId,
        status: "ACEITA",
        criadoEm: quando,
        ofertas: {
          create: {
            autorId: compradorId,
            quantidade: n.quantidade,
            precoUnitarioCentavos: n.preco,
            mensagem: "Tenho interesse nesse lote. Consigo retirar ainda esta semana.",
            criadoEm: quando,
          },
        },
      },
    });

    const pago = n.status === "PAGA" || n.status === "CONCLUIDA";
    const transacao = await prisma.transacao.create({
      data: {
        negociacaoId: negociacao.id,
        anuncioId: anuncio.id,
        vendedorId: anuncio.vendedorId,
        compradorId,
        quantidade: n.quantidade,
        unidade: anuncio.unidade,
        precoUnitarioCentavos: n.preco,
        taxaComissaoBps: COMISSAO_BPS,
        ...valores,
        status: n.status,
        criadoEm: quando,
        pagoEm: pago ? dias(Math.max(0, n.diasAtras - 1)) : null,
        concluidaEm: n.status === "CONCLUIDA" ? dias(Math.max(0, n.diasAtras - 3)) : null,
      },
    });

    if (n.notas) {
      await prisma.avaliacao.createMany({
        data: [
          { transacaoId: transacao.id, autorId: compradorId, avaliadoId: anuncio.vendedorId, nota: n.notas[0], comentario: n.comentarios?.[0], criadoEm: dias(Math.max(0, n.diasAtras - 3)) },
          { transacaoId: transacao.id, autorId: anuncio.vendedorId, avaliadoId: compradorId, nota: n.notas[1], comentario: n.comentarios?.[1], criadoEm: dias(Math.max(0, n.diasAtras - 3)) },
        ],
      });
    }
  }

  // Reputação desnormalizada a partir das avaliações criadas acima.
  const reputacoes = await prisma.avaliacao.groupBy({ by: ["avaliadoId"], _avg: { nota: true }, _count: true });
  for (const r of reputacoes) {
    await prisma.usuario.update({
      where: { id: r.avaliadoId },
      data: { notaMedia: r._avg.nota, totalAvaliacoes: r._count },
    });
  }

  // --- Negociações em andamento, para demonstrar o fluxo ao vivo ---

  // 1) O exemplo do pitch: compradora propõe os 500 kg de casca de manga; aguarda o vendedor.
  await prisma.negociacao.create({
    data: {
      anuncioId: anuncios.get("casca-manga")!.id,
      compradorId: usuarios.get("fernanda")!.id,
      criadoEm: dias(1),
      ofertas: {
        create: {
          autorId: usuarios.get("fernanda")!.id,
          quantidade: 500,
          precoUnitarioCentavos: 30,
          mensagem: "Fico com os 500 kg desta semana. Consegue fazer a R$ 0,30 o quilo? Retiro na quinta.",
          criadoEm: dias(1),
        },
      },
    },
  });

  // 2) Contraproposta do vendedor; aguarda o comprador.
  const emContraproposta = await prisma.negociacao.create({
    data: {
      anuncioId: anuncios.get("bagaco-uva")!.id,
      compradorId: usuarios.get("ricardo")!.id,
      criadoEm: dias(3),
    },
  });
  await prisma.oferta.create({
    data: {
      negociacaoId: emContraproposta.id,
      autorId: usuarios.get("ricardo")!.id,
      quantidade: 6,
      precoUnitarioCentavos: 10000,
      mensagem: "Quero 6 toneladas para a ração dos caprinos. Fecho a R$ 100 a tonelada.",
      criadoEm: dias(3),
    },
  });
  await prisma.oferta.create({
    data: {
      negociacaoId: emContraproposta.id,
      autorId: usuarios.get("carlos")!.id,
      quantidade: 6,
      precoUnitarioCentavos: 11500,
      mensagem: "Por R$ 115 a tonelada eu fecho e ainda ajudo no carregamento.",
      criadoEm: dias(2),
    },
  });

  // 3) Interessada na semente de uva; aguarda o vendedor.
  await prisma.negociacao.create({
    data: {
      anuncioId: anuncios.get("semente-uva")!.id,
      compradorId: usuarios.get("juliana")!.id,
      criadoEm: dias(0.2),
      ofertas: {
        create: {
          autorId: usuarios.get("juliana")!.id,
          quantidade: 150,
          precoUnitarioCentavos: 260,
          mensagem: "Preciso de 150 kg para um lote de óleo. Pode enviar o laudo de umidade?",
          criadoEm: dias(0.2),
        },
      },
    },
  });
}

async function principal() {
  await sincronizarCatalogo();
  console.log("Catálogo sincronizado (municípios, tipos de resíduo e culturas).");

  if ((await prisma.usuario.count()) > 0) {
    console.log("Já existem usuários: dados de demonstração não foram recriados.");
    return;
  }

  await criarDadosDeDemonstracao();
  console.log("Dados de demonstração criados.");
  console.log(`  Admin:    admin@bancoderesiduos.com.br / ${SENHA_ADMIN}`);
  console.log(`  Vendedor: joao@exemplo.com / ${SENHA_DEMO}`);
  console.log(`  Compradora: fernanda@exemplo.com / ${SENHA_DEMO}`);
}

principal()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
