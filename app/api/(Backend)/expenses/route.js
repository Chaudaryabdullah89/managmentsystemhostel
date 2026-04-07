export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import ExpenseServices from "@/lib/services/expenseservices/expenseservices";
import prisma from "@/lib/prisma";
import { requireAuth, requireRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { canAccessExpenseCategory, getAllowedExpenseCategories } from "@/lib/expensePermissions";
import { logAuditEvent } from "@/lib/auditLogger";
import { createInAppNotification } from "@/lib/inAppNotifications";
import { isValidExpenseTransition } from "@/lib/statusTransitions";

export async function GET(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

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
                return errorResponse("Your account is not assigned to any hostel facility.", 403);
            }
        }

        const startDate = (startDateInput && startDateInput !== "undefined") ? startDateInput : null;
        const endDate = (endDateInput && endDateInput !== "undefined") ? endDateInput : null;

        console.log(`[API] GET /api/expenses - Final Filter:`, { hostelId, status, category, startDate, endDate, role: auth.user.role });

        let allowedCategories = undefined;
        if (auth.user.role === 'WARDEN') {
            allowedCategories = getAllowedExpenseCategories(auth.user);
        }

        if (stats === "true") {
            const data = await ExpenseServices.getExpenseStats({
                hostelId,
                allowedCategories
            });
            return successResponse({ data });
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
        return successResponse({ data: expenses });
    } catch (error) {
        console.error("API Error in Expenses GET:", error);
        return errorResponse(error.message, 500, { error: error.message });
    }
}

export async function POST(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

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
                return errorResponse("Permission Denied: No hostel assigned to your account.", 403);
            }

            if (!canAccessExpenseCategory(wardenPermissions, body.category)) {
                return errorResponse("Permission Denied: You cannot create expenses for this category.", 403);
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
                return errorResponse("The submitting user does not exist. Your session may be stale. Please log out and log back in.", 401, {
                    error: "The submitting user does not exist. Your session may be stale. Please log out and log back in."
                });
            }
        }

        // Validate hostelId exists
        if (body.hostelId && body.hostelId !== 'all') {
            const hostel = await prisma.hostel.findUnique({ where: { id: body.hostelId }, select: { id: true } });
            if (!hostel) return errorResponse("Target hostel does not exist.", 400, { error: "Target hostel does not exist." });
        }

        const expense = await ExpenseServices.createExpense(body);
        return successResponse({ data: expense });
    } catch (error) {
        console.error("CRITICAL: Expense Ingress Protocol Failure:", error);
        return errorResponse(error.message, 500, { error: error.message });
    }
}

export async function PATCH(request) {
    const guard = await requireRoles(['ADMIN', 'WARDEN']);
    if (!guard.ok) {
        console.warn(`Unauthorized Expense Update Attempt by role: Unknown`);
        return guard.response;
    }
    const auth = { user: guard.user };

    try {
        const body = await request.json();
        const { id, ...data } = body;
        if (!id) return NextResponse.json({ success: false, error: "Expense ID is required." }, { status: 400 });

        const isStatusMutation = Object.prototype.hasOwnProperty.call(data, "status");
        if (isStatusMutation) {
            if (auth.user.role !== 'ADMIN') {
                return NextResponse.json({ success: false, message: "Only admin can change expense status." }, { status: 403 });
            }

            const existing = await prisma.expense.findUnique({
                where: { id },
                select: { id: true, status: true, amount: true, hostelId: true, category: true, submittedById: true }
            });
            if (!existing) {
                return NextResponse.json({ success: false, error: "Expense record not found." }, { status: 404 });
            }
            if (data.status && !isValidExpenseTransition(existing.status, data.status)) {
                return NextResponse.json(
                    { success: false, error: `Invalid expense status transition from ${existing.status} to ${data.status}.` },
                    { status: 409 }
                );
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
            if (data.status && data.status !== existing.status) {
                await logAuditEvent({
                    action: "EXPENSE_STATUS_UPDATE",
                    actorId: auth.user?.id || auth.user?.userId || auth.user?.sub,
                    actorRole: auth.user?.role,
                    targetType: "EXPENSE",
                    targetId: id,
                    metadata: {
                        previousStatus: existing.status,
                        newStatus: data.status,
                        category: existing.category,
                        hostelId: existing.hostelId,
                        amount: existing.amount,
                    },
                });

                if (data.status === "APPROVED" || data.status === "REJECTED") {
                    const submitter = await prisma.user.findUnique({
                        where: { id: existing.submittedById },
                        select: { role: true },
                    });
                    await createInAppNotification({
                        title: data.status === "APPROVED" ? "Expense approved" : "Expense rejected",
                        content: data.status === "APPROVED"
                            ? `Your ${existing.category?.toLowerCase() || "expense"} request has been approved.`
                            : `Your ${existing.category?.toLowerCase() || "expense"} request was rejected. Please check remarks and update.`,
                        priority: data.status === "REJECTED" ? "HIGH" : "MEDIUM",
                        category: "EXPENSE",
                        targetRoles: submitter?.role ? [submitter.role] : ["WARDEN", "STAFF"],
                        hostelId: existing.hostelId || null,
                        actorId: auth.user?.id || auth.user?.userId || auth.user?.sub || null,
                    });
                }
            }
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

            if (!canAccessExpenseCategory(warden, existing.category)) {
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
    const guard = await requireRoles(['ADMIN']);
    if (!guard.ok) return guard.response;

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
