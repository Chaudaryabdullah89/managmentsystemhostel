const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: "global" },
  });
  console.log("Current system settings in DB:", settings);
}

main().catch(console.error).finally(() => prisma.$disconnect());
