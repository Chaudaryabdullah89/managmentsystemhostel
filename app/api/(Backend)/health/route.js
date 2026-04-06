import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";
import transporter from "@/lib/utils/transpoter";
import os from "os";

export async function GET() {
  try {
    const auth = await checkRole(["ADMIN"]);
    if (!auth.success) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    // 1. Database Health
    let dbStatus = "HEALTHY";
    let dbResponseTime = 0;
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - start;
    } catch (e) {
      dbStatus = "UNHEALTHY";
    }

    // 2. Email Service Health
    let emailStatus = "PENDING";
    try {
        await transporter.verify();
        emailStatus = "HEALTHY";
    } catch (e) {
        emailStatus = "UNHEALTHY";
    }

    // 3. System Settings & Toggles
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "global" },
    });

    // 4. System Environment
    const sysInfo = {
        platform: os.platform(),
        release: os.release(),
        uptime: os.uptime(),
        memory: {
            free: Math.round(os.freemem() / 1024 / 1024) + "MB",
            total: Math.round(os.totalmem() / 1024 / 1024) + "MB",
        },
        loadAvg: os.loadavg(),
    };

    // 5. App Version / Metadata (Optional)
    const nodeVersion = process.version;

    return NextResponse.json({
      success: true,
      health: {
        overall: (dbStatus === "HEALTHY" && emailStatus === "HEALTHY") ? "HEALTHY" : "DEGRADED",
        database: {
          status: dbStatus,
          responseTime: dbResponseTime + "ms",
        },
        email: {
          status: emailStatus,
          provider: "Gmail SMTP",
        },
        automation: {
          status: settings?.autoGenerateRentInvoices || settings?.autoGenerateStaffSalaries ? "ACTIVE" : "INACTIVE",
          lastRun: settings?.lastCronRun || null,
        }
      },
      settings,
      system: sysInfo,
      nodeVersion
    });
  } catch (error) {
    console.error("GET /api/health error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
