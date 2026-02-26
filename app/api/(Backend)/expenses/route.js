import { NextResponse } from "next/server";
import ExpenseServices from "@/lib/services/expenseservices/expenseservices";

export async function GET(request) {
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
            const data = await ExpenseServices.getExpenseStats({ hostelId });
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

        const expense = await ExpenseServices.createExpense(body);
        return NextResponse.json({ success: true, data: expense });
    } catch (error) {
        console.error("CRITICAL: Expense Ingress Protocol Failure:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const body = await request.json();
        console.log("Inbound Authorization Update:", body);
        const { id, ...data } = body;
        const updated = await ExpenseServices.updateExpenseStatus(id, data);
        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("CRITICAL: Authorization State Update Failure:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
