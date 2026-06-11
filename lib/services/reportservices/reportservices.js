import prisma from "@/lib/prisma";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";

export class ReportServices {
    static async getGlobalStats(period = "month", startDate = null, endDate = null, allowedCategories = undefined) {
        const now = new Date();
        let startOfCurrent, endOfCurrent, startOfLast, endOfLast;

        if (startDate && endDate) {
            startOfCurrent = new Date(startDate);
            // Ensure end date covers the entire day
            const endD = new Date(endDate);
            endOfCurrent = new Date(endD.getFullYear(), endD.getMonth(), endD.getDate(), 23, 59, 59, 999);

            const duration = endOfCurrent.getTime() - startOfCurrent.getTime();
            startOfLast = new Date(startOfCurrent.getTime() - duration - 1);
            endOfLast = new Date(endOfCurrent.getTime() - duration - 1);
        } else if (period === 'year') {
            startOfCurrent = new Date(now.getFullYear(), 0, 1);
            endOfCurrent = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            startOfLast = new Date(now.getFullYear() - 1, 0, 1);
            endOfLast = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        } else {
            startOfCurrent = startOfMonth(now);
            endOfCurrent = endOfMonth(now);
            startOfLast = startOfMonth(subMonths(now, 1));
            endOfLast = endOfMonth(subMonths(now, 1));
        }

        if (allowedCategories && allowedCategories.length === 0) {
            return {
                overall: {
                    totalRevenue: 0,
                    revenueChange: 0,
                    totalExpenses: 0,
                    expenseChange: 0,
                    netProfit: 0,
                    profitChange: 0,
                    occupancyRate: 0,
                    occupancyChange: 0,
                    projectedRevenue: 0
                },
                hostelPerformance: [],
                monthlyTrends: [],
                expenseDistribution: [],
                revenueDistribution: [],
                complaintDistribution: [],
                utilityTrends: []
            };
        }

        // Get Revenue (Current vs Last Month)
        const currentRevenue = await prisma.payment.aggregate({
            where: {
                status: 'PAID',
                date: { gte: startOfCurrent, lte: endOfCurrent }
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
                status: { in: ['APPROVED', 'PAID'] },
                date: { gte: startOfCurrent, lte: endOfCurrent },
                ...(allowedCategories ? { category: { in: allowedCategories } } : {})
            },
            _sum: { amount: true }
        });

        const lastExpenses = await prisma.expense.aggregate({
            where: {
                status: { in: ['APPROVED', 'PAID'] },
                date: { gte: startOfLast, lte: endOfLast },
                ...(allowedCategories ? { category: { in: allowedCategories } } : {})
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
                where: {
                    status: { in: ['APPROVED', 'PAID'] },
                    date: { gte: start, lte: end },
                    ...(allowedCategories ? { category: { in: allowedCategories } } : {})
                },
                _sum: { amount: true }
            });

            trends.push({
                month: format(date, 'MMM'),
                revenue: rev._sum.amount || 0,
                expenses: exp._sum.amount || 0,
                profit: (rev._sum.amount || 0) - (exp._sum.amount || 0),
                occupancy: occupancyRate
            });
        }

        // Hostel Performance
        const hostels = await prisma.hostel.findMany({
            include: {
                Room: {
                    select: { id: true, status: true, capacity: true }
                },
                Expense: {
                    where: {
                        status: { in: ['APPROVED', 'PAID'] },
                        ...(allowedCategories ? { category: { in: allowedCategories } } : {})
                    },
                    select: { amount: true }
                }
            }
        });

        const hostelPerformance = await Promise.all(hostels.map(async (h) => {
            const expenses = h.Expense.reduce((acc, curr) => acc + curr.amount, 0);
            const roomIds = h.Room.map(r => r.id);
            const revenueAgg = await prisma.payment.aggregate({
                where: {
                    status: 'PAID',
                    date: { gte: startOfCurrent, lte: endOfCurrent },
                    Booking: { roomId: { in: roomIds } }
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

        const currentProfit = (currentRevenue._sum.amount || 0) - (currentExpenses._sum.amount || 0);
        const lastProfit = (lastRevenue._sum.amount || 0) - (lastExpenses._sum.amount || 0);
        const profitChange = this.calculateChange(currentProfit, lastProfit);

        const expenseDistribution = await prisma.expense.groupBy({
            by: ['category'],
            where: {
                status: { in: ['APPROVED', 'PAID'] },
                date: { gte: startOfCurrent, lte: endOfCurrent },
                ...(allowedCategories ? { category: { in: allowedCategories } } : {})
            },
            _sum: { amount: true }
        });

        const revenueDistribution = await prisma.payment.groupBy({
            by: ['type'],
            where: {
                status: 'PAID',
                date: { gte: startOfCurrent, lte: endOfCurrent }
            },
            _sum: { amount: true }
        });

        const complaintDist = await prisma.complaint.groupBy({
            by: ['category'],
            where: { createdAt: { gte: startOfCurrent, lte: endOfCurrent } },
            _count: { id: true }
        });

        const activeBookings = await prisma.booking.findMany({
            where: { status: 'CHECKED_IN' },
            include: { Room: true }
        });

        const projectedRevenue = activeBookings.reduce((sum, b) => {
            // Use booking-level rent first, then room rent, then room price.
            // DO NOT fall back to totalAmount — it is a stale contract snapshot.
            const rent = b.monthlyRent || b.Room?.montlyrent || b.Room?.price || 0;
            return sum + rent;
        }, 0);

        const utilityTrends = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(now, i);
            const start = startOfMonth(date);
            const end = endOfMonth(date);

            const utilities = await prisma.expense.aggregate({
                where: {
                    status: { in: ['APPROVED', 'PAID'] },
                    date: { gte: start, lte: end },
                    category: 'UTILITY_BILL'
                },
                _sum: { amount: true }
            });
            const maintenance = await prisma.expense.aggregate({
                where: {
                    status: { in: ['APPROVED', 'PAID'] },
                    date: { gte: start, lte: end },
                    category: 'MAINTENANCE'
                },
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
            revenueDistribution: revenueDistribution.map(r => ({ name: r.type, value: r._sum.amount || 0 })),
            complaintDistribution: complaintDist.map(c => ({ name: c.category, value: c._count.id || 0 })),
            utilityTrends: utilityTrends
        };
    }

    static async getHostelStats(hostelId, period = "month", startDate = null, endDate = null, allowedCategories = undefined) {
        const now = new Date();
        let startOfCurrent, endOfCurrent, startOfLast, endOfLast;

        if (startDate && endDate) {
            startOfCurrent = new Date(startDate);
            const endD = new Date(endDate);
            endOfCurrent = new Date(endD.getFullYear(), endD.getMonth(), endD.getDate(), 23, 59, 59, 999);

            const duration = endOfCurrent.getTime() - startOfCurrent.getTime();
            startOfLast = new Date(startOfCurrent.getTime() - duration - 1);
            endOfLast = new Date(endOfCurrent.getTime() - duration - 1);
        } else if (period === 'year') {
            startOfCurrent = new Date(now.getFullYear(), 0, 1);
            endOfCurrent = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            startOfLast = new Date(now.getFullYear() - 1, 0, 1);
            endOfLast = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        } else {
            startOfCurrent = startOfMonth(now);
            endOfCurrent = endOfMonth(now);
            startOfLast = startOfMonth(subMonths(now, 1));
            endOfLast = endOfMonth(subMonths(now, 1));
        }

        if (allowedCategories && allowedCategories.length === 0) {
            return {
                hostel: { id: hostelId, name: "Restricted", manager: "Restricted" },
                overall: { totalRevenue: 0, revenueChange: 0, totalExpenses: 0, expenseChange: 0, netProfit: 0, profitChange: 0, occupancyRate: 0, occupancyChange: 0, projectedRevenue: 0, totalRooms: 0 },
                hostelPerformance: [],
                monthlyTrends: [],
                expenseDistribution: [],
                complaintDistribution: [],
                utilityTrends: []
            };
        }

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

        const currentRevenue = await prisma.payment.aggregate({
            where: {
                status: 'PAID',
                date: { gte: startOfCurrent, lte: endOfCurrent },
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

        const currentExpenses = await prisma.expense.aggregate({
            where: {
                status: { in: ['APPROVED', 'PAID'] },
                date: { gte: startOfCurrent, lte: endOfCurrent },
                hostelId: hostelId,
                ...(allowedCategories ? { category: { in: allowedCategories } } : {})
            },
            _sum: { amount: true }
        });

        const lastExpenses = await prisma.expense.aggregate({
            where: {
                status: { in: ['APPROVED', 'PAID'] },
                date: { gte: startOfLast, lte: endOfLast },
                hostelId: hostelId,
                ...(allowedCategories ? { category: { in: allowedCategories } } : {})
            },
            _sum: { amount: true }
        });

        const currentProfit = (currentRevenue._sum.amount || 0) - (currentExpenses._sum.amount || 0);
        const lastProfit = (lastRevenue._sum.amount || 0) - (lastExpenses._sum.amount || 0);

        const totalRooms = hostel.Room.length;
        const occupiedRooms = hostel.Room.filter(r => r.status === 'OCCUPIED').length;
        const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

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
                    status: { in: ['APPROVED', 'PAID'] },
                    date: { gte: start, lte: end },
                    hostelId: hostelId,
                    ...(allowedCategories ? { category: { in: allowedCategories } } : {})
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

        const expenseDistribution = await prisma.expense.groupBy({
            by: ['category'],
            where: {
                status: { in: ['APPROVED', 'PAID'] },
                hostelId: hostelId,
                date: { gte: startOfCurrent, lte: endOfCurrent },
                ...(allowedCategories ? { category: { in: allowedCategories } } : {})
            },
            _sum: { amount: true }
        });

        const complaintDist = await prisma.complaint.groupBy({
            by: ['category'],
            where: {
                hostelId: hostelId,
                createdAt: { gte: startOfCurrent, lte: endOfCurrent }
            },
            _count: { id: true }
        });

        const activeBookings = await prisma.booking.findMany({
            where: {
                status: 'CHECKED_IN',
                roomId: { in: roomIds }
            },
            include: { Room: true }
        });

        const projectedRevenue = activeBookings.reduce((sum, b) => {
            // Use booking-level rent first, then room rent, then room price.
            // DO NOT fall back to totalAmount — it is a stale contract snapshot.
            const rent = b.monthlyRent || b.Room?.montlyrent || b.Room?.price || 0;
            return sum + rent;
        }, 0);

        const utilityTrends = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(now, i);
            const start = startOfMonth(date);
            const end = endOfMonth(date);

            const utilities = await prisma.expense.aggregate({
                where: {
                    status: { in: ['APPROVED', 'PAID'] },
                    hostelId: hostelId,
                    date: { gte: start, lte: end },
                    category: 'UTILITY_BILL'
                },
                _sum: { amount: true }
            });
            const maintenance = await prisma.expense.aggregate({
                where: {
                    status: { in: ['APPROVED', 'PAID'] },
                    hostelId: hostelId,
                    date: { gte: start, lte: end },
                    category: 'MAINTENANCE'
                },
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
                id: hostel.id,
                name: hostel.name,
                address: hostel.address,
                city: hostel.city,
                manager: hostel.User_Hostel_managerIdToUser?.name || 'Central Admin',
                phone: hostel.phone,
                totalRooms
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
                projectedRevenue,
                totalRooms
            },
            hostelPerformance: [{
                id: hostel.id,
                name: hostel.name,
                revenue: currentRevenue._sum.amount || 0,
                expenses: currentExpenses._sum.amount || 0,
                profit: currentProfit,
                occupancy: Math.round(occupancyRate),
                rooms: totalRooms
            }],
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
