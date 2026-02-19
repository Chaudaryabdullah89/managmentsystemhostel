
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const bookings = await prisma.booking.findMany({
        include: {
            User: { select: { id: true, name: true } },
            Room: { select: { id: true, roomNumber: true, hostelId: true, Hostel: { select: { name: true } } } }
        }
    });
    console.log('BOOKINGS:', JSON.stringify(bookings, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
