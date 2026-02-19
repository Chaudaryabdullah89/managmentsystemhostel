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
                StaffProfile: {
                    include: {
                        Salary: {
                            orderBy: { month: 'desc' },
                            take: 5
                        }
                    }
                },
                Hostel_User_hostelIdToHostel: {
                    select: { name: true }
                },
                Booking: {
                    include: {
                        Room: {
                            include: { Hostel: true }
                        },
                        Payment: true
                    },
                    orderBy: { createdAt: 'desc' }
                },
                Payment: {
                    orderBy: { date: 'desc' },
                    take: 10
                },
                Complaint_Complaint_userIdToUser: {
                    include: { Hostel: true },
                    orderBy: { createdAt: 'desc' }
                },
                Complaint_Complaint_assignedToIdToUser: {
                    include: { Hostel: true },
                    orderBy: { createdAt: 'desc' }
                },
                maintanance_maintanance_userIdToUser: {
                    include: { Hostel: true },
                    orderBy: { createdAt: 'desc' }
                },
                Expense_Expense_submittedByIdToUser: {
                    orderBy: { createdAt: 'desc' }
                },
                Hostel_Hostel_managerIdToUser: true
            }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user
        });
    } catch (error) {
        console.error("User Detail Fetch Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    try {
        const { userId } = await params;
        const body = await request.json();

        // Sanitize body: remove relation fields that cause Prisma to fail if passed directly
        const {
            StaffProfile,
            ResidentProfile,
            Hostel_User_hostelIdToHostel,
            Booking,
            Payment,
            Session,
            Complaint_Complaint_assignedToIdToUser,
            Complaint_Complaint_userIdToUser,
            Expense_Expense_approvedByIdToUser,
            Expense_Expense_rejectedByIdToUser,
            Expense_Expense_submittedByIdToUser,
            Expense_Expense_userIdToUser,
            Hostel_Hostel_managerIdToUser,
            maintanance_maintanance_assignedToIdToUser,
            maintanance_maintanance_userIdToUser,
            id,
            ...updateData
        } = body;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...updateData,
                updatedAt: new Date()
            },
            include: {
                StaffProfile: true,
                ResidentProfile: true
            }
        });

        return NextResponse.json({
            success: true,
            message: "User identity synchronized",
            user: updatedUser
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { userId } = await params;
        await prisma.user.delete({ where: { id: userId } });
        return NextResponse.json({ success: true, message: "User node purged" });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
