export const dynamic = "force-dynamic";
import { isServiceEnabled, hasPermission } from "@/lib/permissions";
import ComplaintServices from "@/lib/services/complaintservices/complaintservices";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

const complaintServices = new ComplaintServices();

export async function GET(request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const auth = { user: guard.user };

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const hostelIdInput = searchParams.get("hostelId");
    const stats = searchParams.get("stats");

    const sanitize = (val) =>
      val === "all" || val === "null" || val === "undefined" || !val
        ? null
        : val;
    let hostelId = sanitize(hostelIdInput);

    // Security: Wardens can ONLY see their assigned hostel's complaints
    if (auth.user.role === "WARDEN") {
      let wardenHostelId = auth.user.hostelId;

      // Fallback: If hostelId is missing in JWT, fetch from DB
      if (!wardenHostelId) {
        const wardenProfile = await prisma.user.findUnique({
          where: { id: auth.user.userId || auth.user.id },
          select: { hostelId: true },
        });
        wardenHostelId = wardenProfile?.hostelId;
      }

      if (!hostelId) {
        hostelId = wardenHostelId;
      } else if (hostelId !== wardenHostelId) {
        // Prevent browsing other hostels
        hostelId = wardenHostelId;
      }
    }

    if (stats) {
      const complaintStats =
        await complaintServices.getComplaintStats(hostelId);
      return successResponse({ data: complaintStats });
    }

    let filter = {};
    if (userId) filter.userId = userId;
    if (hostelId) filter.hostelId = hostelId;

    const assignedToId = searchParams.get("assignedToId");
    if (assignedToId) filter.assignedToId = assignedToId;

    const complaints = await complaintServices.getComplaints(filter);
    return successResponse({ data: complaints });
  } catch (error) {
    console.error("API Error in Complaints GET:", error);
    return errorResponse(error.message, 500);
  }
}

export async function POST(request) {
  // Guard: complaints system must be enabled
  if (!(await isServiceEnabled("enableComplaintsSystem"))) {
    return errorResponse(
      "The complaints service is currently disabled. by administrator.",
      503,
    );
  }

  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const auth = { user: guard.user };

  try {
    const body = await request.json();

    // Security: If warden, enforce their hostel
    if (auth.user.role === "WARDEN") {
      let wardenHostelId = auth.user.hostelId;
      if (!wardenHostelId) {
        const wardenProfile = await prisma.user.findUnique({
          where: { id: auth.user.userId || auth.user.id },
          select: { hostelId: true },
        });
        wardenHostelId = wardenProfile?.hostelId;
      }
      if (wardenHostelId) {
        body.hostelId = wardenHostelId;
      }
    }

    // AI Categorization Integration
    const { categorizeComplaintWithAI } = require("@/lib/services/aiCategorizer");
    const aiResult = await categorizeComplaintWithAI(body.title, body.description);
    if (aiResult) {
      body.category = aiResult.category;
      body.priority = aiResult.priority;
    }

    const complaint = await complaintServices.createComplaint(body);
    return successResponse({ data: complaint });
  } catch (error) {
    console.error("API Error in Complaints POST:", error);
    return errorResponse(error.message, 500);
  }
}

export async function PUT(request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const auth = { user: guard.user };

  if (!await hasPermission('manage_complaints')) {
    return errorResponse("Forbidden: You do not have permission to update complaints.", 403);
  }

  try {
    const body = await request.json();
    const { id, status, resolutionNotes, assignedToId } = body;

    // Security: If warden, verify complaint belongs to their hostel
    if (auth.user.role === "WARDEN") {
      const complaint = await prisma.complaint.findUnique({
        where: { id },
        select: { hostelId: true },
      });

      let wardenHostelId = auth.user.hostelId;
      if (!wardenHostelId) {
        const wardenProfile = await prisma.user.findUnique({
          where: { id: auth.user.userId || auth.user.id },
          select: { hostelId: true },
        });
        wardenHostelId = wardenProfile?.hostelId;
      }

      if (
        complaint &&
        wardenHostelId &&
        complaint.hostelId !== wardenHostelId
      ) {
        return errorResponse(
          "Access Denied: You cannot manage complaints for other hostels.",
          403,
        );
      }
    }

    const complaint = await complaintServices.updateComplaintStatus(
      id,
      status,
      resolutionNotes,
      assignedToId,
    );
    return successResponse({ data: complaint });
  } catch (error) {
    console.error("API Error in Complaints PUT:", error);
    return errorResponse(error.message, 500);
  }
}
