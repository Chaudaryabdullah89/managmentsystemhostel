export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma";
import { requireSelfOrRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function GET(request, { params }) {
    try {
        const { userId } = await params;
        const { searchParams } = new URL(request.url);
        const historyPage = Math.max(1, parseInt(searchParams.get("historyPage") || "1"));
        const historyLimit = Math.min(50, Math.max(1, parseInt(searchParams.get("historyLimit") || "10")));
        const historySkip = (historyPage - 1) * historyLimit;

        if (!userId) {
            return errorResponse("User ID is required", 400);
        }
        const guard = await requireSelfOrRoles(userId, ['ADMIN', 'WARDEN', 'STAFF']);
        if (!guard.ok) return guard.response;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                ResidentProfile: true,
                Hostel_User_hostelIdToHostel: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        phone: true,
                        email: true
                    }
                },
            }
        });

        if (!user) {
            return errorResponse("User not found", 404);
        }

        // restructure data for easier frontend consumption
        // identify active/latest and history
        const [activeBooking, historyBookings, totalHistory] = await Promise.all([
            prisma.booking.findFirst({
                where: { userId, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
                include: { Room: { include: { Hostel: { select: { name: true, address: true } } } } },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.booking.findMany({
                where: { userId, status: 'CHECKED_OUT' },
                include: { Room: { include: { Hostel: { select: { name: true, address: true } } } } },
                orderBy: { createdAt: 'desc' },
                skip: historySkip,
                take: historyLimit,
            }),
            prisma.booking.count({
                where: { userId, status: 'CHECKED_OUT' },
            }),
        ]);

        const history = historyBookings.map(b => ({
            id: b.id,
            roomNumber: b.Room?.roomNumber,
            hostelName: b.Room?.Hostel?.name,
            checkIn: b.checkIn,
            checkOut: b.checkOut,
            status: b.status
        }));

        const profileData = {
            basic: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                cnic: user.cnic,
                image: user.image,
                role: user.role,
                joinedAt: user.createdAt,
                uid: user.uid,
                regNumber: user.regNumber,
                additionalImages: Array.isArray(user?.ResidentProfile?.documents?.galleryImages)
                    ? user.ResidentProfile.documents.galleryImages
                    : []
            },
            resident: {
                ...(user.ResidentProfile || {}),
                currentResidence: user?.ResidentProfile?.documents?.currentResidence || "",
            },
            hostel: user.Hostel_User_hostelIdToHostel,
            residency: activeBooking ? {
                roomNumber: activeBooking.Room?.roomNumber,
                floor: activeBooking.Room?.floor,
                roomType: activeBooking.Room?.type,
                checkIn: activeBooking.checkIn,
                status: activeBooking.status,
                hostelName: activeBooking.Room?.Hostel?.name
            } : null,
            history: history,
            pagination: {
                historyPage,
                historyLimit,
                totalHistory,
                totalPages: Math.max(1, Math.ceil(totalHistory / historyLimit)),
            },
        };

        return successResponse({ data: profileData });

    } catch (error) {
        console.error("Error fetching user profile:", error);
        return errorResponse("Internal Server Error", 500);
    }
}
