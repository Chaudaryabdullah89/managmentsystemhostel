export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma";
import RoomServices from "../../../../lib/services/roomservices/roomservices";
import { requireRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function GET() {
    const guard = await requireRoles(['ADMIN', 'WARDEN', 'STAFF']);
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

    try {
        let hostelId = null;

        // Security: Wardens can ONLY see their assigned hostel's rooms
        if (auth.user.role === 'WARDEN') {
            hostelId = auth.user.hostelId;
            if (!hostelId) {
                const wardenProfile = await prisma.user.findUnique({
                    where: { id: auth.user.userId || auth.user.id },
                    select: { hostelId: true }
                });
                hostelId = wardenProfile?.hostelId;
            }
        }

        const roomData = await new RoomServices().getRooms(hostelId)
        return successResponse({
            message: "Rooms fetched successfully",
            data: roomData,
        })
    } catch (error) {
        console.error("GET Rooms Error:", error);
        return errorResponse("Failed to fetch rooms", 500)
    }
}