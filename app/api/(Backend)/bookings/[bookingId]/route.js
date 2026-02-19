
import { NextResponse } from "next/server";
import BookingServices from "@/lib/services/bookingservices/bookingservices";

const bookingServices = new BookingServices();

export async function GET(request, { params }) {
    try {
        const { bookingId } = await params;
        if (!bookingId) {
            return NextResponse.json({ success: false, error: "Booking ID is required" }, { status: 400 });
        }

        const booking = await bookingServices.getBookingById(bookingId);

        if (!booking) {
            return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, booking });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { bookingId } = await params;
        const data = await request.json();

        if (!bookingId) {
            return NextResponse.json({ success: false, error: "Booking ID is required" }, { status: 400 });
        }

        const updatedBooking = await bookingServices.updateBooking(bookingId, data);
        return NextResponse.json({ success: true, booking: updatedBooking });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
