import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const list = await prisma.payment.findUnique({ 
        where: { id: '26605dd2-f730-4f31-966b-401061d930c9' } 
    })
    console.log(list)
  } catch(e) { console.error(e) }
  finally { await prisma.$disconnect() }
}
main()
