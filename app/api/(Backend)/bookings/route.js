export const dynamic = 'force-dynamic';
import { isServiceEnabled } from '@/lib/permissions';
import BookingServices from "@/lib/services/bookingservices/bookingservices";
import { sendEmail } from "@/lib/utils/sendmail";
import { bookingCreatedEmail } from "@/lib/utils/emailTemplates";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function GET(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        let hostelId = searchParams.get("hostelId");

        // Security: Wardens can ONLY see their assigned hostel's bookings
        if (auth.user.role === 'WARDEN') {
            let wardenHostelId = auth.user.hostelId;
            if (!wardenHostelId) {
                const wardenProfile = await prisma.user.findUnique({
                    where: { id: auth.user.userId || auth.user.id },
                    select: { hostelId: true }
                });
                wardenHostelId = wardenProfile?.hostelId;
            }

            if (!hostelId || hostelId !== wardenHostelId) {
                hostelId = wardenHostelId;
            }
        }

        let bookings;
        if (userId) {
            bookings = await new BookingServices().getBookingHistoryByUserId(userId);
            if (auth.user.role === 'WARDEN') {
                bookings = bookings.filter(b => b.Room?.hostelId === hostelId);
            }
        } else {
            bookings = await new BookingServices().getBookings(hostelId);
        }

        return successResponse({
            message: "Bookings fetched successfully",
            data: bookings,
        });
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}

export async function POST(request) {
    // Guard: guest bookings can be disabled globally by admin
    if (!await isServiceEnabled('enableGuestBookings')) {
        return errorResponse('Guest booking requests are currently closed.', 503);
    }

    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

    try {
        const body = await request.json();

        // Security: If warden, verify context
        if (auth.user.role === 'WARDEN') {
            let wardenHostelId = auth.user.hostelId;
            if (!wardenHostelId) {
                const wardenProfile = await prisma.user.findUnique({
                    where: { id: auth.user.userId || auth.user.id },
                    select: { hostelId: true }
                });
                wardenHostelId = wardenProfile?.hostelId;
            }

            if (body.roomId) {
                const room = await prisma.room.findUnique({
                    where: { id: body.roomId },
                    select: { hostelId: true }
                });
                if (room && room.hostelId !== wardenHostelId) {
                    return errorResponse("Access Denied: You cannot create bookings for other hostels.", 403);
                }
            }
        }

        const booking = await new BookingServices().createBooking(body);

        return successResponse({
            message: "Booking created successfully",
            data: booking,
        });
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}
