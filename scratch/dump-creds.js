const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const creds = await prisma.webAuthnCredential.findMany({
    select: {
      id: true,
      deviceName: true,
      credentialId: true,
      userId: true,
      User: { select: { email: true } }
    }
  });
  console.log(JSON.stringify(creds, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
