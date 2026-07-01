require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const julyPayments = await prisma.payment.findMany({
    where: {
      month: "July",
      year: 2026
    },
    include: {
      Booking: {
        include: {
          User: true
        }
      }
    }
  });

  console.log("July Payments count:", julyPayments.length);
  console.log("July Payments details:", julyPayments.map(p => ({
    id: p.id,
    bookingId: p.bookingId,
    userName: p.Booking?.User?.name,
    amount: p.amount,
    type: p.type,
    status: p.status,
    notes: p.notes,
    createdAt: p.createdAt
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
