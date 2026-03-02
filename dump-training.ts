import { PrismaClient as AiPrisma } from './node_modules/@prisma/ai-client';
const aiPrisma = new AiPrisma();
async function dump() {
  try {
    const data = await aiPrisma.aiTraining.findMany({ 
      take: 20, 
      orderBy: { updatedAt: 'desc' } 
    });
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Dump failed:", e);
  }
}
dump().finally(() => aiPrisma.$disconnect());
