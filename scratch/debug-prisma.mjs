import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    const record = await prisma.resetPassword.findFirst()
    console.log('Query succeeded! Found record:', record)
  } catch (err) {
    console.error('Error querying maintenance:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()


