import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

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
                    orderBy: {
                        createdAt: 'desc'
                    },
                    include: {
                        Room: {
                            include: {
                                Hostel: {
                                    select: {
                                        name: true,
                                        address: true
                                    }
                                }
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
        // identify active/latest and history
        const activeBooking = user.Booking.find(b => ['CONFIRMED', 'CHECKED_IN'].includes(b.status));
        const history = user.Booking.filter(b => b.status === 'CHECKED_OUT').map(b => ({
            id: b.id,
            roomNumber: b.Room?.roomNumber,
            hostelName: b.Room?.Hostel?.name,
            checkIn: b.checkIn,
            checkOut: b.checkOut,
            status: b.status
        }));

        const profileData = {
            basic: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                cnic: user.cnic,
                image: user.image,
                role: user.role,
                joinedAt: user.createdAt,
                uid: user.uid
            },
            resident: user.ResidentProfile,
            hostel: user.Hostel_User_hostelIdToHostel,
            residency: activeBooking ? {
                roomNumber: activeBooking.Room?.roomNumber,
                floor: activeBooking.Room?.floor,
                roomType: activeBooking.Room?.type,
                checkIn: activeBooking.checkIn,
                status: activeBooking.status,
                hostelName: activeBooking.Room?.Hostel?.name
            } : null,
            history: history
        };

        return NextResponse.json({ success: true, data: profileData });

    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
