export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma";
import { requireRoles, requireSelfOrRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { logAuditEvent } from "@/lib/auditLogger";
import { createInAppNotification } from "@/lib/inAppNotifications";

export async function GET(request, { params }) {
    try {
        const { userId } = await params;
        const { searchParams } = new URL(request.url);
        const bookingPage = Math.max(1, parseInt(searchParams.get("bookingPage") || "1"));
        const bookingLimit = Math.min(25, Math.max(1, parseInt(searchParams.get("bookingLimit") || "5")));
        const bookingSkip = (bookingPage - 1) * bookingLimit;
        const paymentPage = Math.max(1, parseInt(searchParams.get("paymentPage") || "1"));
        const paymentLimit = Math.min(25, Math.max(1, parseInt(searchParams.get("paymentLimit") || "10")));
        const paymentSkip = (paymentPage - 1) * paymentLimit;

        if (!userId) {
            return errorResponse("User ID is required", 400);
        }
        const guard = await requireSelfOrRoles(userId, ['ADMIN', 'WARDEN']);
        if (!guard.ok) return guard.response;
        const actor = guard.user;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                // ─── Scalar fields (password intentionally excluded) ───
                id: true,
                name: true,
                email: true,
                phone: true,
                cnic: true,
                role: true,
                isActive: true,
                hostelId: true,
                regNumber: true,
                uid: true,
                image: true,
                createdAt: true,
                updatedAt: true,
                lastLogin: true,
                city: true,
                address: true,
                canManageExpenses: true,
                canManageMess: true,
                canManageGeneral: true,
                canManageUtilities: true,
                canManageMaintenance: true,
                canManageSalaries: true,
                basicSalary: true,
                // ─── Relations ───────────────────────────────────────
                ResidentProfile: true,
                StaffProfile: {
                    select: {
                        id: true,
                        designation: true,
                        basicSalary: true,
                        joiningDate: true,
                        Salary: {
                            orderBy: { month: 'desc' },
                            take: 5
                        }
                    }
                },
                Hostel_User_hostelIdToHostel: {
                    select: { name: true }
                },
                Complaint_Complaint_userIdToUser: {
                    include: { Hostel: true },
                    orderBy: { createdAt: 'desc' }
                },
                Complaint_Complaint_assignedToIdToUser: {
                    include: { Hostel: true },
                    orderBy: { createdAt: 'desc' }
                },
                Maintenance_userIdToUser: {
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
            return errorResponse("User not found", 404);
        }

        // Additional security check: if actor is WARDEN, they can only view users in their hostel
        if (actor.role === 'WARDEN' && actor.id !== userId) {
            const wardenHostelId = actor.hostelId;
            const userHostelId = user.hostelId || user.ResidentProfile?.currentHostelId;
            if (wardenHostelId !== userHostelId) {
                return errorResponse("Access denied: User is not assigned to your hostel", 403);
            }
        }

        const [bookings, totalBookings, payments, totalPayments] = await Promise.all([
            prisma.booking.findMany({
                where: { userId },
                include: {
                    Room: { include: { Hostel: true } },
                    Payment: true,
                },
                orderBy: { createdAt: 'desc' },
                skip: bookingSkip,
                take: bookingLimit,
            }),
            prisma.booking.count({ where: { userId } }),
            prisma.payment.findMany({
                where: { userId },
                orderBy: { date: 'desc' },
                skip: paymentSkip,
                take: paymentLimit,
            }),
            prisma.payment.count({ where: { userId } }),
        ]);

        return successResponse({
            user: {
                ...user,
                Booking: bookings,
                Payment: payments,
            },
            pagination: {
                bookings: {
                    page: bookingPage,
                    limit: bookingLimit,
                    total: totalBookings,
                    totalPages: Math.max(1, Math.ceil(totalBookings / bookingLimit)),
                },
                payments: {
                    page: paymentPage,
                    limit: paymentLimit,
                    total: totalPayments,
                    totalPages: Math.max(1, Math.ceil(totalPayments / paymentLimit)),
                },
            },
        });
    } catch (error) {
        console.error("User Detail Fetch Error:", error);
        return errorResponse(error.message, 500);
    }
}

export async function PATCH(request, { params }) {
    try {
        const { userId } = await params;
        const guard = await requireRoles(['ADMIN']);
        if (!guard.ok) return guard.response;
        const actor = guard.user;
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
            Maintenance_assignedToIdToUser,
            Maintenance_userIdToUser,
            id,
            ...updateData
        } = body;

        // Check if email/uid already exists for another user if they are being updated
        if (updateData.email || updateData.uid) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        updateData.email ? { email: updateData.email } : null,
                        updateData.uid ? { uid: updateData.uid } : null
                    ].filter(Boolean),
                    NOT: { id: userId }
                }
            });

            if (existingUser) {
                const conflictField = existingUser.email === updateData.email ? "Email" : "UID";
                return errorResponse(`${conflictField} is already assigned to another identity. Please reconcile values.`, 400);
            }
        }

        // Security: exclude sensitive/structural fields from mass update.
        // - `password` must go through /api/auth/changepassword (which bcrypt-hashes it)
        // - `role` should be changed via the explicit role-update endpoint only
        // eslint-disable-next-line no-unused-vars
        const { password: _pw, role: _role, ...safeUpdateData } = updateData;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...safeUpdateData,
                updatedAt: new Date()
            },
            include: {
                StaffProfile: true,
                ResidentProfile: true,
                Hostel_User_hostelIdToHostel: {
                    select: { name: true }
                }
            }
        });

        // 🆔 Session Invalidation for Terminated Users
        // If isActive is explicitly set to false, wipe all sessions
        if (updateData.isActive === false) {
            await prisma.session.deleteMany({
                where: { userId }
            });
            console.log(`[API] Terminated user ${userId}: All sessions invalidated.`);
        }

        const permissionKeys = [
            "canManageExpenses",
            "canManageMess",
            "canManageGeneral",
            "canManageUtilities",
            "canManageMaintenance",
            "canManageSalaries",
        ];
        const changedPermissions = permissionKeys
            .filter((key) => Object.prototype.hasOwnProperty.call(updateData, key))
            .reduce((acc, key) => {
                acc[key] = updateData[key];
                return acc;
            }, {});

        if (Object.keys(changedPermissions).length > 0) {
            await logAuditEvent({
                action: "USER_PERMISSION_UPDATE",
                actorId: actor?.id || actor?.userId || actor?.sub,
                actorRole: actor?.role,
                targetType: "USER",
                targetId: userId,
                metadata: { changedPermissions },
            });

            await createInAppNotification({
                title: "Permission profile updated",
                content: `Your access permissions were updated by ${actor?.role || "an admin"}. Please refresh your dashboard if needed.`,
                priority: "MEDIUM",
                category: "PERMISSION",
                targetRoles: [updatedUser.role],
                hostelId: updatedUser.hostelId || null,
                actorId: actor?.id || actor?.userId || actor?.sub || null,
            });
        }

        return successResponse({
            message: "User identity synchronized",
            user: updatedUser
        });
    } catch (error) {
        console.error("User PATCH Error:", error);

        // Handle specific Prisma errors if the findFirst check missed something (e.g. race condition)
        if (error.code === 'P2002') {
            return errorResponse("Unique constraint violation: Email or UID already exists.", 400);
        }

        return errorResponse(error.message, 500);
    }
}

export async function DELETE(request, { params }) {
    const guard = await requireRoles(['ADMIN']);
    if (!guard.ok) return guard.response;

    try {
        const { userId } = await params;
        if (!userId) {
            return errorResponse("User ID is required", 400);
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                StaffProfile: { select: { id: true } },
                Booking: { select: { id: true } },
            },
        });

        if (!targetUser) {
            return errorResponse("User not found", 404);
        }

        const bookingIds = targetUser.Booking.map((b) => b.id);
        const staffProfileId = targetUser.StaffProfile?.id;
        const paymentWhere = bookingIds.length
            ? { OR: [{ userId }, { bookingId: { in: bookingIds } }] }
            : { userId };

        const operations = [
            // Remove references where this user may be an optional assignee/manager.
            prisma.complaint.updateMany({ where: { assignedToId: userId }, data: { assignedToId: null } }),
            prisma.maintenance.updateMany({ where: { assignedToId: userId }, data: { assignedToId: null } }),
            prisma.expense.updateMany({ where: { approvedById: userId }, data: { approvedById: null } }),
            prisma.expense.updateMany({ where: { rejectedById: userId }, data: { rejectedById: null } }),
            prisma.hostel.updateMany({ where: { managerId: userId }, data: { managerId: null } }),
            prisma.staffTask.updateMany({ where: { assignedToId: userId }, data: { assignedToId: null } }),

            // Delete dependent records that require this user.
            prisma.taskComment.deleteMany({ where: { userId } }),
            prisma.chatMessage.deleteMany({ where: { userId } }),
            prisma.notice.deleteMany({ where: { authorId: userId } }),
            prisma.wardenPayment.deleteMany({ where: { wardenId: userId } }),
            prisma.refundRequest.deleteMany({ where: { userId } }),
            prisma.expense.deleteMany({ where: { OR: [{ submittedById: userId }, { userId }] } }),
            prisma.complaint.deleteMany({ where: { userId } }),
            prisma.maintenance.deleteMany({ where: { userId } }),
            prisma.staffTask.deleteMany({ where: { createdById: userId } }),
            prisma.session.deleteMany({ where: { userId } }),

            // Payments must be removed before bookings.
            prisma.payment.deleteMany({ where: paymentWhere }),
            prisma.booking.deleteMany({ where: { userId } }),
            ...(staffProfileId ? [prisma.salary.deleteMany({ where: { staffProfileId } })] : []),

            prisma.user.deleteMany({ where: { id: userId } }),
        ];

        const txResults = await prisma.$transaction(operations);
        const deleteUserResult = txResults[txResults.length - 1];

        // Idempotent behavior: if already deleted by a concurrent request, return success.
        if (!deleteUserResult || deleteUserResult.count === 0) {
            return successResponse({ message: "User already removed" });
        }

        return successResponse({ message: "User node purged" });
    } catch (error) {
        console.error("User DELETE Error:", error);
        return errorResponse(error.message, 500);
    }
}
