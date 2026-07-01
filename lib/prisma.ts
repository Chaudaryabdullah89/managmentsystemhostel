import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// Override Decimal serialization globally so they serialize as numbers instead of strings
Decimal.prototype.toJSON = function() {
    return this.toNumber() as any;
};

const prismaClientSingleton = () => {
    return new PrismaClient();
};

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof prismaClientSingleton> | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;