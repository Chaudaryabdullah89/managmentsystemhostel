import prisma from "@/lib/prisma";
import aiPrisma from "@/lib/ai-prisma";
import { NextResponse } from "next/server";
import { stringSimilarity } from "string-similarity-js";
import { isServiceEnabled } from "@/lib/permissions";
import { requireAuth } from "@/lib/apiAuth";

/* =====================================================
   AI BRAIN CONFIGURATION
===================================================== */

const INTENTS = [
    { name: "GREETING", weight: 0.8, keywords: ["hello", "hi", "hey", "salam", "morning", "evening", "greetings"] },
    { name: "MESS", weight: 1.2, keywords: ["food", "menu", "mess", "breakfast", "lunch", "dinner", "eat", "meal", "hungry", "what is for", "serving"] },
    { name: "FINANCE", weight: 1.5, keywords: ["payment", "bill", "due", "rent", "unpaid", "money", "fee", "charges", "how much", "i owe", "balance"] },
    { name: "PAYMENT_HISTORY", weight: 1.3, keywords: ["history", "past payment", "paid before", "previous payment", "transaction history", "payment record"] },
    { name: "RECEIPT_REQUEST", weight: 1.9, keywords: ["receipt", "recipt", "payment proof", "invoice", "proof of payment", "show receipt", "download receipt", "last receipt", "voucher", "billing proof", "bill receipt", "rent receipt", "payment invoice"] },
    { name: "PAYMENT_OVERDUE", weight: 1.7, keywords: ["overdue", "late", "missed payment", "deadline", "when to pay", "last date", "fine", "penalty", "expire"] },
    { name: "REFUND", weight: 1.6, keywords: ["refund", "refund status", "money back", "return payment", "cashback", "reimbursement"] },
    { name: "ROOM", weight: 1.1, keywords: ["room", "bed", "floor", "assigned", "where is my room", "residence", "dorm", "booking", "details", "checkin", "checkout", "room info"] },
    {
        name: "SUPPORT", weight: 1.8, keywords: [
            "complaint", "issue", "problem", "repair", "broken", "fix",
            "not working", "damage", "leak", "wifi", "internet",
            "electricity", "fan", "ac", "water", "bathroom", "light",
            "dirty", "noise", "roommate", "harassment", "urgent", "asap", "immediately",
            "complain", "maintenance", "cleaning", "quality", "bad", "worst", "unhygienic", "expired"
        ]
    },
    { name: "COMPLAINT_STATUS", weight: 1.5, keywords: ["status", "check complaint", "my complaints", "pending issue", "any update"] },
    { name: "MANAGEMENT", weight: 1.0, keywords: ["manager", "warden", "admin", "contact", "office", "help desk", "management"] },
    { name: "NOTICES", weight: 1.0, keywords: ["notice", "announcement", "update", "news", "latest news", "bulletin", "recent update"] },
    { name: "RULES", weight: 1.2, keywords: ["rule", "policy", "regulation", "law", "forbidden", "allowed", "timing", "gate", "guest", "visitor", "smoke", "alcohol", "curfew", "timing"] },
    { name: "IDENTITY", weight: 0.9, keywords: ["who are you", "what can you do", "help", "feature", "assistant", "capabilities"] },
    { name: "THANKS", weight: 0.7, keywords: ["thank", "thanks", "shukriya", "jazakallah", "nice", "good job", "bye"] }
];

/* =====================================================
   TEXT PREPROCESSING
===================================================== */

function normalizeText(text: string) {
    return text.toLowerCase().replace(/[^\w\s]/g, "").trim();
}

/* =====================================================
   INTENT DETECTOR
===================================================== */

function detectIntent(message: string) {
    const msg = normalizeText(message);
    let bestIntent = { name: "UNKNOWN", score: 0 };

    for (const intent of INTENTS) {
        let score = 0;

        // Keyword detection
        for (const keyword of intent.keywords) {
            if (msg.includes(keyword)) {
                score += 2 * intent.weight; // High score for direct matches
            }
        }

        // Fuzzy matching detection
        for (const keyword of intent.keywords) {
            const similarity = stringSimilarity(msg, keyword);
            if (similarity > 0.6) {
                score += similarity * 3 * intent.weight; // Boost score for similar words
            }
        }

        if (score > bestIntent.score) {
            bestIntent = { name: intent.name, score };
        }
    }

    // Default to unknown if score is too low
    if (bestIntent.score < 0.5) {
        return { name: "UNKNOWN", score: 0 };
    }

    return bestIntent;
}

/* =====================================================
   COMPLAINT ENTITY EXTRACTION
===================================================== */

function extractComplaintDetails(message: string) {
    const msg = normalizeText(message);

    const categories = [
        { type: "ELECTRICAL", keywords: ["light", "fan", "ac", "electricity", "switch", "bulb", "socket", "power"] },
        { type: "PLUMBING", keywords: ["water", "leak", "bathroom", "pipe", "flush", "tap", "shower", "basin", "toilet"] },
        { type: "INTERNET", keywords: ["wifi", "internet", "network", "router", "password", "no internet", "connectivity"] },
        { type: "CLEANLINESS", keywords: ["dirty", "clean", "garbage", "smell", "dust", "cleaning", "sweep", "mop"] },
        { type: "MESS", keywords: ["food", "mess", "roti", "daal", "rice", "quality", "taste", "unhygienic", "bad food", "plate", "spoon", "breakfast", "lunch", "dinner"] },
        { type: "MAINTENANCE", keywords: ["bed", "cupboard", "chair", "table", "almirah", "broken furniture", "furniture", "door", "window", "lock"] },
        { type: "NOISE", keywords: ["noise", "shouting", "loud music", "disturbing", "party", "talking"] },
        { type: "SECURITY", keywords: ["lost", "theft", "gate", "guard", "safety", "illegal"] },
        { type: "BEHAVIOR", keywords: ["roommate", "fight", "harassment", "abusive", "rude", "misconduct"] },
        { type: "OTHER", keywords: [] }
    ];

    let detectedCategory = "OTHER";

    for (const cat of categories) {
        for (const keyword of cat.keywords) {
            if (msg.includes(keyword)) {
                detectedCategory = cat.type;
            }
        }
    }

    let urgency = "NORMAL";

    if (
        msg.includes("urgent") ||
        msg.includes("asap") ||
        msg.includes("immediately") ||
        msg.includes("emergency")
    ) {
        urgency = "HIGH";
    }

    return {
        category: detectedCategory,
        urgency,
        description: message
    };
}

/* ===============================
   FANCY LOGGING UTILITY
=============================== */

const logInfo = (title: string, data: any) => {
    console.log(`\x1b[44m\x1b[37m AI Assistant \x1b[0m \x1b[34m▶ ${title}\x1b[0m`, data);
};

const logBrain = (message: string) => {
    console.log(`\x1b[45m\x1b[37m AI BRAIN \x1b[0m \x1b[35m🧠 ${message}\x1b[0m`);
};

const logGemini = (title: string, data?: any) => {
    console.log(`\x1b[46m\x1b[30m GEMINI AI \x1b[0m \x1b[36m✨ ${title}\x1b[0m`, data || "");
};

/* =====================================================
   GROQ AI (Free Fallback — llama-3.1-8b-instant)
===================================================== */

async function callGroq(message: string, context: string, signal?: AbortSignal): Promise<string | null> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.includes("PASTE")) return null;

    const prompt = `You are a helpful Hostel AI Resident Assistant.
Hostel Context: ${context}
User Question: "${message}"
Give a direct, friendly, concise response (max 3 sentences). Use emojis where appropriate.`;

    try {
        console.log("\x1b[43m\x1b[30m GROQ AI \x1b[0m \x1b[33m⚡ Calling Groq fallback...\x1b[0m");
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 150,
                temperature: 0.7
            }),
            signal: signal || AbortSignal.timeout(5000)
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error("\x1b[41m\x1b[37m GROQ API ERROR \x1b[0m", errText);
            return null;
        }

        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content || null;
        console.log("\x1b[43m\x1b[30m GROQ AI \x1b[0m \x1b[33m⚡ Response Generated ✅\x1b[0m");
        return reply;
    } catch (e) {
        console.error("\x1b[41m\x1b[37m GROQ NETWORK ERROR \x1b[0m", e);
        return null;
    }
}

async function callGemini(message: string, context: string, signal?: AbortSignal): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes("PASTE")) return null;

    const prompt = `You are a helpful Hostel AI Resident Assistant.
Hostel Context: ${context}
User Question: "${message}"
Instructions: Direct, friendly answer (max 3 sentences). Use emojis where appropriate.`;

    try {
        logGemini("Calling Gemini REST API...");
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            }),
            signal: signal || AbortSignal.timeout(5000)
        });

        if (!res.ok) {
            if (res.status === 429) logGemini("⚠️ Quota exceeded → trying Groq fallback");
            return null;
        }

        const data = await res.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (e) {
        return null;
    }
}

async function callAI(message: string, context: string, history: string = "", signal?: AbortSignal): Promise<string | null> {
    const fullContext = history ? `${context}\n\nCONVERSATION HISTORY:\n${history}` : context;
    return (await callGemini(message, fullContext, signal)) ?? (await callGroq(message, fullContext, signal));
}

function detectSentiment(msg: string): string {
    const angryKeywords = ["bad", "worst", "hate", "angry", "annoying", "pathetic", "useless", "stupid", "fraud", "waste"];
    const text = msg.toLowerCase();
    if (angryKeywords.some(kw => text.includes(kw)) || msg.toUpperCase() === msg && msg.length > 5) return "FRUSTRATED";
    return "NEUTRAL";
}

export async function GET(req: Request) {
    if (!await isServiceEnabled('enableAiAssistant')) {
        return NextResponse.json({ success: false, error: "AI Assistant is currently disabled." }, { status: 503 });
    }

    // Security: require valid JWT — never trust userId from query string
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const userId = guard.user.userId || guard.user.id;

    try {
        if (!aiPrisma) return NextResponse.json({ success: true, messages: [] });

        const session = await (aiPrisma as any).aiSession.findFirst({
            where: { userId, isActive: true },
            orderBy: { updatedAt: "desc" },
            include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } }
        });

        if (!session) return NextResponse.json({ success: true, messages: [] });

        const messages = session.messages.map((m: any) => ({
            role: m.role === "AI" ? "bot" : "user",
            content: m.content
        }));

        return NextResponse.json({ success: true, messages });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    if (!await isServiceEnabled('enableAiAssistant')) {
        return NextResponse.json({ success: false, error: "AI Assistant is currently disabled." }, { status: 503 });
    }

    // Security: require valid JWT — userId from body is IGNORED
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const userId = guard.user.userId || guard.user.id;

    try {
        const { message } = await req.json();
        logInfo("Input Received", { userId, message });

        if (!message) {
            return NextResponse.json(
                { success: false, error: "Missing message field" },
                { status: 400 }
            );
        }

        /* ===============================
           LOAD BASE USER DATA (No heavy relations)
        =============================== */

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                hostelId: true
            }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        /* ===============================
           BRAIN SELF-LEARNING (Auto-Training)
        =============================== */

        // 1. Session & History Retrieval (Defensive check for Dedicated AI DB)
        let session: any = null;
        let historyStr = "";
        let sentiment = "NEUTRAL";

        try {
            if (aiPrisma && (aiPrisma as any).aiSession) {
                session = await (aiPrisma as any).aiSession.findFirst({
                    where: { userId, isActive: true },
                    orderBy: { updatedAt: 'desc' }
                });

                if (!session) {
                    session = await (aiPrisma as any).aiSession.create({
                        data: { userId, title: message.substring(0, 30) }
                    });
                }

                const pastMessages = await (aiPrisma as any).aiMessage.findMany({
                    where: { sessionId: session.id },
                    orderBy: { createdAt: 'desc' },
                    take: 4
                });

                historyStr = pastMessages
                    .reverse()
                    .map((m: any) => `${m.role}: ${m.content}`)
                    .join("\n");

                sentiment = detectSentiment(message);
            }
        } catch (sessionErr) {
            console.warn("AI Session System (aiPrisma) is partially unavailable:", sessionErr);
        }

        const normalizedMsg = normalizeText(message);

        // 2. Fetch learned patterns & admin intents
        let learnedPatterns = [];
        let dbIntents = [];
        try {
            if (aiPrisma && (aiPrisma as any).aiTraining) {
                learnedPatterns = await (aiPrisma as any).aiTraining.findMany({
                    where: { isLearned: true }
                });
            }
            if (aiPrisma && (aiPrisma as any).aiIntent) {
                dbIntents = await (aiPrisma as any).aiIntent.findMany({
                    where: { isActive: true }
                });
            }
        } catch (dbError) {
            console.error("AI Pattern Fetch Failed:", dbError);
        }

        let intent = detectIntent(message);
        let source = "Static Brain";

        // Check Admin Dynamic Intents
        for (const di of dbIntents) {
            for (const kw of di.keywords) {
                if (normalizedMsg.includes(normalizeText(kw))) {
                    intent = { name: di.name, score: 99 }; // Admin defined wins
                    source = "Admin Intent";
                    break;
                }
            }
        }

        // See if we have a learned pattern that's a better match
        for (const pattern of learnedPatterns) {
            const similarity = stringSimilarity(normalizedMsg, normalizeText(pattern.query));
            if (similarity > 0.85) {
                // If similarity is very high, override with learned intent
                intent = { name: pattern.detectedIntent || "UNKNOWN", score: similarity * 20 };
                source = "Dynamic Learning";
                break;
            }
        }

        logBrain(`Intent: ${intent.name} (Score: ${intent.score.toFixed(2)}) [Source: ${source}]`);

        // 3. Log query to Training Table & Auto-Train if confidence is extreme (Dedicated DB)
        try {
            if ((aiPrisma as any).aiTraining) {
                await (aiPrisma as any).aiTraining.upsert({
                    where: { query: normalizedMsg },
                    update: {
                        hitCount: { increment: 1 },
                        detectedIntent: intent.name,
                        confidence: intent.score,
                        isLearned: intent.score > 10 ? true : undefined
                    },
                    create: {
                        query: normalizedMsg,
                        detectedIntent: intent.name,
                        confidence: intent.score,
                        isLearned: intent.score > 10,
                        hitCount: 1
                    }
                });
            }
        } catch (e) {
            console.error("AI Training Update Failed:", e);
        }

        let reply = "";
        let suggestions: string[] = [];

        /* ===============================
           INTENT ROUTER (Lazy DB Loading)
        =============================== */

        switch (intent.name) {

            case "GREETING": {
                const unpaid = await prisma.payment.findMany({
                    where: { userId: user.id, status: "OVERDUE" }
                });
                const activeComplaints = await prisma.complaint.findMany({
                    where: { userId: user.id, status: "PENDING" }
                });

                let greeting = `Hello ${user.name.split(" ")[0]}! I'm your Hostel AI Assistant. How can I help you today?`;

                if (unpaid.length > 0) {
                    greeting += `\n\n⚠️ **Friendly Reminder:** You have **${unpaid.length} overdue bill(s)**. It's best to clear them to avoid fines.`;
                } else if (activeComplaints.length > 0) {
                    greeting += `\n\nℹ️ **Status Update:** You have **${activeComplaints.length} pending complaint(s)**. Our team is working on them!`;
                }

                reply = greeting;
                suggestions = ["Mess menu", "My bill status", "Report a problem"];
                break;
            }

            case "IDENTITY":
                reply = "I'm the Hostel Intelligence System. I can manage your mess menu, track payments, provide room details, register complaints, and show latest notices.";
                suggestions = ["What can you do?", "Who is the manager?", "Check room info"];
                break;

            case "MESS": {
                const isTomorrow = normalizedMsg.includes("tomorrow") || normalizedMsg.includes("next day");
                const dayOffset = isTomorrow ? 1 : 0;

                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + dayOffset);

                const targetDayName = targetDate
                    .toLocaleDateString("en-US", { weekday: "long" })
                    .toUpperCase();

                const hostel = user.hostelId ? await prisma.hostel.findUnique({
                    where: { id: user.hostelId },
                    include: { MessMenu: true }
                }) : null;

                const menu = hostel?.MessMenu.find((m: any) => m.dayOfWeek === targetDayName);
                const title = isTomorrow ? "Tomorrow's" : "Today's";

                if (!menu) {
                    reply = `${title} menu hasn't been uploaded yet by the management.`;
                } else {
                    reply =
                        `**${title} Menu (${targetDayName}):**\n\n` +
                        `🍳 **Breakfast:** ${menu.breakfast || 'N/A'} (${menu.breakfastTime || '7-9 AM'})\n` +
                        `🍱 **Lunch:** ${menu.lunch || 'N/A'} (${menu.lunchTime || '1-3 PM'})\n` +
                        `🍲 **Dinner:** ${menu.dinner || 'N/A'} (${menu.dinnerTime || '8-10 PM'})`;
                }
                suggestions = isTomorrow ? ["Today's menu", "Day after tomorrow"] : ["Tomorrow's menu", "Report food issue"];
                break;
            }

            case "FINANCE": {
                const allPayments = await prisma.payment.findMany({
                    where: { userId: user.id },
                    orderBy: { date: 'desc' }
                });
                const unpaid = allPayments.filter((p: any) => p.status === "PENDING");
                const overdue = allPayments.filter((p: any) => p.status === "OVERDUE");
                const paid = allPayments.filter((p: any) => p.status === "PAID");

                const totalPending = unpaid.reduce((s: number, p: any) => s + p.amount, 0);
                const totalOverdue = overdue.reduce((s: number, p: any) => s + p.amount, 0);
                const totalPaid = paid.reduce((s: number, p: any) => s + p.amount, 0);

                const now = new Date();
                const soon = unpaid.filter((p: any) => {
                    if (!p.dueDate) return false;
                    const diff = (new Date(p.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                    return diff >= 0 && diff <= 3;
                });

                if (allPayments.length === 0) {
                    reply = `💳 No payment records found for your account yet. Please contact the office if you believe this is an error.`;
                    suggestions = ["Contact manager", "My room details", "Mess menu"];
                    break;
                }

                let lines = `💰 **Your Payment Summary**\n\n`;
                lines += `✅ **Paid:** PKR ${totalPaid.toLocaleString()} (${paid.length} payment${paid.length !== 1 ? 's' : ''})\n`;

                if (overdue.length > 0) {
                    lines += `\n🚨 **OVERDUE: PKR ${totalOverdue.toLocaleString()}** — ${overdue.length} bill${overdue.length !== 1 ? 's' : ''} are past due!\n`;
                    overdue.slice(0, 2).forEach((p: any) => {
                        lines += `  → ${p.type || 'Bill'} — **PKR ${p.amount.toLocaleString()}** (Due: ${p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-PK') : 'N/A'})\n`;
                    });
                }

                if (unpaid.length > 0) {
                    lines += `\n⏳ **Pending: PKR ${totalPending.toLocaleString()}** — ${unpaid.length} bill${unpaid.length !== 1 ? 's' : ''} awaiting payment\n`;
                    unpaid.slice(0, 3).forEach((p: any) => {
                        const dueStr = p.dueDate ? `(Due: ${new Date(p.dueDate).toLocaleDateString('en-PK')})` : '';
                        lines += `  → ${p.type || 'Rent'} — **PKR ${p.amount.toLocaleString()}** ${dueStr}\n`;
                    });
                }

                if (soon.length > 0) {
                    lines += `\n⚠️ **Alert:** ${soon.length} payment${soon.length !== 1 ? 's are' : ' is'} due within 3 days! Please pay promptly to avoid penalties.`;
                }

                if (overdue.length === 0 && unpaid.length === 0) {
                    lines = `🎉 **Account Clear!** All ${paid.length} payments totaling PKR ${totalPaid.toLocaleString()} have been settled. Great job!`;
                }

                reply = lines;
                suggestions = overdue.length > 0
                    ? ["How to pay?", "Request extension", "Payment history", "Contact manager"]
                    : ["Payment history", "Mess menu", "My room", "How to pay?"];
                break;
            }

            case "PAYMENT_HISTORY": {
                const payments = await prisma.payment.findMany({
                    where: { userId: user.id },
                    orderBy: { date: 'desc' }
                });
                if (payments.length === 0) {
                    reply = "No payment records found for your account.";
                    suggestions = ["My bill", "Contact manager"];
                    break;
                }

                const recent = payments.slice(0, 5);
                let historyLines = `📋 **Payment History** (Last ${recent.length} records)\n\n`;
                recent.forEach((p: any, i: number) => {
                    const statusIcon = p.status === "PAID" ? "✅" : p.status === "OVERDUE" ? "🚨" : "⏳";
                    const dateStr = new Date(p.date || p.createdAt).toLocaleDateString('en-PK');
                    historyLines += `${i + 1}. ${statusIcon} **${p.type || 'Payment'}** — PKR ${p.amount.toLocaleString()} | ${p.status} | ${dateStr}\n`;
                    if (p.method) historyLines += `   💳 Method: ${p.method}${p.transactionId ? ` | TxID: ${p.transactionId}` : ''}\n`;
                    if (p.receiptUrl) historyLines += `   🔗 [Download Receipt](${p.receiptUrl})\n`;
                });

                const totalAll = payments.reduce((s: number, p: any) => s + p.amount, 0);
                historyLines += `\n📊 **Total Transacted:** PKR ${totalAll.toLocaleString()} across ${payments.length} records.`;

                reply = historyLines;
                suggestions = ["Current dues", "Overdue bills", "Refund status", "Management contact"];
                break;
            }

            case "RECEIPT_REQUEST": {
                const paid = await prisma.payment.findMany({
                    where: { userId: user.id, status: "PAID" },
                    orderBy: { date: 'desc' }
                });
                if (paid.length === 0) {
                    reply = "No completed payments found on your account to generate a receipt.";
                } else {
                    const last = paid[0];
                    const txId = last.transactionId || last.uid || last.id.slice(-8).toUpperCase();
                    reply = `📄 **Digital Receipt / Voucher**\n\n` +
                        `**Ref:** #${txId}\n` +
                        `**Status:** ✅ PAID\n` +
                        `**Amount:** PKR ${last.amount.toLocaleString()}\n` +
                        `**Type:** ${last.type || 'Hostel Fee'}\n` +
                        `**Date:** ${new Date(last.date || last.createdAt).toLocaleDateString('en-PK')}\n\n` +
                        (last.receiptUrl ? `🔗 **[Download Receipt/Invoice](${last.receiptUrl})**` : `ℹ️ *Official digital copy. For a physical stamped copy, please visit the hostel office.*`);
                }
                suggestions = ["Check all dues", "Payment history", "Manager info"];
                break;
            }

            case "PAYMENT_OVERDUE": {
                const allPay = await prisma.payment.findMany({
                    where: { userId: user.id },
                    orderBy: { date: 'desc' }
                });
                const overduePay = allPay.filter((p: any) => p.status === "OVERDUE");
                const pendingPay = allPay.filter((p: any) => p.status === "PENDING");

                if (overduePay.length === 0 && pendingPay.length === 0) {
                    reply = `✅ **No overdue payments!** Your account is fully cleared. Keep it up!`;
                    suggestions = ["Payment history", "Mess menu", "My room"];
                    break;
                }

                let overdueLines = ``;
                if (overduePay.length > 0) {
                    const totalOD = overduePay.reduce((s: number, p: any) => s + p.amount, 0);
                    overdueLines = `🚨 **Overdue Bills — Immediate Action Required!**\n\n`;
                    overdueLines += `You have **${overduePay.length} overdue bill${overduePay.length !== 1 ? 's' : ''}** totaling **PKR ${totalOD.toLocaleString()}**.\n\n`;
                    overduePay.forEach((p: any, i: number) => {
                        const daysLate = p.dueDate
                            ? Math.floor((new Date().getTime() - new Date(p.dueDate).getTime()) / (1000 * 60 * 60 * 24))
                            : null;
                        overdueLines += `${i + 1}. 🔴 **${p.type || 'Bill'}** — PKR ${p.amount.toLocaleString()}`;
                        if (daysLate !== null && daysLate > 0) overdueLines += ` *(${daysLate} day${daysLate !== 1 ? 's' : ''} late)*`;
                        overdueLines += `\n`;
                    });
                    overdueLines += `\n⚡ Please contact the office immediately or pay online to avoid further penalties.`;
                } else {
                    const now = new Date();
                    const upcoming = pendingPay
                        .filter((p: any) => p.dueDate)
                        .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

                    if (upcoming.length > 0) {
                        const next = upcoming[0];
                        const nextDueDate = next.dueDate as Date;
                        const daysLeft = Math.ceil((new Date(nextDueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        overdueLines = `⏰ **Upcoming Deadline**\n\nYour next payment of **PKR ${next.amount.toLocaleString()}** (${next.type || 'Rent'}) is due in **${daysLeft} day${daysLeft !== 1 ? 's' : ''}** on ${new Date(nextDueDate).toLocaleDateString('en-PK')}.\n\n✅ No overdue payments currently. Pay on time to keep your record clean!`;
                    } else {
                        overdueLines = `⏳ You have ${pendingPay.length} pending bill${pendingPay.length !== 1 ? 's' : ''} but no overdue dates set yet. Please check with the office.`;
                    }
                }

                reply = overdueLines;
                suggestions = ["How to pay?", "Contact manager", "Payment history", "Request extension"];
                break;
            }

            case "REFUND": {
                const refunds = await prisma.refundRequest.findMany({
                    where: { userId: user.id },
                    orderBy: { createdAt: "desc" },
                    take: 5
                });
                if (refunds.length === 0) {
                    reply = `ℹ️ You have **no active refund requests** on your account.\n\nIf you believe you're owed a refund, please contact the manager or visit the hostel office with your payment receipt.`;
                    suggestions = ["Contact manager", "Payment history", "My bill"];
                } else {
                    let refundLines = `💸 **Your Refund Requests** (${refunds.length} total)\n\n`;
                    refunds.forEach((r: any, i: number) => {
                        const statusIcon = r.status === "APPROVED" ? "✅" : r.status === "REJECTED" ? "❌" : "⏳";
                        refundLines += `${i + 1}. ${statusIcon} **PKR ${r.amount.toLocaleString()}** — Status: **${r.status}**\n`;
                        if (r.reason) refundLines += `   Reason: ${r.reason}\n`;
                        refundLines += `   📅 Filed: ${new Date(r.createdAt).toLocaleDateString('en-PK')}\n`;
                    });

                    const approved = refunds.filter((r: any) => r.status === "APPROVED");
                    if (approved.length > 0) {
                        const total = approved.reduce((s: number, r: any) => s + r.amount, 0);
                        refundLines += `\n✅ **Approved Refunds:** PKR ${total.toLocaleString()} — Contact the office for collection.`;
                    }
                    reply = refundLines;
                }
                suggestions = ["Payment history", "Contact manager", "My bill", "Lodge complaint"];
                break;
            }

            case "ROOM": {
                const activeBooking = await prisma.booking.findFirst({
                    where: {
                        userId: user.id,
                        status: { in: ["CONFIRMED", "CHECKED_IN"] }
                    },
                    include: { Room: { include: { Hostel: true } } }
                });

                if (!activeBooking) {
                    reply = "I couldn't find any active residence record for your account.";
                } else {
                    const room = activeBooking.Room;
                    const checkInDate = new Date(activeBooking.checkIn).toLocaleDateString();
                    const checkOutDate = activeBooking.checkOut ? new Date(activeBooking.checkOut).toLocaleDateString() : "Ongoing";

                    reply =
                        `🏡 **Your Residence Details**\n\n` +
                        `📍 **Room:** ${room.roomNumber}\n` +
                        `🏢 **Floor:** ${room.floor}\n` +
                        `🛏️ **Type:** ${room.type || 'Standard'}\n` +
                        `📅 **Staying:** ${checkInDate} — ${checkOutDate}\n` +
                        `✅ **Booking Status:** ${activeBooking.status}`;
                }
                suggestions = ["Roommate details", "Request room change", "Report room issue"];
                break;
            }

            case "SUPPORT": {
                const complaintData = extractComplaintDetails(message);
                const msg = normalizeText(message);

                const genericTriggers = ["complaint", "issue", "problem", "complain", "support", "help", "report", "register", "hi", "hey"];
                const isGeneric = genericTriggers.includes(msg) || (complaintData.category === "OTHER" && message.split(" ").length < 4);

                if (isGeneric) {
                    reply = "I'm ready to help you file a complaint. **What exactly is the problem?**\n\nPlease describe the issue so I can notify the right team (e.g., 'fan in room 2 is slow', 'bathroom tap is leaking', 'wifi not connecting').";
                    suggestions = ["Fan not working", "WiFi issue", "Bathroom leak", "Mess food quality"];
                    break;
                }

                const existingComplaint = await prisma.complaint.findFirst({
                    where: {
                        userId: user.id,
                        status: { in: ["PENDING", "IN_PROGRESS", "RESOLVED"] },
                        category: complaintData.category as any
                    }
                });

                if (existingComplaint && !message.toLowerCase().includes("new")) {
                    reply =
                        `You already have an active **${complaintData.category}** complaint.\n\n` +
                        `📝 **Title:** ${existingComplaint.title}\n` +
                        `⏳ **Status:** ${existingComplaint.status}\n\n` +
                        `I've notified the system about your follow-up. Would you like to create a *new* complaint instead?`;
                    suggestions = ["Create new complaint", "Check all complaints", "Talk to manager"];
                    break;
                }

                if (!await isServiceEnabled('enableComplaintsSystem')) {
                    reply = "I'm sorry, but the complaint registration system is currently disabled by the administrator. Please contact the office directly for urgent matters.";
                    suggestions = ["Talk to manager", "Check room info", "Mess menu"];
                    break;
                }

                const newComplaint = await prisma.complaint.create({
                    data: {
                        userId: user.id,
                        hostelId: user.hostelId as string,
                        title: `${complaintData.category} Issue`,
                        description: message,
                        category: complaintData.category as any,
                        priority: complaintData.urgency === "HIGH" ? "HIGH" : "MEDIUM",
                        status: "PENDING"
                    }
                });

                reply =
                    `🚀 **Complaint Registered Successfully!**\n\n` +
                    `Category: **${complaintData.category}**\n` +
                    `Priority: **${complaintData.urgency === "HIGH" ? "HIGH" : "MEDIUM"}**\n` +
                    `Status: **${newComplaint.status}**\n\n` +
                    `The maintenance team has been notified and will address this shortly.`;
                suggestions = ["Check status", "Report another issue", "Thank you"];
                break;
            }

            case "NOTICES": {
                const notices = user.hostelId ? await prisma.notice.findMany({
                    where: { hostelId: user.hostelId, isActive: true },
                    orderBy: { createdAt: "desc" },
                    take: 5
                }) : [];

                if (notices.length === 0) {
                    reply = "There are no new announcements or notices from the management at the moment.";
                } else {
                    reply =
                        `📢 **Latest Notice:**\n\n` +
                        `**${notices[0].title}**\n\n` +
                        `${notices[0].content}`;
                }
                suggestions = ["Old notices", "Mess menu", "Rules & Regulations"];
                break;
            }

            case "COMPLAINT_STATUS": {
                const complaints = await prisma.complaint.findMany({
                    where: { userId: user.id }
                });
                if (!complaints || complaints.length === 0) {
                    reply = "You don't have any registered complaints in our records.";
                    suggestions = ["Report a problem", "Management contact"];
                } else {
                    const activeOnes = complaints.filter((c: any) => c.status !== "RESOLVED");
                    if (activeOnes.length === 0) {
                        reply = `You have **${complaints.length}** resolved complaints. Everything looks ship-shape!`;
                    } else {
                        const list = activeOnes.slice(0, 3).map((c: any) => `• **${c.category}**: ${c.status}`).join("\n");
                        reply = `You have **${activeOnes.length} active complaints**.\n\n${list}\n\nOur team is working on them.`;
                    }
                    suggestions = ["Report a problem", "Manager info", "Mess menu"];
                }
                break;
            }

            case "RULES": {
                reply =
                    `📝 **Hostel Rules & Regulations:**\n\n` +
                    `1. **Gate Timings:** Main gate closes at **11:00 PM**.\n` +
                    `2. **Visitors:** Not allowed inside rooms after **8:00 PM**.\n` +
                    `3. **Smoking/Alcohol:** Strictly prohibited within the premises.\n` +
                    `4. **Silence Hours:** Please maintain silence after **11:30 PM**.\n\n` +
                    `For a full list of rules, please visit the office.`;
                suggestions = ["Gate timings", "Visitor policy", "Manager contact"];
                break;
            }

            case "MANAGEMENT": {
                const hostel = user.hostelId ? await prisma.hostel.findUnique({
                    where: { id: user.hostelId },
                    include: { User_Hostel_managerIdToUser: true }
                }) : null;
                const manager = hostel?.User_Hostel_managerIdToUser;

                if (!manager) {
                    reply = "Manager contact details are currently not available in our system.";
                } else {
                    reply =
                        `📍 **Management Contact:**\n\n` +
                        `👤 **Manager:** ${manager.name}\n` +
                        `📞 **Phone:** ${manager.phone}\n` +
                        `✉️ **Email:** ${manager.email || 'N/A'}\n\n` +
                        `Office hours: **9:00 AM - 6:00 PM** (Mon-Sat).`;
                }
                suggestions = ["Office hours", "Emergency contact", "Report issue"];
                break;
            }

            case "THANKS":
                reply = "You're very welcome! Is there anything else I can help you with?";
                suggestions = ["Mess menu", "Room details", "Bye"];
                break;

            default:
                reply = "I didn't quite catch that. You can ask me about the **mess menu**, **unpaid bills**, **room details**, or **register a complaint**.";
                suggestions = ["Mess menu", "My bill", "Report a problem", "Latest notice"];
        }

        // 4. Gemini Enhancement (If reply is still generic or unknown)
        if (intent.name === "UNKNOWN" || reply === "") {
            const unpaidContext = await prisma.payment.findMany({
                where: { userId: user.id, status: { not: "PAID" } }
            });
            const recentPaidContext = await prisma.payment.findMany({
                where: { userId: user.id, status: "PAID" },
                orderBy: { date: "desc" },
                take: 3
            });
            const activeBooking = await prisma.booking.findFirst({
                where: { userId: user.id, status: { in: ["CONFIRMED", "CHECKED_IN"] } },
                include: { Room: true }
            });
            const hostel = user.hostelId ? await prisma.hostel.findUnique({
                where: { id: user.hostelId },
                include: {
                    User_Hostel_managerIdToUser: true,
                    Notice: { where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 1 }
                }
            }) : null;

            const contextStr = `
                User Name: ${user.name}
                Hostel Name: ${hostel?.name || 'Our Hostel'}
                Room: ${activeBooking?.Room?.roomNumber || 'Not assigned'}
                Manager: ${hostel?.User_Hostel_managerIdToUser?.name || 'Hostel Staff'}
                
                FINANCIAL STATUS:
                - Unpaid Bills: ${unpaidContext.length} (Total: PKR ${unpaidContext.reduce((s: number, p: any) => s + p.amount, 0)})
                - Recent Receipts: ${recentPaidContext.map((p: any) => `${p.type} on ${new Date(p.date || p.createdAt).toLocaleDateString()}: ${p.receiptUrl || 'No link'}`).join("; ")}
                
                Recent Notice: ${hostel?.Notice?.[0]?.title || 'Stay tuned for updates'}
                
                Instructions: If user asks for a receipt, provide the specific link from 'Recent Receipts' metadata if it exists.
            `;
            const aiReply = await callAI(message, contextStr, historyStr);
            if (aiReply) {
                reply = aiReply;
                source = "AI Engine (Gemini/Groq)";
                if (sentiment === "FRUSTRATED") {
                    reply = "I understand your frustration. " + reply;
                }
            }
        }

        // 5. Save Interaction to History (Only if session exists)
        if (session) {
            try {
                if ((aiPrisma as any).aiMessage) {
                    await (aiPrisma as any).aiMessage.createMany({
                        data: [
                            { sessionId: session.id, role: "USER", content: message, intent: intent.name, score: intent.score, sentiment },
                            { sessionId: session.id, role: "AI", content: reply, intent: intent.name }
                        ]
                    });
                }
                if ((aiPrisma as any).aiSession) {
                    await (aiPrisma as any).aiSession.update({
                        where: { id: session.id },
                        data: { updatedAt: new Date() }
                    });
                }
            } catch (saveError) {
                console.error("AI Memory Save Failed:", saveError);
            }
        }

        logInfo("Final Response", { intent: intent.name, source, suggestionCount: suggestions.length });
        return NextResponse.json({ success: true, reply, suggestions });

    } catch (error: any) {
        console.error("\x1b[41m\x1b[37m CRITICAL AI ERROR \x1b[0m", error);
        return NextResponse.json(
            { success: false, error: "AI system failure" },
            { status: 500 }
        );
    }
}