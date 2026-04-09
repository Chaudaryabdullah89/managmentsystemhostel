import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  console.log('Fields in SystemSettings model headers:')
  const settings = await prisma.systemSettings.findFirst()
  console.log('Settings:', settings)
  await prisma.$disconnect()
}

main()
