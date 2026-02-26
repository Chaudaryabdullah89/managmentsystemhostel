import prisma from "@/lib/prisma";
const { NextResponse } = require("next/server");
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const hostel = await prisma.hostel.findUnique({
            where: { id: id },
            include: {
                Room: {
                    select: {
                        id: true,
                        roomNumber: true,
                        status: true,
                        capacity: true,
                        type: true
                    }
                },
                Manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        if (!hostel) {
            return NextResponse.json({ success: false, message: "Asset not found in registry" }, { status: 404 });
        }

        return NextResponse.json({ success: true, hostel });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}