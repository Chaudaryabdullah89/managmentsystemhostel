require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      email: "mabdullah004560@gmail.com"
    }
  });

  if (!user) {
    console.log("User mabdullah004560@gmail.com NOT found in database.");
    // Let's print all users
    const all = await prisma.user.findMany({
      select: { email: true, name: true }
    });
    console.log("Existing users in database:", all);
    return;
  }

  console.log("Found user:", user);
  const isMatch = await bcrypt.compare("12345678", user.password);
  console.log("Does password '12345678' match hash?", isMatch);
}

main().catch(console.error).finally(() => prisma.$disconnect());
