import { checkRole } from '@/lib/checkRole';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    const { id } = await params;
    console.log(`[API] GET /api/users/profile/${id} - Fetching profile`);

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                cnic: true,
                address: true,
                role: true,
                image: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
                hostelId: true,
                Hostel_User_hostelIdToHostel: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        email: true,
                        phone: true,

                    }
                }
            }
        });

        if (!user) {
            console.warn(`[API] GET /api/users/profile/${id} - User not found`);
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        console.log(`[API] GET /api/users/profile/${id} - Success`);
        return NextResponse.json(user);
    } catch (error) {
        console.error(`[API] GET /api/users/profile/${id} - Error:`, error);
        return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
    }
}
