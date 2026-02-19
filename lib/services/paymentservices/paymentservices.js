import prisma from "@/lib/prisma";

export default class PaymentServices {
    async createPayment(data) {
        try {
            const payment = await prisma.payment.create({
                data: {
                    userId: data.userId,
                    bookingId: data.bookingId,
                    amount: parseFloat(data.amount),
                    date: data.date ? new Date(data.date) : new Date(),
                    dueDate: data.dueDate ? new Date(data.dueDate) : null,
                    type: data.type || "RENT",
                    status: data.status || "PAID",
                    method: data.method || "CASH",
                    transactionId: data.transactionId,
                    receiptUrl: data.receiptUrl,
                    notes: data.notes,
                    updatedAt: new Date()
                }
            });

            // If it's a booking payment, we might want to check if the total booking amount is covered
            // but for now we just return the payment
            return payment;
        } catch (error) {
            console.error("Error creating payment:", error);
            throw new Error("Failed to create payment");
        }
    }

    async getAllPayments(filters = {}) {
        try {
            const { status, hostelId, search, userId, page = 1, limit = 10 } = filters;
            const skip = (page - 1) * limit;

            const where = {
                AND: [
                    status && status !== 'all' ? { status } : {},
                    userId ? { userId } : {},
                    hostelId && hostelId !== 'all' ? {
                        Booking: {
                            Room: {
                                hostelId: hostelId
                            }
                        }
                    } : {},
                    search ? {
                        OR: [
                            { transactionId: { contains: search, mode: 'insensitive' } },
                            { User: { name: { contains: search, mode: 'insensitive' } } },
                            { Booking: { Room: { roomNumber: { contains: search, mode: 'insensitive' } } } },
                            { Booking: { Room: { Hostel: { name: { contains: search, mode: 'insensitive' } } } } }
                        ]
                    } : {}
                ]
            };

            const payments = await prisma.payment.findMany({
                where,
                include: {
                    User: {
                        select: { name: true, email: true, phone: true }
                    },
                    Booking: {
                        include: {
                            Room: {
                                include: { Hostel: true }
                            }
                        }
                    }
                },
                orderBy: { date: 'desc' },
                skip,
                take: limit
            });

            const total = await prisma.payment.count({ where });

            return {
                payments,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error("Error fetching all payments:", error);
            throw new Error("Failed to fetch payments ledger");
        }
    }

    async getFinancialStats(hostelId) {
        try {
            // Automatically initialize any pending dues before calculating stats
            await this.initializeDuePayments();

            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

            const where = hostelId ? {
                Booking: {
                    Room: {
                        hostelId: hostelId
                    }
                }
            } : {};

            const allPayments = await prisma.payment.findMany({
                where
            });

            const stats = {
                totalRevenue: allPayments.reduce((sum, p) => sum + (p.status === 'PAID' ? p.amount : 0), 0),
                monthlyRevenue: allPayments.reduce((sum, p) => {
                    const pDate = new Date(p.date);
                    if (pDate >= startOfMonth && p.status === 'PAID') return sum + p.amount;
                    return sum;
                }, 0),
                pendingReceivables: allPayments.reduce((sum, p) => sum + (p.status === 'PENDING' ? p.amount : 0), 0),
                overdueLiability: allPayments.reduce((sum, p) => sum + (p.status === 'OVERDUE' ? p.amount : 0), 0),
                totalTransactions: allPayments.length
            };

            return stats;
        } catch (error) {
            console.error("Error calculating financial stats:", error);
            throw new Error("Failed to compute fiscal intelligence");
        }
    }

    async initializeDuePayments() {
        try {
            const activeBookings = await prisma.booking.findMany({
                where: {
                    status: { in: ['CONFIRMED', 'CHECKED_IN'] }
                },
                include: {
                    Room: true,
                    Payment: true
                }
            });

            const today = new Date();
            const results = [];

            for (const booking of activeBookings) {
                const checkInDate = new Date(booking.checkIn);
                const monthlyRent = booking.Room.monthlyrent;

                if (!monthlyRent) continue;

                // Calculate how many months have passed since check-in
                const yearsDiff = today.getFullYear() - checkInDate.getFullYear();
                const monthsDiff = today.getMonth() - checkInDate.getMonth();
                const totalMonthsPassed = (yearsDiff * 12) + monthsDiff;

                // For each month that should have been billed
                for (let i = 0; i <= totalMonthsPassed; i++) {
                    const termDate = new Date(checkInDate);
                    termDate.setMonth(checkInDate.getMonth() + i);

                    // Don't bill for future months
                    if (termDate > today) continue;

                    const monthLabel = termDate.toLocaleString('default', { month: 'long', year: 'numeric' });

                    // Check if a rent payment for this specific month and year already exists
                    const exists = booking.Payment.find(p => {
                        if (p.type !== 'RENT') return false;
                        const pDate = new Date(p.date);
                        return pDate.getUTCMonth() === termDate.getUTCMonth() &&
                            pDate.getUTCFullYear() === termDate.getUTCFullYear();
                    });

                    if (!exists) {
                        // Create a PENDING payment record (initialized for review)
                        const newPayment = await prisma.payment.create({
                            data: {
                                userId: booking.userId,
                                bookingId: booking.id,
                                amount: monthlyRent,
                                status: "PENDING",
                                type: "RENT",
                                date: termDate,
                                dueDate: termDate,
                                notes: `Monthly Rent - ${monthLabel} (Auto-Generated)`,
                                updatedAt: new Date()
                            }
                        });

                        // Update booking totalAmount to reflect the new liability
                        await prisma.booking.update({
                            where: { id: booking.id },
                            data: {
                                totalAmount: booking.totalAmount + monthlyRent
                            }
                        });

                        results.push(newPayment.id);
                    }
                }
            }
            return results;
        } catch (error) {
            console.error("Auto-initiation failed:", error);
            // Don't throw here to avoid breaking the dashboard if one booking fails
            return [];
        }
    }

    async getPaymentsByBooking(bookingId) {
        try {
            return await prisma.payment.findMany({
                where: { bookingId },
                include: {
                    User: true,
                    Booking: {
                        include: { Room: { include: { Hostel: true } } }
                    }
                },
                orderBy: { date: 'desc' }
            });
        } catch (error) {
            console.error("Error fetching booking payments:", error);
            throw new Error("Failed to fetch booking ledger");
        }
    }

    async getPaymentById(id) {
        try {
            return await prisma.payment.findUnique({
                where: { id },
                include: {
                    User: {
                        select: { name: true, email: true, phone: true }
                    },
                    Booking: {
                        include: {
                            Room: {
                                include: { Hostel: true }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error("Error fetching payment detail:", error);
            throw new Error("Failed to retrieve transaction node");
        }
    }

    async updatePaymentStatus(paymentId, status, notes) {
        try {
            return await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status,
                    notes,
                    updatedAt: new Date()
                }
            });
        } catch (error) {
            console.error("Error updating payment status:", error);
            throw new Error("Failed to update transaction status");
        }
    }

    async updatePayment(paymentId, updateData) {
        try {
            return await prisma.payment.update({
                where: { id: paymentId },
                data: updateData,
                include: {
                    User: true,
                    Booking: {
                        include: { Room: { include: { Hostel: true } } }
                    }
                }
            });
        } catch (error) {
            console.error("Error updating payment:", error);
            throw new Error("Failed to update payment");
        }
    }

    async deletePayment(paymentId) {
        try {
            return await prisma.payment.delete({
                where: { id: paymentId }
            });
        } catch (error) {
            console.error("Error deleting payment:", error);
            throw new Error("Failed to delete payment");
        }
    }

    async reconcileBookingPayments(bookingId, totalAmount, userId, method = "CASH", notes = "") {
        try {
            // 1. Get all pending payments for this booking, sorted by due date
            const pendingPayments = await prisma.payment.findMany({
                where: {
                    bookingId,
                    status: "PENDING"
                },
                orderBy: {
                    dueDate: 'asc'
                }
            });

            let remainingPool = parseFloat(totalAmount);
            const settledPayments = [];
            const partiallyPaidPayments = [];

            for (const payment of pendingPayments) {
                if (remainingPool <= 0) break;

                const billAmount = payment.amount;

                if (remainingPool >= billAmount) {
                    // Full settlement for this invoice
                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: "PAID",
                            method,
                            date: new Date(),
                            notes: notes ? `${notes} (Auto-Waterfall Settlement)` : "Auto-Waterfall Settlement",
                            updatedAt: new Date()
                        }
                    });
                    remainingPool -= billAmount;
                    settledPayments.push(payment.id);
                } else {
                    // Partial settlement - We split the payment? 
                    // No, usually we update the existing PENDING one's amount and create a PAID one,
                    // but since the schema is simple, let's just mark it as PARTIAL and update notes.
                    // Actually, let's just mark it as PAID and note the partial amount if we don't have secondary tracking.
                    // Better: Update the bill to the remaining amount and create a new PAID payment for the partial.

                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            amount: billAmount - remainingPool, // Remaining debt
                            notes: `${payment.notes || ''} (Partially paid PKR ${remainingPool})`,
                            updatedAt: new Date()
                        }
                    });

                    // Create the PAID record for the partial amount
                    await prisma.payment.create({
                        data: {
                            userId,
                            bookingId,
                            amount: remainingPool,
                            status: "PAID",
                            method,
                            type: payment.type,
                            date: new Date(),
                            notes: `Partial settlement for invoice ${payment.id}`,
                            updatedAt: new Date()
                        }
                    });

                    remainingPool = 0;
                    partiallyPaidPayments.push(payment.id);
                }
            }

            // If there's still money left, create a credit/advance payment
            if (remainingPool > 0) {
                await prisma.payment.create({
                    data: {
                        userId,
                        bookingId,
                        amount: remainingPool,
                        status: "PAID",
                        method,
                        type: "ADVANCE",
                        date: new Date(),
                        notes: "Excess funds recorded as credit/advance.",
                        updatedAt: new Date()
                    }
                });
            }

            return {
                success: true,
                settledInvoices: settledPayments.length,
                partiallySettled: partiallyPaidPayments.length,
                excessApplied: remainingPool > 0
            };

        } catch (error) {
            console.error("Reconciliation failed:", error);
            throw new Error("Failed to execute waterfall reconciliation protocol.");
        }
    }
}
