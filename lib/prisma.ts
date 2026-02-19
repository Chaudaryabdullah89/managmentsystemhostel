// lib/prisma.ts 
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma_clean?: PrismaClient };

// Configure Prisma client with connection pooling support for Neon
export const prisma =
    globalForPrisma.prisma_clean ??
    new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

// Handle graceful shutdown and connection management
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma_clean = prisma;
}

export default prisma;