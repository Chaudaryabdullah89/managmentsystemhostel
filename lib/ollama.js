/**
 * Ollama local model client.
 * Calls http://localhost:11434/api/generate with system instructions,
 * structured JSON context, and user message.
 *
 * Requires Ollama running locally: ollama run mistral (or another model).
 */

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'mistral';

/**
 * Build a single prompt string from system message, optional JSON context, and user message.
 * @param {string} userMessage - The user's question or message
 * @param {object} [options] - Optional
 * @param {string} [options.systemPrompt] - System instructions for the model
 * @param {object} [options.context] - Structured data (e.g. from RAG) to include as JSON
 */
function buildPrompt(userMessage, options = {}) {
  const { systemPrompt, context } = options;
  const parts = [];

  if (systemPrompt) {
    parts.push(`System: ${systemPrompt}`);
  }
  if (context && Object.keys(context).length > 0) {
    parts.push(`Context (use only this data to answer):\n${JSON.stringify(context, null, 2)}`);
  }
  parts.push(`User: ${userMessage}`);
  return parts.join('\n\n');
}

/**
 * Call Ollama /api/generate and return the model response.
 * @param {string} prompt - Full prompt (use buildPrompt for system + context + user)
 * @param {object} [options]
 * @param {string} [options.model] - Model name (default: OLLAMA_MODEL or "mistral")
 * @param {string} [options.system] - System message (Ollama API field; optional if already in prompt)
 * @param {boolean} [options.stream] - If false, returns full response (default: false)
 * @param {object} [options.options] - Model options (temperature, top_p, etc.)
 * @returns {Promise<{ response: string, done: boolean, error?: string }>}
 */
async function generate(prompt, options = {}) {
  const {
    model = DEFAULT_MODEL,
    system: systemOverride,
    stream = false,
    options: modelOptions = {},
  } = options;

  const body = {
    model,
    prompt,
    stream,
    ...(systemOverride && { system: systemOverride }),
    ...(Object.keys(modelOptions).length > 0 && { options: modelOptions }),
  };

  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama request failed (${res.status}): ${text || res.statusText}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return {
    response: data.response ?? '',
    done: data.done ?? true,
  };
}

/**
 * One-shot: send user message with optional system prompt and structured context;
 * builds prompt and calls generate, returns the model reply.
 * @param {string} userMessage
 * @param {object} [options] - { systemPrompt, context, model, stream, options }
 */
async function chat(userMessage, options = {}) {
  const { systemPrompt, context, ...generateOptions } = options;
  const prompt = buildPrompt(userMessage, { systemPrompt, context });
  const result = await generate(prompt, generateOptions);
  return result.response;
}

export { buildPrompt, generate, chat, DEFAULT_MODEL, OLLAMA_BASE };
