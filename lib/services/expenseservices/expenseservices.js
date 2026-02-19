import prisma from "@/lib/prisma";

class ExpenseServices {
    static async getExpenses({ hostelId, status, category, startDate, endDate, submittedById }) {
        try {
            const where = {};
            if (hostelId && hostelId !== "all") where.hostelId = hostelId;
            if (status && status !== "all") where.status = status;
            if (category && category !== "all") where.category = category;
            if (submittedById) where.submittedById = submittedById;

            if (startDate || endDate) {
                where.date = {};
                if (startDate) where.date.gte = new Date(startDate);
                if (endDate) where.date.lte = new Date(endDate);
            }

            return await prisma.expense.findMany({
                where,
                include: {
                    Hostel: {
                        select: { id: true, name: true, city: true }
                    },
                    User_Expense_submittedByIdToUser: {
                        select: { id: true, name: true, role: true }
                    },
                    User_Expense_approvedByIdToUser: {
                        select: { id: true, name: true }
                    }
                },
                orderBy: {
                    date: 'desc'
                }
            });
        } catch (error) {
            console.error("Error in getExpenses:", error);
            throw error;
        }
    }

    static async getExpenseStats({ hostelId }) {
        try {
            const where = hostelId && hostelId !== "all" ? { hostelId } : {};

            const [total, paid, pending, categories] = await Promise.all([
                prisma.expense.aggregate({
                    where,
                    _sum: { amount: true },
                    _count: { id: true }
                }),
                prisma.expense.aggregate({
                    where: { ...where, status: 'PAID' },
                    _sum: { amount: true }
                }),
                prisma.expense.aggregate({
                    where: { ...where, status: 'PENDING' },
                    _sum: { amount: true }
                }),
                prisma.expense.groupBy({
                    by: ['category'],
                    where,
                    _sum: { amount: true }
                })
            ]);

            // Get monthly trend (last 6 months)
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const trend = await prisma.expense.findMany({
                where: {
                    ...where,
                    date: { gte: sixMonthsAgo }
                },
                select: {
                    amount: true,
                    date: true
                },
                orderBy: {
                    date: 'asc'
                }
            });

            return {
                summary: {
                    totalAmount: total._sum.amount || 0,
                    totalCount: total._count.id || 0,
                    paidAmount: paid._sum.amount || 0,
                    pendingAmount: pending._sum.amount || 0,
                },
                categories: categories.map(c => ({
                    category: c.category,
                    amount: c._sum.amount || 0
                })),
                trend
            };
        } catch (error) {
            console.error("Error in getExpenseStats:", error);
            throw error;
        }
    }

    static async createExpense(data) {
        try {
            return await prisma.expense.create({
                data: {
                    ...data,
                    updatedAt: new Date()
                }
            });
        } catch (error) {
            console.error("Error in createExpense:", error);
            throw error;
        }
    }

    static async updateExpenseStatus(id, { status, approvedById, rejectedById }) {
        try {
            const data = { status, updatedAt: new Date() };
            if (approvedById) data.approvedById = approvedById;
            if (rejectedById) data.rejectedById = rejectedById;

            return await prisma.expense.update({
                where: { id },
                data
            });
        } catch (error) {
            console.error("Error in updateExpenseStatus:", error);
            throw error;
        }
    }

    static async deleteExpense(id) {
        try {
            return await prisma.expense.delete({
                where: { id }
            });
        } catch (error) {
            console.error("Error in deleteExpense:", error);
            throw error;
        }
    }
}

export default ExpenseServices;
