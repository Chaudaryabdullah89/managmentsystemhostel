
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const users = await prisma.user.findMany({
        where: { role: 'WARDEN' },
        select: { id: true, name: true, hostelId: true }
    });
    console.log('WARDENS:', JSON.stringify(users, null, 2));

    const hostels = await prisma.hostel.findMany({
        select: { id: true, name: true, wardens: true }
    });
    console.log('HOSTELS:', JSON.stringify(hostels, null, 2));

    const residents = await prisma.user.findMany({
        where: { role: 'RESIDENT' },
        select: { id: true, name: true, hostelId: true, ResidentProfile: { select: { currentHostelId: true } } }
    });
    console.log('RESIDENTS:', JSON.stringify(residents, null, 2));

    const guests = await prisma.user.findMany({
        where: { role: 'GUEST' },
        select: { id: true, name: true, hostelId: true, ResidentProfile: { select: { currentHostelId: true } } }
    });
    console.log('GUESTS:', JSON.stringify(guests, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
