const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== MobileNotification Logs ===");
  const logs = await prisma.mobileNotification.findMany({
    include: {
      sentBy: { select: { name: true, role: true } },
      hostel: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  logs.forEach(l => {
    console.log(`- ID: ${l.id}`);
    console.log(`  Title: "${l.title}"`);
    console.log(`  Body: "${l.body}"`);
    console.log(`  Target Type: ${l.targetType}`);
    console.log(`  Target Hostel: ${l.hostel?.name || 'ALL'}`);
    console.log(`  Target Role: ${l.targetRole || 'ALL'}`);
    console.log(`  Recipient Count: ${l.recipientCount}`);
    console.log(`  Sent By: ${l.sentBy?.name} (${l.sentBy?.role})`);
    console.log(`  Created At: ${l.createdAt.toISOString()}`);
    console.log("------------------------");
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
