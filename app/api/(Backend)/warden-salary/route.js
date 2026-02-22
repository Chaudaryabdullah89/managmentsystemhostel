import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format } from "date-fns";

// GET /api/warden-salary?wardenId=xxx
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const wardenId = searchParams.get("wardenId");

        const where = { type: "WARDEN_SALARY" };
        if (wardenId) where.wardenId = wardenId;

        const payments = await prisma.wardenPayment.findMany({
            where,
            include: {
                Warden: {
                    select: { id: true, name: true, email: true, phone: true, hostelId: true }
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

// POST /api/warden-salary  — create a new payment record
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            wardenId,
            amount,
            basicSalary,
            bonuses = 0,
            deductions = 0,
            month,
            paymentMethod = "BANK_TRANSFER",
            paymentDate,
            notes = ""
        } = body;

        if (!wardenId || !amount || !month) {
            return NextResponse.json(
                { success: false, error: "wardenId, amount, and month are required" },
                { status: 400 }
            );
        }

        const warden = await prisma.user.findUnique({
            where: { id: wardenId },
            select: { id: true, name: true, email: true }
        });

        if (!warden) {
            return NextResponse.json({ success: false, error: "Warden not found" }, { status: 404 });
        }

        const payment = await prisma.wardenPayment.create({
            data: {
                wardenId,
                amount: Number(amount),
                basicSalary: Number(basicSalary || amount),
                bonuses: Number(bonuses),
                deductions: Number(deductions),
                month,
                paymentMethod,
                paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                notes,
                status: "PAID",
                type: "WARDEN_SALARY"
            },
            include: {
                Warden: { select: { id: true, name: true, email: true } }
            }
        });

        return NextResponse.json({
            success: true,
            message: `Salary of PKR ${Number(amount).toLocaleString()} paid to ${warden.name}`,
            payment
        });
    } catch (error) {
        console.error("Warden Salary Create Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
