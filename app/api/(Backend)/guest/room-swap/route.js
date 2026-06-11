import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function POST(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const userId = guard.user?.id || guard.user?.userId || guard.user?.sub;

    try {
        const { toRoomId, reason } = await request.json();

        if (!toRoomId || !reason) {
            return errorResponse("Missing required fields: toRoomId, reason", 400);
        }

        // Find resident's active room from bookings
        const activeBooking = await prisma.booking.findFirst({
            where: {
                userId,
                status: { in: ['CONFIRMED', 'CHECKED_IN'] }
            },
            select: { roomId: true }
        });

        if (!activeBooking) {
            return errorResponse("No active residency booking found. You must be checked-in to request a room swap.", 400);
        }

        const fromRoomId = activeBooking.roomId;

        if (fromRoomId === toRoomId) {
            return errorResponse("Destination room cannot be the same as your current room.", 400);
        }

        // Verify target room exists
        const targetRoom = await prisma.room.findUnique({
            where: { id: toRoomId },
            select: { status: true, capacity: true, Booking: { where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } } } }
        });

        if (!targetRoom) {
            return errorResponse("Target room does not exist.", 404);
        }

        if (targetRoom.Booking.length >= targetRoom.capacity) {
            return errorResponse("Target room is at full capacity.", 400);
        }

        // Create room swap request
        const swapRequest = await prisma.roomSwapRequest.create({
            data: {
                userId,
                fromRoomId,
                toRoomId,
                reason,
                status: "PENDING"
            }
        });

        return successResponse({
            message: "Room swap request submitted successfully",
            swapRequest
        });

    } catch (error) {
        console.error("POST /api/guest/room-swap error:", error);
        return errorResponse("Failed to submit room swap request", 500);
    }
}

export async function GET(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const userId = guard.user?.id || guard.user?.userId || guard.user?.sub;
    const role = guard.user?.role;

    try {
        const { searchParams } = new URL(request.url);
        const hostelIdInput = searchParams.get("hostelId");

        let requests;

        if (role === 'ADMIN' || role === 'WARDEN') {
            let filter = {};
            if (role === 'WARDEN') {
                const warden = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { hostelId: true }
                });
                const hostelId = warden?.hostelId;
                if (hostelId) {
                    filter = {
                        FromRoom: { hostelId }
                    };
                }
            } else if (hostelIdInput && hostelIdInput !== 'all') {
                filter = {
                    FromRoom: { hostelId: hostelIdInput }
                };
            }

            requests = await prisma.roomSwapRequest.findMany({
                where: filter,
                include: {
                    User: {
                        select: { name: true, email: true, phone: true }
                    },
                    FromRoom: {
                        select: { roomNumber: true, Hostel: { select: { name: true } } }
                    },
                    ToRoom: {
                        select: { roomNumber: true }
                    }
                },
                orderBy: { createdAt: "desc" }
            });
        } else {
            // Residents can only view their own requests
            requests = await prisma.roomSwapRequest.findMany({
                where: { userId },
                include: {
                    FromRoom: {
                        select: { roomNumber: true, Hostel: { select: { name: true } } }
                    },
                    ToRoom: {
                        select: { roomNumber: true }
                    }
                },
                orderBy: { createdAt: "desc" }
            });
        }

        return successResponse({ requests });

    } catch (error) {
        console.error("GET /api/guest/room-swap error:", error);
        return errorResponse("Failed to load room swap requests", 500);
    }
}

// PUT: Warden/Admin approve or reject the request
export async function PUT(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const role = guard.user?.role;
    const wardenId = guard.user?.id || guard.user?.userId || guard.user?.sub;

    if (role !== 'ADMIN' && role !== 'WARDEN') {
        return errorResponse("Forbidden", 403);
    }

    try {
        const { requestId, status } = await request.json();

        if (!requestId || !['APPROVED', 'REJECTED'].includes(status)) {
            return errorResponse("Missing or invalid parameters: requestId, status", 400);
        }

        const swapReq = await prisma.roomSwapRequest.findUnique({
            where: { id: requestId },
            include: { FromRoom: true, ToRoom: true }
        });

        if (!swapReq) {
            return errorResponse("Room swap request not found", 404);
        }

        if (swapReq.status !== 'PENDING') {
            return errorResponse("This swap request is already processed.", 400);
        }

        if (status === 'REJECTED') {
            const updated = await prisma.roomSwapRequest.update({
                where: { id: requestId },
                data: { status: 'REJECTED' }
            });
            return successResponse({ message: "Swap request rejected", request: updated });
        }

        // APPROVED path: Execute swap inside a prisma transaction
        const result = await prisma.$transaction(async (tx) => {
            // Find active booking for the user in the 'fromRoom'
            const activeBooking = await tx.booking.findFirst({
                where: {
                    userId: swapReq.userId,
                    roomId: swapReq.fromRoomId,
                    status: { in: ['CONFIRMED', 'CHECKED_IN'] }
                }
            });

            if (!activeBooking) {
                throw new Error("Active booking for target user not found. User might have checked out.");
            }

            // Verify target room capacity once more in transaction
            const targetRoomBookings = await tx.booking.count({
                where: {
                    roomId: swapReq.toRoomId,
                    status: { in: ['CONFIRMED', 'CHECKED_IN'] }
                }
            });

            if (targetRoomBookings >= swapReq.ToRoom.capacity) {
                throw new Error("Target room has since filled up.");
            }

            // 1. Update active booking to point to target room
            await tx.booking.update({
                where: { id: activeBooking.id },
                data: { roomId: swapReq.toRoomId }
            });

            // 2. Adjust target room occupancy status if full
            const finalTargetRoomBookings = targetRoomBookings + 1;
            if (finalTargetRoomBookings >= swapReq.ToRoom.capacity) {
                await tx.room.update({
                    where: { id: swapReq.toRoomId },
                    data: { status: 'OCCUPIED' }
                });
            }

            // 3. Set fromRoom status to AVAILABLE since one person left
            await tx.room.update({
                where: { id: swapReq.fromRoomId },
                data: { status: 'AVAILABLE' }
            });

            // 4. Update swap request status
            return await tx.roomSwapRequest.update({
                where: { id: requestId },
                data: { status: 'APPROVED' }
            });
        });

        return successResponse({
            message: "Room swap request approved and executed successfully.",
            request: result
        });

    } catch (error) {
        console.error("PUT /api/guest/room-swap error:", error);
        return errorResponse(error.message || "Failed to process room swap", 500);
    }
}
