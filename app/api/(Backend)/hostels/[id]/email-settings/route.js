export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function GET(req, { params }) {
    const { id: hostelId } = await params;
    const guard = await requireRoles(["ADMIN", "WARDEN"]);
    if (!guard.ok) return guard.response;

    const user = guard.user;
    if (user.role === "WARDEN" && user.hostelId !== hostelId) {
        return errorResponse("Access Denied: You cannot manage other hostels.", 403);
    }

    try {
        const hostel = await prisma.hostel.findUnique({
            where: { id: hostelId },
            select: {
                smtpHost: true,
                smtpPort: true,
                smtpSecure: true,
                smtpUser: true,
                smtpPass: true,
                smtpSender: true,
            }
        });

        if (!hostel) {
            return errorResponse("Hostel not found.", 404);
        }

        return successResponse({
            emailSettings: {
                smtpHost: hostel.smtpHost || "",
                smtpPort: hostel.smtpPort || 587,
                smtpSecure: !!hostel.smtpSecure,
                smtpUser: hostel.smtpUser || "",
                smtpPass: hostel.smtpPass || "",
                smtpSender: hostel.smtpSender || "",
            }
        });
    } catch (error) {
        console.error("GET /api/hostels/[id]/email-settings error:", error);
        return errorResponse("Server Error", 500);
    }
}

export async function PUT(req, { params }) {
    const { id: hostelId } = await params;
    const guard = await requireRoles(["ADMIN", "WARDEN"]);
    if (!guard.ok) return guard.response;

    const user = guard.user;
    if (user.role === "WARDEN" && user.hostelId !== hostelId) {
        return errorResponse("Access Denied: You cannot manage other hostels.", 403);
    }

    try {
        const body = await req.json();
        const data = {};

        if ('smtpHost' in body) data.smtpHost = body.smtpHost || null;
        if ('smtpPort' in body) data.smtpPort = body.smtpPort !== null && body.smtpPort !== "" ? Number(body.smtpPort) : null;
        if ('smtpSecure' in body) data.smtpSecure = body.smtpSecure === true || body.smtpSecure === "true";
        if ('smtpUser' in body) data.smtpUser = body.smtpUser || null;
        if ('smtpPass' in body) data.smtpPass = body.smtpPass || null;
        if ('smtpSender' in body) data.smtpSender = body.smtpSender || null;

        const updatedHostel = await prisma.hostel.update({
            where: { id: hostelId },
            data,
        });

        return successResponse({
            message: "Hostel email settings updated successfully.",
            emailSettings: {
                smtpHost: updatedHostel.smtpHost,
                smtpPort: updatedHostel.smtpPort,
                smtpSecure: updatedHostel.smtpSecure,
                smtpUser: updatedHostel.smtpUser,
                smtpSender: updatedHostel.smtpSender,
            }
        });
    } catch (error) {
        console.error("PUT /api/hostels/[id]/email-settings error:", error);
        return errorResponse("Server Error", 500);
    }
}
