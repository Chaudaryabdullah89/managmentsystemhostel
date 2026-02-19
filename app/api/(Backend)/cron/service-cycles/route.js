import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function GET(req) {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const now = new Date();

        // 1. Fetch all hostels with their specific service intervals
        const hostels = await prisma.hostel.findMany({
            include: {
                Room: {
                    include: {
                        Booking: {
                            where: {
                                status: { in: ['CONFIRMED', 'CHECKED_IN'] }
                            },
                            take: 1
                        }
                    }
                }
            }
        });

        const report = {
            cleaningLogsCreated: 0,
            laundryLogsCreated: 0,
            roomsProcessed: 0,
            hostelsProcessed: hostels.length
        };

        for (const hostel of hostels) {
            const cleaningInterval = hostel.cleaningInterval || 24; // Default 24 hours
            const laundryInterval = hostel.laundryInterval || 48;   // Default 48 hours

            for (const room of hostel.Room) {
                report.roomsProcessed++;

                // --- CLEANING CYCLE LOGIC ---
                let shouldLogCleaning = false;
                if (!room.lastCleaningAt) {
                    shouldLogCleaning = true;
                } else {
                    const hoursSinceLastCleaning = (now - new Date(room.lastCleaningAt)) / (1000 * 60 * 60);
                    if (hoursSinceLastCleaning >= cleaningInterval) {
                        shouldLogCleaning = true;
                    }
                }

                if (shouldLogCleaning) {
                    await prisma.cleaningLog.create({
                        data: {
                            id: crypto.randomUUID(),
                            roomId: room.id,
                            hostelId: hostel.id,
                            status: "PENDING",
                            notes: `Automated hygiene check triggered by ${cleaningInterval}hr architecture cycle.`,
                            performedAt: now,
                            createdAt: now
                        }
                    });

                    await prisma.room.update({
                        where: { id: room.id },
                        data: { lastCleaningAt: now }
                    });
                    report.cleaningLogsCreated++;
                }

                // --- LAUNDRY CYCLE LOGIC (Only for occupied rooms) ---
                const activeBooking = room.Booking[0];
                if (activeBooking) {
                    let shouldLogLaundry = false;
                    if (!room.lastLaundryAt) {
                        shouldLogLaundry = true;
                    } else {
                        const hoursSinceLastLaundry = (now - new Date(room.lastLaundryAt)) / (1000 * 60 * 60);
                        if (hoursSinceLastLaundry >= laundryInterval) {
                            shouldLogLaundry = true;
                        }
                    }

                    if (shouldLogLaundry) {
                        await prisma.laundryLog.create({
                            data: {
                                id: crypto.randomUUID(),
                                roomId: room.id,
                                hostelId: hostel.id,
                                residentId: activeBooking.userId,
                                status: "PENDING",
                                notes: `Automated laundry protocol initiated via ${laundryInterval}hr service cycle.`,
                                receivedAt: now,
                                createdAt: now
                            }
                        });

                        await prisma.room.update({
                            where: { id: room.id },
                            data: { lastLaundryAt: now }
                        });
                        report.laundryLogsCreated++;
                    }
                }
            }
        }

        return Response.json({
            success: true,
            timestamp: now.toISOString(),
            report
        });

    } catch (error) {
        console.error("Service Cycle Execution Failed:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
