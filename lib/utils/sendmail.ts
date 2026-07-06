import transporter from "./transpoter";
import { prisma } from "@/lib/prisma";

export interface SendEmailOptions {
    to: string;
    bcc?: string;
    subject: string;
    html: string;
    hostelId?: string;
}

export async function sendEmail({ to, bcc, subject, html, hostelId: explicitHostelId }: SendEmailOptions) {
    let fromName = "Hostel Management";
    let senderEmail = process.env.EMAIL_USER || "";
    let isConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    let resolvedHostelId = explicitHostelId;

    try {
        // Hard kill-switch via env for emergency shutdowns.
        if (process.env.DISABLE_EMAILS === "true") {
            console.warn(`[Mailer] Blocked by DISABLE_EMAILS=true. To: ${to}, Subject: ${subject}`);
            return { skipped: true, reason: "env-disabled" };
        }

        // 1. Resolve hostelId via recipient's email if not explicitly provided
        if (!resolvedHostelId && to) {
            try {
                let cleanEmail = to.trim();
                const match = to.match(/<([^>]+)>/);
                if (match) {
                    cleanEmail = match[1].trim();
                }
                const user = await prisma.user.findUnique({
                    where: { email: cleanEmail },
                    select: { hostelId: true }
                });
                if (user?.hostelId) {
                    resolvedHostelId = user.hostelId;
                }
            } catch (err: any) {
                console.warn("[Mailer] Could not auto-resolve hostelId via recipient email:", err.message);
            }
        }

        // 2. Global DB switch from System Settings.
        try {
            const settings = await prisma.systemSettings.findUnique({
                where: { id: "global" },
                select: { 
                    enableEmailService: true, 
                    companyName: true,
                    smtpUser: true,
                    smtpPass: true,
                    smtpSender: true,
                },
            });
            if (settings?.enableEmailService === false) {
                console.warn(`[Mailer] Blocked by system setting enableEmailService=false. To: ${to}, Subject: ${subject}`);
                return { skipped: true, reason: "settings-disabled" };
            }
            if (settings?.companyName) {
                fromName = settings.companyName;
            }
            
            // Check global db configuration
            if (settings?.smtpUser && settings?.smtpPass) {
                isConfigured = true;
                senderEmail = settings.smtpSender || settings.smtpUser;
            } else if (settings?.smtpSender) {
                senderEmail = settings.smtpSender;
            }
        } catch (settingsErr) {
            // Do not break business flow if settings lookup fails.
            console.warn("[Mailer] Could not read system settings. Falling back to env/SMTP checks.");
        }

        // 3. Hostel-specific SMTP override
        if (resolvedHostelId) {
            try {
                const hostel = await prisma.hostel.findUnique({
                    where: { id: resolvedHostelId },
                    select: {
                        name: true,
                        smtpUser: true,
                        smtpPass: true,
                        smtpSender: true,
                    }
                });
                if (hostel) {
                    if (hostel.name) {
                        fromName = hostel.name;
                    }
                    if (hostel.smtpUser && hostel.smtpPass) {
                        isConfigured = true;
                        senderEmail = hostel.smtpSender || hostel.smtpUser;
                    }
                }
            } catch (hostelErr: any) {
                console.warn(`[Mailer] Could not read hostel ${resolvedHostelId} settings:`, hostelErr.message);
            }
        }

        // ── Mobile Push Notification Interception ─────────────────────────────
        try {
            let cleanEmail = to.trim();
            const match = to.match(/<([^>]+)>/);
            if (match) {
                cleanEmail = match[1].trim();
            }
            const recipientUser = await prisma.user.findUnique({
                where: { email: cleanEmail },
                select: { pushToken: true }
            });

            if (recipientUser?.pushToken) {
                // Strip HTML tags for clean notification description text
                const cleanBody = html
                    .replace(/<[^>]*>/g, " ")
                    .replace(/\s+/g, " ")
                    .trim();

                await fetch("https://exp.host/--/api/v2/push/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        to: recipientUser.pushToken,
                        sound: "default",
                        title: subject,
                        body: cleanBody.length > 120 ? cleanBody.substring(0, 120) + "..." : cleanBody,
                        data: { subject, cleanBody }
                    })
                });
                console.log(`[Push Notification] Dispatched to ${cleanEmail}`);
            }
        } catch (pushErr: any) {
            console.warn("[Push Notification] Failed to send:", pushErr.message);
        }

        // SMTP credentials missing => never attempt to send.
        if (!isConfigured) {
            console.warn("[Mailer] Missing SMTP configuration. Skipping email.");
            return { skipped: true, reason: "smtp-not-configured" };
        }

        const info = await transporter.sendMail({
            hostelId: resolvedHostelId, // Pass the resolved hostelId to select the correct connection pool
            from: `"${fromName}" <${senderEmail}>`,
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
