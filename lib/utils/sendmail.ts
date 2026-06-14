import transporter from "./transpoter";
import { prisma } from "@/lib/prisma";

export interface SendEmailOptions {
    to: string;
    bcc?: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, bcc, subject, html }: SendEmailOptions) {
    let fromName = "Hostel Management";
    try {
        // Hard kill-switch via env for emergency shutdowns.
        if (process.env.DISABLE_EMAILS === "true") {
            console.warn(`[Mailer] Blocked by DISABLE_EMAILS=true. To: ${to}, Subject: ${subject}`);
            return { skipped: true, reason: "env-disabled" };
        }

        // Global DB switch from System Settings.
        try {
            const settings = await prisma.systemSettings.findUnique({
                where: { id: "global" },
                select: { enableEmailService: true, companyName: true },
            });
            if (settings?.enableEmailService === false) {
                console.warn(`[Mailer] Blocked by system setting enableEmailService=false. To: ${to}, Subject: ${subject}`);
                return { skipped: true, reason: "settings-disabled" };
            }
            if (settings?.companyName) {
                fromName = settings.companyName;
            }
        } catch (settingsErr) {
            // Do not break business flow if settings lookup fails.
            console.warn("[Mailer] Could not read system settings. Falling back to env/SMTP checks.");
        }

        // SMTP credentials missing => never attempt to send.
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn("[Mailer] Missing EMAIL_USER/EMAIL_PASS. Skipping email.");
            return { skipped: true, reason: "smtp-not-configured" };
        }

        const info = await transporter.sendMail({
            from: `"${fromName}" <${process.env.EMAIL_USER}>`,
            to,
            bcc,
            subject,
            html,
        });

        return info;
    } catch (error: any) {
        console.error("Error sending email:", error);
        return { skipped: true, reason: "send-failed", error: error?.message };
    }
}
