export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/apiAuth';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { sendEmail } from "@/lib/utils/sendmail";
import { monthlyRentEmail } from "@/lib/utils/emailTemplates";
import crypto from "crypto";
import { errorResponse } from '@/lib/apiResponse';
import { getBranding } from "@/lib/permissions";

export async function GET(request) {
    const auth = await requireAuth();
    if (!auth.success) return errorResponse(auth.error, auth.status);

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const month = searchParams.get("month"); // e.g., "January 2026"
        const hostelId = searchParams.get("hostelId");
        const userId = searchParams.get("userId");

        const where = {
            StaffProfile: {
                User: {
                    role: "STAFF",
                },
            },
        };
        if (status && status !== "all") where.status = status;
        if (month) where.month = month;
        if (hostelId && hostelId !== "all") {
            where.StaffProfile = {
                ...where.StaffProfile,
                User: {
                    ...where.StaffProfile.User,
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
    const auth = await requireAuth();
    if (!auth.success) return errorResponse(auth.error, auth.status);

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
            if (staff.User?.role !== "STAFF") {
                return NextResponse.json({ success: false, error: "Selected profile is not a staff member" }, { status: 400 });
            }

            const existing = await prisma.salary.findFirst({
                where: { staffProfileId: staffId, month }
            });

            if (existing) return NextResponse.json({ success: false, error: `Salary for ${staff.User.name} already exists for ${month}` }, { status: 400 });

            const basicSalary = staff.basicSalary;
            const allowances = staff.allowances;
            const bonuses = customBonuses || 0;
            const deductions = customDeductions || 0;
            const amount = customAmount || (basicSalary + allowances + bonuses - deductions);

            const salaryId = crypto.randomUUID();
            const salaryUid = `SAL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

            const newSalary = await prisma.salary.create({
                data: {
                    id: salaryId,
                    uid: salaryUid,
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

            // Send salary notification email
            if (staff.User?.email) {
                const [monthPart, yearPart] = month.split(" ");
                const branding = await getBranding();
                sendEmail({
                    to: staff.User.email,
                    subject: `Salary Generated — ${month} — ${branding.companyName}`,
                    html: monthlyRentEmail({
                        name: staff.User.name,
                        amount,
                        month: monthPart || month,
                        year: yearPart || new Date().getFullYear(),
                        hostelName: null,
                        type: "SALARY",
                        branding,
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
        const staffWhere = {
            User: {
                role: "STAFF",
                ...(body.hostelId ? { hostelId: body.hostelId } : {}),
            },
        };

        const staffList = await prisma.staffProfile.findMany({
            where: staffWhere,
            include: { User: true }
        });

        const results = { created: 0, skipped: 0 };
        const bulkEmailPromises = [];

        for (const staff of staffList) {
            const existing = await prisma.salary.findFirst({
                where: { staffProfileId: staff.id, month: month }
            });

            if (!existing) {
                const salaryId = crypto.randomUUID();
                const salaryUid = `SAL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

                const newSalary = await prisma.salary.create({
                    data: {
                        id: salaryId,
                        uid: salaryUid,
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

                results.created++;

                // Collect salary notification emails for parallel dispatch
                if (staff.User?.email) {
                    const [monthPart, yearPart] = month.split(" ");
                    const branding = await getBranding();
                    bulkEmailPromises.push(
                        sendEmail({
                            to: staff.User.email,
                            subject: `Salary Generated — ${month} — ${branding.companyName}`,
                            html: monthlyRentEmail({
                                name: staff.User.name,
                                amount: staff.basicSalary + staff.allowances,
                                month: monthPart || month,
                                year: yearPart || new Date().getFullYear(),
                                hostelName: null,
                                type: "SALARY",
                                branding,
                            }),
                        }).catch(err => console.error(`[Email] Salary email failed for ${staff.User.name}:`, err))
                    );
                }
            } else {
                results.skipped++;
            }
        }

        if (bulkEmailPromises.length > 0) {
            Promise.allSettled(bulkEmailPromises);
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
