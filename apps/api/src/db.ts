import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";
import { PrismaClient } from "./generated/prisma/client";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

/** Instância única do Prisma (um pool de conexões por processo). */
export const prisma = new PrismaClient({ adapter });

export { Prisma } from "./generated/prisma/client";
