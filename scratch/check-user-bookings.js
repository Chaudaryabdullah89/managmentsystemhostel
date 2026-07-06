const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'RESIDENT' },
    select: { id: true, name: true, email: true }
  });
  console.log('RESIDENTS:', users);

  for (const u of users) {
    const bookings = await prisma.booking.findMany({
      where: { userId: u.id },
      include: { Room: { include: { Hostel: true } } }
    });
    console.log(`Bookings for ${u.name} (${u.email}):`, bookings);
  }
}

main().catch(err => {
  console.error(err);
}).finally(() => {
  prisma.$disconnect();
});
