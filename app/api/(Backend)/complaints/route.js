export const dynamic = "force-dynamic";
import { checkRole } from "@/lib/checkRole";
import { isServiceEnabled, hasPermission } from "@/lib/permissions";
import { NextResponse } from "next/server";
import ComplaintServices from "@/lib/services/complaintservices/complaintservices";
import { prisma } from "@/lib/prisma";

const complaintServices = new ComplaintServices();

export async function GET(request) {
  const auth = await checkRole([]);
  if (!auth.success)
    return NextResponse.json(
      { success: false, message: auth.error },
      { status: auth.status },
    );

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
      return NextResponse.json({ success: true, data: complaintStats });
    }

    let filter = {};
    if (userId) filter.userId = userId;
    if (hostelId) filter.hostelId = hostelId;

    const assignedToId = searchParams.get("assignedToId");
    if (assignedToId) filter.assignedToId = assignedToId;

    const complaints = await complaintServices.getComplaints(filter);
    return NextResponse.json({ success: true, data: complaints });
  } catch (error) {
    console.error("API Error in Complaints GET:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  // Guard: complaints system must be enabled
  if (!(await isServiceEnabled("enableComplaintsSystem"))) {
    return NextResponse.json(
      {
        success: false,
        message:
          "The complaints service is currently disabled. by administrator.",
      },
      { status: 503 },
    );
  }

  const auth = await checkRole([]);
  if (!auth.success)
    return NextResponse.json(
      { success: false, message: auth.error },
      { status: auth.status },
    );

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

    const complaint = await complaintServices.createComplaint(body);
    return NextResponse.json({ success: true, data: complaint });
  } catch (error) {
    console.error("API Error in Complaints POST:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  const auth = await checkRole([]);
  if (!auth.success)
    return NextResponse.json(
      { success: false, message: auth.error },
      { status: auth.status },
    );

  if (!await hasPermission('manage_complaints')) {
    return NextResponse.json({ success: false, message: "Forbidden: You do not have permission to update complaints." }, { status: 403 });
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
        return NextResponse.json(
          {
            success: false,
            error:
              "Access Denied: You cannot manage complaints for other hostels.",
          },
          { status: 403 },
        );
      }
    }

    const complaint = await complaintServices.updateComplaintStatus(
      id,
      status,
      resolutionNotes,
      assignedToId,
    );
    return NextResponse.json({ success: true, data: complaint });
  } catch (error) {
    console.error("API Error in Complaints PUT:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
