# AI Integration (Ollama + RAG)

## Section 5: Connect Next.js to local model

- **Install & run Ollama:**  
  `curl -fsSL https://ollama.com/install.sh | sh`  
  Then: `ollama run mistral`
- **API:** `POST /api/ai/chat`  
  - Sends **system instructions**, **structured JSON context**, and **user message** to `http://localhost:11434/api/generate`.
  - Body: `{ "message": "Do I have any pending bills?", "useRag": true }`
  - Optional env: `OLLAMA_BASE_URL` (default `http://localhost:11434`), `OLLAMA_MODEL` (default `mistral`).

**Code:** `lib/ollama.js`, `app/api/(Backend)/ai/chat/route.js`.

---

## Section 6: RAG (Retrieval Augmented Generation)

- **Flow:** Detect intent → fetch only relevant DB data → send structured data to model → model formats answer.
- **Benefits:** Less hallucination, faster, cheaper, safer.
- **Implementation:** `lib/ragContext.js`
  - `detectIntent(message)` – keyword-based (payment, complaint, booking, hostel, notice).
  - `getRelevantContext(userId, role, message)` – loads only that user’s payments, complaints, bookings, etc., plus notices/hostels when relevant.

The chat route uses RAG by default (`useRag: true`).

---

## Section 7: Fine-tuning with LoRA (future)

To specialize the model for hostel Q&A, Pakistani language, Roman Urdu, payment logic, complaint handling:

1. **Dataset:** 500–2000 examples in Instruction / Input / Output format.  
   Example:  
   - Instruction: User asks about unpaid rent  
   - Input: Do I have any pending bills?  
   - Output: You have 1 unpaid invoice of PKR 12,000 due on 10th March.
2. **Training:** HuggingFace + PEFT (LoRA), train adapter layers, merge with base model.
3. **Serving:** Run the fine-tuned model in Ollama and set `OLLAMA_MODEL` to that model name; no change needed in this app’s API.

---

## Frontend usage

```js
const res = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    message: 'Do I have any pending bills?',
    useRag: true,
    includeContext: false, // set true to debug context
  }),
});
const { success, reply } = await res.json();
```

Requires the user to be logged in (session cookie).
