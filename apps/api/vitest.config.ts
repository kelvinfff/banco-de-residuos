import { defineConfig } from "vitest/config";

// Os testes de integração usam um banco separado (TEST_DATABASE_URL), que é
// apagado a cada execução. Nunca aponte esta variável para o banco de desenvolvimento.
const ambienteDeTeste = {
  NODE_ENV: "test",
  DATABASE_URL:
    process.env.TEST_DATABASE_URL ??
    "postgresql://bdr:bdr@localhost:5434/banco_residuos_test?schema=public",
  JWT_SECRET: "segredo-apenas-para-testes-0123456789abcdef",
  UPLOAD_DIR: "./tests/.uploads",
  COMISSAO_BPS: "500",
};

// Vale também para o setup global (migrations), que roda neste mesmo processo.
Object.assign(process.env, ambienteDeTeste);

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["./tests/preparar-banco.ts"],
    // Os arquivos compartilham o mesmo banco: rodam um de cada vez.
    fileParallelism: false,
    hookTimeout: 30_000,
    env: ambienteDeTeste,
  },
});
