import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export async function GET(req, { params }) {

    const { Id } = await params;


    if (!Id) {
        return NextResponse.json({ error: "User ID is required" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: Id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                cnic: true,
                phone: true,
                address: true,
                city: true,
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
                        city: true,
                        phone: true,
                        email: true
                    }
                }
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (err) {
        console.error("Error fetching user:", err);
        return NextResponse.json({ error: "Internal server error" });
    }
}