import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { sendEmail } from "@/lib/utils/sendmail";
import { monthlyRentEmail } from "@/lib/utils/emailTemplates";
import crypto from "crypto";

export async function GET(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const month = searchParams.get("month"); // e.g., "January 2026"
        const hostelId = searchParams.get("hostelId");
        const userId = searchParams.get("userId");

        const where = {};
        if (status && status !== "all") where.status = status;
        if (month) where.month = month;
        if (hostelId && hostelId !== "all") {
            where.StaffProfile = {
                User: {
                    hostelId: hostelId
                }
            };
        }
        if (userId) {
            where.StaffProfile = {
                ...(where.StaffProfile || {}),
                userId: userId
            };
        }

        const salaries = await prisma.salary.findMany({
            where,
            include: {
                StaffProfile: {
                    include: {
                        User: {
                            select: {
                                name: true,
                                email: true,
                                phone: true,
                                role: true,
                                hostelId: true,
                                Hostel_User_hostelIdToHostel: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({
            success: true,
            salaries
        });
    } catch (error) {
        console.error("Salary Fetch Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// Generate Payroll for the month
export async function POST(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const body = await request.json();
        const { month, staffId, customAmount, customBonuses, customDeductions, customNotes } = body;

        if (!month) {
            return NextResponse.json({ success: false, error: "Month is required" }, { status: 400 });
        }

        // Single Salary Record Creation
        if (staffId) {
            const staff = await prisma.staffProfile.findUnique({
                where: { id: staffId },
                include: { User: true }
            });

            if (!staff) return NextResponse.json({ success: false, error: "Staff not found" }, { status: 404 });

            const existing = await prisma.salary.findFirst({
                where: { staffProfileId: staffId, month }
            });

            if (existing) return NextResponse.json({ success: false, error: `Salary for ${staff.User.name} already exists for ${month}` }, { status: 400 });

            const basicSalary = staff.basicSalary;
            const allowances = staff.allowances;
            const bonuses = customBonuses || 0;
            const deductions = customDeductions || 0;
            const amount = customAmount || (basicSalary + allowances + bonuses - deductions);

            const newSalary = await prisma.salary.create({
                data: {
                    id: crypto.randomUUID(),
                    staffProfileId: staffId,
                    month,
                    amount,
                    basicSalary,
                    allowances,
                    bonuses,
                    deductions,
                    notes: customNotes || "Manual Entry",
                    status: 'PENDING',
                    updatedAt: new Date()
                },
                include: {
                    StaffProfile: {
                        include: { User: true }
                    }
                }
            });

            // Generate and assign UID
            const salaryUid = `SAL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
            await prisma.salary.update({
                where: { id: newSalary.id },
                data: { uid: salaryUid }
            });

            newSalary.uid = salaryUid;

            // Send salary notification email
            if (staff.User?.email) {
                const [monthPart, yearPart] = month.split(" ");
                sendEmail({
                    to: staff.User.email,
                    subject: `Salary Generated — ${month} — GreenView Hostels`,
                    html: monthlyRentEmail({
                        name: staff.User.name,
                        amount,
                        month: monthPart || month,
                        year: yearPart || new Date().getFullYear(),
                        hostelName: null,
                        type: "SALARY",
                    }),
                }).catch(err => console.error("[Email] Salary email failed:", err));
            }

            return NextResponse.json({
                success: true,
                message: `Salary record initiated for ${staff.User.name}`,
                salary: newSalary
            });
        }

        // Bulk Generation Logic
        const staffWhere = {};
        if (body.hostelId) {
            staffWhere.User = {
                hostelId: body.hostelId
            };
        }

        const staffList = await prisma.staffProfile.findMany({
            where: staffWhere,
            include: { User: true }
        });

        const results = { created: 0, skipped: 0 };

        for (const staff of staffList) {
            const existing = await prisma.salary.findFirst({
                where: { staffProfileId: staff.id, month: month }
            });

            if (!existing) {
                const newSalary = await prisma.salary.create({
                    data: {
                        id: crypto.randomUUID(),
                        staffProfileId: staff.id,
                        month: month,
                        amount: (staff.basicSalary || 0) + (staff.allowances || 0),
                        basicSalary: staff.basicSalary || 0,
                        allowances: staff.allowances || 0,
                        bonuses: 0,
                        deductions: 0,
                        status: 'PENDING',
                        updatedAt: new Date()
                    }
                });

                const salaryUid = `SAL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
                await prisma.salary.update({
                    where: { id: newSalary.id },
                    data: { uid: salaryUid }
                });
                results.created++;

                // Send salary notification email
                if (staff.User?.email) {
                    const [monthPart, yearPart] = month.split(" ");
                    sendEmail({
                        to: staff.User.email,
                        subject: `Salary Generated — ${month} — GreenView Hostels`,
                        html: monthlyRentEmail({
                            name: staff.User.name,
                            amount: staff.basicSalary + staff.allowances,
                            month: monthPart || month,
                            year: yearPart || new Date().getFullYear(),
                            hostelName: null,
                            type: "SALARY",
                        }),
                    }).catch(err => console.error(`[Email] Salary email failed for ${staff.User.name}:`, err));
                }
            } else {
                results.skipped++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Payroll for ${month} processed.`,
            results
        });
    } catch (error) {
        console.error("Payroll Operation Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
