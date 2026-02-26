import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { userId, status, notes } = await request.json();

        if (!userId) {
            return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
        }

        const staffProfile = await prisma.staffProfile.findUnique({
            where: { userId }
        });

        if (!staffProfile) {
            return NextResponse.json({ success: false, error: "Staff profile not found" }, { status: 404 });
        }

        // Check if there's an active check-in for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingAttendance = await prisma.staffAttendance.findFirst({
            where: {
                staffProfileId: staffProfile.id,
                checkIn: {
                    gte: today
                },
                checkOut: null
            }
        });

        if (status === "CHECK_IN") {
            if (existingAttendance) {
                return NextResponse.json({ success: false, error: "Already checked in" }, { status: 400 });
            }

            const attendance = await prisma.staffAttendance.create({
                data: {
                    staffProfileId: staffProfile.id,
                    status: "PRESENT",
                    notes: notes || "Daily Check-in"
                }
            });

            return NextResponse.json({ success: true, data: attendance });
        } else if (status === "CHECK_OUT") {
            if (!existingAttendance) {
                return NextResponse.json({ success: false, error: "No active check-in found" }, { status: 400 });
            }

            const attendance = await prisma.staffAttendance.update({
                where: { id: existingAttendance.id },
                data: {
                    checkOut: new Date(),
                    notes: notes ? `${existingAttendance.notes} | Checkout: ${notes}` : existingAttendance.notes
                }
            });

            return NextResponse.json({ success: true, data: attendance });
        }

        return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    } catch (error) {
        console.error("Attendance Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const staffProfileId = searchParams.get("staffProfileId");

        let id = staffProfileId;
        if (userId) {
            const profile = await prisma.staffProfile.findUnique({ where: { userId } });
            id = profile?.id;
        }

        if (!id) {
            return NextResponse.json({ success: false, error: "Staff identification required" }, { status: 400 });
        }

        const attendance = await prisma.staffAttendance.findMany({
            where: { staffProfileId: id },
            orderBy: { checkIn: 'desc' },
            take: 30
        });

        return NextResponse.json({ success: true, data: attendance });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
