export const dynamic = 'force-dynamic';
import BookingServices from "@/lib/services/bookingservices/bookingservices";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

const bookingServices = new BookingServices();

export async function GET(request, { params }) {
    const guard = await requireRoles(['ADMIN', 'WARDEN']);
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

    try {
        const { bookingId } = await params;
        if (!bookingId) {
            return errorResponse("Booking ID is required", 400);
        }

        const booking = await bookingServices.getBookingById(bookingId);

        if (!booking) {
            return errorResponse("Booking not found", 404);
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
                return errorResponse("Access Denied: You cannot view bookings from other hostels.", 403);
            }
        }

        return successResponse({ booking });
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}

export async function PUT(request, { params }) {
    const guard = await requireRoles(['ADMIN', 'WARDEN']);
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

    try {
        const { bookingId } = await params;
        const data = await request.json();

        if (!bookingId) {
            return errorResponse("Booking ID is required", 400);
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
                return errorResponse("Access Denied: You cannot update bookings from other hostels.", 403);
            }
        }

        const updatedBooking = await bookingServices.updateBooking(bookingId, data);
        return successResponse({ booking: updatedBooking });
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}

export async function DELETE(request, { params }) {
    const guard = await requireRoles(['ADMIN', 'WARDEN']);
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

    try {
        const { bookingId } = await params;

        if (!bookingId) {
            return errorResponse("Booking ID is required", 400);
        }

        // Security: Wardens can ONLY delete their own hostel's bookings
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
                return errorResponse("Access Denied: You cannot delete bookings from other hostels.", 403);
            }
        }

        await bookingServices.deleteBooking(bookingId);
        return successResponse({ message: "Booking deleted successfully" });
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}
