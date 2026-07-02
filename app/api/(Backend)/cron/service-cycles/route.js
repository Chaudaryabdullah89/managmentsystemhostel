export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/checkRole';
import prisma from "@/lib/prisma";
import crypto from "crypto";

const DEFAULT_TIMEZONE = process.env.SERVICE_CYCLE_TIMEZONE || "Asia/Karachi";
const DEFAULT_WINDOW_MINUTES = Number(process.env.SERVICE_CYCLE_WINDOW_MINUTES || 15);
const CLEANING_HOUR = Number(process.env.CLEANING_CRON_HOUR ?? 9);
const CLEANING_MINUTE = Number(process.env.CLEANING_CRON_MINUTE ?? 0);
const LAUNDRY_HOUR = Number(process.env.LAUNDRY_CRON_HOUR ?? 10);
const LAUNDRY_MINUTE = Number(process.env.LAUNDRY_CRON_MINUTE ?? 0);

function getZonedParts(date, timeZone) {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const byType = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return {
        year: Number(byType.year),
        month: Number(byType.month),
        day: Number(byType.day),
        hour: Number(byType.hour),
        minute: Number(byType.minute),
        second: Number(byType.second),
    };
}

function isWithinRunWindow(now, targetHour, targetMinute, timeZone, windowMinutes) {
    const zoned = getZonedParts(now, timeZone);
    const nowMinutes = zoned.hour * 60 + zoned.minute;
    const targetMinutes = targetHour * 60 + targetMinute;
    return Math.abs(nowMinutes - targetMinutes) <= windowMinutes;
}

export async function GET(req) {
    // 1. Check authorization: Allow either valid Vercel Cron Secret OR manual admin trigger
    const authHeader = req.headers.get('authorization');
    const isCronSecretValid = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
    let isAdminManualTrigger = false;

    if (!isCronSecretValid) {
        const auth = await checkRole(["ADMIN"]);
        if (!auth.success) {
            return NextResponse.json({ success: false, message: "Unauthorized. Admin access or valid CRON_SECRET required." }, { status: 401 });
        }
        // Admin manually triggered — always force-run regardless of time window
        isAdminManualTrigger = true;
    }

    try {
        const now = new Date();
        const { searchParams } = new URL(req.url);
        const forceParam = searchParams.get("force") === "true";

        // When called by admin manually (not via cron secret), always force-run
        const force = forceParam || isAdminManualTrigger;

        const runCleaningNow = force || isWithinRunWindow(now, CLEANING_HOUR, CLEANING_MINUTE, DEFAULT_TIMEZONE, DEFAULT_WINDOW_MINUTES);
        const runLaundryNow = force || isWithinRunWindow(now, LAUNDRY_HOUR, LAUNDRY_MINUTE, DEFAULT_TIMEZONE, DEFAULT_WINDOW_MINUTES);

        if (!runCleaningNow && !runLaundryNow) {
            return NextResponse.json({
                success: true,
                skipped: true,
                reason: "Outside configured execution window",
                now: now.toISOString(),
                timezone: DEFAULT_TIMEZONE,
                windowMinutes: DEFAULT_WINDOW_MINUTES,
                schedule: {
                    cleaning: `${String(CLEANING_HOUR).padStart(2, "0")}:${String(CLEANING_MINUTE).padStart(2, "0")}`,
                    laundry: `${String(LAUNDRY_HOUR).padStart(2, "0")}:${String(LAUNDRY_MINUTE).padStart(2, "0")}`,
                },
            });
        }


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
            for (const room of hostel.Room) {
                report.roomsProcessed++;

                // Room-level intervals only — Hostel model has no cleaningInterval/laundryInterval fields
                const cleaningInterval = room.cleaningInterval || 24;
                const laundryInterval = room.laundryInterval || 48;

                // --- CLEANING CYCLE LOGIC (all rooms) ---
                if (runCleaningNow) {
                    const lastCleaningAt = room.lastCleaningAt;
                    const shouldLogCleaning = !lastCleaningAt
                        || (now - new Date(lastCleaningAt)) / (1000 * 60 * 60) >= cleaningInterval;

                    if (shouldLogCleaning) {
                        await prisma.$transaction([
                            prisma.cleaningLog.create({
                                data: {
                                    roomId: room.id,
                                    hostelId: hostel.id,
                                    status: "PENDING",
                                    notes: `Automated hygiene check (${cleaningInterval}h cycle).`,
                                    performedAt: now,
                                }
                            }),
                            prisma.room.update({
                                where: { id: room.id },
                                data: { lastCleaningAt: now }
                            })
                        ]);
                        report.cleaningLogsCreated++;
                    }
                }

                // --- LAUNDRY CYCLE LOGIC (occupied rooms only) ---
                const activeBooking = room.Booking[0];
                if (activeBooking && runLaundryNow) {
                    const lastLaundryAt = room.lastLaundryAt;
                    const shouldLogLaundry = !lastLaundryAt
                        || (now - new Date(lastLaundryAt)) / (1000 * 60 * 60) >= laundryInterval;

                    if (shouldLogLaundry) {
                        await prisma.$transaction([
                            prisma.laundryLog.create({
                                data: {
                                    roomId: room.id,
                                    hostelId: hostel.id,
                                    status: "COMPLETED",
                                    notes: `Automated laundry protocol (${laundryInterval}h cycle).`,
                                    receivedAt: now,
                                    itemsCount: 0,
                                }
                            }),
                            prisma.room.update({
                                where: { id: room.id },
                                data: { lastLaundryAt: now }
                            })
                        ]);
                        report.laundryLogsCreated++;
                    }
                }
            }
        }


        return NextResponse.json({
            success: true,
            timestamp: now.toISOString(),
            timezone: DEFAULT_TIMEZONE,
            schedule: {
                cleaning: `${String(CLEANING_HOUR).padStart(2, "0")}:${String(CLEANING_MINUTE).padStart(2, "0")}`,
                laundry: `${String(LAUNDRY_HOUR).padStart(2, "0")}:${String(LAUNDRY_MINUTE).padStart(2, "0")}`,
            },
            executed: {
                cleaning: runCleaningNow,
                laundry: runLaundryNow
            },
            report
        });

    } catch (error) {
        console.error("Service Cycle Execution Failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
