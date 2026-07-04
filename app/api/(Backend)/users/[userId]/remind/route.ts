export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { sendEmail } from "@/lib/utils/sendmail";
import { buildEmailTemplate } from "@/lib/utils/emailTemplates";
import { getBranding } from "@/lib/permissions";
import { apiLogger } from "@/lib/apiLogger";
import { withLogger } from "@/lib/withLogger";

/**
 * POST /api/users/[userId]/remind
 *
 * Sends a manual reminder to a specific user via:
 *  - Email (always attempted if user has an email)
 *  - WhatsApp (if WHATSAPP_WEBHOOK_URL is configured + user has phone + sendWhatsApp=true)
 *
 * Body: {
 *   subject:      string   (required)
 *   message:      string   (required)
 *   sendWhatsApp: boolean  (optional, default false)
 *   type:         "RENT_DUE" | "GENERAL" | "WARNING" | "URGENT" (optional, default "GENERAL")
 * }
 */
export const POST = withLogger(async (request: NextRequest, { params }: { params: Promise<{ userId: string }> }, log) => {
    log.step("Auth check — ADMIN or WARDEN required");
    const guard = await requireRoles(['ADMIN', 'WARDEN']);
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };
    log.info("Auth passed", { role: auth.user.role });

    try {
        const { userId } = await params;
        const body = await request.json();
        const { subject, message, sendWhatsApp = false, type = "GENERAL" } = body;

        if (!subject?.trim() || !message?.trim()) {
            return errorResponse("Subject and message are required.", 400);
        }

        // Fetch user with their hostel info
        log.step(`Looking up user ${userId}`);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                hostelId: true,
                Hostel_User_hostelIdToHostel: { select: { name: true } }
            }
        });

        if (!user) return errorResponse("User not found.", 404);

        // Security: Wardens can only remind users in their hostel
        if (auth.user.role === 'WARDEN') {
            let wardenHostelId = auth.user.hostelId;
            if (!wardenHostelId) {
                log.step("hostelId missing in JWT — fetching from DB");
                const warden = await prisma.user.findUnique({
                    where: { id: auth.user.userId || auth.user.id },
                    select: { hostelId: true }
                });
                wardenHostelId = warden?.hostelId;
            }
            if (wardenHostelId && user.hostelId && user.hostelId !== wardenHostelId) {
                return errorResponse("Access Denied: User belongs to a different hostel branch.", 403);
            }
        }

        log.info(`Sending reminder to ${user.name}`, { email: user.email, type, sendWhatsApp });

        const branding = await getBranding();
        const hostelName = user.Hostel_User_hostelIdToHostel?.name || branding.companyName;
        const results: { email?: string; whatsapp?: string } = {};

        // ── Email ─────────────────────────────────────────────────────────
        if (user.email) {
            const typeConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
                RENT_DUE: { label: "Rent Due", color: "#b25e00", bg: "#fdf3e7", border: "#f9e2c7" },
                WARNING:  { label: "Warning",  color: "#c0392b", bg: "#fdf2f2", border: "#f9c6c6" },
                URGENT:   { label: "Urgent",   color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
                GENERAL:  { label: "Notice",   color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe" },
            };
            const cfg = typeConfig[type] || typeConfig.GENERAL;

            const bodyHtml = `
              <div style="margin-bottom:20px;">
                <span style="
                  display:inline-block;
                  padding:4px 12px;
                  border-radius:999px;
                  font-size:11px;
                  font-weight:700;
                  letter-spacing:0.1em;
                  text-transform:uppercase;
                  color:${cfg.color};
                  background:${cfg.bg};
                  border:1px solid ${cfg.border};
                ">${cfg.label}</span>
              </div>

              <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#4b4b4f;">
                Hello <strong>${user.name}</strong>,
              </p>

              <div style="margin:18px 0 20px;padding:18px 20px;border-radius:12px;border:1px solid ${cfg.border};background:${cfg.bg};">
                <p style="margin:0;font-size:14px;color:#1d1d1f;line-height:1.7;white-space:pre-line;">${message}</p>
              </div>

              <p style="margin:20px 0 0;font-size:12px;color:#86868b;">
                This message was sent by ${hostelName} management. 
                If you have questions, please contact your hostel warden.
              </p>
            `;

            const html = buildEmailTemplate({
                title: subject,
                subtitle: `${hostelName} — Direct Communication`,
                bodyHtml,
                branding,
            });

            try {
                await sendEmail({ to: user.email, subject, html });
                results.email = "sent";
                log.ok(`Email sent to ${user.name} <${user.email}>`);
                apiLogger.info(`[Reminder] Email sent to ${user.name} <${user.email}>`);
            } catch (emailErr) {
                log.fail(`Email failed to ${user.email}`, emailErr);
                apiLogger.error(`[Reminder] Email failed to ${user.email}`, emailErr);
                results.email = "failed";
            }
        } else {
            results.email = "no_email";
        }

        // ── WhatsApp ──────────────────────────────────────────────────────
        if (sendWhatsApp && process.env.WHATSAPP_WEBHOOK_URL) {
            if (user.phone) {
                const waText = `📌 *Reminder from ${hostelName}*\n\n*${subject}*\n\n${message}\n\n━━━━━━━━━━━━━━━━\n👤 *To:* ${user.name}\n🏢 *Hostel:* ${hostelName}\n🕒 *Sent:* ${new Date().toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}`;

                try {
                    const waRes = await fetch(process.env.WHATSAPP_WEBHOOK_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            phone: user.phone,
                            text: waText,
                            message: waText,
                            type: "individual",
                        }),
                        signal: AbortSignal.timeout(8000),
                    });
                    results.whatsapp = waRes.ok ? "sent" : `failed:${waRes.status}`;
                    apiLogger.info(`[Reminder] WhatsApp sent to ${user.name} (${user.phone}) — ${results.whatsapp}`);
                } catch (waErr) {
                    apiLogger.error(`[Reminder] WhatsApp failed to ${user.phone}`, waErr);
                    results.whatsapp = "failed";
                }
            } else {
                results.whatsapp = "no_phone";
            }
        } else if (sendWhatsApp) {
            results.whatsapp = "webhook_not_configured";
        }

        const anySuccess = results.email === "sent" || results.whatsapp === "sent";
        if (!anySuccess && results.email !== "no_email") {
            return errorResponse("Reminder could not be delivered via any channel.", 502, { results });
        }

        log.ok(`Reminder dispatched`, results);
        return successResponse({
            message: "Reminder dispatched.",
            recipient: { name: user.name, email: user.email, phone: user.phone },
            results,
        });
    } catch (error: any) {
        log.fail("Unexpected error", error);
        apiLogger.error("[Reminder] Unexpected error", error);
        return errorResponse(error.message, 500);
    }
});
