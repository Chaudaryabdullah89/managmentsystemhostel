export const dynamic = 'force-dynamic';
import transporter from "@/lib/utils/transpoter";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function POST(req, { params }) {
    const { id: hostelId } = await params;
    const guard = await requireRoles(["ADMIN", "WARDEN"]);
    if (!guard.ok) return guard.response;

    const user = guard.user;
    if (user.role === "WARDEN" && user.hostelId !== hostelId) {
        return errorResponse("Access Denied: You cannot manage other hostels.", 403);
    }

    try {
        const { testEmail } = await req.json();
        if (!testEmail) {
            return errorResponse("Missing target test email address", 400);
        }

        const hostel = await prisma.hostel.findUnique({
            where: { id: hostelId },
            select: {
                name: true,
                smtpHost: true,
                smtpPort: true,
                smtpSecure: true,
                smtpUser: true,
                smtpPass: true,
                smtpSender: true,
            }
        });

        if (!hostel) {
            return errorResponse("Hostel not found.", 404);
        }

        console.log(` 📧 [Hostel Mailer Diagnostic] Attempting to send test email to ${testEmail} using hostel config ${hostelId}...`);

        const fromName = hostel.name || "Hostel Management";
        const senderEmail = hostel.smtpSender || hostel.smtpUser || process.env.EMAIL_USER || "no-reply@hms.com";

        const info = await transporter.sendMail({
            hostelId,
            from: `"${fromName} (Custom SMTP)" <${senderEmail}>`,
            to: testEmail,
            subject: `${fromName} — SMTP Connection Diagnostic Test`,
            text: `SMTP connection verification success for ${fromName}! This confirms your hostel-specific mail settings are working.`,
            html: `
                <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
                    <h2 style="color: #6366f1; margin-top: 0;">Hostel SMTP Connection Verified!</h2>
                    <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                        Your outgoing mail settings for <strong>${fromName}</strong> are successfully configured and verified.
                    </p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <p style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">
                        SMTP Diagnostic Details
                    </p>
                    <ul style="font-size: 12px; color: #475569; padding-left: 20px; margin-top: 0;">
                        <li><strong>Hostel Name:</strong> ${fromName}</li>
                        <li><strong>Host:</strong> ${hostel.smtpHost || "smtp.gmail.com"}</li>
                        <li><strong>Port:</strong> ${hostel.smtpPort || 587}</li>
                        <li><strong>User:</strong> ${hostel.smtpUser || "Default"}</li>
                    </ul>
                </div>
            `
        });

        console.log(" ✅ [Hostel Mailer Diagnostic] Test email sent successfully!", info.messageId);

        return successResponse({ 
            success: true, 
            messageId: info.messageId, 
            response: info.response 
        });
    } catch (err) {
        console.error(" ❌ [Hostel Mailer Diagnostic] SMTP Connection Test Failed:", err);
        return errorResponse(`SMTP Diagnostic Failed: ${err.message || err}`, 500);
    }
}
