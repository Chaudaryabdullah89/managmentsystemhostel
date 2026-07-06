const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true }
  });
  console.log('ALL USERS:', users);

  for (const u of users) {
    const bookings = await prisma.booking.findMany({
      where: { userId: u.id },
      include: { Room: { include: { Hostel: true } } }
    });
    if (bookings.length > 0) {
      console.log(`Bookings for ${u.name} (${u.email}) [Role: ${u.role}]:`, bookings.map(b => ({ id: b.id, status: b.status, room: b.Room?.roomNumber })));
    }
  }
}

main().catch(err => {
  console.error(err);
}).finally(() => {
  prisma.$disconnect();
});
