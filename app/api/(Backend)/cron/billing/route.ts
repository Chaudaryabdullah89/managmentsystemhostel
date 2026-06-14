import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { isServiceEnabled } from "@/lib/permissions"; // Assuming it checks SystemSettings

export async function GET(request: NextRequest) {
    // ── 1. Secure the Cron Route ─────────────────────────────────────────
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return errorResponse("Unauthorized cron trigger", 401);
    }

    // ── 2. Check System Settings ─────────────────────────────────────────
    const autoGenerateRentInvoices = await isServiceEnabled("autoGenerateRentInvoices");
    if (!autoGenerateRentInvoices) {
        return successResponse({ message: "Automated billing is disabled in System Settings. Skipping." });
    }

    try {
        const currentDate = new Date();
        const monthIndex = currentDate.getMonth(); // 0 = Jan, 1 = Feb
        const year = currentDate.getFullYear();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonthName = monthNames[monthIndex];

        // ── 3. Find Active Bookings ──────────────────────────────────────────
        const activeBookings = await prisma.booking.findMany({
            where: {
                status: { in: ["CONFIRMED", "CHECKED_IN"] },
                monthlyRent: { gt: 0 }
            },
            include: { User: true }
        });

        const logs: any[] = [];
        let generatedCount = 0;

        // ── 4. Generate Invoices ─────────────────────────────────────────────
        for (const booking of activeBookings) {
            // Check if payment already exists for this month/year to prevent duplicates
            const existingPayment = await prisma.payment.findFirst({
                where: {
                    userId: booking.userId,
                    bookingId: booking.id,
                    type: "MONTHLY_RENT",
                    month: currentMonthName,
                    year: year
                }
            });

            if (!existingPayment) {
                // Calculate due date (10th of the current month)
                const dueDate = new Date(year, monthIndex, 10);

                await prisma.payment.create({
                    data: {
                        userId: booking.userId,
                        bookingId: booking.id,
                        amount: booking.monthlyRent || 0,
                        type: "MONTHLY_RENT",
                        status: "PENDING",
                        month: currentMonthName,
                        year: year,
                        dueDate: dueDate,
                        notes: `Automated rent generation for ${currentMonthName} ${year}`
                    }
                });

                logs.push({ userId: booking.userId, email: booking.User.email, amount: booking.monthlyRent });
                generatedCount++;
            }
        }

        // ── 5. Save Billing Log ──────────────────────────────────────────────
        await prisma.billingLog.create({
            data: {
                month: monthIndex + 1,
                year: year,
                type: "MONTHLY_RENT",
                status: "SUCCESS",
                logs: JSON.stringify({ generatedCount, details: logs })
            }
        });

        return successResponse({
            message: `Successfully generated ${generatedCount} rent invoices for ${currentMonthName} ${year}`,
            generatedCount
        });

    } catch (error: any) {
        console.error("[CRON] /api/cron/billing - Error:", error);

        await prisma.billingLog.create({
            data: {
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                type: "MONTHLY_RENT",
                status: "FAILED",
                logs: JSON.stringify({ error: error.message || "Unknown error" })
            }
        });

        return errorResponse("Failed to run automated billing.", 500);
    }
}
