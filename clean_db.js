const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting database cleanup...");

    // Delete in reverse dependency order to satisfy foreign key constraints
    await prisma.refundRequest.deleteMany({});
    console.log("Deleted RefundRequests");

    await prisma.payment.deleteMany({});
    console.log("Deleted Payments");

    await prisma.wardenPayment.deleteMany({});
    console.log("Deleted WardenPayments");

    await prisma.session.deleteMany({});
    console.log("Deleted Sessions");

    await prisma.chatMessage.deleteMany({});
    console.log("Deleted ChatMessages");

    await prisma.resetPassword.deleteMany({});
    console.log("Deleted resetPasswords");

    await prisma.otpVerification.deleteMany({});
    console.log("Deleted OtpVerifications");

    await prisma.taskComment.deleteMany({});
    console.log("Deleted TaskComments");

    await prisma.staffTask.deleteMany({});
    console.log("Deleted StaffTasks");

    await prisma.notice.deleteMany({});
    console.log("Deleted Notices");

    await prisma.complaintComment.deleteMany({});
    console.log("Deleted ComplaintComments");

    await prisma.complaint.deleteMany({});
    console.log("Deleted Complaints");

    await prisma.maintanance.deleteMany({});
    console.log("Deleted maintanance");

    await prisma.expense.deleteMany({});
    console.log("Deleted Expenses");

    await prisma.booking.deleteMany({});
    console.log("Deleted Bookings");

    await prisma.salary.deleteMany({});
    console.log("Deleted Salaries");

    await prisma.staffProfile.deleteMany({});
    console.log("Deleted StaffProfiles");

    await prisma.residentProfile.deleteMany({});
    console.log("Deleted ResidentProfiles");

    await prisma.cleaningLog.deleteMany({});
    console.log("Deleted CleaningLogs");

    await prisma.laundryLog.deleteMany({});
    console.log("Deleted LaundryLogs");

    await prisma.room.deleteMany({});
    console.log("Deleted Rooms");

    await prisma.messMenu.deleteMany({});
    console.log("Deleted MessMenus");

    // Remove user references from hostels first to prevent FK constraint on managerId
    await prisma.hostel.updateMany({
        data: {
            managerId: null
        }
    });

    await prisma.hostel.deleteMany({});
    console.log("Deleted Hostels");

    // Remove all users except '2@gmail.com'
    const deletedUsers = await prisma.user.deleteMany({
        where: {
            email: {
                not: '2@gmail.com'
            }
        }
    });
    console.log(`Deleted ${deletedUsers.count} Users`);

    const adminUser = await prisma.user.findUnique({
        where: { email: '2@gmail.com' }
    });
    if (adminUser) {
        console.log("✅ Maintained admin user:", adminUser.email);
    } else {
        console.log("⚠️ Admin user '2@gmail.com' was not found in the database initially.");
    }

    console.log("✅ Database cleanup completed successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
