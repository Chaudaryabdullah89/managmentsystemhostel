export const dynamic = 'force-dynamic';
import BookingServices from "@/lib/services/bookingservices/bookingservices";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function GET(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return errorResponse("UserId is required", 400);
        }

        const bookings = await new BookingServices().getBookingHistoryByUserId(userId);
        return successResponse({
            message: "Booking history fetched successfully",
            bookings: bookings,
        });
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}
