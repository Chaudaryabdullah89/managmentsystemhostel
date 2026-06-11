import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { format, startOfMonth, subMonths } from "date-fns";

export async function GET(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const role = guard.user?.role;

    if (role !== 'ADMIN') {
        return errorResponse("Forbidden: Admin access only", 403);
    }

    try {
        const { searchParams } = new URL(request.url);
        const hostelId = searchParams.get("hostelId");

        // status PAID but also exclude SECURITY_REFUND — that is money going out (a return),
        // not revenue collected. Including it would overstate total revenue.
        const paymentFilter = { status: "PAID", type: { not: "SECURITY_REFUND" } };
        const expenseFilter = { status: { in: ["PAID", "APPROVED"] } };

        if (hostelId && hostelId !== "all") {
            paymentFilter.Booking = {
                Room: { hostelId }
            };
            expenseFilter.hostelId = hostelId;
        }

        // Fetch payments and expenses in parallel
        const [payments, expenses] = await Promise.all([
            prisma.payment.findMany({
                where: paymentFilter,
                select: {
                    amount: true,
                    date: true,
                    type: true,
                    createdAt: true
                }
            }),
            prisma.expense.findMany({
                where: expenseFilter,
                select: {
                    amount: true,
                    date: true,
                    category: true,
                    createdAt: true
                }
            })
        ]);

        let totalRevenue = 0;
        let totalExpenses = 0;

        const collectionsBreakdown = { RENT: 0, SECURITY_DEPOSIT: 0, OTHER: 0 };
        const expensesBreakdown = { MESS: 0, GENERAL: 0, UTILITY_BILL: 0, MAINTENANCE: 0, SALARY: 0 };

        const monthlyRaw = {};

        // 1. Process Revenue (Payments)
        payments.forEach(p => {
            const amount = p.amount || 0;
            totalRevenue += amount;

            // Type breakdown
            const type = p.type || "RENT";
            if (type === "RENT" || type === "MONTHLY_RENT") {
                collectionsBreakdown.RENT += amount;
            } else if (type === "SECURITY_DEPOSIT") {
                collectionsBreakdown.SECURITY_DEPOSIT += amount;
            } else {
                collectionsBreakdown.OTHER += amount;
            }

            // Timeline
            const date = p.date ? new Date(p.date) : new Date(p.createdAt);
            const mKey = format(date, "MMM yyyy");
            if (!monthlyRaw[mKey]) monthlyRaw[mKey] = { revenue: 0, expenses: 0 };
            monthlyRaw[mKey].revenue += amount;
        });

        // 2. Process Expenses
        expenses.forEach(e => {
            const amount = e.amount || 0;
            totalExpenses += amount;

            // Category breakdown
            const category = e.category || "GENERAL";
            if (expensesBreakdown[category] !== undefined) {
                expensesBreakdown[category] += amount;
            } else {
                expensesBreakdown.GENERAL += amount;
            }

            // Timeline
            const date = e.date ? new Date(e.date) : new Date(e.createdAt);
            const mKey = format(date, "MMM yyyy");
            if (!monthlyRaw[mKey]) monthlyRaw[mKey] = { revenue: 0, expenses: 0 };
            monthlyRaw[mKey].expenses += amount;
        });

        // Format timeline chart
        const timeline = Object.keys(monthlyRaw).map(k => {
            const [mon, yr] = k.split(" ");
            return {
                raw: new Date(`${mon} 1, ${yr}`),
                name: k,
                revenue: monthlyRaw[k].revenue,
                expenses: monthlyRaw[k].expenses,
                net: monthlyRaw[k].revenue - monthlyRaw[k].expenses
            };
        }).sort((a, b) => a.raw - b.raw).map(d => ({
            name: d.name,
            revenue: d.revenue,
            expenses: d.expenses,
            net: d.net
        }));

        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        return successResponse({
            summary: {
                totalRevenue,
                totalExpenses,
                netProfit,
                profitMargin
            },
            collectionsBreakdown,
            expensesBreakdown,
            timeline
        });

    } catch (error) {
        console.error("GET /api/admin/financials error:", error);
        return errorResponse("Failed to fetch financials data", 500);
    }
}
