require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const crypto = require("crypto");

async function runBillingCron() {
  console.log("Simulating /api/cron/billing...");
  
  const currentDate = new Date();
  const monthIndex = currentDate.getMonth(); // 0 = Jan, 1 = Feb
  const year = currentDate.getFullYear();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthName = monthNames[monthIndex];

  console.log(`Current Month: ${currentMonthName} ${year}`);

  // Find Active Bookings
  const activeBookings = await prisma.booking.findMany({
    where: {
      status: { in: ["CONFIRMED", "CHECKED_IN"] },
      monthlyRent: { gt: 0 }
    },
    include: { User: true }
  });

  console.log(`Active bookings count: ${activeBookings.length}`);

  let generatedCount = 0;
  for (const booking of activeBookings) {
    const existingPayment = await prisma.payment.findFirst({
      where: {
        userId: booking.userId,
        bookingId: booking.id,
        type: "MONTHLY_RENT",
        month: currentMonthName,
        year: year
      }
    });

    if (!existingPayment) {
      console.log(`Generating payment for ${booking.User.name} (${booking.id}). Amount: ${booking.monthlyRent}`);
      // Calculate due date (10th of the current month)
      const dueDate = new Date(year, monthIndex, 10);

      await prisma.payment.create({
        data: {
          id: crypto.randomUUID(),
          userId: booking.userId,
          bookingId: booking.id,
          amount: booking.monthlyRent || 0,
          type: "MONTHLY_RENT",
          status: "PENDING",
          month: currentMonthName,
          year: year,
          dueDate: dueDate,
          notes: `Automated rent generation for ${currentMonthName} ${year}`,
          updatedAt: new Date()
        }
      });
      generatedCount++;
    } else {
      console.log(`Payment already exists for ${booking.User.name} (${booking.id})`);
    }
  }

  console.log(`Successfully generated ${generatedCount} rent invoices.`);
}

runBillingCron().catch(console.error).finally(() => prisma.$disconnect());
