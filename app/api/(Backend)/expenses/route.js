import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import ExpenseServices from "@/lib/services/expenseservices/expenseservices";
import prisma from "@/lib/prisma";

export async function GET(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { searchParams } = new URL(request.url);
        const stats = searchParams.get("stats");
        const hostelId = searchParams.get("hostelId");
        const status = searchParams.get("status");
        const category = searchParams.get("category");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const submittedById = searchParams.get("submittedById");

        if (stats === "true") {
            const data = await ExpenseServices.getExpenseStats({
                hostelId: (hostelId === 'all' || hostelId === 'null' || hostelId === 'undefined') ? null : hostelId
            });
            return NextResponse.json({ success: true, data });
        }

        const expenses = await ExpenseServices.getExpenses({
            hostelId,
            status,
            category,
            startDate,
            endDate,
            submittedById
        });

        return NextResponse.json({ success: true, data: expenses });
    } catch (error) {
        console.error("API Error in Expenses GET:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const body = await request.json();
        console.log("Inbound Expense Ingress:", body);

        // Validate user existence to prevent P2003 Foreign Key Violation
        if (body.submittedById) {
            const userExists = await prisma.user.findUnique({
                where: { id: body.submittedById },
                select: { id: true }
            });
            if (!userExists) {
                return NextResponse.json({
                    success: false,
                    error: "The submitting user does not exist. Your session may be stale. Please log out and log back in."
                }, { status: 401 });
            }
        }

        // Validate hostelId exists
        if (body.hostelId && body.hostelId !== 'all') {
            const hostel = await prisma.hostel.findUnique({ where: { id: body.hostelId }, select: { id: true } });
            if (!hostel) return NextResponse.json({ success: false, error: "Target hostel does not exist." }, { status: 400 });
        }

        const expense = await ExpenseServices.createExpense(body);
        return NextResponse.json({ success: true, data: expense });
    } catch (error) {
        console.error("CRITICAL: Expense Ingress Protocol Failure:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(request) {
    const auth = await checkRole(['ADMIN', 'SUPER_ADMIN', 'WARDEN']);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const body = await request.json();
        console.log("Inbound Authorization Update:", body);
        const { id, ...data } = body;

        // Prevent P2003 by validating User IDs
        if (data.approvedById) {
            const user = await prisma.user.findUnique({ where: { id: data.approvedById }, select: { id: true } });
            if (!user) return NextResponse.json({ success: false, error: "Approving user does not exist. Please refresh." }, { status: 400 });
        }
        if (data.rejectedById) {
            const user = await prisma.user.findUnique({ where: { id: data.rejectedById }, select: { id: true } });
            if (!user) return NextResponse.json({ success: false, error: "Rejecting user does not exist. Please refresh." }, { status: 400 });
        }

        const updated = await ExpenseServices.updateExpenseStatus(id, data);
        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("CRITICAL: Authorization State Update Failure:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
