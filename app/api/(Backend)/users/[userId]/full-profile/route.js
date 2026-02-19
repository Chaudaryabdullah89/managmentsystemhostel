import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
    try {
        const { userId } = await params;

        if (!userId) {
            return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                ResidentProfile: true,
                Hostel_User_hostelIdToHostel: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        phone: true,
                        email: true
                    }
                },
                Booking: {
                    where: {
                        status: { in: ['CONFIRMED', 'CHECKED_IN'] }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },  
                    take: 1,
                    include: {
                        Room: {
                            select: {
                                roomNumber: true,
                                floor: true,
                                type: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        // restructure data for easier frontend consumption
        const activeBooking = user.Booking[0];
        const profileData = {
            basic: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                cnic: user.cnic,
                image: user.image,
                role: user.role,
                joinedAt: user.createdAt,
            },
            resident: user.ResidentProfile,
            hostel: user.Hostel_User_hostelIdToHostel,
            residency: activeBooking ? {
                roomNumber: activeBooking.Room.roomNumber,
                floor: activeBooking.Room.floor,
                roomType: activeBooking.Room.type,
                checkIn: activeBooking.checkIn,
                status: activeBooking.status
            } : null
        };

        return NextResponse.json({ success: true, data: profileData });

    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
