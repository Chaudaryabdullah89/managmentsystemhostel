const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking DB stats...");
  const tables = ['user', 'booking', 'payment', 'complaint', 'session', 'room', 'hostel'];
  for (const table of tables) {
    try {
      const count = await prisma[table].count();
      console.log(`${table}: ${count} records`);
    } catch (e) {
      console.error(`Error counting ${table}:`, e.message);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
