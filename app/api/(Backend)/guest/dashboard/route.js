export const dynamic = 'force-dynamic';
import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function GET() {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const userId = guard.user?.id || guard.user?.userId || guard.user?.sub;

    if (!userId) {
        return errorResponse("Unauthorized", 401);
    }

    try {
        // Fetch user basic profile to resolve hostelId and role for notices
        const userProfile = await prisma.user.findUnique({
            where: { id: userId },
            select: { hostelId: true, role: true }
        });

        const hostelId = userProfile?.hostelId;
        const viewerRole = userProfile?.role;

        // Fetch bookings, payments, complaints, and notices in parallel on the server
        const [bookings, payments, complaints, notices] = await Promise.all([
            // 1. Bookings
            prisma.booking.findMany({
                where: { userId },
                select: {
                    id: true,
                    status: true,
                    checkIn: true,
                    checkOut: true,
                    totalAmount: true,
                    securityDeposit: true,
                    monthlyRent: true,
                    uid: true,
                    Room: {
                        select: {
                            id: true,
                            roomNumber: true,
                            floor: true,
                            type: true,
                            capacity: true,
                            price: true,
                            status: true,
                            amenities: true,
                            images: true,
                            Hostel: {
                                select: {
                                    id: true,
                                    name: true,
                                    address: true,
                                    city: true,
                                    phone: true,
                                    email: true,
                                    completeaddress: true,
                                    messavailable: true,
                                    laundaryavailable: true,
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),

            // 2. Payments (Take recent 10 for dashboard preview)
            prisma.payment.findMany({
                where: { userId },
                select: {
                    id: true,
                    amount: true,
                    status: true,
                    method: true,
                    type: true,
                    month: true,
                    year: true,
                    date: true,
                    notes: true,
                    receiptUrl: true,
                    uid: true,
                },
                orderBy: { date: 'desc' },
                take: 10
            }),

            // 3. Complaints
            prisma.complaint.findMany({
                where: { userId },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    category: true,
                    priority: true,
                    status: true,
                    uid: true,
                    createdAt: true,
                    images: true,
                    resolutionNotes: true,
                    resolvedAt: true,
                    assignedToId: true,
                    User_Complaint_assignedToIdToUser: {
                        select: { id: true, name: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),

            // 4. Notices
            prisma.notice.findMany({
                where: {
                    isActive: true,
                    AND: [
                        {
                            OR: [
                                { hostelId: null },
                                hostelId ? { hostelId } : { hostelId: null }
                            ]
                        },
                        viewerRole ? {
                            OR: [
                                { targetRoles: { isEmpty: true } },
                                { targetRoles: { has: viewerRole } }
                            ]
                        } : {}
                    ]
                },
                select: {
                    id: true,
                    title: true,
                    content: true,
                    priority: true,
                    category: true,
                    createdAt: true,
                    author: {
                        select: { name: true, role: true, image: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 5
            })
        ]);

        return successResponse({
            bookings,
            payments,
            complaints,
            notices
        });

    } catch (error) {
        console.error("[API] GET /api/guest/dashboard error:", error);
        return errorResponse("Failed to load dashboard data", 500);
    }
}
