import aiPrisma from './lib/ai-prisma';

async function check() {
    console.log("aiPrisma keys:", Object.keys(aiPrisma));
    // @ts-ignore
    console.log("aiSession exists:", !!aiPrisma.aiSession);
    // @ts-ignore
    console.log("aiTraining exists:", !!aiPrisma.aiTraining);
    process.exit(0);
}

check();
