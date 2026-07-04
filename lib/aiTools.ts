import prisma from "@/lib/prisma";
import { ComplaintCategory, ComplaintPriority } from "@prisma/client";

/**
 * Agentic Tool: File a complaint ticket directly into the database
 */
export async function toolFileComplaint(params: {
    userId: string;
    hostelId: string;
    roomNumber?: string;
    title: string;
    description: string;
    category?: string;
    priority?: string;
}) {
    try {
        let resolvedHostelId = params.hostelId;
        if (!resolvedHostelId) {
            const booking = await prisma.booking.findFirst({
                where: { userId: params.userId },
                select: { Room: { select: { hostelId: true } } }
            });
            resolvedHostelId = booking?.Room?.hostelId || "";
        }
        if (!resolvedHostelId) {
            const firstHostel = await prisma.hostel.findFirst({ select: { id: true } });
            resolvedHostelId = firstHostel?.id || "";
        }

        if (!params.userId || !resolvedHostelId) {
            return { success: false, error: "Missing user or hostel identification." };
        }

        let validCategory: ComplaintCategory = ComplaintCategory.OTHER;
        if (params.category) {
            const upper = params.category.toUpperCase();
            if (Object.values(ComplaintCategory).includes(upper as any)) {
                validCategory = upper as ComplaintCategory;
            }
        }

        let validPriority: ComplaintPriority = ComplaintPriority.MEDIUM;
        if (params.priority) {
            const upper = params.priority.toUpperCase();
            if (Object.values(ComplaintPriority).includes(upper as any)) {
                validPriority = upper as ComplaintPriority;
            }
        }

        const complaint = await prisma.complaint.create({
            data: {
                userId: params.userId,
                hostelId: resolvedHostelId,
                roomNumber: params.roomNumber || undefined,
                title: params.title || `${validCategory} Complaint`,
                description: params.description,
                category: validCategory,
                priority: validPriority,
                status: "PENDING",
                uid: `CMP-${Date.now().toString().slice(-6)}`,
            },
        });

        return {
            success: true,
            message: `Complaint #${complaint.uid} logged successfully!`,
            complaint: {
                id: complaint.id,
                uid: complaint.uid,
                title: complaint.title,
                category: complaint.category,
                priority: complaint.priority,
                status: complaint.status,
                createdAt: complaint.createdAt,
            },
        };
    } catch (err: any) {
        console.error("toolFileComplaint error:", err);
        return { success: false, error: err.message || "Failed to log complaint." };
    }
}

/**
 * Agentic Tool: Fetch Manager & Warden Contact Details
 */
export async function toolFetchManagerInfo(userId: string, hostelId?: string) {
    try {
        let manager: any = null;
        let hostelName = "Hostel Management";

        if (hostelId) {
            const hostel = await prisma.hostel.findUnique({
                where: { id: hostelId },
                include: {
                    User_Hostel_managerIdToUser: {
                        select: { name: true, phone: true, email: true, role: true }
                    }
                }
            });
            if (hostel) {
                hostelName = hostel.name;
                manager = hostel.User_Hostel_managerIdToUser;
            }
        }

        if (!manager) {
            const adminUser = await prisma.user.findFirst({
                where: { role: { in: ["ADMIN", "WARDEN"] }, isActive: true },
                select: { name: true, phone: true, email: true, role: true }
            });
            manager = adminUser || { name: "Hostel Admin Helpdesk", phone: "+92 300 1234567", email: "office@hostelportal.com", role: "ADMIN" };
        }

        const cleanPhone = manager.phone ? manager.phone.replace(/[^\d+]/g, "").replace(/^0/, "+92") : "+923001234567";
        const whatsappUrl = `https://wa.me/${cleanPhone.replace(/\+/g, "")}?text=Hello%20${encodeURIComponent(manager.name)},%20I%20need%20assistance%20regarding%20my%20hostel%20stay.`;

        return {
            success: true,
            hostelName,
            manager: {
                name: manager.name,
                phone: manager.phone || "+92 300 1234567",
                email: manager.email || "office@hostelportal.com",
                role: manager.role || "MANAGER",
                whatsappUrl,
                officeHours: "9:00 AM - 6:00 PM (Mon-Sat)"
            }
        };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Agentic Tool: Fetch Last Paid Receipt / Invoice
 */
export async function toolFetchLastReceipt(userId: string) {
    try {
        const lastPaid = await prisma.payment.findFirst({
            where: { userId, status: "PAID" },
            orderBy: { date: "desc" },
        });

        if (lastPaid) {
            return {
                success: true,
                hasReceipt: true,
                receipt: {
                    id: lastPaid.id,
                    uid: lastPaid.uid || `REC-${lastPaid.id.slice(-6).toUpperCase()}`,
                    amount: Number(lastPaid.amount),
                    date: lastPaid.date,
                    month: lastPaid.month || "Current",
                    year: lastPaid.year || new Date().getFullYear(),
                    type: lastPaid.type,
                    method: lastPaid.method,
                    transactionId: lastPaid.transactionId || `TXN-${Date.now().toString().slice(-6)}`,
                    receiptUrl: lastPaid.receiptUrl || `/api/payments/${lastPaid.id}/receipt`,
                    status: lastPaid.status
                }
            };
        }

        // Fallback: check any latest payment
        const latestAny = await prisma.payment.findFirst({
            where: { userId },
            orderBy: { date: "desc" },
        });

        if (latestAny) {
            return {
                success: true,
                hasReceipt: false,
                message: "No paid receipts found, but here is your latest payment record:",
                receipt: {
                    id: latestAny.id,
                    uid: latestAny.uid || `REC-${latestAny.id.slice(-6).toUpperCase()}`,
                    amount: Number(latestAny.amount),
                    date: latestAny.date,
                    month: latestAny.month || "Current",
                    year: latestAny.year || new Date().getFullYear(),
                    type: latestAny.type,
                    method: latestAny.method,
                    transactionId: latestAny.transactionId || "N/A",
                    receiptUrl: latestAny.receiptUrl || null,
                    status: latestAny.status
                }
            };
        }

        return {
            success: false,
            hasReceipt: false,
            error: "No payment history found for your account."
        };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Agentic Tool: Fetch Mess Menu
 */
export async function toolFetchMessMenu(hostelId: string, dayOfWeek?: string) {
    try {
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const targetDay = dayOfWeek ? dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1).toLowerCase() : null;

        const menuList = await prisma.messMenu.findMany({
            where: {
                hostelId,
                ...(targetDay && days.includes(targetDay) ? { dayOfWeek: targetDay } : {}),
            },
            orderBy: { createdAt: "asc" },
        });

        return {
            success: true,
            count: menuList.length,
            menu: menuList.map((m) => ({
                dayOfWeek: m.dayOfWeek,
                breakfast: m.breakfast || "Standard Breakfast",
                breakfastTime: m.breakfastTime || "8:00 AM - 10:00 AM",
                lunch: m.lunch || "Standard Lunch",
                lunchTime: m.lunchTime || "1:00 PM - 3:00 PM",
                dinner: m.dinner || "Standard Dinner",
                dinnerTime: m.dinnerTime || "8:00 PM - 10:00 PM",
            })),
        };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Agentic Tool: Fetch User Rent & Payment Status
 */
export async function toolFetchUserRentStatus(userId: string) {
    try {
        const payments = await prisma.payment.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 10,
        });

        const pendingPayments = payments.filter((p) => p.status === "PENDING" || p.status === "OVERDUE");
        const totalPending = pendingPayments.reduce((acc, p) => acc + Number(p.amount), 0);
        const lastPaid = payments.find((p) => p.status === "PAID");

        return {
            success: true,
            totalPending,
            pendingCount: pendingPayments.length,
            pendingList: pendingPayments.map((p) => ({
                id: p.id,
                uid: p.uid,
                amount: Number(p.amount),
                status: p.status,
                dueDate: p.dueDate,
                month: p.month,
                year: p.year,
                type: p.type,
            })),
            lastPaid: lastPaid
                ? {
                    amount: Number(lastPaid.amount),
                    date: lastPaid.date,
                    month: lastPaid.month,
                    method: lastPaid.method,
                }
                : null,
        };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Agentic Tool: Fetch Resident Room Details & Roommates
 */
export async function toolFetchRoomDetails(userId: string) {
    try {
        const activeBooking = await prisma.booking.findFirst({
            where: {
                userId,
                status: { in: ["CONFIRMED", "CHECKED_IN"] },
            },
            include: {
                Room: {
                    include: {
                        Hostel: true,
                        Booking: {
                            where: { status: { in: ["CONFIRMED", "CHECKED_IN"] } },
                            include: { User: { select: { id: true, name: true, phone: true, email: true } } },
                        },
                    },
                },
            },
        });

        if (!activeBooking || !activeBooking.Room) {
            return { success: false, error: "No active room booking found." };
        }

        const room = activeBooking.Room;
        const roommates = room.Booking.filter((b) => b.userId !== userId).map((b) => ({
            name: b.User.name,
            phone: b.User.phone,
        }));

        return {
            success: true,
            hostelName: room.Hostel.name,
            roomNumber: room.roomNumber,
            floor: room.floor,
            roomType: room.type,
            capacity: room.capacity,
            price: Number(room.price),
            amenities: room.amenities,
            roommates,
            checkIn: activeBooking.checkIn,
        };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Agentic Tool: Fetch Executive Admin Metrics
 */
export async function toolFetchAdminMetrics(hostelId?: string) {
    try {
        const hostelFilter = hostelId && hostelId !== "all" ? { hostelId } : {};

        const totalRooms = await prisma.room.count({ where: hostelFilter });
        const occupiedRooms = await prisma.room.count({
            where: { ...hostelFilter, status: "OCCUPIED" },
        });
        const activeComplaints = await prisma.complaint.count({
            where: { ...hostelFilter, status: { in: ["PENDING", "IN_PROGRESS"] } },
        });
        const pendingExpenses = await prisma.expense.count({
            where: { ...hostelFilter, status: "PENDING" },
        });

        const totalPayments = await prisma.payment.aggregate({
            _sum: { amount: true },
            where: { status: "PAID" },
        });

        const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

        // Top complaint categories for Analytics Card
        const complaintsByCategory = await prisma.complaint.groupBy({
            by: ["category"],
            _count: { id: true },
            where: hostelFilter,
            orderBy: { _count: { id: "desc" } },
            take: 5
        });

        return {
            success: true,
            totalRooms,
            occupiedRooms,
            occupancyRate,
            activeComplaints,
            pendingExpenses,
            totalRevenuePaid: Number(totalPayments._sum.amount || 0),
            complaintsByCategory: complaintsByCategory.map(c => ({
                category: c.category,
                count: c._count.id
            }))
        };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Agentic Tool: Phase 5 — Poll Ticket Status
 * Checks the current status of a complaint and returns a diff if it changed.
 */
export async function toolPollTicketStatus(userId: string) {
    try {
        const complaints = await prisma.complaint.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
                id: true,
                uid: true,
                title: true,
                category: true,
                status: true,
                priority: true,
                createdAt: true,
                updatedAt: true,
                resolutionNotes: true,
            }
        });

        if (!complaints.length) {
            return { success: false, error: "No complaints found." };
        }

        const latest = complaints[0];
        const statusTimeline = complaints.map(c => ({
            uid: c.uid || c.id.slice(-6).toUpperCase(),
            category: c.category,
            status: c.status,
            priority: c.priority,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            resolutionNotes: c.resolutionNotes,
        }));

        return {
            success: true,
            latest,
            statusTimeline,
            totalComplaints: complaints.length
        };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Agentic Tool: Phase 9 — Natural Language Analytics (Admin/Warden Only)
 * Executes pre-built analytics queries based on admin natural language input.
 */
export async function toolNaturalLanguageAnalytics(hostelId: string, query: string) {
    try {
        const hostelFilter = hostelId && hostelId !== "all" ? { hostelId } : {};
        const lowerQuery = query.toLowerCase();
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const result: Record<string, any> = {};

        // Occupancy
        if (lowerQuery.includes("occup") || lowerQuery.includes("rooms") || lowerQuery.includes("beds")) {
            const total = await prisma.room.count({ where: hostelFilter });
            const occupied = await prisma.room.count({ where: { ...hostelFilter, status: "OCCUPIED" } });
            const vacant = total - occupied;
            result.occupancy = { total, occupied, vacant, rate: total > 0 ? Math.round((occupied / total) * 100) : 0 };
        }

        // Revenue / Rent collection
        if (lowerQuery.includes("revenue") || lowerQuery.includes("collection") || lowerQuery.includes("rent") || lowerQuery.includes("income")) {
            const thisMonth = await prisma.payment.aggregate({
                _sum: { amount: true },
                where: { status: "PAID", date: { gte: monthStart } }
            });
            const total = await prisma.payment.aggregate({
                _sum: { amount: true },
                where: { status: "PAID" }
            });
            result.revenue = {
                thisMonth: Number(thisMonth._sum.amount || 0),
                allTime: Number(total._sum.amount || 0)
            };
        }

        // Complaints
        if (lowerQuery.includes("complaint") || lowerQuery.includes("ticket") || lowerQuery.includes("issue") || lowerQuery.includes("overdue")) {
            const pending = await prisma.complaint.count({ where: { ...hostelFilter, status: "PENDING" } });
            const inProgress = await prisma.complaint.count({ where: { ...hostelFilter, status: "IN_PROGRESS" } });
            const resolved = await prisma.complaint.count({ where: { ...hostelFilter, status: "RESOLVED" } });
            const overdueComplaints = await prisma.complaint.findMany({
                where: {
                    ...hostelFilter,
                    status: { in: ["PENDING", "IN_PROGRESS"] },
                    createdAt: { lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
                },
                orderBy: { createdAt: "asc" },
                take: 5,
                select: { uid: true, title: true, category: true, status: true, createdAt: true }
            });
            result.complaints = { pending, inProgress, resolved, overdueCount: overdueComplaints.length, overdueList: overdueComplaints };
        }

        // Pending expenses
        if (lowerQuery.includes("expense") || lowerQuery.includes("pending payment")) {
            const pendingExpenses = await prisma.expense.findMany({
                where: { ...hostelFilter, status: "PENDING" },
                take: 5,
                select: { title: true, amount: true, category: true, date: true }
            });
            result.expenses = { count: pendingExpenses.length, list: pendingExpenses };
        }

        return { success: true, query, data: result };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
