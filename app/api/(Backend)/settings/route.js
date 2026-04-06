import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";

const DEFAULT_SETTINGS = {
  // Maintenance
  maintenanceMode: false,
  maintenanceMessage: "",

  // Core Services
  enableLaundry: true,
  enableMess: true,
  enableGuestBookings: true,
  enableComplaintsSystem: true,
  enableMaintenanceRequests: true,
  enableRefundRequests: true,
  enableNoticeBoard: true,
  enableAiAssistant: true,
  enablePaymentProcessing: true,

  // Email Services
  enableEmailService: true,
  enablePasswordResetEmails: true,
  enableBookingEmails: true,
  enablePaymentEmails: true,
  enableComplaintEmails: true,
  enableNoticeEmails: true,
  enableWelcomeEmails: true,
  autoGenerateRentInvoices: true,
  autoGenerateStaffSalaries: true,
};

export async function GET() {
  try {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: "global" },
    });

    if (!settings) {
      settings = DEFAULT_SETTINGS;
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const auth = await checkRole(["ADMIN"]);
    if (!auth.success) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();

    // Whitelist all allowed fields
    const allowed = Object.keys(DEFAULT_SETTINGS);
    const data = {};
    for (const key of allowed) {
      if (key in body) {
        data[key] = body[key];
      }
    }

    const settings = await prisma.systemSettings.upsert({
      where: { id: "global" },
      update: data,
      create: { id: "global", ...DEFAULT_SETTINGS, ...data },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error", error: String(error) },
      { status: 500 }
    );
  }
}
