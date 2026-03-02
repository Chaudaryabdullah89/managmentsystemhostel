import prisma from "@/lib/prisma";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";

export class ReportServices {
    static async getGlobalStats(period = "month") {
        const now = new Date();
        const startOfCurrent = startOfMonth(now);
        const startOfLast = startOfMonth(subMonths(now, 1));
        const endOfLast = endOfMonth(subMonths(now, 1));

        // Get Revenue (Current vs Last Month)
        const currentRevenue = await prisma.payment.aggregate({
            where: {
                status: 'PAID',
                date: { gte: startOfCurrent }
            },
            _sum: { amount: true }
        });

        const lastRevenue = await prisma.payment.aggregate({
            where: {
                status: 'PAID',
                date: { gte: startOfLast, lte: endOfLast }
            },
            _sum: { amount: true }
        });

        // Get Expenses (Current vs Last Month)
        const currentExpenses = await prisma.expense.aggregate({
            where: {
                status: 'PAID',
                date: { gte: startOfCurrent }
            },
            _sum: { amount: true }
        });

        const lastExpenses = await prisma.expense.aggregate({
            where: {
                status: 'PAID',
                date: { gte: startOfLast, lte: endOfLast }
            },
            _sum: { amount: true }
        });

        // Occupancy Calculation
        const totalRooms = await prisma.room.count();
        const occupiedRooms = await prisma.room.count({
            where: { status: 'OCCUPIED' }
        });
        const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

        // Last 6 Months Trends
        const trends = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(now, i);
            const start = startOfMonth(date);
            const end = endOfMonth(date);

            const rev = await prisma.payment.aggregate({
                where: { status: 'PAID', date: { gte: start, lte: end } },
                _sum: { amount: true }
            });

            const exp = await prisma.expense.aggregate({
                where: { status: 'PAID', date: { gte: start, lte: end } },
                _sum: { amount: true }
            });

            trends.push({
                month: format(date, 'MMM'),
                revenue: rev._sum.amount || 0,
                expenses: exp._sum.amount || 0,
                profit: (rev._sum.amount || 0) - (exp._sum.amount || 0),
                occupancy: occupancyRate // This is a simplification, should ideally be historical occupancy
            });
        }

        // Hostel Performance (Corrected logic)
        const hostels = await prisma.hostel.findMany({
            include: {
                Room: {
                    select: {
                        id: true,
                        status: true,
                        capacity: true
                    }
                },
                Expense: {
                    where: { status: 'PAID' },
                    select: { amount: true }
                }
            }
        });

        const hostelPerformance = await Promise.all(hostels.map(async (h) => {
            const expenses = h.Expense.reduce((acc, curr) => acc + curr.amount, 0);

            // Get all payments related to this hostel's rooms
            const roomIds = h.Room.map(r => r.id);
            const revenueAgg = await prisma.payment.aggregate({
                where: {
                    status: 'PAID',
                    Booking: {
                        roomId: { in: roomIds }
                    }
                },
                _sum: { amount: true }
            });

            const revenue = revenueAgg._sum.amount || 0;
            const totalRoomsCount = h.Room.length;
            const occupiedRoomsCount = h.Room.filter(r => r.status === 'OCCUPIED').length;

            return {
                id: h.id,
                name: h.name,
                revenue,
                expenses,
                profit: revenue - expenses,
                occupancy: totalRoomsCount > 0 ? Math.round((occupiedRoomsCount / totalRoomsCount) * 100) : 0,
                rooms: totalRoomsCount,
                occupied: occupiedRoomsCount
            };
        }));

        // Calculate profit change
        const currentProfit = (currentRevenue._sum.amount || 0) - (currentExpenses._sum.amount || 0);
        const lastProfit = (lastRevenue._sum.amount || 0) - (lastExpenses._sum.amount || 0);
        const profitChange = this.calculateChange(currentProfit, lastProfit);

        // Expense Distribution (Current Month)
        const expenseDistribution = await prisma.expense.groupBy({
            by: ['category'],
            where: {
                status: 'PAID',
                date: { gte: startOfCurrent }
            },
            _sum: { amount: true }
        });

        // Complaint Categories Distribution
        const complaintDist = await prisma.complaint.groupBy({
            by: ['category'],
            _count: { id: true }
        });

        // Revenue Forecasting (Next Month)
        const activeBookings = await prisma.booking.findMany({
            where: { status: 'CHECKED_IN' },
            include: { Room: true }
        });

        const projectedRevenue = activeBookings.reduce((sum, b) => {
            const rent = b.monthlyRent || b.Room?.montlyrent || b.Room?.price || (b.totalAmount - (b.securityDeposit || 0));
            return sum + (rent || 0);
        }, 0);

        // Utility Trends (Last 6 Months - Category Breakdown)
        const utilityTrends = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(now, i);
            const start = startOfMonth(date);
            const end = endOfMonth(date);

            const utilities = await prisma.expense.aggregate({
                where: { status: 'PAID', category: 'UTILITIES', date: { gte: start, lte: end } },
                _sum: { amount: true }
            });
            const maintenance = await prisma.expense.aggregate({
                where: { status: 'PAID', category: 'MAINTENANCE', date: { gte: start, lte: end } },
                _sum: { amount: true }
            });

            utilityTrends.push({
                month: format(date, 'MMM'),
                utilities: utilities._sum.amount || 0,
                maintenance: maintenance._sum.amount || 0
            });
        }

        return {
            overall: {
                totalRevenue: currentRevenue._sum.amount || 0,
                revenueChange: this.calculateChange(currentRevenue._sum.amount || 0, lastRevenue._sum.amount || 0),
                totalExpenses: currentExpenses._sum.amount || 0,
                expenseChange: this.calculateChange(currentExpenses._sum.amount || 0, lastExpenses._sum.amount || 0),
                netProfit: currentProfit,
                profitChange: profitChange,
                occupancyRate: Math.round(occupancyRate),
                occupancyChange: 2.5,
                projectedRevenue
            },
            hostelPerformance,
            monthlyTrends: trends,
            expenseDistribution: expenseDistribution.map(e => ({ name: e.category, value: e._sum.amount || 0 })),
            complaintDistribution: complaintDist.map(c => ({ name: c.category, value: c._count.id || 0 })),
            utilityTrends
        };
    }

    static async getHostelStats(hostelId, period = "month") {
        const now = new Date();
        const startOfCurrent = startOfMonth(now);
        const startOfLast = startOfMonth(subMonths(now, 1));
        const endOfLast = endOfMonth(subMonths(now, 1));

        const hostel = await prisma.hostel.findUnique({
            where: { id: hostelId },
            include: {
                Room: true,
                User_Hostel_managerIdToUser: {
                    select: { name: true, email: true, phone: true }
                }
            }
        });

        if (!hostel) throw new Error("Hostel not found");

        const roomIds = hostel.Room.map(r => r.id);

        // Revenue
        const currentRevenue = await prisma.payment.aggregate({
            where: {
                status: 'PAID',
                date: { gte: startOfCurrent },
                Booking: { roomId: { in: roomIds } }
            },
            _sum: { amount: true }
        });

        const lastRevenue = await prisma.payment.aggregate({
            where: {
                status: 'PAID',
                date: { gte: startOfLast, lte: endOfLast },
                Booking: { roomId: { in: roomIds } }
            },
            _sum: { amount: true }
        });

        // Expenses
        const currentExpenses = await prisma.expense.aggregate({
            where: {
                status: 'PAID',
                date: { gte: startOfCurrent },
                hostelId: hostelId
            },
            _sum: { amount: true }
        });

        const lastExpenses = await prisma.expense.aggregate({
            where: {
                status: 'PAID',
                date: { gte: startOfLast, lte: endOfLast },
                hostelId: hostelId
            },
            _sum: { amount: true }
        });

        const currentProfit = (currentRevenue._sum.amount || 0) - (currentExpenses._sum.amount || 0);
        const lastProfit = (lastRevenue._sum.amount || 0) - (lastExpenses._sum.amount || 0);

        // Occupancy
        const totalRooms = hostel.Room.length;
        const occupiedRooms = hostel.Room.filter(r => r.status === 'OCCUPIED').length;
        const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

        // Trends
        const trends = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(now, i);
            const start = startOfMonth(date);
            const end = endOfMonth(date);

            const rev = await prisma.payment.aggregate({
                where: {
                    status: 'PAID',
                    date: { gte: start, lte: end },
                    Booking: { roomId: { in: roomIds } }
                },
                _sum: { amount: true }
            });

            const exp = await prisma.expense.aggregate({
                where: {
                    status: 'PAID',
                    date: { gte: start, lte: end },
                    hostelId: hostelId
                },
                _sum: { amount: true }
            });

            trends.push({
                month: format(date, 'MMM'),
                revenue: rev._sum.amount || 0,
                expenses: exp._sum.amount || 0,
                profit: (rev._sum.amount || 0) - (exp._sum.amount || 0),
            });
        }

        // Expense Distribution (Current Month - Hostel Specific)
        const expenseDistribution = await prisma.expense.groupBy({
            by: ['category'],
            where: {
                status: 'PAID',
                hostelId: hostelId,
                date: { gte: startOfCurrent }
            },
            _sum: { amount: true }
        });

        // Complaint Categories Distribution (Hostel Specific)
        const complaintDist = await prisma.complaint.groupBy({
            by: ['category'],
            where: { hostelId: hostelId },
            _count: { id: true }
        });

        // Revenue Forecasting (Next Month - Hostel Specific)
        const activeBookings = await prisma.booking.findMany({
            where: {
                status: 'CHECKED_IN',
                roomId: { in: roomIds }
            },
            include: { Room: true }
        });

        const projectedRevenue = activeBookings.reduce((sum, b) => {
            const rent = b.monthlyRent || b.Room?.montlyrent || b.Room?.price || (b.totalAmount - (b.securityDeposit || 0));
            return sum + (rent || 0);
        }, 0);

        // Utility Trends (Last 6 Months - Hostel Specific)
        const utilityTrends = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(now, i);
            const start = startOfMonth(date);
            const end = endOfMonth(date);

            const utilities = await prisma.expense.aggregate({
                where: { status: 'PAID', category: 'UTILITIES', hostelId: hostelId, date: { gte: start, lte: end } },
                _sum: { amount: true }
            });
            const maintenance = await prisma.expense.aggregate({
                where: { status: 'PAID', category: 'MAINTENANCE', hostelId: hostelId, date: { gte: start, lte: end } },
                _sum: { amount: true }
            });

            utilityTrends.push({
                month: format(date, 'MMM'),
                utilities: utilities._sum.amount || 0,
                maintenance: maintenance._sum.amount || 0
            });
        }

        return {
            hostel: {
                name: hostel.name,
                address: hostel.address,
                city: hostel.city,
                manager: hostel.User_Hostel_managerIdToUser?.name || 'Central Admin',
                phone: hostel.phone
            },
            overall: {
                totalRevenue: currentRevenue._sum.amount || 0,
                revenueChange: this.calculateChange(currentRevenue._sum.amount || 0, lastRevenue._sum.amount || 0),
                totalExpenses: currentExpenses._sum.amount || 0,
                expenseChange: this.calculateChange(currentExpenses._sum.amount || 0, lastExpenses._sum.amount || 0),
                netProfit: currentProfit,
                profitChange: this.calculateChange(currentProfit, lastProfit),
                occupancyRate: Math.round(occupancyRate),
                occupancyChange: 1.2,
                projectedRevenue
            },
            monthlyTrends: trends,
            expenseDistribution: expenseDistribution.map(e => ({ name: e.category, value: e._sum.amount || 0 })),
            complaintDistribution: complaintDist.map(c => ({ name: c.category, value: c._count.id || 0 })),
            utilityTrends
        };
    }

    static calculateChange(current, last) {
        if (!last) return 0;
        return (((current - last) / last) * 100).toFixed(1);
    }
}
