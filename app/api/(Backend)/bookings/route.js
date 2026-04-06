export const dynamic = 'force-dynamic';
import { checkRole } from '@/lib/checkRole';
import { isServiceEnabled } from '@/lib/permissions';
import { NextResponse } from "next/server";
import BookingServices from "@/lib/services/bookingservices/bookingservices";
import { sendEmail } from "@/lib/utils/sendmail";
import { bookingCreatedEmail } from "@/lib/utils/emailTemplates";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

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

        return NextResponse.json({
            message: "Bookings fetched successfully",
            data: bookings,
            success: true
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    // Guard: guest bookings can be disabled globally by admin
    if (!await isServiceEnabled('enableGuestBookings')) {
        return NextResponse.json({ success: false, message: 'Guest booking requests are currently closed.' }, { status: 503 });
    }

    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

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
                    return NextResponse.json({ success: false, error: "Access Denied: You cannot create bookings for other hostels." }, { status: 403 });
                }
            }
        }

        const booking = await new BookingServices().createBooking(body);

        return NextResponse.json({
            message: "Booking created successfully",
            data: booking,
            success: true
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
