export const dynamic = 'force-dynamic';
import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import ExpenseServices from "@/lib/services/expenseservices/expenseservices";
import prisma from "@/lib/prisma";

export async function GET(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { searchParams } = new URL(request.url);
        const stats = searchParams.get("stats");
        const hostelIdInput = searchParams.get("hostelId");
        const statusInput = searchParams.get("status");
        const categoryInput = searchParams.get("category");
        const startDateInput = searchParams.get("startDate");
        const endDateInput = searchParams.get("endDate");
        const submittedById = searchParams.get("submittedById");

        const sanitize = (val) => (val === 'all' || val === 'null' || val === 'undefined' || !val) ? null : val;
        let hostelId = sanitize(hostelIdInput);
        const status = sanitize(statusInput);
        const category = sanitize(categoryInput);

        // Security: Wardens can ONLY see their own hostel's data
        if (auth.user.role === 'WARDEN') {
            const targetId = auth.user.id || auth.user.userId || auth.user.sub;
            const wardenProfile = await prisma.user.findUnique({
                where: { id: targetId },
                select: {
                    hostelId: true,
                    canManageExpenses: true,
                    canManageMess: true,
                    canManageGeneral: true,
                    canManageUtilities: true,
                    canManageMaintenance: true,
                    canManageSalaries: true
                }
            });

            if (wardenProfile) {
                auth.user.hostelId = wardenProfile.hostelId;
                auth.user.canManageExpenses = wardenProfile.canManageExpenses;
                auth.user.canManageMess = wardenProfile.canManageMess;
                auth.user.canManageGeneral = wardenProfile.canManageGeneral;
                auth.user.canManageUtilities = wardenProfile.canManageUtilities;
                auth.user.canManageMaintenance = wardenProfile.canManageMaintenance;
                auth.user.canManageSalaries = wardenProfile.canManageSalaries;
            }
            let wardenHostelId = auth.user.hostelId;

            console.log(`[API] Warden ID check:`, { hostelId, wardenHostelId });

            if (!hostelId || hostelId === 'all') {
                hostelId = wardenHostelId;
            } else if (hostelId !== wardenHostelId) {
                console.warn(`[API] Warden ${auth.user.email} attempted access to hostel ${hostelId}. Reverting to assigned ${wardenHostelId}.`);
                hostelId = wardenHostelId;
            }

            // If still no hostelId found, they shouldn't see anything for "all"
            if (!hostelId) {
                console.error(`[API] CRITICAL: Warden ${auth.user.email} has no assigned hostelId in DB!`);
                return NextResponse.json({ success: false, error: "Your account is not assigned to any hostel facility." }, { status: 403 });
            }
        }

        const startDate = (startDateInput && startDateInput !== "undefined") ? startDateInput : null;
        const endDate = (endDateInput && endDateInput !== "undefined") ? endDateInput : null;

        console.log(`[API] GET /api/expenses - Final Filter:`, { hostelId, status, category, startDate, endDate, role: auth.user.role });

        let allowedCategories = undefined;
        if (auth.user.role === 'WARDEN' && !auth.user.canManageExpenses) {
            allowedCategories = [];
            if (auth.user.canManageMess) allowedCategories.push('MESS');
            if (auth.user.canManageGeneral) allowedCategories.push('GENERAL');
            if (auth.user.canManageUtilities) allowedCategories.push('UTILITY_BILL');
            if (auth.user.canManageMaintenance) allowedCategories.push('MAINTENANCE');
            if (auth.user.canManageSalaries) allowedCategories.push('SALARY');

            if (allowedCategories.length === 0) {
                // Return empty array instead of 'NONE' to avoid enum validation errors
            }
        }

        if (stats === "true") {
            const data = await ExpenseServices.getExpenseStats({
                hostelId,
                allowedCategories
            });
            return NextResponse.json({ success: true, data });
        }

        const expenses = await ExpenseServices.getExpenses({
            hostelId,
            status,
            category,
            startDate,
            endDate,
            submittedById,
            allowedCategories
        });

        console.log(`[API] GET /api/expenses - Results: ${expenses.length} records found`);
        return NextResponse.json({ success: true, data: expenses });
    } catch (error) {
        console.error("API Error in Expenses GET:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const body = await request.json();

        // Security: Enforce Warden's hostel if they are a warden
        if (auth.user.role === 'WARDEN') {
            let wardenHostelId = auth.user.hostelId;
            let wardenPermissions = {
                canManageExpenses: auth.user.canManageExpenses,
                canManageMess: auth.user.canManageMess,
                canManageGeneral: auth.user.canManageGeneral,
                canManageUtilities: auth.user.canManageUtilities,
                canManageMaintenance: auth.user.canManageMaintenance,
                canManageSalaries: auth.user.canManageSalaries
            };
            if (!wardenHostelId) {
                const targetId = auth.user.userId || auth.user.id || auth.user.sub;
                if (targetId) {
                    const wardenProfile = await prisma.user.findUnique({
                        where: { id: targetId },
                        select: {
                            hostelId: true,
                            canManageExpenses: true,
                            canManageMess: true,
                            canManageGeneral: true,
                            canManageUtilities: true,
                            canManageMaintenance: true,
                            canManageSalaries: true
                        }
                    });
                    wardenHostelId = wardenProfile?.hostelId;
                    if (wardenProfile) {
                        wardenPermissions = {
                            canManageExpenses: wardenProfile.canManageExpenses,
                            canManageMess: wardenProfile.canManageMess,
                            canManageGeneral: wardenProfile.canManageGeneral,
                            canManageUtilities: wardenProfile.canManageUtilities,
                            canManageMaintenance: wardenProfile.canManageMaintenance,
                            canManageSalaries: wardenProfile.canManageSalaries
                        };
                    }
                }
            }

            if (wardenHostelId) {
                body.hostelId = wardenHostelId;
            } else {
                return NextResponse.json({ success: false, error: "Permission Denied: No hostel assigned to your account." }, { status: 403 });
            }

            const categoryPermissions = {
                MESS: wardenPermissions.canManageMess,
                GENERAL: wardenPermissions.canManageGeneral,
                UTILITY_BILL: wardenPermissions.canManageUtilities,
                MAINTENANCE: wardenPermissions.canManageMaintenance,
                SALARY: wardenPermissions.canManageSalaries,
            };

            if (!wardenPermissions.canManageExpenses && !categoryPermissions[body.category]) {
                return NextResponse.json({ success: false, error: "Permission Denied: You cannot create expenses for this category." }, { status: 403 });
            }
        }

        console.log("Inbound Expense Ingress:", body);

        // Validate user existence to prevent P2003 Foreign Key Violation
        if (body.submittedById) {
            const userExists = await prisma.user.findUnique({
                where: { id: body.submittedById },
                select: { id: true }
            });
            if (!userExists) {
                return NextResponse.json({
                    success: false,
                    error: "The submitting user does not exist. Your session may be stale. Please log out and log back in."
                }, { status: 401 });
            }
        }

        // Validate hostelId exists
        if (body.hostelId && body.hostelId !== 'all') {
            const hostel = await prisma.hostel.findUnique({ where: { id: body.hostelId }, select: { id: true } });
            if (!hostel) return NextResponse.json({ success: false, error: "Target hostel does not exist." }, { status: 400 });
        }

        const expense = await ExpenseServices.createExpense(body);
        return NextResponse.json({ success: true, data: expense });
    } catch (error) {
        console.error("CRITICAL: Expense Ingress Protocol Failure:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(request) {
    const auth = await checkRole(['ADMIN', 'WARDEN']);
    if (!auth.success) {
        console.warn(`Unauthorized Expense Update Attempt by role: ${auth.user?.role || 'Unknown'}`);
        return NextResponse.json({ success: false, message: "Forbidden: You do not have permission to update expense records." }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { id, ...data } = body;
        if (!id) return NextResponse.json({ success: false, error: "Expense ID is required." }, { status: 400 });

        const isStatusMutation = Object.prototype.hasOwnProperty.call(data, "status");
        if (isStatusMutation) {
            if (auth.user.role !== 'ADMIN') {
                return NextResponse.json({ success: false, message: "Only admin can change expense status." }, { status: 403 });
            }

            if (data.approvedById) {
                const user = await prisma.user.findUnique({ where: { id: data.approvedById }, select: { id: true } });
                if (!user) return NextResponse.json({ success: false, error: "Approving administrator identity not found." }, { status: 400 });
            }
            if (data.rejectedById) {
                const user = await prisma.user.findUnique({ where: { id: data.rejectedById }, select: { id: true } });
                if (!user) return NextResponse.json({ success: false, error: "Rejecting administrator identity not found." }, { status: 400 });
            }

            const updated = await ExpenseServices.updateExpenseStatus(id, data);
            return NextResponse.json({ success: true, data: updated });
        }

        // Inline title/amount edit mutation
        const nextTitle = String(data.title || "").trim();
        const nextAmount = Number(data.amount);
        if (!nextTitle || !Number.isFinite(nextAmount) || nextAmount <= 0) {
            return NextResponse.json({ success: false, error: "Valid title and amount are required." }, { status: 400 });
        }

        const existing = await prisma.expense.findUnique({
            where: { id },
            select: { id: true, hostelId: true, category: true }
        });
        if (!existing) {
            return NextResponse.json({ success: false, error: "Expense record not found." }, { status: 404 });
        }

        if (auth.user.role === 'WARDEN') {
            const targetId = auth.user.id || auth.user.userId || auth.user.sub;
            const warden = await prisma.user.findUnique({
                where: { id: targetId },
                select: {
                    hostelId: true,
                    canManageExpenses: true,
                    canManageMess: true,
                    canManageGeneral: true,
                    canManageUtilities: true,
                    canManageMaintenance: true,
                    canManageSalaries: true
                }
            });

            if (!warden?.hostelId || warden.hostelId !== existing.hostelId) {
                return NextResponse.json({ success: false, error: "You can only edit expenses for your hostel." }, { status: 403 });
            }

            const categoryPermissions = {
                MESS: warden.canManageMess,
                GENERAL: warden.canManageGeneral,
                UTILITY_BILL: warden.canManageUtilities,
                MAINTENANCE: warden.canManageMaintenance,
                SALARY: warden.canManageSalaries,
            };
            if (!warden.canManageExpenses && !categoryPermissions[existing.category]) {
                return NextResponse.json({ success: false, error: "You do not have permission to edit this category." }, { status: 403 });
            }
        }

        const updated = await ExpenseServices.updateExpenseFields(id, { title: nextTitle, amount: nextAmount });
        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("CRITICAL: Authorization State Update Failure:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
export async function DELETE(request) {
    const auth = await checkRole(['ADMIN']);
    if (!auth.success) return NextResponse.json({ success: false, message: "Forbidden: You do not have permission to delete expense records." }, { status: 403 });

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ success: false, error: "Record identity (ID) is required for deletion." }, { status: 400 });

        const result = await ExpenseServices.deleteExpense(id);
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("CRITICAL: Expense Record Deletion Failure:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
