
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUIDs() {
    try {
        const bookings = await prisma.booking.findMany({ take: 5, include: { User: true } });
        console.log("Checking first 5 bookings:");
        bookings.forEach(b => {
            console.log(`Booking ID: ${b.id}, UID: ${b.uid}`);
            console.log(`  User ID: ${b.User?.id}, User UID: ${b.User?.uid}`);
        });
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUIDs();
