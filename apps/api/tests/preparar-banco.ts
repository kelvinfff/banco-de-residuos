import { execSync } from "node:child_process";
import fs from "node:fs";

/** Antes da suíte: aplica as migrations no banco de teste e limpa a pasta de uploads. */
export default function prepararBanco() {
  const url = process.env.DATABASE_URL ?? "";
  if (!/test/i.test(new URL(url).pathname)) {
    throw new Error(
      `Recusando rodar os testes: o banco "${new URL(url).pathname}" não parece ser de teste. ` +
        "Defina TEST_DATABASE_URL apontando para um banco cujo nome contenha 'test'.",
    );
  }
  execSync("npx prisma migrate deploy", { stdio: "pipe", env: process.env });
  fs.rmSync("./tests/.uploads", { recursive: true, force: true });
  fs.mkdirSync("./tests/.uploads", { recursive: true });

  return () => fs.rmSync("./tests/.uploads", { recursive: true, force: true });
}
