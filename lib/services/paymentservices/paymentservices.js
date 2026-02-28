import { prisma } from "@/lib/prisma";
import { generateUID, UID_PREFIXES } from "@/lib/uid-generator";
import crypto from "crypto";


export default class PaymentServices {
    async createPayment(data) {
        try {
            // Added Strength: Multi-stage validation for non-duplication
            if (data.type === "RENT" || data.type === "MONTHLY_RENT" || data.type === "SECURITY_DEPOSIT") {
                const now = new Date();
                const checkMonth = data.month || now.toLocaleString('default', { month: 'long' });
                const checkYear = data.year ? parseInt(data.year) : now.getUTCFullYear();

                const existing = await prisma.payment.findFirst({
                    where: {
                        userId: data.userId,
                        bookingId: data.bookingId || null,
                        type: { in: ["RENT", "MONTHLY_RENT", "SECURITY_DEPOSIT"] },
                        month: checkMonth,
                        year: checkYear,
                        status: {
                            notIn: ["REJECTED", "FAILED", "REFUNDED"]
                        }
                    }
                });

                if (existing && !data.allowDuplicate) {
                    throw new Error(`A ${existing.type.toLowerCase().replace('_', ' ')} payment for ${checkMonth} ${checkYear} already exists and is ${existing.status.toLowerCase()}.`);
                }

                // Ensure data passed to create also has these defaults if they were missing
                data.month = checkMonth;
                data.year = checkYear;
            }

            // Strength: Atomic Transaction
            return await prisma.$transaction(async (tx) => {
                const payment = await tx.payment.create({
                    data: {
                        id: crypto.randomUUID(),
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
                        month: data.month,
                        year: data.year ? parseInt(data.year) : null,
                        updatedAt: new Date()
                    }
                });

                // Algorithm: Apply UID separately if Prisma HMR is lagging
                await tx.payment.update({
                    where: { id: payment.id },
                    data: { uid: generateUID(UID_PREFIXES.PAYMENT, crypto.randomUUID().substring(0, 8)) }
                });

                // Algorithm: If it's a new debt (PENDING RENT), ensure booking liability is updated
                if (payment.status === "PENDING" && payment.bookingId) {
                    await tx.booking.update({
                        where: { id: payment.bookingId },
                        data: {
                            totalAmount: { increment: payment.amount }
                        }
                    });
                }

                return payment;
            });
        } catch (error) {
            console.error("Critical Failure in createPayment:", error);
            throw error;
        }
    }

    async requestRefund(data) {
        try {
            return await prisma.$transaction(async (tx) => {
                // 1. Verify payment exists and is PAID
                const payment = await tx.payment.findUnique({
                    where: { id: data.paymentId },
                    include: {
                        Booking: {
                            include: {
                                Room: true
                            }
                        }
                    }
                });

                if (!payment || payment.status !== "PAID") {
                    throw new Error("Only verified paid transactions can be refunded.");
                }

                const hostelId = payment.Booking?.Room?.hostelId;
                if (!hostelId) {
                    throw new Error("Could not determine hostel context for this payment.");
                }

                // 2. Create Refund Request
                const request = await tx.refundRequest.create({
                    data: {
                        paymentId: data.paymentId,
                        userId: data.userId,
                        hostelId: hostelId,
                        reason: data.reason,
                        amount: payment.amount,
                        status: "PENDING",
                        notes: data.notes
                    }
                });

                // 3. Optional: Mark payment as 'REFUND_PENDING' if you add that status
                // For now, we'll keep it as PAID but linked to a RefundRequest

                return request;
            });
        } catch (error) {
            console.error("Refund Request Failed:", error);
            throw error;
        }
    }

    async refundSecurity(bookingId, amount, notes = "") {
        try {
            return await prisma.$transaction(async (tx) => {
                const booking = await tx.booking.findUnique({
                    where: { id: bookingId },
                    select: { securityDeposit: true, userId: true, id: true }
                });

                if (!booking) throw new Error("Booking not found");
                if (booking.securityDeposit < amount) {
                    throw new Error(`Insufficient security deposit balance. Available: PKR ${booking.securityDeposit}`);
                }

                // 1. Create a Payment record of type 'SECURITY_REFUND'
                const payment = await tx.payment.create({
                    data: {
                        id: crypto.randomUUID(),
                        userId: booking.userId,
                        bookingId: booking.id,
                        amount: amount,
                        status: "PAID",
                        type: "SECURITY_REFUND",
                        date: new Date(),
                        notes: notes || "Security Deposit direct refund.",
                        updatedAt: new Date()
                    }
                });

                await tx.payment.update({
                    where: { id: payment.id },
                    data: { uid: generateUID(UID_PREFIXES.PAYMENT, crypto.randomUUID().substring(0, 8)) }
                });

                // 2. Reduce the security deposit in the Booking model
                await tx.booking.update({
                    where: { id: bookingId },
                    data: {
                        securityDeposit: { decrement: amount }
                    }
                });

                return payment;
            });
        } catch (error) {
            console.error("Security Refund Failed:", error);
            throw error;
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

                // FALLBACK HIERARCHY: Direct Booking Rent -> Room Monthly Rent -> Room Base Price
                const bRent = parseFloat(booking.monthlyRent || 0);
                const rRent = parseFloat(booking.Room?.montlyrent || 0);
                const basePrice = parseFloat(booking.Room?.price || 0);

                const monthlyRent = bRent || rRent || basePrice;

                if (!monthlyRent) continue;

                // Calculate how many months have passed since check-in
                const yearsDiff = today.getFullYear() - checkInDate.getFullYear();
                const monthsDiff = today.getMonth() - checkInDate.getMonth();
                const totalMonthsPassed = (yearsDiff * 12) + monthsDiff;

                // For each month that should have been billed
                for (let i = 0; i <= totalMonthsPassed; i++) {
                    // Safe month calculation
                    const termYear = checkInDate.getFullYear() + Math.floor((checkInDate.getMonth() + i) / 12);
                    const termMonthIndex = (checkInDate.getMonth() + i) % 12;

                    // The rent due date is considered the 1st of the respective month
                    const termDate = new Date(termYear, termMonthIndex, 1);

                    // Don't bill for future months
                    if (termYear > today.getFullYear() || (termYear === today.getFullYear() && termMonthIndex > today.getMonth())) continue;

                    const monthString = termDate.toLocaleString('default', { month: 'long' });
                    const monthLabel = `${monthString} ${termYear}`;

                    // Check if a rent payment for this specific month and year already exists
                    const exists = booking.Payment.find(p => {
                        if (p.type !== 'RENT' && p.type !== 'MONTHLY_RENT') return false;
                        if (["REJECTED", "FAILED", "REFUNDED"].includes(p.status)) return false;
                        return p.month === monthString && p.year === termYear;
                    });

                    if (!exists) {
                        // Create a PENDING payment record (initialized for review)
                        const newPayment = await prisma.payment.create({
                            data: {
                                id: crypto.randomUUID(),
                                userId: booking.userId,
                                bookingId: booking.id,
                                amount: monthlyRent,
                                status: "PENDING",
                                type: "RENT",
                                date: today, // recorded today
                                dueDate: termDate, // due on the 1st of the month
                                month: monthString,
                                year: termYear,
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

    async enforceLateFees() {
        try {
            const today = new Date();
            const gracePeriodDays = 5;
            const penaltyAmount = 500; // Standard late fee

            const overdueThreshold = new Date();
            overdueThreshold.setDate(today.getDate() - gracePeriodDays);

            // Find rent payments that are PENDING/OVERDUE and past the grace period
            const paymentsToPenalize = await prisma.payment.findMany({
                where: {
                    status: { in: ["PENDING", "OVERDUE"] },
                    type: "RENT",
                    dueDate: { lt: overdueThreshold },
                    // Optimization: Check if we haven't already added a LATE_FEE for this specific bill 
                    // To avoid double-charging, we check the notes link
                }
            });

            for (const payment of paymentsToPenalize) {
                const lateFeeSignature = `Late Fee for Ref: ${payment.uid || payment.id.slice(-8)}`;

                // Check if late fee already exists
                const existingFee = await prisma.payment.findFirst({
                    where: {
                        bookingId: payment.bookingId,
                        type: "LATE_FEE",
                        notes: { contains: lateFeeSignature }
                    }
                });

                if (!existingFee) {
                    await prisma.$transaction(async (tx) => {
                        // 1. Mark the original payment as OVERDUE if it was PENDING
                        if (payment.status === "PENDING") {
                            await tx.payment.update({
                                where: { id: payment.id },
                                data: { status: "OVERDUE" }
                            });
                        }

                        // 2. Create the Penalty record
                        const penalty = await tx.payment.create({
                            data: {
                                id: crypto.randomUUID(),
                                userId: payment.userId,
                                bookingId: payment.bookingId,
                                amount: penaltyAmount,
                                status: "PENDING",
                                type: "LATE_FEE",
                                date: today,
                                dueDate: today,
                                notes: lateFeeSignature,
                                updatedAt: new Date()
                            }
                        });

                        await tx.payment.update({
                            where: { id: penalty.id },
                            data: { uid: `FEE-${Date.now().toString().slice(-6)}` }
                        });

                        // 3. Increment the booking liability
                        if (payment.bookingId) {
                            await tx.booking.update({
                                where: { id: payment.bookingId },
                                data: {
                                    totalAmount: { increment: penaltyAmount }
                                }
                            });
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Penalty enforcement failed:", error);
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
            const payment = await prisma.payment.findUnique({
                where: { id },
                include: {
                    User: {
                        select: {
                            name: true,
                            email: true,
                            phone: true,
                            hostelId: true,
                            Hostel_User_hostelIdToHostel: {
                                select: { name: true }
                            }
                        }
                    },
                    Booking: {
                        include: {
                            Room: {
                                include: {
                                    Hostel: { select: { name: true } }
                                }
                            }
                        }
                    }
                }
            });

            if (payment && payment.userId) {
                const balance = await this.getUserBalance(payment.userId);
                payment.userBalance = balance;
            }

            return payment;
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
                    User: {
                        select: {
                            name: true,
                            email: true,
                            phone: true,
                            hostelId: true,
                            Hostel_User_hostelIdToHostel: { select: { name: true } }
                        }
                    },
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

    async bulkApprovePayments(paymentIds, adminId) {
        try {
            return await prisma.$transaction(async (tx) => {
                const results = await tx.payment.updateMany({
                    where: {
                        id: { in: paymentIds },
                        status: { in: ['PENDING', 'OVERDUE'] }
                    },
                    data: {
                        status: 'PAID',
                        updatedAt: new Date(),
                        notes: `Bulk approved by admin ${adminId}`
                    }
                });
                return results;
            });
        } catch (error) {
            console.error("Bulk approval failed:", error);
            throw new Error("Failed to process bulk approvals");
        }
    }

    async getHostelFinancialSummary(hostelId) {
        try {
            const payments = await prisma.payment.findMany({
                where: {
                    OR: [
                        { Booking: { Room: { hostelId } } },
                        { User: { hostelId } }
                    ]
                }
            });

            return {
                totalRevenue: payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0),
                pendingReceivables: payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0),
                overdueAmount: payments.filter(p => p.status === 'OVERDUE').reduce((s, p) => s + p.amount, 0),
                collectionRate: payments.length > 0
                    ? (payments.filter(p => p.status === 'PAID').length / payments.length) * 100
                    : 0,
                transactionCount: payments.length
            };
        } catch (error) {
            console.error("Financial summary failed:", error);
            throw new Error("Failed to generate financial intelligence");
        }
    }

    async getUserBalance(userId) {
        try {
            const payments = await prisma.payment.findMany({
                where: { userId, status: { in: ['PENDING', 'OVERDUE'] } }
            });
            return payments.reduce((sum, p) => sum + p.amount, 0);
        } catch (error) {
            console.error("Failed to fetch user balance:", error);
            return 0;
        }
    }

    async reconcileBookingPayments(bookingId, totalAmount, userId, method = "CASH", notes = "") {
        try {
            return await prisma.$transaction(async (tx) => {
                // 1. Get all pending payments for this booking, sorted by due date
                const pendingPayments = await tx.payment.findMany({
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
                        await tx.payment.update({
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
                        // Partial settlement
                        await tx.payment.update({
                            where: { id: payment.id },
                            data: {
                                amount: billAmount - remainingPool, // Remaining debt
                                notes: `${payment.notes || ''} (Partially paid PKR ${remainingPool})`,
                                updatedAt: new Date()
                            }
                        });

                        // Create the PAID record for the partial amount
                        const partialPayment = await tx.payment.create({
                            data: {
                                id: crypto.randomUUID(),
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

                        await tx.payment.update({
                            where: { id: partialPayment.id },
                            data: { uid: generateUID(UID_PREFIXES.PAYMENT, crypto.randomUUID().substring(0, 8)) }
                        });

                        remainingPool = 0;
                        partiallyPaidPayments.push(payment.id);
                    }
                }

                // If there's still money left, create a credit/advance payment
                if (remainingPool > 0) {
                    const newPayment = await tx.payment.create({
                        data: {
                            id: crypto.randomUUID(),
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

                    await tx.payment.update({
                        where: { id: newPayment.id },
                        data: { uid: generateUID(UID_PREFIXES.PAYMENT, crypto.randomUUID().substring(0, 8)) }
                    });
                }

                return {
                    success: true,
                    settledInvoices: settledPayments.length,
                    partiallySettled: partiallyPaidPayments.length,
                    excessApplied: remainingPool > 0
                };
            });

        } catch (error) {
            console.error("Critical Failure in Waterfall Reconciliation:", error);
            throw error;
        }
    }
}
