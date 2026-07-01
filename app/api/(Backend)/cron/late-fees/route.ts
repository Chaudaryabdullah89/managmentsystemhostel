import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { isServiceEnabled } from "@/lib/permissions";
import { requireRoles } from "@/lib/apiAuth";

const LATE_FEE_AMOUNT = 500; // Fixed late fee amount. Could be moved to SystemSettings in the future.

export async function GET(request: NextRequest) {
    // ── 1. Secure the Cron Route ─────────────────────────────────────────
    const authHeader = request.headers.get("authorization");
    const isCronSecretValid = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isCronSecretValid) {
        const guard = await requireRoles(['ADMIN', 'WARDEN']);
        if (!guard.ok) {
            return errorResponse("Unauthorized: Admin/Warden session or valid CRON_SECRET required", 401);
        }
    }

    // ── 2. Check System Settings ─────────────────────────────────────────
    const autoGenerateRentInvoices = await isServiceEnabled("autoGenerateRentInvoices");
    if (!autoGenerateRentInvoices) {
        return successResponse({ message: "Automated billing is disabled. Skipping late fees." });
    }

    try {
        const currentDate = new Date();
        const monthIndex = currentDate.getMonth(); 
        const year = currentDate.getFullYear();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonthName = monthNames[monthIndex];

        // ── 3. Find Overdue Payments ─────────────────────────────────────────
        const overduePayments = await prisma.payment.findMany({
            where: {
                type: "MONTHLY_RENT",
                status: "PENDING",
                dueDate: { lte: currentDate }, // Due date has passed
                month: currentMonthName,
                year: year
            },
            include: { User: true }
        });

        const logs: any[] = [];
        let generatedCount = 0;

        // ── 4. Generate Late Fees ────────────────────────────────────────────
        for (const payment of overduePayments) {
            // Check if a late fee was already generated for this specific rent payment
            const existingLateFee = await prisma.payment.findFirst({
                where: {
                    userId: payment.userId,
                    bookingId: payment.bookingId,
                    type: "LATE_FEE",
                    month: currentMonthName,
                    year: year
                }
            });

            if (!existingLateFee) {
                // Update original payment status to OVERDUE
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: { status: "OVERDUE" }
                });

                // Create new late fee payment
                await prisma.payment.create({
                    data: {
                        userId: payment.userId,
                        bookingId: payment.bookingId,
                        amount: LATE_FEE_AMOUNT,
                        type: "LATE_FEE",
                        status: "PENDING",
                        month: currentMonthName,
                        year: year,
                        notes: `Late fee for overdue ${currentMonthName} ${year} rent`
                    }
                });

                logs.push({ userId: payment.userId, email: payment.User.email, originalPaymentId: payment.id });
                generatedCount++;
            }
        }

        // ── 5. Save Billing Log ──────────────────────────────────────────────
        await prisma.billingLog.create({
            data: {
                month: monthIndex + 1,
                year: year,
                type: "LATE_FEES",
                status: "SUCCESS",
                logs: JSON.stringify({ generatedCount, details: logs })
            }
        });

        return successResponse({
            message: `Successfully generated ${generatedCount} late fees for ${currentMonthName} ${year}`,
            generatedCount
        });

    } catch (error: any) {
        console.error("[CRON] /api/cron/late-fees - Error:", error);

        await prisma.billingLog.create({
            data: {
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                type: "LATE_FEES",
                status: "FAILED",
                logs: JSON.stringify({ error: error.message || "Unknown error" })
            }
        });

        return errorResponse("Failed to process late fees.", 500);
    }
}
