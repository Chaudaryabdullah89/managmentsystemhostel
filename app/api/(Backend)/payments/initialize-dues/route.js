import PaymentServices from "@/lib/services/paymentservices/paymentservices";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { withLogger } from "@/lib/withLogger";

const paymentServices = new PaymentServices();

export const POST = withLogger(async (request, ctx, log) => {
    log.step("Auth check — ADMIN or WARDEN required");
    const guard = await requireRoles(['ADMIN', 'WARDEN']);
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };
    log.info("Auth passed", { role: auth.user.role });

    try {
        let hostelId = null;
        if (auth.user.role === 'WARDEN') {
            hostelId = auth.user.hostelId;
            if (!hostelId) {
                log.step("hostelId missing in JWT — fetching from DB");
                const wardenProfile = await prisma.user.findUnique({
                    where: { id: auth.user.userId || auth.user.id },
                    select: { hostelId: true }
                });
                hostelId = wardenProfile?.hostelId;
            }
        }

        log.step(`Initializing due payments${hostelId ? " for hostel " + hostelId : " globally"}`);
        const results = await paymentServices.initializeDuePayments(hostelId);
        log.ok(`Initialized ${results.length} due payment records`);

        return successResponse({
            message: `Successfully initialized ${results.length} pending rent records ${hostelId ? "for your hostel" : "globally"}.`,
            count: results.length
        });
    } catch (error) {
        log.fail("Failed to initialize dues", error);
        return errorResponse(error.message, 500, { error: error.message });
    }
});
