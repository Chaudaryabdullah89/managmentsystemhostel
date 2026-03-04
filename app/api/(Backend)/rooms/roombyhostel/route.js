export const dynamic = 'force-dynamic';
import { checkRole } from '@/lib/checkRole';
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import RoomServices from "../../../../../lib/services/roomservices/roomservices";

export async function GET(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { searchParams } = new URL(request.url);
        let hostelId = searchParams.get('hostelId');

        // Security: Wardens can ONLY see their assigned hostel's rooms
        if (auth.user.role === 'WARDEN') {
            let wardenHostelId = auth.user.hostelId;
            if (!wardenHostelId) {
                const wardenProfile = await prisma.user.findUnique({
                    where: { id: auth.user.userId || auth.user.id },
                    select: { hostelId: true }
                });
                wardenHostelId = wardenProfile?.hostelId;
            }

            if (!hostelId || hostelId !== wardenHostelId) {
                hostelId = wardenHostelId;
            }
        }

        if (!hostelId) {
            return NextResponse.json({
                error: "hostelId is required",
                success: false
            }, { status: 400 });
        }

        const roomData = await new RoomServices().getRoomByHostelId(hostelId)
        return NextResponse.json({
            message: "Rooms fetched successfully",
            data: roomData,
            success: true
        })
    } catch (error) {
        console.error("GET Rooms Error:", error);
        return NextResponse.json({
            error: "Failed to fetch rooms",
            success: false
        }, { status: 500 })
    }
}