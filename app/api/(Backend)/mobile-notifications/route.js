import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const guard = await requireAuth();
        if (!guard.ok) return guard.response;
        const user = guard.user;

        if (user.role !== "ADMIN" && user.role !== "WARDEN") {
            return errorResponse("Forbidden: Access denied.", 403);
        }

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));
        const skip = (page - 1) * limit;

        const where = {};

        if (user.role === "WARDEN") {
            // Resolve Warden's hostel ID
            let wardenHostelId = user.hostelId;
            if (!wardenHostelId) {
                const profile = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: { hostelId: true }
                });
                wardenHostelId = profile?.hostelId;
            }

            // Wardens can see notifications they sent, OR notifications targeted to their hostel
            where.OR = [
                { sentById: user.id },
                ...(wardenHostelId ? [{ targetHostelId: wardenHostelId }] : [])
            ];
        }

        const [notifications, total] = await Promise.all([
            prisma.mobileNotification.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    body: true,
                    targetType: true,
                    targetHostelId: true,
                    targetRole: true,
                    recipientCount: true,
                    createdAt: true,
                    sentBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true
                        }
                    },
                    hostel: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit
            }),
            prisma.mobileNotification.count({ where })
        ]);

        return successResponse({
            data: notifications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("[API] GET /api/mobile-notifications - Error:", error);
        return errorResponse(error.message, 500);
    }
}

export async function POST(request) {
    try {
        const guard = await requireAuth();
        if (!guard.ok) return guard.response;
        const currentUser = guard.user;

        if (currentUser.role !== "ADMIN" && currentUser.role !== "WARDEN") {
            return errorResponse("Forbidden: Access denied.", 403);
        }

        const body = await request.json();
        const { title, body: content, targetType, targetHostelId, targetRole, userIds } = body;

        if (!title || !title.trim() || !content || !content.trim()) {
            return errorResponse("Title and Body are required parameters.", 400);
        }

        // Resolve Warden details if applicable
        let wardenHostelId = null;
        if (currentUser.role === "WARDEN") {
            wardenHostelId = currentUser.hostelId;
            if (!wardenHostelId) {
                const profile = await prisma.user.findUnique({
                    where: { id: currentUser.id },
                    select: { hostelId: true }
                });
                wardenHostelId = profile?.hostelId;
            }

            if (!wardenHostelId) {
                return errorResponse("Forbidden: Warden must belong to a hostel to send notifications.", 403);
            }
        }

        // Build target users search criteria
        const userWhere = {
            pushToken: { not: null }
        };

        let finalTargetHostelId = targetHostelId;

        const cleanUserIds = (userIds || []).filter(id => id && typeof id === "string");

        // Apply tenant and target logic
        if (currentUser.role === "WARDEN") {
            // Wardens can only send to their own hostel
            finalTargetHostelId = wardenHostelId;

            if (targetType === "specific_users") {
                // Ensure specific users belong to the Warden's hostel
                userWhere.id = { in: cleanUserIds };
                userWhere.OR = [
                    { hostelId: wardenHostelId },
                    { ResidentProfile: { currentHostelId: wardenHostelId } }
                ];
            } else if (targetType === "role" || targetType === "hostel_role") {
                if (targetRole) userWhere.role = targetRole;
                userWhere.OR = [
                    { hostelId: wardenHostelId },
                    { ResidentProfile: { currentHostelId: wardenHostelId } }
                ];
            } else {
                // targetType === "all" or "hostel"
                userWhere.OR = [
                    { hostelId: wardenHostelId },
                    { ResidentProfile: { currentHostelId: wardenHostelId } }
                ];
            }
        } else {
            // ADMIN logic
            if (targetType === "specific_users") {
                userWhere.id = { in: cleanUserIds };
            } else {
                if (targetHostelId && targetHostelId !== "all") {
                    userWhere.OR = [
                        { hostelId: targetHostelId },
                        { ResidentProfile: { currentHostelId: targetHostelId } }
                    ];
                }
                if (targetRole && targetRole !== "all") {
                    userWhere.role = targetRole;
                }
            }
        }

        // Fetch users with tokens
        const recipients = await prisma.user.findMany({
            where: userWhere,
            select: {
                id: true,
                pushToken: true
            }
        });

        const tokens = recipients.map(r => r.pushToken).filter(Boolean);

        if (tokens.length > 0) {
            // Infer the screen destination based on the notification title
            let targetScreen = "notices";
            const lowerTitle = title.toLowerCase();
            if (lowerTitle.includes("payment") || lowerTitle.includes("due") || lowerTitle.includes("fee") || lowerTitle.includes("invoice")) {
                targetScreen = "payments";
            } else if (lowerTitle.includes("complaint") || lowerTitle.includes("ticket") || lowerTitle.includes("support")) {
                targetScreen = "support";
            }

            // Expo recommends batching notifications in chunks of 100
            const chunkSize = 100;
            for (let i = 0; i < tokens.length; i += chunkSize) {
                const chunk = tokens.slice(i, i + chunkSize);
                const expoMessages = chunk.map(token => ({
                    to: token,
                    sound: "default",
                    title: title,
                    body: content.length > 150 ? content.substring(0, 150) + "..." : content,
                    data: { 
                        title, 
                        body: content,
                        screen: targetScreen
                    }
                }));

                try {
                    const response = await fetch("https://exp.host/--/api/v2/push/send", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(expoMessages)
                    });
                    if (!response.ok) {
                        const errText = await response.text();
                        console.error(`[Push Notification] Expo API error: Status ${response.status} - ${errText}`);
                    }
                } catch (fetchErr) {
                    console.error("[Push Notification] Failed to post chunk to Expo:", fetchErr.message);
                }
            }
        }

        // Save mobile notification log in DB
        const savedNotif = await prisma.mobileNotification.create({
            data: {
                title,
                body: content,
                targetType,
                targetHostelId: (targetType === "hostel" || targetType === "hostel_role" || currentUser.role === "WARDEN") ? finalTargetHostelId : null,
                targetRole: (targetType === "role" || targetType === "hostel_role") ? targetRole : null,
                recipientCount: tokens.length,
                sentById: currentUser.id
            },
            include: {
                sentBy: {
                    select: {
                        name: true,
                        role: true
                    }
                },
                hostel: {
                    select: {
                        name: true
                    }
                }
            }
        });

        return successResponse({
            message: `Notification dispatched successfully to ${tokens.length} devices.`,
            notification: savedNotif
        });
    } catch (error) {
        console.error("[API] POST /api/mobile-notifications - Error:", error);
        return errorResponse(error.message, 500);
    }
}

export async function DELETE(request) {
    try {
        const guard = await requireAuth();
        if (!guard.ok) return guard.response;
        const currentUser = guard.user;

        if (currentUser.role !== "ADMIN" && currentUser.role !== "WARDEN") {
            return errorResponse("Forbidden: Access denied.", 403);
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return errorResponse("Bad Request: Missing notification ID.", 400);
        }

        // Fetch log details to check permissions
        const log = await prisma.mobileNotification.findUnique({
            where: { id }
        });

        if (!log) {
            return errorResponse("Not Found: Notification log not found.", 44);
        }

        // Security check: Wardens can ONLY delete logs they personally sent
        if (currentUser.role === "WARDEN" && log.sentById !== currentUser.id) {
            return errorResponse("Forbidden: Wardens can only delete their own dispatched notifications.", 403);
        }

        // Perform deletion
        await prisma.mobileNotification.delete({
            where: { id }
        });

        return successResponse({
            message: "Notification log deleted successfully."
        });
    } catch (error) {
        console.error("[API] DELETE /api/mobile-notifications - Error:", error);
        return errorResponse(error.message, 500);
    }
}

