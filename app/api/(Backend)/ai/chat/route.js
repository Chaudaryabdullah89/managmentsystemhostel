import { checkRole } from '@/lib/checkRole';
import { chat } from '@/lib/ollama';
import { getRelevantContext, DEFAULT_SYSTEM_PROMPT } from '@/lib/ragContext';
import { NextResponse } from 'next/server';

/**
 * POST /api/ai/chat
 *
 * Connect Next.js to local Ollama model.
 * Body: { message: string, useRag?: boolean, systemPrompt?: string, context?: object }
 *
 * - message: user question
 * - useRag: if true (default), detect intent and fetch only relevant DB data, then send as context
 * - systemPrompt: optional override for system instructions
 * - context: optional pre-built context (if not using RAG)
 *
 * Returns: { success, reply, context? }
 */
export async function POST(request) {
  const auth = await checkRole([]);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const message = body.message?.trim();
    if (!message) {
      return NextResponse.json(
        { success: false, message: 'Missing or empty message' },
        { status: 400 }
      );
    }

    const useRag = body.useRag !== false;
    const systemPrompt = body.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
    let context = body.context ?? null;

    if (useRag && auth.user?.id) {
      context = await getRelevantContext(
        auth.user.id,
        auth.user.role ?? 'RESIDENT',
        message
      );
    }

    const reply = await chat(message, {
      systemPrompt,
      context: context || undefined,
      stream: false,
    });

    const res = { success: true, reply };
    if (body.includeContext && context) res.context = context;
    return NextResponse.json(res);
  } catch (error) {
    const isOllamaDown =
      error.message?.includes('fetch') ||
      error.message?.includes('Ollama request failed') ||
      error.cause?.code === 'ECONNREFUSED';
    return NextResponse.json(
      {
        success: false,
        message: isOllamaDown
          ? 'AI service unavailable. Ensure Ollama is running (e.g. ollama run mistral).'
          : error.message,
      },
      { status: isOllamaDown ? 503 : 500 }
    );
  }
}
