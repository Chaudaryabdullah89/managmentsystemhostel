import prisma from "@/lib/prisma";
import aiPrisma from "@/lib/ai-prisma";
import { NextResponse } from "next/server";
import { stringSimilarity } from "string-similarity-js";
import { isServiceEnabled, getSystemSettings } from "@/lib/permissions";
import { requireAuth } from "@/lib/apiAuth";
import { getRelevantContext } from "@/lib/ragContext";
import { buildPretrainedPrompt, buildGroqMessages, PromptBuildParams } from "@/lib/aiPromptEngine";
import { buildConversationMemory } from "@/lib/aiMemory";
import {
    toolFileComplaint,
    toolFetchMessMenu,
    toolFetchUserRentStatus,
    toolFetchRoomDetails,
    toolFetchAdminMetrics,
    toolFetchManagerInfo,
    toolFetchLastReceipt,
    toolPollTicketStatus,
    toolNaturalLanguageAnalytics
} from "@/lib/aiTools";

/* =====================================================
   AI BRAIN CONFIGURATION
===================================================== */

const INTENTS = [
    { name: "CASUAL", weight: 1.0, keywords: ["how are you", "how r u", "how are u", "how are you doing", "kaise ho", "kya haal", "kya haal hai", "wassup", "whats up", "what's up", "sub khairiyat", "kaise ho bro", "kaise ho bhai"] },
    { name: "HELP_HUB", weight: 1.8, keywords: ["help", "options", "features", "what can you do", "show menu", "quick options", "services", "menu options", "capabilities", "suggestions", "vast options"] },
    { name: "GREETING", weight: 0.8, keywords: ["hello", "hi", "hey", "salam", "morning", "evening", "greetings"] },
    { name: "MESS", weight: 1.2, keywords: ["food", "menu", "mess", "breakfast", "lunch", "dinner", "eat", "meal", "hungry", "what is for", "serving", "khana", "nashta", "roti", "daal", "chawal"] },
    { name: "FINANCE", weight: 1.5, keywords: ["payment", "bill", "due", "rent", "unpaid", "money", "fee", "charges", "how much", "i owe", "balance", "paisa", "paise", "baza"] },
    { name: "PAYMENT_HISTORY", weight: 1.3, keywords: ["history", "past payment", "paid before", "previous payment", "transaction history", "payment record"] },
    { name: "RECEIPT_REQUEST", weight: 1.9, keywords: ["receipt", "recipt", "payment proof", "invoice", "proof of payment", "show receipt", "download receipt", "last receipt", "voucher", "billing proof", "bill receipt", "rent receipt", "payment invoice", "download last receipt"] },
    { name: "PAYMENT_OVERDUE", weight: 1.7, keywords: ["overdue", "late", "missed payment", "deadline", "when to pay", "last date", "fine", "penalty", "expire"] },
    { name: "REFUND", weight: 1.6, keywords: ["refund", "refund status", "money back", "return payment", "cashback", "reimbursement"] },
    { name: "ROOM", weight: 1.1, keywords: ["room", "bed", "floor", "assigned", "where is my room", "residence", "dorm", "booking", "details", "checkin", "checkout", "room info", "kamra"] },
    {
        name: "SUPPORT", weight: 1.8, keywords: [
            "complaint", "issue", "problem", "repair", "broken", "fix",
            "not working", "damage", "leak", "wifi", "internet",
            "electricity", "fan", "ac", "water", "bathroom", "light",
            "dirty", "noise", "roommate", "harassment", "urgent", "asap", "immediately",
            "complain", "maintenance", "cleaning", "quality", "bad", "worst", "unhygienic", "expired",
            "shikayat", "masla", "kharaab", "kharab", "bijli", "paani"
        ]
    },
    { name: "COMPLAINT_STATUS", weight: 1.5, keywords: ["status", "check complaint", "my complaints", "pending issue", "any update"] },
    { name: "MANAGEMENT", weight: 1.8, keywords: ["manager", "warden", "admin", "contact", "office", "help desk", "management", "call manager", "manager connect", "phone number", "whatsapp"] },
    { name: "ANALYTICS", weight: 1.8, keywords: ["analytics", "metrics", "occupancy", "revenue", "stats", "performance", "total collection", "hostel status", "report"] },
    { name: "NOTICES", weight: 1.0, keywords: ["notice", "announcement", "update", "news", "latest news", "bulletin", "recent update", "show hostel notices"] },
    { name: "LEAVE_GATEPASS", weight: 1.9, keywords: ["leave", "gate pass", "gatepass", "night out", "weekend leave", "how to apply leave", "outpass"] },
    { name: "ROOM_SWAP", weight: 1.9, keywords: ["swap", "room swap", "change room", "how to swap room", "switch room", "room transfer"] },
    { name: "HOUSEKEEPING", weight: 1.7, keywords: ["cleaning", "housekeeping", "clean room", "check cleaning log", "sweep", "mop"] },
    { name: "LAUNDRY", weight: 1.7, keywords: ["laundry", "wash", "washing", "clothes", "dry clean", "check laundry status", "laundry status"] },
    { name: "EMERGENCY", weight: 2.0, keywords: ["emergency", "panic", "urgent help", "danger", "security alert", "help desk call", "emergency help"] },
    { name: "RULES", weight: 1.2, keywords: ["rule", "policy", "regulation", "law", "forbidden", "allowed", "timing", "gate", "guest", "visitor", "smoke", "alcohol", "curfew", "timing"] },
    { name: "IDENTITY", weight: 0.9, keywords: ["who are you", "what can you do", "help", "feature", "assistant", "capabilities"] },
    { name: "THANKS", weight: 0.7, keywords: ["thank", "thanks", "shukriya", "jazakallah", "nice", "good job", "bye"] },
    { name: "TICKET_POLL", weight: 2.0, keywords: ["any update", "update on complaint", "update on issue", "what happened", "complaint update", "ticket update", "resolved yet", "still pending", "koi update", "masla theek", "complaint ka kya hua", "issue fix", "update on my", "meri request", "request ka kya", "request ka kiabana", "kiabana", "kya bana", "kya hua", "status of my", "my request"] }
];


function normalizeText(text: string) {
    return text.toLowerCase().replace(/[^\w\s]/g, "").trim();
}

function detectIntent(message: string) {
    const msg = normalizeText(message);
    let bestIntent = { name: "UNKNOWN", score: 0 };

    for (const intent of INTENTS) {
        let score = 0;
        for (const keyword of intent.keywords) {
            if (msg.includes(keyword)) {
                score += 2 * intent.weight;
            }
        }
        for (const keyword of intent.keywords) {
            const similarity = stringSimilarity(msg, keyword);
            if (similarity > 0.6) {
                score += similarity * 3 * intent.weight;
            }
        }
        if (score > bestIntent.score) {
            bestIntent = { name: intent.name, score };
        }
    }

    if (bestIntent.score < 0.5) {
        return { name: "UNKNOWN", score: 0 };
    }
    return bestIntent;
}

async function classifyIntentWithAI(user: any, message: string): Promise<string> {
    try {
        const classificationPrompt = `Classify the user message into ONE of these exact intent codes:
- SUPPORT (if user wants to log a complaint, report an issue, fix something, repair, maintenance, shikayat, masla, comlain)
- COMPLAINT_STATUS (if user asks about existing complaints, my tickets, status of issue)
- MESS (if user asks about food, mess menu, meal timings, breakfast, lunch, dinner)
- RECEIPT_REQUEST (if user wants to download receipt, payment voucher, billing proof)
- FINANCE (if user asks about rent dues, unpaid balance, fee)
- ROOM (if user asks about assigned room, roommate, beds)
- LEAVE_GATEPASS (if user asks about leave application, gate pass, night out)
- ROOM_SWAP (if user asks to change or swap room)
- HOUSEKEEPING (if user asks about room cleaning or housekeeping)
- LAUNDRY (if user asks about laundry cycles or clothes washing)
- EMERGENCY (if user asks for urgent help, security alert, emergency desk)
- NOTICES (if user asks about announcements, hostel news, notices)
- RULES (if user asks about hostel policies, gate timings, curfew)
- MANAGEMENT (if user asks for warden contact, manager phone, office whatsapp)
- GREETING (if user says hello, hi, how are you, casual greeting)

User Message: "${message}"

Respond ONLY with JSON: {"intent": "INTENT_CODE"}`;

        const aiResponse = await callAI(user, classificationPrompt, "", "");
        if (aiResponse) {
            const match = aiResponse.match(/\{[\s\S]*?\}/);
            if (match) {
                const parsed = JSON.parse(match[0]);
                if (parsed.intent && parsed.intent !== "UNKNOWN") {
                    return parsed.intent;
                }
            }
        }
    } catch (err) {
        console.error("AI Intent Classification Fallback Error:", err);
    }
    return "UNKNOWN";
}

function isStatusQuery(message: string): boolean {
    const msg = normalizeText(message);
    const statusIndicators = [
        "update", "status", "check", "kya bana", "kiabana", "kia bana",
        "kya hua", "progress", "resolved", "pending", "what happened",
        "my complaints", "my ticket", "my tickets", "check complaint",
        "about my complaint", "about my complaints", "complaint update",
        "ticket update", "shikayat ka kya", "status of"
    ];

    for (const indicator of statusIndicators) {
        if (msg.includes(indicator)) return true;
    }

    if (msg.includes("requeset") || msg.includes("request")) return true;

    return false;
}

function isComplaintQuery(message: string): boolean {
    // Status/update check queries must NEVER be treated as new complaint submissions!
    if (isStatusQuery(message)) return false;

    const msg = normalizeText(message);
    const complaintKeywords = [
        "complain", "comlain", "compain", "complaint", "complint",
        "shikayat", "shikayt", "masla", "issue", "problem", "problm",
        "repair", "broken", "fix", "kharaab", "kharab"
    ];
    for (const kw of complaintKeywords) {
        if (msg.includes(kw)) return true;
    }
    const words = msg.split(/\s+/);
    for (const word of words) {
        if (word.length >= 4) {
            if (stringSimilarity(word, "complain") > 0.65 || stringSimilarity(word, "complaint") > 0.65 || stringSimilarity(word, "shikayat") > 0.65) {
                return true;
            }
        }
    }
    return false;
}

function extractComplaintDetails(message: string) {
    const msg = normalizeText(message);

    const categories = [
        { type: "ELECTRICAL", keywords: ["light", "fan", "ac", "electricity", "switch", "bulb", "socket", "power", "bijli"] },
        { type: "PLUMBING", keywords: ["water", "leak", "bathroom", "pipe", "flush", "tap", "shower", "basin", "toilet", "paani"] },
        { type: "INTERNET", keywords: ["wifi", "internet", "network", "router", "password", "no internet", "connectivity"] },
        { type: "CLEANLINESS", keywords: ["dirty", "clean", "garbage", "smell", "dust", "cleaning", "sweep", "mop"] },
        { type: "MESS", keywords: ["food", "mess", "roti", "daal", "rice", "quality", "taste", "unhygienic", "bad food", "plate", "spoon", "breakfast", "lunch", "dinner", "khana"] },
        { type: "MAINTENANCE", keywords: ["bed", "cupboard", "chair", "table", "almirah", "broken furniture", "furniture", "door", "window", "lock"] },
        { type: "NOISE", keywords: ["noise", "shouting", "loud music", "disturbing", "party", "talking"] },
        { type: "SECURITY", keywords: ["lost", "theft", "gate", "guard", "safety", "illegal"] },
        { type: "BEHAVIOR", keywords: ["roommate", "fight", "harassment", "abusive", "rude", "misconduct"] },
        { type: "OTHER", keywords: [] }
    ];

    if (msg.startsWith("file complaint for")) {
        const parts = message.split(":");
        const categoryPart = parts[0]?.replace(/file complaint for/i, "").trim().toUpperCase();
        const descriptionPart = parts.slice(1).join(":").trim() || message;
        return {
            category: categoryPart || "OTHER",
            urgency: msg.includes("urgent") || msg.includes("now") || msg.includes("asap") || msg.includes("emergency") ? "HIGH" : "NORMAL",
            description: descriptionPart
        };
    }

    let detectedCategory = "OTHER";
    for (const cat of categories) {
        for (const keyword of cat.keywords) {
            if (msg.includes(keyword)) {
                detectedCategory = cat.type;
            }
        }
    }

    let urgency = "NORMAL";
    if (msg.includes("urgent") || msg.includes("asap") || msg.includes("immediately") || msg.includes("emergency")) {
        urgency = "HIGH";
    }

    return {
        category: detectedCategory,
        urgency,
        description: message
    };
}

/* =====================================================
   LLM CALLS (Gemini / Groq)
===================================================== */

/* =====================================================
   LANGUAGE DETECTION (Phase 6 — Roman Urdu NLP)
===================================================== */

const ROMAN_URDU_MARKERS = [
    "kya", "hai", "mera", "meri", "mujhe", "hum", "aap", "tum", "karo",
    "bhai", "yaar", "banda", "khana", "nashta", "roti", "daal", "chawal",
    "paisa", "paise", "kiraya", "rent", "masla", "bijli", "paani", "kamra",
    "shukriya", "theek", "bilkul", "zaroor", "nahi", "nahin", "haan",
    "kab", "kahan", "kaisa", "kaise", "kitna", "kitni", "kuch", "sub",
    "abhi", "kal", "aaj", "bohot", "thora", "zyada", "kam", "warden",
    "shikayat", "kharaab", "kharab", "door", "kholo", "band", "bana",
    "kiabana", "requeset", "request", "kia"
];

const URDU_SCRIPT_REGEX = /[\u0600-\u06FF]/;

function detectLanguage(message: string): "english" | "roman_urdu" | "urdu_script" {
    if (URDU_SCRIPT_REGEX.test(message)) return "urdu_script";
    const lower = message.toLowerCase();
    let romanScore = 0;
    for (const marker of ROMAN_URDU_MARKERS) {
        if (lower.includes(marker)) romanScore++;
    }
    return romanScore >= 1 ? "roman_urdu" : "english";
}

/* =====================================================
   LLM CALLS (Groq / Gemini) — Groq Primary Provider
===================================================== */

async function callGroq(
    promptOrMessages: string | Array<{ role: string; content: string }>,
    signal?: AbortSignal,
    temperature = 0.5,
    maxTokens = 1000,
    model = "llama-3.3-70b-versatile"
): Promise<string | null> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.includes("PASTE")) {
        console.log(" ⚠️ [HostelAI Groq] GROQ_API_KEY is missing or unconfigured in .env");
        return null;
    }

    const messages = typeof promptOrMessages === "string"
        ? [{ role: "user", content: promptOrMessages }]
        : promptOrMessages;

    try {
        console.log(` 🤖 [HostelAI Groq] Querying Groq API (${model})...`);
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens: maxTokens,
                temperature,
                top_p: 0.9
            }),
            signal: signal || AbortSignal.timeout(9000)
        });

        if (!res.ok) {
            console.log(` ⚠️ [HostelAI Groq] Primary status ${res.status}. Retrying with fast fallback model (llama-3.1-8b-instant)...`);
            const fallbackRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages,
                    max_tokens: maxTokens,
                    temperature,
                    top_p: 0.9
                }),
                signal: signal || AbortSignal.timeout(8000)
            });

            if (!fallbackRes.ok) {
                console.error(` ❌ [HostelAI Groq] Both Groq models failed (Primary: ${res.status}, Fallback: ${fallbackRes.status})`);
                return null;
            }
            const fallbackData = await fallbackRes.json();
            const fallbackOutput = fallbackData?.choices?.[0]?.message?.content || null;
            if (fallbackOutput) console.log(" ✅ [HostelAI Groq] Received fast response from Groq (8b-instant)!");
            return fallbackOutput;
        }

        const data = await res.json();
        const output = data?.choices?.[0]?.message?.content || null;
        if (output) console.log(` ✅ [HostelAI Groq] Received response from Groq (${model})!`);
        return output;
    } catch (e: any) {
        console.error(" ❌ [HostelAI Groq] Error calling Groq API:", e?.message || e);
        return null;
    }
}

async function callGemini(fullPrompt: string, signal?: AbortSignal, temperature = 0.7): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes("PASTE")) return null;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: { maxOutputTokens: 800, temperature }
            }),
            signal: signal || AbortSignal.timeout(10000)
        });

        if (!res.ok) return null;
        const data = await res.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (e) {
        return null;
    }
}

async function callAI(user: any, message: string, contextData: string, historyData: string = "", signal?: AbortSignal, language: "english" | "roman_urdu" | "urdu_script" = "english"): Promise<string | null> {
    const settings = await getSystemSettings();
    const systemPromptOverride = settings.aiSystemPrompt || undefined;
    const model = settings.aiModel || "llama-3.3-70b-versatile";
    const temperature = settings.aiTemperature ?? 0.5;

    const groqMessages = buildGroqMessages({
        user,
        message,
        contextData,
        historyData,
        language,
        systemPromptOverride
    });

    const fullPrompt = buildPretrainedPrompt({
        user,
        message,
        contextData,
        historyData,
        language,
        systemPromptOverride
    });

    // Try structured Groq system/user messages first, fallback to Gemini
    const groqReply = await callGroq(groqMessages, signal, temperature, 1000, model);
    if (groqReply) return groqReply;

    return await callGemini(fullPrompt, signal, temperature);
}

/* =====================================================
   SMART SUGGESTIONS GENERATOR (Phase 4)
===================================================== */

async function generateSmartSuggestions(user: any, intent: string, reply: string): Promise<string[]> {
    const staticDefaults: Record<string, string[]> = {
        MESS: ["Report food issue", "Check rent balance", "Download receipt"],
        FINANCE: ["Download last receipt", "Mess menu", "Manager contact"],
        SUPPORT: ["Check complaint status", "Manager contact", "Mess menu"],
        COMPLAINT_STATUS: ["File new complaint", "Manager contact", "Mess menu"],
        ROOM: ["Check rent dues", "Mess menu", "File a complaint"],
        MANAGEMENT: ["File a complaint", "Check rent dues", "Mess menu"],
        NOTICES: ["Today's Mess Menu", "Check Rent Balance", "Manager contact"],
    };

    try {
        const suggestionPrompt = `Based on this HostelAI response about "${intent}", generate 3 short follow-up options a hostel resident in Pakistan might click next. Keep each under 6 words. Respond ONLY with JSON array of strings: ["Option 1", "Option 2", "Option 3"]

Response: "${reply.slice(0, 200)}"`;

        const raw = (await callGroq(suggestionPrompt, undefined, 0.3, 200)) ?? (await callGemini(suggestionPrompt));
        if (raw) {
            const match = raw.match(/\[[\s\S]*?\]/);
            if (match) {
                const parsed = JSON.parse(match[0]);
                if (Array.isArray(parsed) && parsed.length >= 2) {
                    return parsed.slice(0, 3).map((s: any) => String(s).slice(0, 40));
                }
            }
        }
    } catch (e) {
        // fall through to static defaults
    }

    return staticDefaults[intent] || ["Download last receipt", "Today's Mess Menu", "Report a problem"];
}

/* =====================================================
   GET HANDLER — Fetch Chat History
===================================================== */

export async function GET(req: Request) {
    if (!await isServiceEnabled('enableAiAssistant')) {
        return NextResponse.json({ success: false, error: "AI Assistant is currently disabled." }, { status: 503 });
    }

    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    
    const currentUserId = guard.user.userId || guard.user.id;
    const currentUserRole = guard.user.role;

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");

    let targetUserId = currentUserId;
    if (requestedUserId && requestedUserId !== currentUserId) {
        if (["ADMIN", "WARDEN", "STAFF"].includes(currentUserRole)) {
            targetUserId = requestedUserId;
        } else {
            return NextResponse.json({ success: false, error: "Unauthorized to access other users' chat history." }, { status: 403 });
        }
    }

    try {
        const unreadOnly = searchParams.get("unreadOnly") === "true";

        if (unreadOnly) {
            // Phase 3: Badge polling — count unread proactive bot messages
            const unreadCount = await prisma.chatMessage.count({
                where: { userId: targetUserId, role: "bot", isRead: false, isProactive: true }
            });
            return NextResponse.json({ success: true, unreadCount });
        }

        const limitParam = searchParams.get("limit");
        const takeLimit = limitParam ? Math.min(200, parseInt(limitParam)) : 100;

        const messages = await prisma.chatMessage.findMany({
            where: { userId: targetUserId },
            orderBy: { createdAt: "asc" },
            take: takeLimit
        });

        // Mark all bot messages as read once fetched
        await prisma.chatMessage.updateMany({
            where: { userId: targetUserId, role: "bot", isRead: false },
            data: { isRead: true }
        });

        const formatted = messages.map((m) => ({
            id: m.id,
            role: m.role === "bot" || m.role === "AI" ? "bot" : "user",
            content: m.content,
            cardType: m.cardType || null,
            cardData: m.cardData || null,
            suggestions: m.suggestions || [],
            feedback: m.feedback || null,
            isProactive: m.isProactive || false,
            createdAt: m.createdAt
        }));

        return NextResponse.json({ success: true, messages: formatted });
    } catch (e: any) {
        console.error("Failed to load chat history:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

/* =====================================================
   PATCH HANDLER — Record User Feedback (Learning)
===================================================== */

export async function PATCH(req: Request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const userId = guard.user.userId || guard.user.id;

    try {
        const { messageId, feedback, context, reply } = await req.json();
        if (!messageId || !feedback) {
            return NextResponse.json({ success: false, error: "Missing messageId or feedback" }, { status: 400 });
        }

        // Update the message feedback
        await prisma.chatMessage.updateMany({
            where: { id: messageId, userId },
            data: { feedback }
        });

        // Phase 10: Store AiFeedback for learning
        await (prisma as any).aiFeedback.create({
            data: {
                userId,
                messageId,
                feedback: feedback === "up" ? "POSITIVE" : "NEGATIVE",
                context: context || null,
                reply: reply || null
            }
        });

        // Phase 10: On negative feedback, queue AI response regeneration
        if (feedback === "down" && context) {
            console.log(`[HostelAI Feedback] 👎 Negative feedback on message ${messageId} — queueing regeneration...`);
            try {
                const improvementPrompt = `The following HostelAI response received negative feedback from a resident. Please generate an improved, more helpful and specific response.

Original User Message: "${context}"
Original Response: "${reply || "(not provided)"}" 

Generate a better response that is more accurate, warmer in tone, and directly addresses the resident's concern with specific hostel management context.`;

                const improvedReply = await callGemini(improvementPrompt) ?? await callGroq(improvementPrompt);
                if (improvedReply) {
                    await prisma.chatMessage.update({
                        where: { id: messageId },
                        data: { content: improvedReply }
                    });
                    await (prisma as any).aiFeedback.updateMany({
                        where: { messageId, userId },
                        data: { improved: true }
                    });
                    console.log(`[HostelAI Feedback] ✅ Message ${messageId} improved and updated in DB.`);
                    return NextResponse.json({ success: true, improved: true, improvedReply, message: "HostelAI has improved this response based on your feedback!" });
                }
            } catch (e) {
                console.error("[HostelAI Feedback] Regeneration failed:", e);
            }
        }

        return NextResponse.json({ success: true, message: feedback === "up" ? "Thanks for your positive feedback! 🌟" : "Got it! We'll work on improving this. Thanks for helping HostelAI learn! 🙏" });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

/* =====================================================
   POST HANDLER — Agentic Copilot Logic & Memory Retrieval
===================================================== */

export async function POST(req: Request) {
    if (!await isServiceEnabled('enableAiAssistant')) {
        return NextResponse.json({ success: false, error: "AI Assistant is currently disabled." }, { status: 503 });
    }

    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const userId = guard.user.userId || guard.user.id;

    try {
        const { message } = await req.json();

        if (!message || !message.trim()) {
            return NextResponse.json({ success: false, error: "Missing message field" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true, hostelId: true }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        let effectiveHostelId = user.hostelId;
        if (!effectiveHostelId) {
            const booking = await prisma.booking.findFirst({
                where: { userId: user.id },
                select: { Room: { select: { hostelId: true } } }
            });
            effectiveHostelId = booking?.Room?.hostelId || null;
        }
        if (!effectiveHostelId) {
            const firstHostel = await prisma.hostel.findFirst({ select: { id: true } });
            effectiveHostelId = firstHostel?.id || null;
        }

        const startTime = Date.now();
        console.log(`\n======================================================`);
        console.log(`🤖 [HostelAI API] 📩 Incoming User Chat Request`);
        console.log(` 👤 User: ${user.name} (${user.email}) | Role: ${user.role} | ID: ${user.id}`);
        console.log(` 💬 Message: "${message}"`);
        console.log(` 🏠 Resolved Hostel ID: ${effectiveHostelId || "None"}`);

        // ── Phase 2: Deep Multi-Turn Conversation Memory ─────────────────
        console.log(` 🧠 Building deep conversation memory...`);
        const historyStr = await buildConversationMemory(user.id);

        // ── Phase 6: Detect Language (English / Roman Urdu / Urdu Script) ─
        const language = detectLanguage(message);
        console.log(` 🌐 Detected Language: ${language}`);

        let intent = detectIntent(message);
        const lowerMsg = message.toLowerCase();

        console.log(` 🔍 Rule Match Intent: ${intent.name} (Confidence Score: ${intent.score.toFixed(2)})`);

        if (isStatusQuery(message)) {
            console.log(` ⚡ [HostelAI] Status / Request Query Match Triggered! Intent forced -> TICKET_POLL`);
            intent = { name: "TICKET_POLL", score: 5.0 };
        } else if (isComplaintQuery(message)) {
            console.log(` ⚡ [HostelAI] Complaint / Typo Match Triggered! Intent forced -> SUPPORT`);
            intent = { name: "SUPPORT", score: 5.0 };
        } else if (intent.score < 2.0 || intent.name === "UNKNOWN") {
            console.log(` 🤖 [HostelAI] Rule confidence low (${intent.score.toFixed(2)}). Querying LLM Intent Classifier...`);
            const aiIntent = await classifyIntentWithAI(user, message);
            console.log(` 🎯 [HostelAI] LLM Classified Intent: ${aiIntent}`);
            if (aiIntent && aiIntent !== "UNKNOWN") {
                intent = { name: aiIntent, score: 3.0 };
            }
        }

        console.log(` 🚀 [HostelAI Final Intent Selected]: ${intent.name}`);

        let reply = "";
        let cardType: string | null = null;
        let cardData: any = null;
        let suggestions: string[] = ["Mess menu", "My bill status", "Download last receipt", "Report a problem"];

        // Save User Message to DB
        await prisma.chatMessage.create({
            data: {
                userId: user.id,
                role: "user",
                content: message
            }
        });

        /* =====================================================
           AGENTIC TOOL EXECUTION & INTENT ROUTING
        ===================================================== */

        switch (intent.name) {
            case "CASUAL":
            case "GREETING":
            case "IDENTITY": {
                console.log(` 🛠️ [HostelAI Handler] Executing CASUAL / GREETING / IDENTITY handler...`);
                const isExplicitHubRequest =
                    lowerMsg === "help" ||
                    lowerMsg === "menu" ||
                    lowerMsg === "services" ||
                    lowerMsg === "hub" ||
                    lowerMsg.includes("show menu") ||
                    lowerMsg.includes("services hub") ||
                    lowerMsg.includes("quick options");

                if (isExplicitHubRequest) {
                    console.log(` 📌 User explicitly requested Services Hub. Attaching HELP_HUB_CARD.`);
                    cardType = "HELP_HUB_CARD";
                    cardData = { userName: user.name };
                    reply = `Here is your **HostelAI Executive Services Hub** with **12 instant feature tools**:`;
                } else {
                    console.log(` 🌐 Requesting AI response from Gemini / Groq for natural conversation...`);
                    const ragContext = await getRelevantContext(user.id, user.role, message);
                    const contextStr = JSON.stringify({
                        userName: user.name,
                        userRole: user.role,
                        hostelId: effectiveHostelId,
                        liveData: ragContext
                    }, null, 2);
                    const aiReply = await callAI(user, message, contextStr, historyStr);
                    reply = aiReply || `I am **HostelAI**, your smart hostel copilot! I'm here to help with your stay, meals, receipts, and maintenance. How can I assist you today?`;
                }
                suggestions = ["Today's Mess Menu", "Download last receipt", "Check Rent Balance", "File a Complaint"];
                break;
            }

            case "HELP_HUB": {
                console.log(` 🛠️ [HostelAI Handler] Rendering HELP_HUB_CARD...`);
                cardType = "HELP_HUB_CARD";
                cardData = { userName: user.name };
                reply = `Here is your **HostelAI Executive Services Hub** with **12 instant feature tools**:`;
                suggestions = ["Today's Mess Menu", "Download last receipt", "Check Rent Balance", "Manager contact", "How to apply leave", "Emergency help"];
                break;
            }

            case "LEAVE_GATEPASS": {
                console.log(` 🛠️ [HostelAI Handler] Executing LEAVE_GATEPASS policy query...`);
                reply = `To apply for a **Gate Pass or Leave (Night Out)**:\n\n1. Go to **Leave & Gate Pass** in your dashboard menu.\n2. Click **Apply New Leave**.\n3. Fill in your departure & return dates and reason.\n4. Once submitted, your warden will review and issue your QR Gate Pass.`;
                suggestions = ["Check my room info", "Manager contact", "Check Rent Balance"];
                break;
            }

            case "ROOM_SWAP": {
                console.log(` 🛠️ [HostelAI Handler] Executing ROOM_SWAP policy query...`);
                reply = `To apply for a **Room Swap (Room Transfer)**:\n\n1. Go to **My Room** in your dashboard menu.\n2. Scroll down to **Request Room Change**.\n3. Select an available room and state your reason.\n4. Click **Submit Room Change Request** for warden review.`;
                suggestions = ["Check my room info", "Manager contact", "Report a problem"];
                break;
            }

            case "HOUSEKEEPING": {
                console.log(` 🛠️ [HostelAI Handler] Executing HOUSEKEEPING query...`);
                reply = `To check **Housekeeping & Cleaning History**:\n\n1. Go to **Services & Support** in your sidebar.\n2. Tap the **Room Services Logs** tab to view your room's cleaning history.\n3. If your room needs immediate cleaning, file a **Housekeeping Ticket** under Support.`;
                suggestions = ["File a complaint", "My room info", "Manager contact"];
                break;
            }

            case "LAUNDRY": {
                console.log(` 🛠️ [HostelAI Handler] Executing LAUNDRY query...`);
                reply = `To check **Laundry Cycles & Status**:\n\n1. Go to **Services & Support** in your sidebar.\n2. Select **Room Services Logs** to see your laundry batch history.\n3. If you have unwashed laundry, submit a request via room services.`;
                suggestions = ["File a complaint", "Today's Mess Menu", "Check Rent Balance"];
                break;
            }

            case "EMERGENCY": {
                console.log(` 🛠️ [HostelAI Handler] Executing EMERGENCY desk query...`);
                const managerInfo = await toolFetchManagerInfo(user.id);
                const phone = managerInfo.manager?.phone || "+92 300 1234567";
                const wa = managerInfo.manager?.whatsappUrl || "https://wa.me/923001234567";
                reply = `🚨 **EMERGENCY ASSISTANCE DESK**\n\nIf you have an urgent medical, security, or power emergency:\n\n• **Warden Office:** ${phone}\n• **WhatsApp Direct:** ${wa}\n• **Curfew & Gate Security:** On duty 24/7\n\nPlease call the warden number above immediately for instant on-ground response!`;
                suggestions = ["Manager contact", "File a complaint", "Download last receipt"];
                break;
            }

            case "RECEIPT_REQUEST": {
                console.log(` 🛠️ [HostelAI Tool] Fetching last payment receipt via toolFetchLastReceipt...`);
                const receiptResult = await toolFetchLastReceipt(user.id);
                if (receiptResult.success && receiptResult.receipt) {
                    cardType = "RECEIPT_CARD";
                    cardData = receiptResult;
                    reply = receiptResult.hasReceipt
                        ? `Here is your **latest official payment receipt & voucher**:`
                        : `Here is your **most recent payment record**:`;
                } else {
                    reply = `No payment receipts found for your account.`;
                }
                suggestions = ["Check Rent Dues", "Mess menu", "Manager contact"];
                break;
            }

            case "MESS": {
                console.log(` 🛠️ [HostelAI Tool] Fetching Mess Menu via toolFetchMessMenu(hostelId: ${effectiveHostelId})...`);
                if (effectiveHostelId) {
                    const messResult = await toolFetchMessMenu(effectiveHostelId);
                    if (messResult.success && messResult.menu && messResult.menu.length > 0) {
                        cardType = "MESS_CARD";
                        cardData = { menu: messResult.menu };
                        reply = `Here is the current **Mess Menu** for your hostel:`;
                    } else {
                        reply = `No mess menu schedule found for your hostel at the moment.`;
                    }
                } else {
                    reply = `You are currently not assigned to a hostel property to view the mess menu.`;
                }
                suggestions = ["Check Rent Dues", "Download last receipt", "Report food issue"];
                break;
            }

            case "FINANCE":
            case "PAYMENT_OVERDUE":
            case "PAYMENT_HISTORY": {
                console.log(` 🛠️ [HostelAI Tool] Fetching Rent Dues via toolFetchUserRentStatus(userId: ${user.id})...`);
                const rentResult = await toolFetchUserRentStatus(user.id);
                if (rentResult.success) {
                    cardType = "PAYMENT_CARD";
                    cardData = rentResult;
                    const pendingCount = rentResult.pendingCount || 0;
                    const totalPending = rentResult.totalPending || 0;
                    if (pendingCount > 0) {
                        reply = `You have **${pendingCount} pending bill(s)** totaling **PKR ${totalPending.toLocaleString()}**.`;
                    } else {
                        reply = `Great news! You have **no pending rent bills**. Your account is up to date! 🎉`;
                    }
                } else {
                    reply = `Unable to fetch rent information right now.`;
                }
                suggestions = ["Download last receipt", "Mess menu", "Report a problem"];
                break;
            }

            case "ROOM": {
                console.log(` 🛠️ [HostelAI Tool] Fetching Room Details via toolFetchRoomDetails(userId: ${user.id})...`);
                const roomResult = await toolFetchRoomDetails(user.id);
                if (roomResult.success) {
                    cardType = "ROOM_CARD";
                    cardData = roomResult;
                    reply = `Here are your assigned room details at **${roomResult.hostelName}**:`;
                } else {
                    reply = `You do not have an active room assignment at this time.`;
                }
                suggestions = ["Check rent dues", "Mess menu", "Hostel rules"];
                break;
            }

            case "SUPPORT": {
                const lowerMsg = message.toLowerCase().trim();
                const isExplicitSubmission = lowerMsg.startsWith("file complaint for") || lowerMsg.includes(":");
                console.log(` 🛠️ [HostelAI Tool] Handling SUPPORT complaint request (Explicit Submission: ${isExplicitSubmission})...`);

                if (isStatusQuery(message)) {
                    console.log(` 📌 Message is a status check query. Redirecting to TICKET_POLL handler.`);
                    const recentComplaint = await prisma.complaint.findFirst({
                        where: { userId: user.id },
                        orderBy: { createdAt: "desc" }
                    });
                    if (recentComplaint) {
                        const statusEmoji = (({
                            PENDING: "🟡",
                            IN_PROGRESS: "🔵",
                            RESOLVED: "✅",
                            REJECTED: "❌",
                            CLOSED: "⬛"
                        } as Record<string, string>)[recentComplaint.status]) || "⚪";

                        const statusLabel = (({
                            PENDING: "Pending — Awaiting Assignment",
                            IN_PROGRESS: "In Progress — Team is Working On It",
                            RESOLVED: "Resolved ✅",
                            REJECTED: "Rejected ❌",
                            CLOSED: "Closed"
                        } as Record<string, string>)[recentComplaint.status]) || recentComplaint.status;

                        cardType = "TICKET_UPDATE_CARD";
                        cardData = {
                            complaint: recentComplaint,
                            statusEmoji,
                            statusLabel
                        };
                        reply = `${statusEmoji} **Latest Ticket #${recentComplaint.uid || recentComplaint.id.slice(-6).toUpperCase()}** — Status: **${statusLabel}**`;
                        if (recentComplaint.resolutionNotes) {
                            reply += `\n\n📋 Resolution Notes: *${recentComplaint.resolutionNotes}*`;
                        }
                    } else {
                        reply = `You don't have any logged complaints yet. Would you like to file one?`;
                        cardType = "COMPLAINT_BUILDER";
                        cardData = { userId: user.id, hostelId: effectiveHostelId };
                    }
                    suggestions = ["File new complaint", "Check all complaints", "Manager contact"];
                    break;
                }

                const isAskingToCreateTicket =
                    lowerMsg.includes("want to file") ||
                    lowerMsg.includes("how to file") ||
                    lowerMsg.includes("help me file") ||
                    lowerMsg.includes("file a complaint") ||
                    lowerMsg.includes("file complaint") ||
                    lowerMsg.includes("log a complaint") ||
                    lowerMsg.includes("log complaint") ||
                    lowerMsg.includes("file ticket") ||
                    lowerMsg.includes("log ticket") ||
                    lowerMsg.includes("report issue") ||
                    lowerMsg.includes("report problem") ||
                    lowerMsg.includes("comlain") ||
                    lowerMsg.includes("compain") ||
                    lowerMsg === "complaint" ||
                    lowerMsg === "complain" ||
                    message.length < 20;

                if (!isExplicitSubmission && isAskingToCreateTicket) {
                    console.log(` 📌 Opening COMPLAINT_BUILDER form for user.`);
                    cardType = "COMPLAINT_BUILDER";
                    cardData = { userId: user.id, hostelId: effectiveHostelId };
                    reply = `I can help you file a maintenance ticket! Please select a category and type your issue below:`;
                } else if (effectiveHostelId) {
                    console.log(` 📝 Submitting new complaint ticket to database...`);
                    const extracted = extractComplaintDetails(message);
                    const complaintResult = await toolFileComplaint({
                        userId: user.id,
                        hostelId: effectiveHostelId,
                        title: `${extracted.category} Issue Logged via AI`,
                        description: extracted.description,
                        category: extracted.category,
                        priority: extracted.urgency === "HIGH" ? "HIGH" : "MEDIUM"
                    });

                    if (complaintResult.success && complaintResult.complaint) {
                        console.log(` ✅ Ticket created successfully! UID: #${complaintResult.complaint.uid}`);
                        cardType = "COMPLAINT_CARD";
                        cardData = complaintResult.complaint;
                        reply = `I have logged your **${extracted.category}** complaint ticket **#${complaintResult.complaint.uid}**. Our maintenance team has been notified!`;
                    } else {
                        cardType = "COMPLAINT_BUILDER";
                        cardData = { userId: user.id, hostelId: user.hostelId };
                        reply = `Please select a category and describe the problem below:`;
                    }
                } else {
                    reply = `You must be assigned to a hostel property to log maintenance tickets.`;
                }
                suggestions = ["Manager contact", "Check complaint status", "Mess menu"];
                break;
            }

            case "COMPLAINT_STATUS": {
                console.log(` 🛠️ [HostelAI Query] Fetching user complaints from DB...`);
                const userComplaints = await prisma.complaint.findMany({
                    where: { userId: user.id },
                    orderBy: { createdAt: "desc" },
                    take: 5
                });
                cardType = "COMPLAINT_LIST_CARD";
                cardData = { complaints: userComplaints };
                reply = userComplaints.length > 0
                    ? `Here is the status of your **Maintenance Complaint Tickets**:`
                    : `You do not have any logged maintenance tickets at the moment.`;
                suggestions = ["File a complaint", "Manager contact", "Check Rent Balance"];
                break;
            }

            case "MANAGEMENT": {
                console.log(` 🛠️ [HostelAI Tool] Fetching Manager Info via toolFetchManagerInfo...`);
                const managerResult = await toolFetchManagerInfo(user.id, user.hostelId || undefined);
                if (managerResult.success) {
                    cardType = "MANAGEMENT_CARD";
                    cardData = managerResult;
                    reply = `Here are the contact details for your **Hostel Manager & Office**:`;
                } else {
                    reply = `Unable to retrieve manager contact details right now. Please visit the main office desk.`;
                }
                suggestions = ["File a complaint", "Mess menu", "Check rent dues"];
                break;
            }

            case "ANALYTICS": {
                console.log(` 🛠️ [HostelAI Tool] Fetching Admin Metrics via toolFetchAdminMetrics...`);
                if (user.role === "ADMIN" || user.role === "WARDEN") {
                    const metrics = await toolFetchAdminMetrics(user.hostelId || undefined);
                    if (metrics.success) {
                        cardType = "ANALYTICS_CARD";
                        cardData = metrics;
                        reply = `Here is the latest executive analytics overview for your hostel properties:`;
                    } else {
                        reply = `Unable to generate executive analytics metrics.`;
                    }
                } else {
                    reply = `Executive analytics are available for Hostel Wardens and Admins.`;
                }
                suggestions = ["Hostel Occupancy", "Pending Expenses", "Unpaid Bills"];
                break;
            }

            case "NOTICES": {
                console.log(` 🛠️ [HostelAI Query] Querying active notices from DB...`);
                const notices = await prisma.notice.findMany({
                    where: user.hostelId ? { hostelId: user.hostelId } : {},
                    orderBy: { createdAt: "desc" },
                    take: 5
                });
                cardType = "NOTICE_CARD";
                cardData = { notices };
                reply = notices.length > 0
                    ? `Here are the latest **Hostel Bulletins & Announcements**:`
                    : `There are currently no active announcements posted on the notice board.`;
                suggestions = ["Today's Mess Menu", "Download last receipt", "Check Rent Balance", "Manager contact"];
                break;
            }

            case "RULES": {
                console.log(` 🛠️ [HostelAI Query] Rendering Hostel Rules & Policies...`);
                reply = `📝 **Hostel Rules & Policies:**\n\n` +
                    `1. **Gate Timings:** Main gate closes at **11:00 PM**.\n` +
                    `2. **Visitors:** Not permitted in resident rooms after **8:00 PM**.\n` +
                    `3. **Quiet Hours:** Please maintain silence after **11:30 PM**.\n` +
                    `4. **Prohibited Items:** Smoking, alcohol, and high-wattage electrical heaters strictly prohibited.`;
                suggestions = ["Gate Timings", "Visitor Policy", "Warden Contact"];
                break;
            }

            case "TICKET_POLL": {
                console.log(` 🛠️ [HostelAI Tool] Polling latest complaint ticket status...`);
                const recentComplaint = await prisma.complaint.findFirst({
                    where: { userId: user.id },
                    orderBy: { createdAt: "desc" }
                });

                if (!recentComplaint) {
                    reply = `You don't have any logged complaints yet. Would you like to file one?`;
                    cardType = "COMPLAINT_BUILDER";
                    cardData = { userId: user.id, hostelId: effectiveHostelId };
                } else {
                    const statusEmoji = (({
                        PENDING: "🟡",
                        IN_PROGRESS: "🔵",
                        RESOLVED: "✅",
                        REJECTED: "❌",
                        CLOSED: "⬛"
                    } as Record<string, string>)[recentComplaint.status]) || "⚪";

                    const statusLabel = (({
                        PENDING: "Pending — Awaiting Assignment",
                        IN_PROGRESS: "In Progress — Team is Working On It",
                        RESOLVED: "Resolved ✅",
                        REJECTED: "Rejected ❌",
                        CLOSED: "Closed"
                    } as Record<string, string>)[recentComplaint.status]) || recentComplaint.status;

                    cardType = "TICKET_UPDATE_CARD";
                    cardData = {
                        complaint: recentComplaint,
                        statusEmoji,
                        statusLabel
                    };
                    reply = `${statusEmoji} **Latest Ticket #${recentComplaint.uid || recentComplaint.id.slice(-6).toUpperCase()}** — Status: **${statusLabel}**`;
                    if (recentComplaint.resolutionNotes) {
                        reply += `\n\n📋 Resolution Notes: *${recentComplaint.resolutionNotes}*`;
                    } else if (recentComplaint.status === "PENDING") {
                        reply += `\n\nYour ticket is still in the queue. We'll notify you once the team picks it up!`;
                    }
                }
                suggestions = ["File new complaint", "Complaint list", "Manager contact"];
                break;
            }

            default: {
                console.log(` 🌐 [HostelAI Default] Fallback to RAG Context + LLM Call...`);
                const ragContext = await getRelevantContext(user.id, user.role, message);
                const contextStr = JSON.stringify({
                    userName: user.name,
                    userRole: user.role,
                    hostelId: user.hostelId,
                    liveData: ragContext
                }, null, 2);

                const aiReply = await callAI(user, message, contextStr, historyStr, undefined, language);
                if (aiReply) {
                    reply = aiReply;
                } else {
                    let summaryParts: string[] = [];
                    if (ragContext.summary.pendingPayments && ragContext.summary.pendingPayments > 0) {
                        summaryParts.push(`• **Pending Rent Dues:** PKR ${ragContext.summary.pendingAmount?.toLocaleString() || 0} (${ragContext.summary.pendingPayments} unpaid bill)`);
                    }
                    if (ragContext.summary.openComplaints && ragContext.summary.openComplaints > 0) {
                        summaryParts.push(`• **Active Maintenance Tickets:** ${ragContext.summary.openComplaints} open complaint(s)`);
                    }
                    if (ragContext.notices && ragContext.notices.length > 0) {
                        summaryParts.push(`• **Latest Announcement:** "${ragContext.notices[0].title}"`);
                    }

                    const lowerMsg = message.toLowerCase();
                    if (lowerMsg.includes("complaint") || lowerMsg.includes("ticket") || lowerMsg.includes("masla") || lowerMsg.includes("shikayat") || lowerMsg.includes("problem") || lowerMsg.includes("repair")) {
                        cardType = "COMPLAINT_BUILDER";
                        cardData = { userId: user.id, hostelId: user.hostelId };
                        reply = `I can help you file a complaint ticket! Please select a category and describe the problem below:`;
                    } else if (summaryParts.length > 0) {
                        reply = `Here is your live account status from our database:\n\n${summaryParts.join("\n")}\n\nSelect a service below for quick actions:`;
                        cardType = "HELP_HUB_CARD";
                        cardData = { userName: user.name };
                    } else {
                        reply = `I am **HostelAI**. I'm here to help with your hostel stay! Here are your **Quick Feature Options**:`;
                        cardType = "HELP_HUB_CARD";
                        cardData = { userName: user.name };
                    }
                }
                suggestions = ["Download last receipt", "Today's Mess Menu", "My Bill Status", "Report a problem"];
                break;
            }
        }

        // Phase 4: AI-Generated Smart Suggestions (async, non-blocking)
        let finalSuggestions = suggestions;
        try {
            if (reply && !cardType?.includes("HUB") && !cardType?.includes("BUILDER")) {
                const smart = await generateSmartSuggestions(user, intent.name, reply);
                if (smart && smart.length >= 2) finalSuggestions = smart;
            }
        } catch (_) {}

        // Save AI Response Message to DB
        const savedMessage = await prisma.chatMessage.create({
            data: {
                userId: user.id,
                role: "bot",
                content: reply,
                cardType,
                cardData,
                suggestions: finalSuggestions,
                isRead: false
            }
        });

        console.log(` 📤 [HostelAI Output] Card Type: ${cardType || "None"} | Language: ${language} | Intent: ${intent.name}`);
        console.log(` ⏱️ Total Processing Time: ${Date.now() - startTime}ms`);
        console.log(`======================================================\n`);

        return NextResponse.json({
            success: true,
            messageId: savedMessage.id,
            reply,
            cardType,
            cardData,
            suggestions: finalSuggestions,
            language
        });

    } catch (error: any) {
        console.error("❌ AI Assistant POST Error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}