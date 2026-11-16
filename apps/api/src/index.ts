import { criarApp } from "./app";
import { prisma } from "./db";
import { env } from "./env";
import { garantirPastaDeUploads } from "./lib/uploads";

await garantirPastaDeUploads();

const servidor = criarApp().listen(env.PORT, () => {
  console.log(`API do Banco de Resíduos em http://localhost:${env.PORT}/api`);
});

// Encerramento limpo (Ctrl+C, docker stop): termina as requisições e fecha o pool do banco.
for (const sinal of ["SIGINT", "SIGTERM"] as const) {
  process.on(sinal, () => {
    servidor.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });
}
