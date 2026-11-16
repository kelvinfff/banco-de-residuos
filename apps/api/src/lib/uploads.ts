import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { env } from "../env";
import { ErroHttp } from "./erros";

export const MAX_FOTOS_POR_ANUNCIO = 5;
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

const EXTENSOES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

/** Recebe até 5 imagens no campo `fotos` e grava em disco com nome aleatório. */
export const receberFotos = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, env.UPLOAD_DIR),
    filename: (_req, file, cb) => {
      // O nome original do arquivo é ignorado: nada vindo do cliente entra no caminho.
      cb(null, `${crypto.randomBytes(16).toString("hex")}${EXTENSOES[file.mimetype] ?? ""}`);
    },
  }),
  limits: { fileSize: TAMANHO_MAXIMO_BYTES, files: MAX_FOTOS_POR_ANUNCIO },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype in EXTENSOES) return cb(null, true);
    cb(new ErroHttp(400, "Formato de imagem não suportado. Use JPG, PNG ou WebP."));
  },
}).array("fotos", MAX_FOTOS_POR_ANUNCIO);

/** Confere os primeiros bytes do arquivo: o tipo declarado pelo navegador não é confiável. */
async function ehImagemDeVerdade(caminho: string): Promise<boolean> {
  const arquivo = await fs.open(caminho, "r");
  try {
    const { buffer, bytesRead } = await arquivo.read(Buffer.alloc(12), 0, 12, 0);
    if (bytesRead < 12) return false;
    const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const png = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const webp =
      buffer.subarray(0, 4).toString("latin1") === "RIFF" &&
      buffer.subarray(8, 12).toString("latin1") === "WEBP";
    return jpeg || png || webp;
  } finally {
    await arquivo.close();
  }
}

export async function validarConteudoDasFotos(arquivos: Express.Multer.File[]) {
  for (const arquivo of arquivos) {
    if (!(await ehImagemDeVerdade(arquivo.path))) {
      await apagarArquivos(arquivos.map((a) => a.path));
      throw new ErroHttp(400, "Um dos arquivos enviados não é uma imagem válida.");
    }
  }
}

export async function apagarArquivos(caminhos: string[]) {
  await Promise.all(caminhos.map((c) => fs.rm(c, { force: true })));
}

export const urlPublicaDaFoto = (nomeDoArquivo: string) => `/uploads/${nomeDoArquivo}`;

/** Converte a URL pública de volta para o caminho em disco (só o nome do arquivo é usado). */
export const caminhoDaFoto = (url: string) => path.join(env.UPLOAD_DIR, path.basename(url));

export async function garantirPastaDeUploads() {
  await fs.mkdir(env.UPLOAD_DIR, { recursive: true });
}
