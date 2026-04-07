import transporter from "./transpoter";
import { prisma } from "@/lib/prisma";

export async function sendEmail({ to, subject, html }) {
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
                select: { enableEmailService: true },
            });
            if (settings?.enableEmailService === false) {
                console.warn(`[Mailer] Blocked by system setting enableEmailService=false. To: ${to}, Subject: ${subject}`);
                return { skipped: true, reason: "settings-disabled" };
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
            from: `"Mubarak Group of Hostels" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });

        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        return { skipped: true, reason: "send-failed", error: error?.message };
    }
}