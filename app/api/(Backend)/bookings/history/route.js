import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import BookingServices from "@/lib/services/bookingservices/bookingservices";

export async function GET(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "UserId is required", success: false }, { status: 400 });
        }

        const bookings = await new BookingServices().getBookingHistoryByUserId(userId);
        return NextResponse.json({
            message: "Booking history fetched successfully",
            bookings: bookings,
            success: true
        });
    } catch (error) {
        return NextResponse.json({ error: error.message, success: false }, { status: 500 });
    }
}
