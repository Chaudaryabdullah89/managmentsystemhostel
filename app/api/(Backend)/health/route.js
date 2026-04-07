import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";
import transporter from "@/lib/utils/transpoter";
import os from "os";

// ─── Helper: check a Prisma model by running a fast count query ─────────────
async function checkModel(name, queryFn) {
  const start = Date.now();
  try {
    const count = await queryFn();
    return { name, status: "OK", latency: Date.now() - start, count };
  } catch (e) {
    return { name, status: "ERROR", latency: Date.now() - start, error: e.message };
  }
}

export async function GET() {
  try {
    const auth = await checkRole(["ADMIN"]);
    if (!auth.success) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    // ── 1. Database connectivity ─────────────────────────────────────────────
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

    // ── 4. Per-collection health via Prisma (no HTTP, no auth needed) ────────
    const [
      hostelsCheck,
      roomsCheck,
      bookingsCheck,
      paymentsCheck,
      usersCheck,
      complaintsCheck,
      noticesCheck,
      salariesCheck,
    ] = await Promise.all([
      checkModel("Hostels API",    () => prisma.hostel.count()),
      checkModel("Rooms API",      () => prisma.room.count()),
      checkModel("Bookings API",   () => prisma.booking.count()),
      checkModel("Payments API",   () => prisma.payment.count()),
      checkModel("Users API",      () => prisma.user.count()),
      checkModel("Complaints API", () => prisma.complaint.count()),
      checkModel("Notices API",    () => prisma.notice.count()),
      checkModel("Salaries API",   () => prisma.salary.count()),
    ]);

    // ── 5. Live aggregate counts ─────────────────────────────────────────────
    const totalUsers       = usersCheck.count       ?? 0;
    const totalHostels     = hostelsCheck.count     ?? 0;
    const totalBookings    = bookingsCheck.count    ?? 0;
    const totalPayments    = paymentsCheck.count    ?? 0;
    const pendingComplaints = await prisma.complaint.count({ where: { status: "PENDING" } });

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
          autoRent:  settings?.autoGenerateRentInvoices ?? false,
          autoSalary: settings?.autoGenerateStaffSalaries ?? false,
          lastRun:   settings?.lastCronRun ?? null,
        },
        maintenance: settings?.maintenanceMode ?? false,
        services: {
          laundry:     settings?.enableLaundry             ?? false,
          mess:        settings?.enableMess                ?? false,
          bookings:    settings?.enableGuestBookings       ?? false,
          complaints:  settings?.enableComplaintsSystem    ?? false,
          maintenance: settings?.enableMaintenanceRequests ?? false,
          refunds:     settings?.enableRefundRequests      ?? false,
          notices:     settings?.enableNoticeBoard         ?? false,
          ai:          settings?.enableAiAssistant         ?? false,
          payments:    settings?.enablePaymentProcessing   ?? false,
          emailService: settings?.enableEmailService       ?? false,
        },
        endpoints: {
          hostels:    hostelsCheck,
          rooms:      roomsCheck,
          bookings:   bookingsCheck,
          payments:   paymentsCheck,
          users:      usersCheck,
          complaints: complaintsCheck,
          notices:    noticesCheck,
          salaries:   salariesCheck,
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
        platform:     os.platform(),
        arch:         os.arch(),
        nodeVersion:  process.version,
        uptime:       Math.round(process.uptime()),
        serverUptime: Math.round(os.uptime()),
        memory: {
          free:        Math.round(freeMem  / 1024 / 1024),
          total:       Math.round(totalMem / 1024 / 1024),
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
