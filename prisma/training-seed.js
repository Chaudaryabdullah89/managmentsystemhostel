const { PrismaClient } = require('../node_modules/@prisma/ai-client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.AI_DATABASE_URL
        }
    }
});

async function seed() {
    const trainingData = [
        // Mess & Food
        { query: "mess food quality is very bad", detectedIntent: "SUPPORT", isLearned: true, confidence: 15 },
        { query: "i want to complain about the food", detectedIntent: "SUPPORT", isLearned: true, confidence: 15 },
        { query: "wifi is not working in my room", detectedIntent: "SUPPORT", isLearned: true, confidence: 15 },
        { query: "bathroom is dirty", detectedIntent: "SUPPORT", isLearned: true, confidence: 15 },
        { query: "show me tomorrow menu", detectedIntent: "MESS", isLearned: true, confidence: 15 },
        { query: "who is the hostel manager and his phone number", detectedIntent: "MANAGEMENT", isLearned: true, confidence: 15 },
        { query: "what are the hostel rules", detectedIntent: "RULES", isLearned: true, confidence: 15 },
        { query: "when does the gate close", detectedIntent: "RULES", isLearned: true, confidence: 15 },

        // Finance — current dues
        { query: "how much is my current due", detectedIntent: "FINANCE", isLearned: true, confidence: 15 },
        { query: "what is my total bill", detectedIntent: "FINANCE", isLearned: true, confidence: 15 },
        { query: "how much do i owe", detectedIntent: "FINANCE", isLearned: true, confidence: 15 },
        { query: "show my unpaid bills", detectedIntent: "FINANCE", isLearned: true, confidence: 15 },
        { query: "check my balance", detectedIntent: "FINANCE", isLearned: true, confidence: 15 },
        { query: "what fees are pending", detectedIntent: "FINANCE", isLearned: true, confidence: 15 },

        // Payment History
        { query: "show my payment history", detectedIntent: "PAYMENT_HISTORY", isLearned: true, confidence: 15 },
        { query: "past payments", detectedIntent: "PAYMENT_HISTORY", isLearned: true, confidence: 15 },
        { query: "when did i last pay", detectedIntent: "PAYMENT_HISTORY", isLearned: true, confidence: 15 },
        { query: "show transaction history", detectedIntent: "PAYMENT_HISTORY", isLearned: true, confidence: 15 },
        { query: "i need my receipt", detectedIntent: "PAYMENT_HISTORY", isLearned: true, confidence: 15 },
        { query: "download invoice", detectedIntent: "PAYMENT_HISTORY", isLearned: true, confidence: 15 },

        // Overdue
        { query: "i have overdue payment", detectedIntent: "PAYMENT_OVERDUE", isLearned: true, confidence: 15 },
        { query: "my payment is late", detectedIntent: "PAYMENT_OVERDUE", isLearned: true, confidence: 15 },
        { query: "when is my payment due", detectedIntent: "PAYMENT_OVERDUE", isLearned: true, confidence: 15 },
        { query: "last date for rent payment", detectedIntent: "PAYMENT_OVERDUE", isLearned: true, confidence: 15 },
        { query: "will there be a fine for late payment", detectedIntent: "PAYMENT_OVERDUE", isLearned: true, confidence: 15 },
        { query: "is my rent overdue", detectedIntent: "PAYMENT_OVERDUE", isLearned: true, confidence: 15 },

        // Refund
        { query: "i want a refund", detectedIntent: "REFUND", isLearned: true, confidence: 15 },
        { query: "check my refund status", detectedIntent: "REFUND", isLearned: true, confidence: 15 },
        { query: "when will i get my money back", detectedIntent: "REFUND", isLearned: true, confidence: 15 },
        { query: "refund request status", detectedIntent: "REFUND", isLearned: true, confidence: 15 },
        { query: "my security deposit refund", detectedIntent: "REFUND", isLearned: true, confidence: 15 },
    ];

    console.log("Seeding AI Training Data...");

    for (const item of trainingData) {
        await prisma.aiTraining.upsert({
            where: { query: item.query },
            update: item,
            create: item,
        });
    }

    console.log("AI Training Data Seeded successfully!");
}

seed()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
