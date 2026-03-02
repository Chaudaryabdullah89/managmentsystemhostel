// @ts-ignore
import { PrismaClient } from "@prisma/ai-client";

const globalForAiPrisma = global as unknown as { aiPrisma: PrismaClient };

export const aiPrisma = globalForAiPrisma.aiPrisma || new PrismaClient({
    datasources: {
        db: {
            url: process.env.AI_DATABASE_URL
        }
    }
});

if (process.env.NODE_ENV !== "production") globalForAiPrisma.aiPrisma = aiPrisma;

export default aiPrisma;
