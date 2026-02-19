const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generateUID(prefix, id) {
    // Use first 8 characters of ID to ensure uniqueness
    const uniquePart = id.substring(0, 8).toUpperCase();
    return `${prefix}-${uniquePart}`;
}

async function generateUIDs() {
    console.log('🚀 Starting UID generation...\n');

    try {
        // Generate UIDs for Users
        console.log('📝 Generating UIDs for Users...');
        const users = await prisma.user.findMany({ where: { uid: null } });
        let userCount = 0;
        for (const user of users) {
            try {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { uid: generateUID('USR', user.id) }
                });
                userCount++;
            } catch (error) {
                console.log(`⚠️  Skipping duplicate UID for user ${user.id}`);
            }
        }
        console.log(`✅ Generated ${userCount} User UIDs\n`);

        // Generate UIDs for Bookings
        console.log('📝 Generating UIDs for Bookings...');
        const bookings = await prisma.booking.findMany({ where: { uid: null } });
        let bookingCount = 0;
        for (const booking of bookings) {
            try {
                await prisma.booking.update({
                    where: { id: booking.id },
                    data: { uid: generateUID('BKG', booking.id) }
                });
                bookingCount++;
            } catch (error) {
                console.log(`⚠️  Skipping duplicate UID for booking ${booking.id}`);
            }
        }
        console.log(`✅ Generated ${bookingCount} Booking UIDs\n`);

        // Generate UIDs for Payments
        console.log('📝 Generating UIDs for Payments...');
        const payments = await prisma.payment.findMany({ where: { uid: null } });
        let paymentCount = 0;
        for (const payment of payments) {
            try {
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: { uid: generateUID('PAY', payment.id) }
                });
                paymentCount++;
            } catch (error) {
                console.log(`⚠️  Skipping duplicate UID for payment ${payment.id}`);
            }
        }
        console.log(`✅ Generated ${paymentCount} Payment UIDs\n`);

        // Generate UIDs for Complaints
        console.log('📝 Generating UIDs for Complaints...');
        const complaints = await prisma.complaint.findMany({ where: { uid: null } });
        let complaintCount = 0;
        for (const complaint of complaints) {
            try {
                await prisma.complaint.update({
                    where: { id: complaint.id },
                    data: { uid: generateUID('CMP', complaint.id) }
                });
                complaintCount++;
            } catch (error) {
                console.log(`⚠️  Skipping duplicate UID for complaint ${complaint.id}`);
            }
        }
        console.log(`✅ Generated ${complaintCount} Complaint UIDs\n`);

        // Generate UIDs for Maintenance
        console.log('📝 Generating UIDs for Maintenance...');
        const maintenance = await prisma.maintanance.findMany({ where: { uid: null } });
        let maintenanceCount = 0;
        for (const task of maintenance) {
            try {
                await prisma.maintanance.update({
                    where: { id: task.id },
                    data: { uid: generateUID('MNT', task.id) }
                });
                maintenanceCount++;
            } catch (error) {
                console.log(`⚠️  Skipping duplicate UID for maintenance ${task.id}`);
            }
        }
        console.log(`✅ Generated ${maintenanceCount} Maintenance UIDs\n`);

        console.log('🎉 UID generation completed successfully!');
    } catch (error) {
        console.error('❌ Error generating UIDs:', error);
    } finally {
        await prisma.$disconnect();
    }
}

generateUIDs();
