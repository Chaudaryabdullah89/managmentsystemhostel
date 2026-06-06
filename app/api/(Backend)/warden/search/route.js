export const dynamic = 'force-dynamic';
import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
    const auth = await checkRole(['WARDEN', 'ADMIN']);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('query');

        if (!query || query.trim().length < 2) {
            return NextResponse.json({
                success: false,
                error: "Search term must be at least 2 characters"
            });
        }

        const searchTerm = query.trim().toUpperCase();

        // Determine the hostelId to filter by. 
        // If it's a Warden, we use their own hostelId.
        let hostelId = auth.user.hostelId;

        // Fallback for Warden if hostelId is not in auth token (though it should be)
        if (auth.user.role === 'WARDEN' && !hostelId) {
            const wardenProfile = await prisma.user.findUnique({
                where: { id: auth.user.userId || auth.user.id },
                select: { hostelId: true }
            });
            hostelId = wardenProfile?.hostelId;
        }

        if (!hostelId && auth.user.role === 'WARDEN') {
            return NextResponse.json({ success: false, error: "Unauthorized: No hostel assigned to account." }, { status: 403 });
        }

        const whereFilter = (field = 'hostelId') => {
            if (auth.user.role === 'ADMIN') return {}; // Admin sees all
            return { [field]: hostelId };
        };

        // Search across models restricted to this hostel
        const [users, bookings, payments, complaints, maintenance] = await Promise.all([
            // Users in this hostel (Wardens can only see Residents and Guests of their hostel)
            prisma.user.findMany({
                where: {
                    AND: [
                        { OR: [{ hostelId: hostelId }, { ResidentProfile: { currentHostelId: hostelId } }] },
                        { role: { in: ['RESIDENT', 'GUEST'] } },
                        {
                            OR: [
                                { uid: { contains: searchTerm, mode: 'insensitive' } },
                                { email: { contains: query, mode: 'insensitive' } },
                                { name: { contains: query, mode: 'insensitive' } },
                                { phone: { contains: query, mode: 'insensitive' } },
                                { regNumber: { contains: query, mode: 'insensitive' } },
                                { cnic: { contains: query, mode: 'insensitive' } },
                                { id: { contains: query, mode: 'insensitive' } }
                            ]
                        }
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

            // Bookings in this hostel
            prisma.booking.findMany({
                where: {
                    AND: [
                        { Room: { hostelId: hostelId } },
                        {
                            OR: [
                                { uid: { contains: searchTerm, mode: 'insensitive' } },
                                { id: { contains: query, mode: 'insensitive' } },
                                {
                                    User: {
                                        OR: [
                                            { name: { contains: query, mode: 'insensitive' } },
                                            { email: { contains: query, mode: 'insensitive' } },
                                            { uid: { contains: searchTerm, mode: 'insensitive' } },
                                            { regNumber: { contains: query, mode: 'insensitive' } }
                                        ]
                                    }
                                }
                            ]
                        }
                    ]
                },
                include: {
                    User: {
                        select: {
                            id: true,
                            uid: true,
                            name: true,
                            email: true,
                            cnic: true,
                            ResidentProfile: {
                                select: {
                                    documents: true
                                }
                            }
                        }
                    },
                    Room: { include: { Hostel: { select: { id: true, name: true } } } }
                },
                take: 10
            }),

            // Payments related to users in this hostel
            prisma.payment.findMany({
                where: {
                    AND: [
                        { OR: [{ User: { hostelId: hostelId } }, { User: { ResidentProfile: { currentHostelId: hostelId } } }] },
                        {
                            OR: [
                                { uid: { contains: searchTerm, mode: 'insensitive' } },
                                { transactionId: { contains: query, mode: 'insensitive' } },
                                { id: { contains: query, mode: 'insensitive' } },
                                {
                                    User: {
                                        OR: [
                                            { name: { contains: query, mode: 'insensitive' } },
                                            { email: { contains: query, mode: 'insensitive' } },
                                            { uid: { contains: searchTerm, mode: 'insensitive' } },
                                            { regNumber: { contains: query, mode: 'insensitive' } }
                                        ]
                                    }
                                }
                            ]
                        }
                    ]
                },
                include: {
                    User: { select: { id: true, uid: true, name: true, email: true } },
                    Booking: { select: { id: true, uid: true } }
                },
                take: 10
            }),

            // Complaints in this hostel
            prisma.complaint.findMany({
                where: {
                    AND: [
                        { hostelId: hostelId },
                        {
                            OR: [
                                { uid: { contains: searchTerm, mode: 'insensitive' } },
                                { title: { contains: query, mode: 'insensitive' } },
                                { id: { contains: query, mode: 'insensitive' } },
                                {
                                    User_Complaint_userIdToUser: {
                                        OR: [
                                            { name: { contains: query, mode: 'insensitive' } },
                                            { email: { contains: query, mode: 'insensitive' } },
                                            { regNumber: { contains: query, mode: 'insensitive' } }
                                        ]
                                    }
                                }
                            ]
                        }
                    ]
                },
                include: {
                    User_Complaint_userIdToUser: { select: { id: true, uid: true, name: true, email: true } },
                    Hostel: { select: { id: true, name: true } }
                },
                take: 10
            }),

            // Maintenance in this hostel
            prisma.maintenance.findMany({
                where: {
                    AND: [
                        { hostelId: hostelId },
                        {
                            OR: [
                                { uid: { contains: searchTerm, mode: 'insensitive' } },
                                { title: { contains: query, mode: 'insensitive' } },
                                { id: { contains: query, mode: 'insensitive' } },
                                {
                                    User: {
                                        OR: [
                                            { name: { contains: query, mode: 'insensitive' } },
                                            { email: { contains: query, mode: 'insensitive' } },
                                            { regNumber: { contains: query, mode: 'insensitive' } }
                                        ]
                                    }
                                }
                            ]
                        }
                    ]
                },
                include: {
                    User: { select: { id: true, uid: true, name: true, email: true } },
                    Hostel: { select: { id: true, name: true } }
                },
                take: 10
            })
        ]);

        return NextResponse.json({
            success: true,
            results: { users, bookings, payments, complaints, maintenance },
            total: users.length + bookings.length + payments.length + complaints.length + maintenance.length
        });

    } catch (error) {
        console.error("[Warden Search Error]:", error);
        return NextResponse.json({ success: false, error: "Search failed." }, { status: 500 });
    }
}
