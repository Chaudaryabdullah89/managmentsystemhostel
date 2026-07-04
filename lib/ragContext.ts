/**
 * RAG: Retrieval Augmented Generation Engine for HostelAI 2.0
 * 1. Intent recognition (English & Roman Urdu).
 * 2. Role-scoped data fetching.
 * 3. Structured RAG context construction.
 */

import prisma from '@/lib/prisma';

export const INTENT_KEYWORDS: Record<string, string[]> = {
  payment: ['payment', 'pay', 'rent', 'bill', 'bills', 'invoice', 'dues', 'pending', 'unpaid', 'paid', 'amount', 'pkr', 'rupees', 'paisa', 'paise', 'baza', 'fee', 'charge'],
  complaint: ['complaint', 'complaints', 'issue', 'problem', 'report', 'resolution', 'status', 'shikayat', 'masla', 'kharaab', 'kharab', 'broken', 'repair', 'bijli', 'wifi', 'paani', 'fan', 'ac'],
  booking: ['booking', 'book', 'room', 'check-in', 'check-out', 'reservation', 'stay', 'kamra', 'bed', 'shift'],
  mess: ['mess', 'food', 'menu', 'lunch', 'dinner', 'breakfast', 'khana', 'nashta', 'roti', 'daal', 'chawal', 'eat'],
  hostel: ['hostel', 'hostels', 'amenities', 'laundry', 'address', 'rules', 'warden', 'manager'],
  notice: ['notice', 'notices', 'announcement', 'news', 'update', 'bulletin'],
};

export function detectIntent(message: string): string[] {
  if (!message || typeof message !== 'string') return [];
  const lower = message.toLowerCase();
  const intents: string[] = [];
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) intents.push(intent);
  }
  return intents.length ? intents : ['general'];
}

export interface RAGContextSummary {
  pendingPayments?: number;
  pendingAmount?: number;
  openComplaints?: number;
  occupancyRate?: number;
}

export interface RAGContext {
  intents: string[];
  summary: RAGContextSummary;
  user?: any;
  payments?: any[];
  complaints?: any[];
  bookings?: any[];
  messMenu?: any[];
  notices?: any[];
  hostels?: any[];
  error?: string;
}

/**
 * Fetch live DB context tailored to the user's account and stay for Groq AI RAG context.
 */
export async function getRelevantContext(userId: string, role: string, message: string): Promise<RAGContext> {
  const intents = detectIntent(message);
  const context: RAGContext = { intents, summary: {} };

  try {
    // 1. Fetch User Profile + Assigned Room + Hostel Details
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        hostelId: true,
        Hostel_User_hostelIdToHostel: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
            messavailable: true,
            laundaryavailable: true,
          }
        },
        Booking: {
          where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
          take: 1,
          select: {
            id: true,
            checkIn: true,
            status: true,
            securityDeposit: true,
            Room: {
              select: {
                id: true,
                roomNumber: true,
                floor: true,
                type: true,
                capacity: true,
                montlyrent: true,
                amenities: true,
                hostelId: true,
                Hostel: {
                  select: {
                    name: true,
                    address: true,
                    city: true,
                    phone: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (userProfile) {
      const activeBooking = userProfile.Booking?.[0];
      const hostelObj = userProfile.Hostel_User_hostelIdToHostel || activeBooking?.Room?.Hostel;
      const roomObj = activeBooking?.Room;

      let roommates: string[] = [];
      if (roomObj?.id) {
        const otherBookings = await prisma.booking.findMany({
          where: {
            roomId: roomObj.id,
            userId: { not: userId },
            status: { in: ['CONFIRMED', 'CHECKED_IN'] }
          },
          select: { User: { select: { name: true } } }
        });
        roommates = otherBookings.map(b => b.User.name);
      }

      const effectiveRent = Number(roomObj?.montlyrent || activeBooking?.securityDeposit || 15000);

      context.user = {
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role,
        hostelName: hostelObj?.name || "Hostel Property",
        hostelAddress: (hostelObj as any)?.address || (hostelObj as any)?.city || null,
        roomNumber: roomObj?.roomNumber || "Unassigned",
        floor: roomObj?.floor || 0,
        roomType: roomObj?.type || "Standard",
        roomCapacity: roomObj?.capacity || 1,
        roomAmenities: roomObj?.amenities || ["WiFi", "Electricity", "Water"],
        roommates: roommates.length > 0 ? roommates : ["No roommates assigned"],
        monthlyRent: effectiveRent,
        securityDeposit: Number(activeBooking?.securityDeposit || 0),
        checkInDate: activeBooking?.checkIn || null,
        hostelPhone: (hostelObj as any)?.phone || null,
      };
    }

    // 2. Fetch Payments Summary & Dues
    const payments = await prisma.payment.findMany({
      where: role === 'ADMIN' ? {} : { userId },
      orderBy: { date: 'desc' },
      take: 10,
      select: {
        id: true,
        amount: true,
        date: true,
        dueDate: true,
        type: true,
        status: true,
        notes: true,
        month: true,
        year: true,
      },
    });
    context.payments = payments;
    const pending = payments.filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE');
    context.summary.pendingPayments = pending.length;
    context.summary.pendingAmount = pending.reduce((s, p) => s + Number(p.amount), 0);

    // 3. Fetch Recent Complaints & Ticket Statuses
    const complaints = await prisma.complaint.findMany({
      where: role === 'ADMIN' ? {} : { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
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

    // 4. Fetch Mess Menu (if hostel assigned)
    const effectiveHostelId = userProfile?.hostelId || userProfile?.Booking?.[0]?.Room?.hostelId;
    if (effectiveHostelId) {
      const menu = await prisma.messMenu.findMany({
        where: { hostelId: effectiveHostelId },
        take: 7,
      });
      context.messMenu = menu;
    }

    // 5. Fetch Active Notices
    const notices = await prisma.notice.findMany({
      where: effectiveHostelId ? { hostelId: effectiveHostelId } : {},
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { title: true, content: true, priority: true, createdAt: true },
    });
    context.notices = notices;

  } catch (err: any) {
    context.error = err.message;
  }

  return context;
}

export const DEFAULT_SYSTEM_PROMPT = `You are HostelAI, an intelligent, polite, and executive AI Assistant for a top-tier Hostel Management System in Pakistan.
You assist Residents, Wardens, and Admins with live DB data.
- For amounts, express in PKR (e.g. PKR 12,000).
- If the user asks in Roman Urdu (e.g., "Mera rent kitna hai?"), respond in warm, fluent Roman Urdu.
- Be concise, helpful, and structured using markdown bullet points.`;
