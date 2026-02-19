import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('query');

        if (!query || query.trim().length < 3) {
            return NextResponse.json({
                success: false,
                error: "Search term must be at least 3 characters"
            });
        }

        const searchTerm = query.trim().toUpperCase();

        // Search across all models
        const [users, bookings, payments, complaints, maintenance] = await Promise.all([
            // Search users by UID, email, name, or phone
            prisma.user.findMany({
                where: {
                    OR: [
                        { uid: { contains: searchTerm, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } },
                        { name: { contains: query, mode: 'insensitive' } },
                        { phone: { contains: query, mode: 'insensitive' } },
                        { id: { contains: query, mode: 'insensitive' } }
                    ]
                },
                select: {
                    id: true,
                    uid: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    image: true,
                    createdAt: true
                },
                take: 10
            }),

            // Search bookings by UID or ID
            prisma.booking.findMany({
                where: {
                    OR: [
                        { uid: { contains: searchTerm, mode: 'insensitive' } },
                        { id: { contains: query, mode: 'insensitive' } }
                    ]
                },
                include: {
                    User: {
                        select: {
                            id: true,
                            uid: true,
                            name: true,
                            email: true
                        }
                    },
                    Room: {
                        include: {
                            Hostel: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                },
                take: 10
            }),

            // Search payments by UID or transaction ID
            prisma.payment.findMany({
                where: {
                    OR: [
                        { uid: { contains: searchTerm, mode: 'insensitive' } },
                        { transactionId: { contains: query, mode: 'insensitive' } },
                        { id: { contains: query, mode: 'insensitive' } }
                    ]
                },
                include: {
                    User: {
                        select: {
                            id: true,
                            uid: true,
                            name: true,
                            email: true
                        }
                    },
                    Booking: {
                        select: {
                            id: true,
                            uid: true,
                            checkIn: true,
                            checkOut: true
                        }
                    }
                },
                take: 10
            }),

            // Search complaints by UID or title
            prisma.complaint.findMany({
                where: {
                    OR: [
                        { uid: { contains: searchTerm, mode: 'insensitive' } },
                        { title: { contains: query, mode: 'insensitive' } },
                        { id: { contains: query, mode: 'insensitive' } }
                    ]
                },
                include: {
                    User_Complaint_userIdToUser: {
                        select: {
                            id: true,
                            uid: true,
                            name: true,
                            email: true
                        }
                    },
                    Hostel: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                take: 10
            }),

            // Search maintenance by UID or title
            prisma.maintanance.findMany({
                where: {
                    OR: [
                        { uid: { contains: searchTerm, mode: 'insensitive' } },
                        { title: { contains: query, mode: 'insensitive' } },
                        { id: { contains: query, mode: 'insensitive' } }
                    ]
                },
                include: {
                    User_maintanance_userIdToUser: {
                        select: {
                            id: true,
                            uid: true,
                            name: true,
                            email: true
                        }
                    },
                    Hostel: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                take: 10
            })
        ]);

        return NextResponse.json({
            success: true,
            results: {
                users,
                bookings,
                payments,
                complaints,
                maintenance
            },
            total: users.length + bookings.length + payments.length + complaints.length + maintenance.length
        });

    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({
            success: false,
            error: "Search failed. Please try again."
        }, { status: 500 });
    }
}
