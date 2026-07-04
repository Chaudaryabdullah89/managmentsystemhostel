import transporter from "@/lib/utils/transpoter";
import { requireRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export const dynamic = 'force-dynamic';

export async function POST(req) {
    const guard = await requireRoles(["ADMIN"]);
    if (!guard.ok) return guard.response;

    try {
        const { testEmail } = await req.json();
        if (!testEmail) {
            return errorResponse("Missing target test email address", 400);
        }

        console.log(` 📧 [Mailer Diagnostic] Attempting to send test email to ${testEmail}...`);

        const info = await transporter.sendMail({
            from: `"Hostel Portal System Settings" <${process.env.EMAIL_USER || "no-reply@hms.com"}>`,
            to: testEmail,
            subject: "Hostel Portal System Settings — SMTP Diagnostic Connection Test",
            text: `Hostel Portal Email Diagnostics Success! This is a test email sent to verify SMTP credentials and settings connection.`,
            html: `
                <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
                    <h2 style="color: #4f46e5; margin-top: 0;">SMTP Connection Verified!</h2>
                    <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                        Your outgoing mail settings are successfully configured. The mailer module triggered a successful connection.
                    </p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <p style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">
                        Diagnostics Details
                    </p>
                    <ul style="font-size: 12px; color: #475569; padding-left: 20px; margin-top: 0;">
                        <li><strong>Host:</strong> ${process.env.EMAIL_HOST || "smtp.gmail.com"}</li>
                        <li><strong>Port:</strong> ${process.env.EMAIL_PORT || 587}</li>
                        <li><strong>User:</strong> ${process.env.EMAIL_USER || "Unconfigured"}</li>
                    </ul>
                </div>
            `
        });

        console.log(" ✅ [Mailer Diagnostic] Test email sent successfully!", info.messageId);

        return successResponse({ 
            success: true, 
            messageId: info.messageId, 
            response: info.response 
        });
    } catch (err) {
        console.error(" ❌ [Mailer Diagnostic] SMTP Connection Test Failed:", err);
        return errorResponse(`SMTP Diagnostic Failed: ${err.message || err}`, 500);
    }
}
