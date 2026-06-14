/**
 * AI Prisma Client — connects to the AI database (AI sessions + messages).
 *
 * If AI_DATABASE_URL is not configured, exports `null`.
 * All consumers MUST guard: `if (!aiPrisma) return ...`
 *
 * To enable: set AI_DATABASE_URL in .env.local (see .env.example)
 * Then run: npx prisma generate --schema=prisma/ai-schema.prisma
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated from prisma/ai-schema.prisma
import { PrismaClient } from "@prisma/ai-client";

if (!process.env.AI_DATABASE_URL) {
    console.warn(
        "[ai-prisma] AI_DATABASE_URL is not set — AI session history will be disabled. " +
        "See .env.example for configuration."
    );
}

const globalForAiPrisma = global as unknown as { aiPrisma: PrismaClient | null };

let aiPrismaInstance: PrismaClient | null = null;

if (process.env.AI_DATABASE_URL) {
    aiPrismaInstance = globalForAiPrisma.aiPrisma ?? new PrismaClient({
        datasources: {
            aiDb: {
                url: process.env.AI_DATABASE_URL
            }
        }
    });

    if (process.env.NODE_ENV !== "production") {
        globalForAiPrisma.aiPrisma = aiPrismaInstance;
    }
}

export const aiPrisma = aiPrismaInstance;
export default aiPrisma;

