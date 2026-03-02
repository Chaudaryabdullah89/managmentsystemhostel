import { checkRole } from '@/lib/checkRole';

import { NextResponse } from "next/server";
import BookingServices from "@/lib/services/bookingservices/bookingservices";

const bookingServices = new BookingServices();

export async function GET(request, { params }) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { bookingId } = await params;
        if (!bookingId) {
            return NextResponse.json({ success: false, error: "Booking ID is required" }, { status: 400 });
        }

        const booking = await bookingServices.getBookingById(bookingId);

        if (!booking) {
            return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
        }

        // Security: Wardens can ONLY see their own hostel's bookings
        if (auth.user.role === 'WARDEN') {
            let wardenHostelId = auth.user.hostelId;
            if (!wardenHostelId) {
                const wardenProfile = await prisma.user.findUnique({
                    where: { id: auth.user.userId || auth.user.id },
                    select: { hostelId: true }
                });
                wardenHostelId = wardenProfile?.hostelId;
            }

            if (booking.Room?.hostelId !== wardenHostelId) {
                return NextResponse.json({ success: false, error: "Access Denied: You cannot view bookings from other hostels." }, { status: 403 });
            }
        }

        return NextResponse.json({ success: true, booking });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { bookingId } = await params;
        const data = await request.json();

        if (!bookingId) {
            return NextResponse.json({ success: false, error: "Booking ID is required" }, { status: 400 });
        }

        // Security: Wardens can ONLY update their own hostel's bookings
        if (auth.user.role === 'WARDEN') {
            let wardenHostelId = auth.user.hostelId;
            if (!wardenHostelId) {
                const wardenProfile = await prisma.user.findUnique({
                    where: { id: auth.user.userId || auth.user.id },
                    select: { hostelId: true }
                });
                wardenHostelId = wardenProfile?.hostelId;
            }

            const booking = await prisma.booking.findUnique({
                where: { id: bookingId },
                include: { Room: { select: { hostelId: true } } }
            });

            if (booking && booking.Room?.hostelId !== wardenHostelId) {
                return NextResponse.json({ success: false, error: "Access Denied: You cannot update bookings from other hostels." }, { status: 403 });
            }
        }

        const updatedBooking = await bookingServices.updateBooking(bookingId, data);
        return NextResponse.json({ success: true, booking: updatedBooking });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
