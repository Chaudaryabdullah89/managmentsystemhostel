const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== Profiling database queries ===");
  
  // Measure raw query
  let start = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  console.log(`SELECT 1 took: ${Date.now() - start}ms`);

  // Measure User profile select
  start = Date.now();
  const users = await prisma.user.findMany({ take: 1 });
  console.log(`Find one user took: ${Date.now() - start}ms`);
  
  if (users.length === 0) {
    console.log("No users in DB");
    return;
  }
  
  const userId = users[0].id;
  const userRole = users[0].role;
  console.log(`Using userId: ${userId}, role: ${userRole}`);

  // Profile Booking query
  start = Date.now();
  await prisma.booking.findMany({
    where: { userId },
    include: {
      User: {
        include: {
          ResidentProfile: true,
        },
      },
      Room: {
        include: {
          Hostel: true,
        },
      },
      Payment: {
        orderBy: {
          date: 'desc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  console.log(`Booking history query took: ${Date.now() - start}ms`);

  // Profile Payment query
  start = Date.now();
  await prisma.payment.findMany({
    where: { userId },
    include: {
      User: {
        select: { name: true, email: true, phone: true }
      },
      Booking: {
        include: {
          Room: {
            include: { Hostel: true }
          }
        }
      }
    },
    orderBy: { date: 'desc' },
  });
  console.log(`Payment history query took: ${Date.now() - start}ms`);

  // Profile Complaint query
  start = Date.now();
  await prisma.complaint.findMany({
    where: { userId },
    include: {
      User_Complaint_userIdToUser: {
        select: { id: true, name: true, email: true, image: true, role: true }
      },
      Hostel: {
        select: { id: true, name: true, city: true }
      },
      User_Complaint_assignedToIdToUser: {
        select: { id: true, name: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  console.log(`Complaint history query took: ${Date.now() - start}ms`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
