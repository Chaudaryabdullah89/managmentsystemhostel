const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== Profiling database queries parallel vs sequential ===");
  
  const userId = "cd40c862-e452-4491-8bae-e6c55001382c";
  const hostelId = "cl..."; // Some hostelId, or null
  
  // Method 1: Sequential
  let startSeq = Date.now();
  const bookingsSeq = await prisma.booking.findMany({
    where: { userId },
    include: {
      User: { include: { ResidentProfile: true } },
      Room: { include: { Hostel: true } },
      Payment: { orderBy: { date: 'desc' } }
    },
    orderBy: { createdAt: 'desc' }
  });
  const paymentsSeq = await prisma.payment.findMany({
    where: { userId },
    include: {
      User: { select: { name: true, email: true, phone: true } },
      Booking: { include: { Room: { include: { Hostel: true } } } }
    },
    orderBy: { date: 'desc' },
    take: 10
  });
  const complaintsSeq = await prisma.complaint.findMany({
    where: { userId },
    include: {
      User_Complaint_userIdToUser: { select: { id: true, name: true, email: true, image: true, role: true } },
      Hostel: { select: { id: true, name: true, city: true } },
      User_Complaint_assignedToIdToUser: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  const noticesSeq = await prisma.notice.findMany({
    where: {
      OR: [
        { hostelId: null },
        hostelId ? { hostelId } : {}
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  const durationSeq = Date.now() - startSeq;
  console.log(`Sequential execution took: ${durationSeq}ms`);

  // Method 2: Parallel Promise.all
  let startPar = Date.now();
  const [bookingsPar, paymentsPar, complaintsPar, noticesPar] = await Promise.all([
    prisma.booking.findMany({
      where: { userId },
      include: {
        User: { include: { ResidentProfile: true } },
        Room: { include: { Hostel: true } },
        Payment: { orderBy: { date: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.payment.findMany({
      where: { userId },
      include: {
        User: { select: { name: true, email: true, phone: true } },
        Booking: { include: { Room: { include: { Hostel: true } } } }
      },
      orderBy: { date: 'desc' },
      take: 10
    }),
    prisma.complaint.findMany({
      where: { userId },
      include: {
        User_Complaint_userIdToUser: { select: { id: true, name: true, email: true, image: true, role: true } },
        Hostel: { select: { id: true, name: true, city: true } },
        User_Complaint_assignedToIdToUser: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.notice.findMany({
      where: {
        OR: [
          { hostelId: null },
          hostelId ? { hostelId } : {}
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ]);
  const durationPar = Date.now() - startPar;
  console.log(`Parallel execution took: ${durationPar}ms`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
