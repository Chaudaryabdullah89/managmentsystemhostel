export const dynamic = 'force-dynamic';
import PaymentServices from "@/lib/services/paymentservices/paymentservices";
import { sendEmail } from "@/lib/utils/sendmail";
import { monthlyRentEmail } from "@/lib/utils/emailTemplates";
import { requireRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { getBranding } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const paymentServices = new PaymentServices();

export async function POST(request, { params }) {
    const guard = await requireRoles(['ADMIN', 'WARDEN']);
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

    try {
        const { paymentId } = await params;
        const payment = await paymentServices.getPaymentById(paymentId);
        if (!payment) return errorResponse("Payment record not found", 404);

        // Security check for Warden: Must belong to their hostel
        if (auth.user.role === 'WARDEN') {
            let wardenHostelId = auth.user.hostelId;
            if (!wardenHostelId) {
                const wardenProfile = await prisma.user.findUnique({
                    where: { id: auth.user.userId || auth.user.id },
                    select: { hostelId: true }
                });
                wardenHostelId = wardenProfile?.hostelId;
            }
            const paymentHostelId = payment.Booking?.Room?.hostelId || payment.User?.hostelId;
            if (wardenHostelId && paymentHostelId && paymentHostelId !== wardenHostelId) {
                return errorResponse("Access Denied: Payment belongs to another hostel branch.", 403);
            }
        }

        const userEmail = payment.User?.email;
        if (!userEmail) {
            return errorResponse("User has no email address configured.", 400);
        }

        const branding = await getBranding();
        const hostelName = payment.Booking?.Room?.Hostel?.name || payment.User?.Hostel_User_hostelIdToHostel?.name || "Hostel Branch";
        
        const now = new Date();
        const monthName = payment.month || now.toLocaleString("en-PK", { month: "long" });
        const year = payment.year || now.getFullYear();

        await sendEmail({
            to: userEmail,
            subject: `Payment Outstanding Notification — ${monthName} ${year} — ${branding.companyName}`,
            html: monthlyRentEmail({
                name: payment.User.name,
                amount: payment.amount,
                month: monthName,
                year: year,
                dueDate: payment.dueDate || null,
                hostelName: hostelName,
                type: payment.type || "RENT",
                branding,
            }),
        });

        return successResponse({ message: "Notification email sent successfully." });
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}
