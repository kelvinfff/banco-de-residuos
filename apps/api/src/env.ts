import "dotenv/config";
import path from "node:path";
import { z } from "zod";

const esquema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET precisa ter ao menos 32 caracteres"),
  /** Comissão da plataforma em pontos-base (500 = 5%). */
  COMISSAO_BPS: z.coerce.number().int().min(0).max(10_000).default(500),
  UPLOAD_DIR: z.string().default("./uploads"),
  /** Envia o cookie de sessão apenas por HTTPS. Ative em produção com TLS. */
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

const resultado = esquema.safeParse(process.env);

if (!resultado.success) {
  console.error("Configuração de ambiente inválida:");
  for (const problema of resultado.error.issues) {
    console.error(`  - ${problema.path.join(".")}: ${problema.message}`);
  }
  process.exit(1);
}

export const env = {
  ...resultado.data,
  UPLOAD_DIR: path.resolve(resultado.data.UPLOAD_DIR),
};
