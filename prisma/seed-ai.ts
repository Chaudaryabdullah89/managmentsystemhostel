
import { PrismaClient as AiPrisma } from '../node_modules/@prisma/ai-client';
const aiPrisma = new AiPrisma();

async function train() {
    const trainingData = [
        // Receipts
        { query: "i want my receipt", detectedIntent: "RECEIPT_REQUEST", confidence: 15, isLearned: true },
        { query: "show me last payment receipt", detectedIntent: "RECEIPT_REQUEST", confidence: 15, isLearned: true },
        { query: "download my rent receipt", detectedIntent: "RECEIPT_REQUEST", confidence: 15, isLearned: true },
        { query: "invoice of last month", detectedIntent: "RECEIPT_REQUEST", confidence: 15, isLearned: true },
        { query: "send me my bill proof", detectedIntent: "RECEIPT_REQUEST", confidence: 15, isLearned: true },
        { query: "where is my voucher", detectedIntent: "RECEIPT_REQUEST", confidence: 15, isLearned: true },
        { query: "get my payment invoice", detectedIntent: "RECEIPT_REQUEST", confidence: 15, isLearned: true },

        // Mess
        { query: "what is for lunch today", detectedIntent: "MESS", confidence: 10, isLearned: true },
        { query: "tomorrow breakfast menu", detectedIntent: "MESS", confidence: 10, isLearned: true },
        { query: "hungry what is for dinner", detectedIntent: "MESS", confidence: 10, isLearned: true },
        { query: "is today's mess menu uploaded", detectedIntent: "MESS", confidence: 10, isLearned: true },
        { query: "what time is lunch served", detectedIntent: "MESS", confidence: 10, isLearned: true },

        // Complaints
        { query: "my fan is slow fix it", detectedIntent: "SUPPORT", confidence: 12, isLearned: true },
        { query: "wifi is not connecting in my room", detectedIntent: "SUPPORT", confidence: 12, isLearned: true },
        { query: "bathroom tap is leaking", detectedIntent: "SUPPORT", confidence: 12, isLearned: true },
        { query: "report a broken bed", detectedIntent: "SUPPORT", confidence: 12, isLearned: true },
        { query: "my room has no electricity", detectedIntent: "SUPPORT", confidence: 12, isLearned: true },
        { query: "quality of food is bad", detectedIntent: "SUPPORT", confidence: 12, isLearned: true },
        { query: "the water in the washroom is cold", detectedIntent: "SUPPORT", confidence: 12, isLearned: true },
        { query: "my cupboard lock is broken", detectedIntent: "SUPPORT", confidence: 12, isLearned: true },
        { query: "the room floor is dirty", detectedIntent: "SUPPORT", confidence: 12, isLearned: true },
        { query: "i paid but my status is still unpaid", detectedIntent: "SUPPORT", confidence: 12, isLearned: true },
        { query: "request room cleaning", detectedIntent: "SUPPORT", confidence: 12, isLearned: true },
        { query: "internet is slow", detectedIntent: "SUPPORT", confidence: 12, isLearned: true },
        { query: "broken door lock", detectedIntent: "SUPPORT", confidence: 12, isLearned: true },

        // Room
        { query: "when will the room be cleaned", detectedIntent: "ROOM", confidence: 11, isLearned: true },
        { query: "laundry timing for room", detectedIntent: "ROOM", confidence: 11, isLearned: true },

        // Finance
        { query: "how much is my total due", detectedIntent: "FINANCE", confidence: 11, isLearned: true },
        { query: "do i have any pending bills", detectedIntent: "FINANCE", confidence: 11, isLearned: true },
        { query: "my rent status", detectedIntent: "FINANCE", confidence: 11, isLearned: true },
        { query: "when is my next payment due", detectedIntent: "PAYMENT_OVERDUE", confidence: 14, isLearned: true },
        { query: "show my payment history", detectedIntent: "PAYMENT_HISTORY", confidence: 11, isLearned: true },

        // Rules
        { query: "what is the gate closing time", detectedIntent: "RULES", confidence: 13, isLearned: true },
        { query: "can i bring a friend to my room", detectedIntent: "RULES", confidence: 13, isLearned: true },
        { query: "visitor policy of hostel", detectedIntent: "RULES", confidence: 13, isLearned: true },
        { query: "is smoking allowed", detectedIntent: "RULES", confidence: 13, isLearned: true },
        { query: "curfew timings", detectedIntent: "RULES", confidence: 13, isLearned: true },

        // Management
        { query: "give me manager contact number", detectedIntent: "MANAGEMENT", confidence: 12, isLearned: true },
        { query: "where is the warden office", detectedIntent: "MANAGEMENT", confidence: 12, isLearned: true },
        { query: "i want to talk to admin", detectedIntent: "MANAGEMENT", confidence: 12, isLearned: true },

        // Identity
        { query: "who are you", detectedIntent: "IDENTITY", confidence: 10, isLearned: true },
        { query: "what can you do for me", detectedIntent: "IDENTITY", confidence: 10, isLearned: true },
        { query: "help me with my booking", detectedIntent: "IDENTITY", confidence: 10, isLearned: true },
        { query: "is this ai assistant or human", detectedIntent: "IDENTITY", confidence: 10, isLearned: true },
    ];

    for (const data of trainingData) {
        await aiPrisma.aiTraining.upsert({
            where: { query: data.query },
            update: data,
            create: data,
        });
    }
    console.log("AI Comprehensive Training completed!");
}

train().finally(() => aiPrisma.$disconnect());
