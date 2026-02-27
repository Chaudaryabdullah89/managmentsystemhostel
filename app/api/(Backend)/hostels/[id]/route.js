import { checkRole } from '@/lib/checkRole';
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
export async function GET(request, { params }) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { id } = await params;
        const hostel = await prisma.hostel.findUnique({
            where: { id },
            include: {
                Room: {
                    select: {
                        id: true,
                        roomNumber: true,
                        status: true,
                        capacity: true,
                        type: true,
                    },
                },
                User_Hostel_managerIdToUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });

        if (!hostel) {
            return NextResponse.json({ success: false, message: "Asset not found in registry" }, { status: 404 });
        }

        const formattedHostel = {
            ...hostel,
            Manager: hostel.User_Hostel_managerIdToUser || null,
        };

        delete formattedHostel.User_Hostel_managerIdToUser;

        return NextResponse.json({ success: true, hostel: formattedHostel });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}