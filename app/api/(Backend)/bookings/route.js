import { NextResponse } from "next/server";
import BookingServices from "@/lib/services/bookingservices/bookingservices";
import { sendEmail } from "@/lib/utils/sendmail";
import { bookingCreatedEmail } from "@/lib/utils/emailTemplates";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const hostelId = searchParams.get("hostelId");

        let bookings;
        if (userId) {
            bookings = await new BookingServices().getBookingHistoryByUserId(userId);
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
    try {
        const body = await request.json();
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
