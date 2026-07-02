import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function POST(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const authUser = guard.user;
    const authUserId = authUser?.id || authUser?.userId || authUser?.sub;
    const role = authUser?.role;

    try {
        const body = await request.json();
        const { toRoomId, reason, userId: inputUserId, autoApprove } = body;

        if (!toRoomId || !reason) {
            return errorResponse("Missing required fields: toRoomId, reason", 400);
        }

        // Target resident ID: Admins and Wardens can specify target user
        let targetUserId = authUserId;
        if ((role === 'ADMIN' || role === 'WARDEN') && inputUserId) {
            targetUserId = inputUserId;
        }

        // Find resident's active booking
        const activeBooking = await prisma.booking.findFirst({
            where: {
                userId: targetUserId,
                status: { in: ['CONFIRMED', 'CHECKED_IN'] }
            },
            select: { id: true, roomId: true, Room: { select: { hostelId: true } } }
        });

        if (!activeBooking) {
            return errorResponse("No active residency booking found for this user.", 400);
        }

        // Warden security check: warden can only swap within their hostel
        if (role === 'WARDEN') {
            const wardenProfile = await prisma.user.findUnique({
                where: { id: authUserId },
                select: { hostelId: true }
            });
            const wardenHostelId = wardenProfile?.hostelId;
            if (wardenHostelId && activeBooking.Room?.hostelId !== wardenHostelId) {
                return errorResponse("Security Alert: You can only initiate swaps for residents in your hostel.", 403);
            }
        }

        const fromRoomId = activeBooking.roomId;

        if (fromRoomId === toRoomId) {
            return errorResponse("Destination room cannot be the same as current room.", 400);
        }

        // Verify target room exists
        const targetRoom = await prisma.room.findUnique({
            where: { id: toRoomId },
            select: { id: true, status: true, capacity: true, Booking: { where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } } } }
        });

        if (!targetRoom) {
            return errorResponse("Target room does not exist.", 404);
        }

        if (targetRoom.Booking.length >= targetRoom.capacity) {
            return errorResponse("Target room is at full capacity.", 400);
        }

        const formattedReason = (role === 'ADMIN' || role === 'WARDEN') && !reason.startsWith("[DIRECT_TRANSFER]")
            ? `[DIRECT_TRANSFER] ${reason}`
            : reason;

        // Direct Execution (Auto Approve) by Admin/Warden
        if ((role === 'ADMIN' || role === 'WARDEN') && autoApprove) {
            const result = await prisma.$transaction(async (tx) => {
                // 1. Create swap request record as APPROVED
                const swapReq = await tx.roomSwapRequest.create({
                    data: {
                        userId: targetUserId,
                        fromRoomId,
                        toRoomId,
                        reason: formattedReason,
                        status: "APPROVED"
                    }
                });

                // 2. Update booking to point to new room
                await tx.booking.update({
                    where: { id: activeBooking.id },
                    data: { roomId: toRoomId }
                });

                // 3. Adjust target room status
                const newTargetCount = targetRoom.Booking.length + 1;
                if (newTargetCount >= targetRoom.capacity) {
                    await tx.room.update({
                        where: { id: toRoomId },
                        data: { status: 'OCCUPIED' }
                    });
                }

                // 4. Set old room to AVAILABLE
                await tx.room.update({
                    where: { id: fromRoomId },
                    data: { status: 'AVAILABLE' }
                });

                return swapReq;
            });

            return successResponse({
                message: "Room swap executed successfully.",
                swapRequest: result
            });
        }

        // Pending Request path
        const swapRequest = await prisma.roomSwapRequest.create({
            data: {
                userId: targetUserId,
                fromRoomId,
                toRoomId,
                reason: formattedReason,
                status: "PENDING"
            }
        });

        return successResponse({
            message: "Room swap request submitted successfully.",
            swapRequest
        });

    } catch (error) {
        console.error("POST /api/guest/room-swap error:", error);
        return errorResponse("Failed to process room swap request", 500);
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

            const targetRoomBookings = await tx.booking.count({
                where: {
                    roomId: swapReq.toRoomId,
                    status: { in: ['CONFIRMED', 'CHECKED_IN'] }
                }
            });

            if (targetRoomBookings >= swapReq.ToRoom.capacity) {
                throw new Error("Target room has since filled up.");
            }

            await tx.booking.update({
                where: { id: activeBooking.id },
                data: { roomId: swapReq.toRoomId }
            });

            const finalTargetRoomBookings = targetRoomBookings + 1;
            if (finalTargetRoomBookings >= swapReq.ToRoom.capacity) {
                await tx.room.update({
                    where: { id: swapReq.toRoomId },
                    data: { status: 'OCCUPIED' }
                });
            }

            await tx.room.update({
                where: { id: swapReq.fromRoomId },
                data: { status: 'AVAILABLE' }
            });

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
