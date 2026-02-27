import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export default class RoomServices {
    async getRooms() {
        try {
            const rooms = await prisma.room.findMany({
                include: {
                    Hostel: true,
                    Booking: {
                        where: {
                            status: {
                                in: ['CONFIRMED', 'COMPLETED']
                            }
                        },
                        include: {
                            User: true
                        }
                    }
                }
            });
            return rooms.map(room => ({
                ...room,
                monthlyrent: room.monthlyrent || room.montlyrent || room.price || 0
            }));
        } catch (error) {
            console.error("Error fetching rooms:", error);
            throw new Error("Failed to fetch rooms");
        }
    }

    async createRoom(data) {
        try {
            const room = await prisma.room.create({
                data: {
                    hostelId: data.hostelId,
                    roomNumber: data.roomNumber,
                    type: data.type,
                    capacity: parseInt(data.capacity || 3),
                    floor: parseInt(data.floor || 0),
                    price: parseFloat(data.price || 0),
                    pernightrent: parseFloat(data.pricepernight || data.pernightrent || 0),
                    montlyrent: parseFloat(data.monthlyrent || data.montlyrent || 0),
                    status: data.status || "AVAILABLE",
                    amenities: data.amenities || [],
                    images: data.images || [],
                    cleaningInterval: data.cleaningInterval ? parseInt(data.cleaningInterval) : 24,
                    laundryInterval: data.laundryInterval ? parseInt(data.laundryInterval) : 48,
                    updatedAt: new Date()
                }
            })
            return room;
        } catch (error) {
            console.error("Error creating room:", error);
            throw error;
        }
    }

    async syncAutomationLogs() {
        try {
            const rooms = await prisma.room.findMany({
                include: { Hostel: true }
            });

            const results = { cleaning: 0, laundry: 0 };
            const now = new Date();

            for (const room of rooms) {
                const hostel = room.Hostel;

                // Effective Intervals (Room level wins, then Hostel level, finally fallback defaults)

                const effectiveCleaningInterval = room.cleaningInterval || hostel.cleaningInterval || 24;
                const effectiveLaundryInterval = room.laundryInterval || hostel.laundryInterval || 48;

                // Check Cleaning
                const lastCleaning = room.lastCleaningAt || room.createdAt;
                const hoursSinceCleaning = (now - lastCleaning) / (1000 * 60 * 60);

                if (hoursSinceCleaning >= effectiveCleaningInterval) {
                    await prisma.$transaction([
                        prisma.cleaningLog.create({
                            data: {
                                roomId: room.id,
                                hostelId: room.hostelId,
                                status: "COMPLETED",
                                notes: `Automated cleaning cycle completed (${Math.floor(hoursSinceCleaning)}h interval)`
                            }
                        }),
                        prisma.room.update({
                            where: { id: room.id },
                            data: { lastCleaningAt: now }
                        })
                    ]);
                    results.cleaning++;
                }

                // Check Laundry
                const lastLaundry = room.lastLaundryAt || room.createdAt;
                const hoursSinceLaundry = (now - lastLaundry) / (1000 * 60 * 60);

                if (hoursSinceLaundry >= effectiveLaundryInterval) {
                    await prisma.$transaction([
                        prisma.laundryLog.create({
                            data: {
                                roomId: room.id,
                                hostelId: room.hostelId,
                                status: "COMPLETED",
                                notes: `Automated laundry cycle completed (${Math.floor(hoursSinceLaundry)}h interval)`,
                                itemsCount: 0 // Placeholder for automated log
                            }
                        }),
                        prisma.room.update({
                            where: { id: room.id },
                            data: { lastLaundryAt: now }
                        })
                    ]);
                    results.laundry++;
                }
            }
            return results;
        } catch (error) {
            console.error("Automation Sync Error:", error);
            throw error;
        }
    }

    async updateRoom(data) {
        try {
            const room = await prisma.room.update({
                where: { id: data.id },
                data: {
                    roomNumber: data.roomNumber,
                    type: data.type,
                    capacity: parseInt(data.capacity),
                    floor: parseInt(data.floor),
                    price: parseFloat(data.price),
                    pernightrent: parseFloat(data.pricepernight || data.pernightrent),
                    montlyrent: parseFloat(data.monthlyrent || data.montlyrent),
                    status: data.status,
                    cleaningInterval: data.cleaningInterval,
                    laundryInterval: data.laundryInterval,
                    amenities: data.amenities || [],
                    images: data.images || [],
                    updatedAt: new Date()
                }
            })
            return room;
        } catch (error) {
            console.error("Error updating room:", error);
            throw error;
        }
    }

    async deleteRoom(id) {
        try {
            const room = await prisma.room.delete({
                where: { id }
            })
            return room;
        } catch (error) {
            console.error("Error deleting room:", error);
            throw error;
        }
    }

    async getRoomByHostelId(id) {
        try {
            const rooms = await prisma.room.findMany({
                where: {
                    hostelId: id
                },
                include: {
                    Hostel: true,
                    Booking: {
                        where: {
                            status: {
                                in: ['CHECKED_IN', 'CONFIRMED']
                            }
                        },
                        include: {
                            User: true
                        }
                    }
                }
            })
            return rooms.map(room => ({
                ...room,
                monthlyrent: room.monthlyrent || room.montlyrent || room.price || 0
            }));
        } catch (error) {
            console.error("Error fetching rooms by hostel id:", error);
            throw new Error("Failed to fetch rooms by hostel id");
        }
    }

    async getSingleRoomByHostelId(hostelId, roomid) {
        try {
            // Strictly match by roomid and (hostelId or hostel Name)
            // No fallback to just roomid to prevent data leakage between hostels
            const room = await prisma.room.findFirst({
                where: {
                    id: roomid,
                    OR: [
                        { hostelId: hostelId },
                        { Hostel: { name: decodeURIComponent(hostelId) } }
                    ]
                },
                include: {
                    Booking: {
                        where: {
                            status: {
                                in: ['CONFIRMED', 'COMPLETED']
                            }
                        },
                        include: {
                            User: true
                        }
                    },
                    Hostel: true
                }
            });

            if (room) {
                // Derive a simple currentGuests array for the UI
                room.currentGuests = room.Booking.map(b => ({
                    id: b.User.id,
                    bookingId: b.id,
                    name: b.User.name,
                    contact: b.User.phone || b.User.email,
                    checkInDate: new Date(b.checkIn).toLocaleDateString(),
                    rentStatus: "Paid"
                }));

                // For now, expose empty logs (Cleaning/Laundry log models are not defined in Prisma)
                room.LaundryLog = [];
                room.CleaningLog = [];
                room.monthlyrent = room.monthlyrent || room.montlyrent || room.price || 0;
            }

            return room;
        } catch (error) {
            console.error("Error fetching single room by hostel id:", error);
            throw new Error("Failed to fetch single room by hostel id");
        }
    }

    async createCleaningLog(data) {
        try {
            const log = await prisma.cleaningLog.create({
                data: {
                    roomId: data.roomId,
                    hostelId: data.hostelId,
                    status: data.status || "COMPLETED",
                    notes: data.notes
                }
            })
            return log;
        } catch (error) {
            console.error("Error creating cleaning log:", error);
            throw error;
        }
    }

    async createLaundryLog(data) {
        try {
            const log = await prisma.laundryLog.create({
                data: {
                    roomId: data.roomId,
                    hostelId: data.hostelId,
                    itemsCount: parseInt(data.itemsCount || 0),
                    status: data.status || "PENDING",
                    notes: data.notes
                }
            })
            return log;
        } catch (error) {
            console.error("Error creating laundry log:", error);
            throw error;
        }
    }

    async updateMaintenanceLog(id, data) {
        try {
            const log = await prisma.maintanance.update({
                where: { id },
                data: {
                    status: data.status,
                    resolutionNotes: data.resolutionNotes,
                    resolvedAt: data.status === 'RESOLVED' ? new Date() : undefined
                }
            })
            return log;
        } catch (error) {
            console.error("Error updating maintenance log:", error);
            throw error;
        }
    }

    async updateCleaningLog(id, data) {
        try {
            const log = await prisma.cleaningLog.update({
                where: { id },
                data: {
                    status: data.status,
                    notes: data.notes
                }
            })

            // Sync room timestamp if completed
            if (data.status === 'COMPLETED') {
                await prisma.room.update({
                    where: { id: log.roomId },
                    data: { lastCleaningAt: new Date() }
                });
            }

            return log;
        } catch (error) {
            console.error("Error updating cleaning log:", error);
            throw error;
        }
    }

    async updateLaundryLog(id, data) {
        try {
            const updateData = {
                status: data.status,
                notes: data.notes,
                itemsCount: data.itemsCount ? parseInt(data.itemsCount) : undefined,
            };

            if (data.status === 'DELIVERED' || data.status === 'COMPLETED') {
                updateData.deliveredAt = new Date();
            }

            const log = await prisma.laundryLog.update({
                where: { id: id },
                data: updateData
            })

            // Sync room timestamp if completed or delivered
            if (data.status === 'DELIVERED' || data.status === 'COMPLETED') {
                await prisma.room.update({
                    where: { id: log.roomId },
                    data: { lastLaundryAt: new Date() }
                });
            }

            return log;
        } catch (error) {
            console.error("Error updating laundry log:", error);
            throw error;
        }
    }
}