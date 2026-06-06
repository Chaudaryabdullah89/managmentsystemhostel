// @ts-ignore
import { PrismaClient } from "@prisma/ai-client";

const globalForAiPrisma = global as unknown as { aiPrisma: PrismaClient };

export const aiPrisma = globalForAiPrisma.aiPrisma || new PrismaClient({
    datasources: {
        aiDb: {
            url: process.env.AI_DATABASE_URL || "postgresql://mock:mock@localhost:5432/mock"
        }
    }
});

if (process.env.NODE_ENV !== "production") globalForAiPrisma.aiPrisma = aiPrisma;

export default aiPrisma;
