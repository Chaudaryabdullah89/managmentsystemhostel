import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";
import transporter from "@/lib/utils/transpoter";
import os from "os";

// ─── Helper: ping an internal API endpoint ─────────────────────────────────
async function pingEndpoint(url, baseUrl) {
  const start = Date.now();
  try {
    const res = await fetch(`${baseUrl}${url}`, {
      method: "GET",
      headers: { "x-internal-health-check": "1" },
      signal: AbortSignal.timeout(5000),
    });
    return {
      status: res.status >= 200 && res.status < 500 ? "OK" : "ERROR",
      httpStatus: res.status,
      latency: Date.now() - start,
    };
  } catch (e) {
    return { status: "ERROR", httpStatus: null, latency: Date.now() - start, error: e.message };
  }
}

export async function GET(req) {
  try {
    const auth = await checkRole(["ADMIN"]);
    if (!auth.success) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const baseUrl = req.headers.get("origin") || `http://localhost:${process.env.PORT || 3000}`;

    // ── 1. Database ─────────────────────────────────────────────────────────
    let dbStatus = "HEALTHY";
    let dbLatency = 0;
    let dbError = null;
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
    } catch (e) {
      dbStatus = "UNHEALTHY";
      dbError = e.message;
    }

    // ── 2. Email / SMTP ──────────────────────────────────────────────────────
    let emailStatus = "UNHEALTHY";
    let emailError = null;
    try {
      await transporter.verify();
      emailStatus = "HEALTHY";
    } catch (e) {
      emailError = e.message;
    }

    // ── 3. System Settings ───────────────────────────────────────────────────
    const settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });

    // ── 4. Live API Endpoint Checks ──────────────────────────────────────────
    const [
      hostelsCheck,
      roomsCheck,
      bookingsCheck,
      paymentsCheck,
      usersCheck,
      complaintsCheck,
      noticesCheck,
      settingsCheck,
    ] = await Promise.all([
      pingEndpoint("/api/hostels", baseUrl),
      pingEndpoint("/api/rooms", baseUrl),
      pingEndpoint("/api/bookings", baseUrl),
      pingEndpoint("/api/payments", baseUrl),
      pingEndpoint("/api/users", baseUrl),
      pingEndpoint("/api/complaints", baseUrl),
      pingEndpoint("/api/notices", baseUrl),
      pingEndpoint("/api/settings", baseUrl),
    ]);

    // ── 5. Live counts from database ─────────────────────────────────────────
    const [totalUsers, totalBookings, totalPayments, totalHostels, pendingComplaints] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count(),
      prisma.payment.count(),
      prisma.hostel.count(),
      prisma.complaint.count({ where: { status: "OPEN" } }),
    ]);

    // ── 6. Server Info ───────────────────────────────────────────────────────
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const memUsedPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

    const overall = dbStatus === "HEALTHY" && emailStatus === "HEALTHY" ? "HEALTHY" : "DEGRADED";

    return NextResponse.json({
      success: true,
      checkedAt: new Date().toISOString(),
      health: {
        overall,
        database: {
          status: dbStatus,
          latency: dbLatency,
          error: dbError,
        },
        email: {
          status: emailStatus,
          account: process.env.EMAIL_USER || "Not configured",
          error: emailError,
        },
        automation: {
          autoRent: settings?.autoGenerateRentInvoices ?? false,
          autoSalary: settings?.autoGenerateStaffSalaries ?? false,
          lastRun: settings?.lastCronRun ?? null,
        },
        maintenance: settings?.maintenanceMode ?? false,
        services: {
          laundry: settings?.enableLaundry ?? false,
          mess: settings?.enableMess ?? false,
          bookings: settings?.enableGuestBookings ?? false,
          complaints: settings?.enableComplaintsSystem ?? false,
          maintenance: settings?.enableMaintenanceRequests ?? false,
          refunds: settings?.enableRefundRequests ?? false,
          notices: settings?.enableNoticeBoard ?? false,
          ai: settings?.enableAiAssistant ?? false,
          payments: settings?.enablePaymentProcessing ?? false,
          emailService: settings?.enableEmailService ?? false,
        },
        endpoints: {
          hostels:    { ...hostelsCheck,   name: "Hostels API" },
          rooms:      { ...roomsCheck,     name: "Rooms API" },
          bookings:   { ...bookingsCheck,  name: "Bookings API" },
          payments:   { ...paymentsCheck,  name: "Payments API" },
          users:      { ...usersCheck,     name: "Users API" },
          complaints: { ...complaintsCheck, name: "Complaints API" },
          notices:    { ...noticesCheck,   name: "Notices API" },
          settings:   { ...settingsCheck,  name: "Settings API" },
        },
      },
      stats: {
        totalUsers,
        totalHostels,
        totalBookings,
        totalPayments,
        pendingComplaints,
      },
      server: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        uptime: Math.round(process.uptime()),
        serverUptime: Math.round(os.uptime()),
        memory: {
          free: Math.round(freeMem / 1024 / 1024),
          total: Math.round(totalMem / 1024 / 1024),
          usedPercent: memUsedPercent,
        },
        loadAvg: os.loadavg().map((v) => parseFloat(v.toFixed(2))),
      },
    });
  } catch (error) {
    console.error("GET /api/health error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
