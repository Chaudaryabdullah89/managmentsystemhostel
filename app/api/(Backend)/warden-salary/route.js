import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { sendEmail } from "@/lib/utils/sendmail";
import { monthlyRentEmail } from "@/lib/utils/emailTemplates";
import crypto from 'crypto';

// GET /api/warden-salary
export async function GET(request) {
    const auth = await checkRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { searchParams } = new URL(request.url);
        const wardenId = searchParams.get("wardenId");
        const month = searchParams.get("month");
        const status = searchParams.get("status");
        const hostelId = searchParams.get("hostelId");

        const where = {};
        if (wardenId) where.wardenId = wardenId;
        if (month && month !== 'All') where.month = month;
        if (status && status !== 'All') where.status = status;

        if (hostelId && hostelId !== "All" && hostelId !== "all") {
            where.Warden = {
                hostelId: hostelId
            };
        }

        const payments = await prisma.wardenPayment.findMany({
            where,
            include: {
                Warden: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        hostelId: true,
                        Hostel_User_hostelIdToHostel: true,
                        basicSalary: true,
                        allowances: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json({ success: true, payments });
    } catch (error) {
        console.error("Warden Salary Fetch Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST /api/warden-salary
export async function POST(request) {
    const auth = await checkRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const body = await request.json();
        const {
            wardenId,
            amount,
            basicSalary,
            allowances = 0,
            bonuses = 0,
            deductions = 0,
            month,
            paymentMethod = "BANK_TRANSFER",
            paymentDate,
            notes = "",
            hostelId
        } = body;

        if (!month) {
            return NextResponse.json({ success: false, error: "Month is required" }, { status: 400 });
        }

        // Single Creation
        if (wardenId) {
            const warden = await prisma.user.findUnique({
                where: { id: wardenId },
                select: { id: true, name: true, email: true, basicSalary: true, allowances: true }
            });

            if (!warden) {
                return NextResponse.json({ success: false, error: "Warden not found" }, { status: 404 });
            }

            const existing = await prisma.wardenPayment.findFirst({
                where: { wardenId, month }
            });

            if (existing) {
                return NextResponse.json({ success: false, error: `Salary for ${warden.name} already exists for ${month}` }, { status: 400 });
            }

            const bSalary = basicSalary || warden.basicSalary || 0;
            const allow = allowances || warden.allowances || 0;
            const totalAmount = amount || (Number(bSalary) + Number(allow) + Number(bonuses) - Number(deductions));

            const payment = await prisma.wardenPayment.create({
                data: {
                    id: crypto.randomUUID(),
                    wardenId,
                    amount: Number(totalAmount),
                    basicSalary: Number(bSalary),
                    bonuses: Number(bonuses),
                    deductions: Number(deductions),
                    month,
                    paymentMethod,
                    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                    notes: notes || "Manual Entry",
                    status: "PAID",
                    type: "WARDEN_SALARY",
                    updatedAt: new Date()
                },
                include: {
                    Warden: { select: { id: true, name: true, email: true } }
                }
            });

            // Generate and assign UID
            const wardenPaymentUid = `WDP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
            await prisma.wardenPayment.update({
                where: { id: payment.id },
                data: { uid: wardenPaymentUid }
            });

            payment.uid = wardenPaymentUid;

            // Email Notification
            if (warden.email) {
                const [mName, yName] = month.split(" ");
                sendEmail({
                    to: warden.email,
                    subject: `Salary Disbursed — ${month} — GreenView Hostels`,
                    html: monthlyRentEmail({
                        name: warden.name,
                        amount: totalAmount,
                        month: mName || month,
                        year: yName || new Date().getFullYear(),
                        hostelName: null,
                        type: "SALARY",
                    }),
                }).catch(err => console.error("[Email] Warden salary email failed:", err));
            }

            return NextResponse.json({
                success: true,
                message: `Salary of PKR ${Number(totalAmount).toLocaleString()} paid to ${warden.name}`,
                payment
            });
        }

        // Bulk Generation Logic
        const wardenWhere = { role: 'WARDEN' };
        if (hostelId && hostelId !== 'all' && hostelId !== 'All') {
            wardenWhere.hostelId = hostelId;
        }

        const wardens = await prisma.user.findMany({
            where: wardenWhere,
            select: { id: true, name: true, email: true, basicSalary: true, allowances: true }
        });

        let createdCount = 0;
        let skippedCount = 0;

        for (const warden of wardens) {
            const existing = await prisma.wardenPayment.findFirst({
                where: { wardenId: warden.id, month }
            });

            if (existing) {
                skippedCount++;
                continue;
            }

            const bSalary = warden.basicSalary || 0;
            const allow = warden.allowances || 0;
            const totalAmount = bSalary + allow;

            const newPayment = await prisma.wardenPayment.create({
                data: {
                    id: crypto.randomUUID(),
                    wardenId: warden.id,
                    amount: totalAmount,
                    basicSalary: bSalary,
                    month,
                    status: "PAID",
                    type: "WARDEN_SALARY",
                    notes: "Automated Payroll Generation",
                    updatedAt: new Date()
                }
            });

            const wardenPaymentUid = `WDP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
            await prisma.wardenPayment.update({
                where: { id: newPayment.id },
                data: { uid: wardenPaymentUid }
            });

            if (warden.email) {
                const [mName, yName] = month.split(" ");
                sendEmail({
                    to: warden.email,
                    subject: `Salary Disbursed — ${month} — GreenView Hostels`,
                    html: monthlyRentEmail({
                        name: warden.name,
                        amount: totalAmount,
                        month: mName || month,
                        year: yName || new Date().getFullYear(),
                        hostelName: null,
                        type: "SALARY",
                    }),
                }).catch(err => console.error("[Email] Bulk Warden salary email failed:", err));
            }

            createdCount++;
        }

        return NextResponse.json({
            success: true,
            message: `Payroll generated: ${createdCount} created, ${skippedCount} skipped.`
        });

    } catch (error) {
        console.error("Warden Salary POST Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE /api/warden-salary
export async function DELETE(request) {
    const auth = await checkRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

        await prisma.wardenPayment.delete({ where: { id } });
        return NextResponse.json({ success: true, message: "Record deleted" });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PATCH /api/warden-salary (Update for Appeals, etc.)
export async function PATCH(request) {
    try {
        const body = await request.json();
        const { id, ...data } = body;

        if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

        const updated = await prisma.wardenPayment.update({
            where: { id },
            data: data
        });

        return NextResponse.json({ success: true, payment: updated });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
