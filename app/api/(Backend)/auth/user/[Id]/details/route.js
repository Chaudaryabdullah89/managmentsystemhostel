import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export async function GET(req, { params }) {

    const { Id } = await params;

    console.log(Id, "it is id");

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
                image: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                // Correct Prisma relation names from schema.prisma
                ResidentProfile: {
                    select: {
                        id: true,
                        guardianName: true,
                        guardianPhone: true,
                        emergencyContact: true,
                        address: true,
                        city: true,
                        currentHostelId: true,
                        currentRoomId: true,
                        documents: true,
                    }
                },
                StaffProfile: {
                    select: {
                        id: true,
                        designation: true,
                        department: true,
                        shift: true,
                        basicSalary: true,
                        allowances: true,
                        joiningDate: true,
                        documents: true,
                        Salary: {
                            select: {
                                id: true,
                                month: true,
                                amount: true,
                                basicSalary: true,
                                allowances: true,
                                bonuses: true,
                                deductions: true,
                                status: true,
                                paymentDate: true,
                                paymentMethod: true,
                                notes: true,
                                createdAt: true,
                                updatedAt: true
                            }
                        }
                    }
                },
                Complaint_Complaint_userIdToUser: {
                    select: {
                        id: true,
                        hostelId: true,
                        roomNumber: true,
                        title: true,
                        description: true,
                        category: true,
                        priority: true,
                        status: true,
                        assignedToId: true,
                        resolutionNotes: true,
                        resolvedAt: true,
                        images: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                },
                maintanance_maintanance_userIdToUser: {
                    select: {
                        id: true,
                        hostelId: true,
                        title: true,
                        description: true,
                        status: true,
                        assignedToId: true,
                        resolutionNotes: true,
                        resolvedAt: true,
                        images: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                },
                Hostel_Hostel_managerIdToUser: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        address: true,
                        city: true,
                        state: true,
                        country: true,
                        phone: true,
                        email: true,
                        description: true,
                        floors: true,
                        image: true,
                        managerId: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                },
                Complaint_Complaint_assignedToIdToUser: {
                    select: {
                        id: true,
                        hostelId: true,
                        roomNumber: true,
                        title: true,
                        description: true,
                        category: true,
                        priority: true,
                        status: true,
                        assignedToId: true,
                        resolutionNotes: true,
                        resolvedAt: true,
                        images: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                },
                Expense_Expense_submittedByIdToUser: {
                    select: {
                        id: true,
                        hostelId: true,
                        title: true,
                        description: true,
                        amount: true,
                        date: true,
                        category: true,
                        status: true,
                        receiptUrl: true,
                        submittedById: true,
                        approvedById: true,
                        createdAt: true,
                        updatedAt: true,
                        rejectedById: true,
                    }
                },
                Expense_Expense_approvedByIdToUser: true,
                Expense_Expense_rejectedByIdToUser: true,

                Booking: {
                    select: {
                        id: true,
                        roomId: true,
                        Room: {
                            include: {
                                Hostel: true,
                                CleaningLog: {
                                    orderBy: { createdAt: 'desc' },
                                    take: 10
                                },
                                LaundryLog: {
                                    orderBy: { createdAt: 'desc' },
                                    take: 10
                                }
                            }
                        },
                        checkIn: true,
                        checkOut: true,
                        status: true,
                        totalAmount: true,
                        securityDeposit: true,
                        Payment: {
                            select: {
                                id: true,
                                amount: true,
                                date: true,
                                dueDate: true,
                                type: true,
                                status: true,
                                method: true,
                                transactionId: true,
                                receiptUrl: true,
                                notes: true,
                                createdAt: true,
                                updatedAt: true,
                            }
                        },
                        createdAt: true,
                        updatedAt: true,
                    }
                },

                Payment: {
                    select: {
                        id: true,
                        bookingId: true,
                        amount: true,
                        date: true,
                        dueDate: true,
                        type: true,
                        status: true,
                        method: true,
                        transactionId: true,
                        receiptUrl: true,
                        notes: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                }
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Map back to friendly names for frontend compatibility
        const formattedUser = {
            ...user,
            residentProfile: user.ResidentProfile,
            staffProfile: user.StaffProfile,
            salaries: user.StaffProfile?.Salary,
            complaints: user.Complaint_Complaint_userIdToUser,
            maintenanceTasks: user.maintanance_maintanance_userIdToUser,
            managedHostels: user.Hostel_Hostel_managerIdToUser,
            handledComplaints: user.Complaint_Complaint_assignedToIdToUser,
            createdExpenses: user.Expense_Expense_submittedByIdToUser,
            approvedExpenses: user.Expense_Expense_approvedByIdToUser,
            rejectedExpenses: user.Expense_Expense_rejectedByIdToUser,
            bookings: user.Booking?.map(b => ({
                ...b,
                room: b.Room,
                payments: b.Payment
            })),
            payments: user.Payment
        };

        // Remove the long Prisma internal names
        delete formattedUser.ResidentProfile;
        delete formattedUser.StaffProfile;
        delete formattedUser.Complaint_Complaint_userIdToUser;
        delete formattedUser.maintanance_maintanance_userIdToUser;
        delete formattedUser.Hostel_Hostel_managerIdToUser;
        delete formattedUser.Complaint_Complaint_assignedToIdToUser;
        delete formattedUser.Expense_Expense_submittedByIdToUser;
        delete formattedUser.Expense_Expense_approvedByIdToUser;
        delete formattedUser.Expense_Expense_rejectedByIdToUser;
        delete formattedUser.Booking;
        delete formattedUser.Payment;

        return NextResponse.json(formattedUser);
    } catch (err) {
        console.error("Error fetching user:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}