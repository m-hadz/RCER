import { PrismaClient } from "@/app/generated/prisma/client";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

const prismaClientSingleton = () => {
    const adapter = new PrismaBetterSqlite3({
        url: process.env.DATABASE_URL as string
    });

    return new PrismaClient({ adapter });
}

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma
if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma