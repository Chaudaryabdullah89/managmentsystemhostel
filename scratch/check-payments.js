const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true }
  });

  for (const u of users) {
    const payments = await prisma.payment.findMany({
      where: { userId: u.id }
    });
    if (payments.length > 0) {
      console.log(`Payments for ${u.name} (${u.email}) [Role: ${u.role}]:`, payments.map(p => ({ id: p.id, status: p.status, amount: p.amount, type: p.type })));
    } else {
      console.log(`No payments for ${u.name} (${u.email})`);
    }
  }
}

main().catch(err => {
  console.error(err);
}).finally(() => {
  prisma.$disconnect();
});
