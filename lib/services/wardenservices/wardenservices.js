import { prisma } from "@/lib/prisma";

export default class WardenServices {
    async getWardenDashboardStats(userId) {
        try {
            // Find the hostel assigned to this warden
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { hostelId: true }
            });

            if (!user || !user.hostelId) {
                throw new Error("Warden is not assigned to any hostel.");
            }

            const hostelId = user.hostelId;

            // 1. Total Residents
            const totalResidents = await prisma.user.count({
                where: {
                    AND: [
                        {
                            OR: [
                                { hostelId: hostelId },
                                { Booking: { some: { Room: { hostelId: hostelId } } } }
                            ]
                        },
                        {
                            role: { in: ['RESIDENT', 'GUEST'] }
                        }
                    ],
                    isActive: true
                }
            });

            // 2. Room Occupancy
            const totalRooms = await prisma.room.count({ where: { hostelId } });
            const occupiedRooms = await prisma.room.count({
                where: {
                    hostelId,
                    status: 'OCCUPIED'
                }
            });

            // 3. Pending/Active Bookings (Check-ins needed)
            const pendingCheckins = await prisma.booking.count({
                where: {
                    Room: { hostelId },
                    status: 'CONFIRMED'
                }
            });

            // 4. Active Complaints
            const activeComplaints = await prisma.complaint.count({
                where: {
                    hostelId,
                    status: { in: ['PENDING', 'IN_PROGRESS'] }
                }
            });

            // 5. Recent Maintenance Tasks
            const maintenanceTasks = await prisma.maintanance.count({
                where: {
                    hostelId,
                    status: { in: ['PENDING', 'IN_PROGRESS'] }
                }
            });

            // 6. Service Stats (Today's pending)
            const pendingLaundry = await prisma.laundryLog.count({
                where: {
                    Room: { hostelId },
                    status: 'PENDING'
                }
            });

            const pendingCleaning = await prisma.cleaningLog.count({
                where: {
                    Room: { hostelId },
                    status: 'PENDING'
                }
            });

            return {
                hostelId,
                totalResidents,
                occupancy: {
                    total: totalRooms,
                    occupied: occupiedRooms,
                    percentage: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
                },
                pendingCheckins,
                activeComplaints,
                maintenanceTasks,
                pendingLaundry,
                pendingCleaning,
                totalPendingServices: pendingLaundry + pendingCleaning
            };
        } catch (error) {
            console.error("Error in getWardenDashboardStats:", error);
            throw error;
        }
    }

    async getHostelResidents(userId) {
        try {
            console.log(`[WardenServices] getHostelResidents called for warden: ${userId}`);
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { hostelId: true }
            });

            if (!user || !user.hostelId) {
                console.warn(`[WardenServices] Warden ${userId} has no assigned hostelId.`);
                return [];
            }

            console.log(`[WardenServices] Fetching residents for hostelId: ${user.hostelId}`);

            const residents = await prisma.user.findMany({
                where: {
                    AND: [
                        {
                            OR: [
                                { hostelId: user.hostelId },
                                { Booking: { some: { Room: { hostelId: user.hostelId } } } }
                            ]
                        },
                        {
                            role: { in: ['RESIDENT', 'GUEST'] }
                        }
                    ]
                },
                include: {
                    ResidentProfile: true,
                    Booking: {
                        include: { Room: { include: { Hostel: true } } },
                        orderBy: { createdAt: 'desc' },
                    }
                }
            });

            console.log(`[WardenServices] Found ${residents.length} potential residents.`);
            return residents;
        } catch (error) {
            console.error("Error in getHostelResidents:", error);
            throw error;
        }
    }

    async getOperationalLogs(userId, type) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { hostelId: true }
            });

            if (!user || !user.hostelId) return [];

            if (type === 'cleaning') {
                return await prisma.cleaningLog.findMany({
                    where: { Room: { hostelId: user.hostelId } },
                    include: { Room: true },
                    orderBy: { performedAt: 'desc' }
                });
            } else if (type === 'laundry') {
                return await prisma.laundryLog.findMany({
                    where: { Room: { hostelId: user.hostelId } },
                    include: { Room: true },
                    orderBy: { receivedAt: 'desc' }
                });
            }
            return [];
        } catch (error) {
            console.error("Error in getOperationalLogs:", error);
            throw error;
        }
    }

    async getDueServices(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { hostelId: true }
            });

            if (!user || !user.hostelId) return { dueCleaning: [], dueLaundry: [] };

            const hostel = await prisma.hostel.findUnique({
                where: { id: user.hostelId },
                include: { Room: true }
            });

            const now = new Date();
            const dueCleaning = [];
            const dueLaundry = [];

            for (const room of hostel.Room) {
                // Effective Intervals (Room level wins, then Hostel level, finally fallback defaults)
                const effectiveCleaningInterval = room.cleaningInterval || hostel.cleaningInterval || 24;
                const effectiveLaundryInterval = room.laundryInterval || hostel.laundryInterval || 48;

                // Check Cleaning Overdue
                const lastCleaning = room.lastCleaningAt || room.createdAt;
                const hoursSinceLastC = (now - lastCleaning) / (1000 * 60 * 60);
                if (hoursSinceLastC >= effectiveCleaningInterval) {
                    dueCleaning.push({
                        ...room,
                        overdueHours: Math.floor(hoursSinceLastC - effectiveCleaningInterval),
                        lastPerformed: lastCleaning
                    });
                }

                // Check Laundry Overdue
                const lastLaundry = room.lastLaundryAt || room.createdAt;
                const hoursSinceLastL = (now - lastLaundry) / (1000 * 60 * 60);
                if (hoursSinceLastL >= effectiveLaundryInterval) {
                    dueLaundry.push({
                        ...room,
                        overdueHours: Math.floor(hoursSinceLastL - effectiveLaundryInterval),
                        lastPerformed: lastLaundry
                    });
                }
            }

            return { dueCleaning, dueLaundry };
        } catch (error) {
            console.error("Error in getDueServices:", error);
            throw error;
        }
    }

    async getHostelRooms(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { hostelId: true }
            });

            if (!user || !user.hostelId) return [];

            return await prisma.room.findMany({
                where: { hostelId: user.hostelId },
                include: {
                    Booking: {
                        where: {
                            status: {
                                in: ['CHECKED_IN', 'CONFIRMED']
                            }
                        },
                        include: {
                            User: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    phone: true
                                }
                            }
                        }
                    }
                },
                orderBy: { roomNumber: 'asc' }
            });
        } catch (error) {
            console.error("Error in getHostelRooms:", error);
            throw error;
        }
    }
}
