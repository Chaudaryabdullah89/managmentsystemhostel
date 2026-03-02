
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
    console.log('Starting migration of Expense categories (using standard Prisma updateMany)...');

    const mappings = {
        'UTILITIES': 'UTILITY_BILL',
        'MAINTENANCE': 'MAINTENANCE',
        'SALARIES': 'SALARY',
        'SUPPLIES': 'GENERAL',
        'GROCERIES': 'MESS',
        'OTHER': 'GENERAL'
    };

    for (const [oldCat, newCat] of Object.entries(mappings)) {
        try {
            const result = await prisma.expense.updateMany({
                where: { category: oldCat },
                data: { category: newCat }
            });
            console.log(`Migrated ${result.count} records from ${oldCat} to ${newCat}`);
        } catch (err) {
            console.error(`Failed to migrate ${oldCat}:`, err.message);
        }
    }

    console.log('Migration complete.');
}

migrate()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
