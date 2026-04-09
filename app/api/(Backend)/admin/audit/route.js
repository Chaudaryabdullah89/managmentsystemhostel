export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/apiAuth';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { errorResponse } from '@/lib/apiResponse';

export async function GET(request) {
    const auth = await requireAuth();
    if (!auth.success) return errorResponse(auth.error, auth.status);

    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("query");

        if (!query) {
            return NextResponse.json({ success: false, error: "Search query is required" }, { status: 400 });
        }

        const results = {
            user: null,
            booking: null,
            payment: null,
            complaint: null,
            maintenance: null
        };

        // 1. Try to find user by email or ID
        if (query.includes('@')) {
            results.user = await prisma.user.findUnique({
                where: { email: query },
                include: {
                    ResidentProfile: true,
                    StaffProfile: true,
                    Booking: {
                        include: { Room: { include: { Hostel: true } } },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            });
        } else {
            // Try as ID for User
            results.user = await prisma.user.findUnique({
                where: { id: query },
                include: { ResidentProfile: true, StaffProfile: true }
            });

            // Try as Reg Number if not found
            if (!results.user) {
                results.user = await prisma.user.findUnique({
                    where: { regNumber: query },
                    include: { ResidentProfile: true, StaffProfile: true }
                });
            }
        }

        // 2. Try to find Booking by ID
        if (!results.booking) {
            results.booking = await prisma.booking.findUnique({
                where: { id: query },
                include: {
                    User: true,
                    Room: { include: { Hostel: true } },
                    Payment: true
                }
            });
        }

        // 3. Try to find Payment by ID
        if (!results.payment) {
            results.payment = await prisma.payment.findUnique({
                where: { id: query },
                include: {
                    User: true,
                    Booking: { include: { Room: { include: { Hostel: true } } } }
                }
            });
        }

        // 4. Try to find Complaint by ID
        if (!results.complaint) {
            results.complaint = await prisma.complaint.findUnique({
                where: { id: query },
                include: {
                    User_Complaint_userIdToUser: true,
                    Hostel: true,
                    comments: { include: { User: true } }
                }
            });
        }

        // 5. Try to find Maintenance by ID
        if (!results.maintenance) {
            results.maintenance = await prisma.maintenance.findUnique({
                where: { id: query },
                include: {
                    Hostel: true,
                    Room: true,
                    User: true
                }
            });
        }

        // If we found a user (either by email or ID from previous step)
        if (results.user) {
            const userId = results.user.id;
            const [allPayments, allComplaints, allMaintenance, allBookings] = await Promise.all([
                prisma.payment.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
                prisma.complaint.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { comments: true } }),
                prisma.maintenance.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
                prisma.booking.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                    include: { Room: { include: { Hostel: true } } }
                })
            ]);
            results.allPayments = allPayments;
            results.allComplaints = allComplaints;
            results.allMaintenance = allMaintenance;
            results.allBookings = allBookings;
        }

        return NextResponse.json({
            success: true,
            results
        });

    } catch (error) {
        console.error("Audit Search Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
