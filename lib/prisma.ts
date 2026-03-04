import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
    return new PrismaClient();
};

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof prismaClientSingleton> | undefined;
};

// Check if existing client is out of sync with new models/fields
// We check for 'uid' existence in the payment model if it exists
if (globalForPrisma.prisma) {
    const isOutOfSync = !('payment' in globalForPrisma.prisma);
    if (isOutOfSync) {
        globalForPrisma.prisma = undefined;
    }
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;