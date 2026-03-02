/**
 * RAG: Retrieval Augmented Generation.
 * 1. Detect user intent from the message.
 * 2. Fetch only relevant DB data for that user.
 * 3. Return structured context for the AI (no full DB dump).
 *
 * Benefits: less hallucination, faster, cheaper, safer.
 */

import prisma from '@/lib/prisma';

const INTENT_KEYWORDS = {
  payment: ['payment', 'pay', 'rent', 'bill', 'bills', 'invoice', 'dues', 'pending', 'unpaid', 'paid', 'amount', 'pkr', 'rupees'],
  complaint: ['complaint', 'complaints', 'issue', 'problem', 'report', 'resolution', 'status'],
  booking: ['booking', 'book', 'room', 'check-in', 'check-out', 'reservation', 'stay'],
  hostel: ['hostel', 'hostels', 'amenities', 'mess', 'menu', 'laundry', 'address'],
  notice: ['notice', 'notices', 'announcement', 'news'],
};

function detectIntent(message) {
  if (!message || typeof message !== 'string') return [];
  const lower = message.toLowerCase();
  const intents = [];
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) intents.push(intent);
  }
  return intents.length ? intents : ['general'];
}

/**
 * Fetch only the data relevant to the user's question.
 * @param {string} userId - Logged-in user id
 * @param {string} role - User role (ADMIN, WARDEN, RESIDENT, etc.)
 * @param {string} message - User message (used for intent)
 * @returns {Promise<object>} Structured context object for the model
 */
async function getRelevantContext(userId, role, message) {
  const intents = detectIntent(message);
  const context = { intents, summary: {} };

  try {
    if (intents.includes('payment')) {
      const payments = await prisma.payment.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 15,
        select: {
          amount: true,
          date: true,
          dueDate: true,
          type: true,
          status: true,
          notes: true,
        },
      });
      context.payments = payments;
      const pending = payments.filter((p) => p.status === 'PENDING');
      context.summary.pendingPayments = pending.length;
      context.summary.pendingAmount = pending.reduce((s, p) => s + p.amount, 0);
    }

    if (intents.includes('complaint')) {
      const complaints = await prisma.complaint.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          title: true,
          category: true,
          status: true,
          priority: true,
          createdAt: true,
          resolutionNotes: true,
        },
      });
      context.complaints = complaints;
      context.summary.openComplaints = complaints.filter((c) => c.status !== 'RESOLVED').length;
    }

    if (intents.includes('booking')) {
      const bookings = await prisma.booking.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          status: true,
          checkIn: true,
          checkOut: true,
          totalAmount: true,
          roomId: true,
        },
        include: {
          Room: {
            select: {
              roomNumber: true,
              type: true,
              Hostel: { select: { name: true } },
            },
          },
        },
      });
      context.bookings = bookings.map((b) => ({
        status: b.status,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        totalAmount: b.totalAmount,
        room: b.Room?.roomNumber,
        hostel: b.Room?.Hostel?.name,
      }));
    }

    if (intents.includes('notice')) {
      const notices = await prisma.notice.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { title: true, content: true, priority: true, createdAt: true },
      });
      context.notices = notices;
    }

    if (intents.includes('hostel') || intents.includes('general')) {
      const hostels = await prisma.hostel.findMany({
        take: 5,
        select: {
          name: true,
          address: true,
          city: true,
          status: true,
          montlyrent: true,
          messavailable: true,
          laundaryavailable: true,
        },
      });
      context.hostels = hostels;
    }
  } catch (err) {
    context.error = err.message;
  }

  return context;
}

const DEFAULT_SYSTEM_PROMPT = `You are a helpful assistant for a hostel management system in Pakistan.
Answer in a clear, concise way. Use the provided Context (JSON) to answer; do not invent data.
If the user asks about payments or rent, use only the payments data in context.
If they ask about complaints, use only the complaints data.
For amounts, use PKR and the exact numbers from context.
You can respond in English or Roman Urdu if the user writes in Roman Urdu.`;

export { detectIntent, getRelevantContext, DEFAULT_SYSTEM_PROMPT, INTENT_KEYWORDS };
