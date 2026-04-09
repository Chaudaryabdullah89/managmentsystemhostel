export const dynamic = "force-dynamic";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse } from "@/lib/apiResponse";
import { getRelevantContext, DEFAULT_SYSTEM_PROMPT } from "@/lib/ragContext";
import { NextResponse } from "next/server";

/**
 * POST /api/ai/chat
 *
 * Uses Gemini (primary) → Groq (fallback). Ollama removed — not available on Vercel.
 * Body: { message: string, useRag?: boolean, systemPrompt?: string }
 */
export async function POST(request) {
  const auth = await requireAuth();
  if (!auth.success) return errorResponse(auth.error, auth.status);

  try {
    const body = await request.json();
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        { success: false, message: "Missing or empty message" },
        { status: 400 }
      );
    }

    const userId = auth.user?.userId || auth.user?.id;
    const userRole = auth.user?.role ?? "RESIDENT";
    const systemPrompt = body.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
    const useRag = body.useRag !== false;

    // Build RAG context from DB
    let context = body.context ?? null;
    if (useRag && userId) {
      try {
        context = await getRelevantContext(userId, userRole, message);
      } catch (ragErr) {
        console.warn("RAG context fetch failed:", ragErr.message);
      }
    }

    const contextStr = context ? JSON.stringify(context, null, 2) : "";
    const prompt = `${systemPrompt}\n\nHostel Context:\n${contextStr}\n\nUser Question: "${message}"\n\nGive a direct, friendly, concise response. Use emojis where appropriate.`;

    // Primary: Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && !geminiKey.includes("PASTE")) {
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          const result = { success: true, reply };
          if (body.includeContext && context) result.context = context;
          return NextResponse.json(result);
        }
      }
    }

    // Fallback: Groq
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && !groqKey.includes("PASTE")) {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply) {
          const result = { success: true, reply };
          if (body.includeContext && context) result.context = context;
          return NextResponse.json(result);
        }
      }
    }

    return NextResponse.json(
      { success: false, message: "AI service temporarily unavailable. Please try again shortly." },
      { status: 503 }
    );
  } catch (error) {
    console.error("AI Chat Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process your request." },
      { status: 500 }
    );
  }
}
