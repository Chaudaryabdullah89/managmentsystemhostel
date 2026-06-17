import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/utils/sendmail";
import { buildEmailTemplate } from "@/lib/utils/emailTemplates";
import crypto from "crypto";
import { getBranding } from "@/lib/permissions";
import { generateUID, UID_PREFIXES } from "@/lib/uid-generator";
import { getCache, setCache, invalidatePattern } from "@/lib/redis";

export interface NoticeCreateData {
    title: string;
    content: string;
    priority?: string;
    category?: string;
    authorId: string;
    hostelId?: string | null;
    expiresAt?: string | Date | null;
    targetRoles?: string[];
    sendEmail?: boolean;
    broadcastWhatsApp?: boolean;
}

class NoticeService {
    async getNotices(filter: any = {}) {
        const cacheKey = `notices:list:${JSON.stringify(filter)}`;
        const cached = await getCache<any[]>(cacheKey);
        if (cached) return cached;

        try {
            const result = await prisma.notice.findMany({
                where: {
                    ...filter,
                    isActive: true
                },
                include: {
                    author: {
                        select: {
                            name: true,
                            role: true,
                            image: true
                        }
                    },
                    hostel: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            await setCache(cacheKey, result, 600); // Cache for 10 minutes
            return result;
        } catch (error: any) {
            throw new Error(`Failed to fetch notices: ${error.message}`);
        }
    }

    async createNotice(data: NoticeCreateData) {
        try {
            const { title, content, priority, category, authorId, hostelId, expiresAt, targetRoles, sendEmail: shouldSendEmail, broadcastWhatsApp } = data;
            const newNotice = await prisma.notice.create({
                data: {
                    id: crypto.randomUUID(),
                    title,
                    content,
                    priority: priority || "MEDIUM",
                    category: category || "GENERAL",
                    authorId,
                    hostelId: (hostelId === 'all' || !hostelId) ? null : hostelId,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                    targetRoles: targetRoles || [],
                    updatedAt: new Date()
                }
            });

            // Generate and assign UID
            const noticeUid = generateUID(UID_PREFIXES.NOTICE, crypto.randomUUID());
            await prisma.notice.update({
                where: { id: newNotice.id },
                data: { uid: noticeUid }
            });

            newNotice.uid = noticeUid;

            // Invalidate notices cache
            await invalidatePattern('notices:*');

            // Asynchronously dispatch email alerts to affected residents if requested
            if (shouldSendEmail !== false) {
                setImmediate(async () => {
                    try {
                        let usersToEmail: any[] = [];
                        if (hostelId && hostelId !== 'all') {
                            // Send to residents of specific hostel
                            const bookings = await prisma.booking.findMany({
                                where: {
                                    Room: { hostelId: hostelId },
                                    status: { in: ['CONFIRMED', 'CHECKED_IN'] }
                                },
                                include: { User: true }
                            });
                            const userMap = new Map();
                            bookings.forEach(b => userMap.set(b.userId, b.User));
                            usersToEmail = Array.from(userMap.values());
                        } else {
                            // Global notice, send to all residents
                            const bookings = await prisma.booking.findMany({
                                where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
                                include: { User: true }
                            });
                            const userMap = new Map();
                            bookings.forEach(b => userMap.set(b.userId, b.User));
                            usersToEmail = Array.from(userMap.values());
                        }

                        const emailAddresses = usersToEmail.map(u => u.email).filter(Boolean);
                        if (emailAddresses.length > 0) {
                            const subject = `[Notice] ${priority === 'URGENT' ? 'URGENT: ' : ''}${title}`;

                            const badgeColor = priority === 'URGENT' ? '#b91c1c' : '#4f46e5';
                            const badgeBg = priority === 'URGENT' ? '#fef2f2' : '#eef2ff';

                            const bodyHtml = `
                              <div style="margin-bottom:18px;">
                                <span style="
                                  display:inline-block;
                                  padding:4px 10px;
                                  border-radius:999px;
                                  font-size:11px;
                                  font-weight:600;
                                  letter-spacing:0.14em;
                                  text-transform:uppercase;
                                  color:${badgeColor};
                                  background:${badgeBg};
                                ">
                                  ${priority} • ${category}
                                </span>
                              </div>

                              <p style="margin:0 0 16px; font-size:14px; color:#4b5563;">
                                A new notice has been published by the hostel management.
                              </p>

                              <div style="margin:18px 0 20px; padding:16px 18px; border-radius:12px; border:1px solid #e5e7eb; background:#f9fafb;">
                                <p style="margin:0; font-size:13px; color:#374151; white-space:pre-line;">
                                  ${content}
                                </p>
                              </div>

                              <p style="margin:0; font-size:12px; color:#9ca3af;">
                                You’re receiving this message because you are an active resident in the hostel system.
                              </p>
                            `;

                            const branding = await getBranding();
                            const html = buildEmailTemplate({
                                title: priority === 'URGENT' ? 'Urgent hostel notice' : 'New hostel notice',
                                subtitle: hostelId ? 'Important update for your hostel' : `${branding.companyName} @ Network Level`,
                                bodyHtml,
                                branding,
                            });

                            // Send utilizing BCC to avoid sharing email addresses
                            await sendEmail({
                                to: process.env.EMAIL_USER || 'admin@mghostels.com', // fallback required usually 
                                bcc: emailAddresses.join(', '),
                                subject,
                                html
                            });
                        }
                    } catch (e) {
                        console.error("Failed to dispatch notice emails:", e);
                    }
                });
            }

            // Asynchronously dispatch WhatsApp webhook if configured and requested
            if (broadcastWhatsApp && process.env.WHATSAPP_WEBHOOK_URL) {
                const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
                setImmediate(async () => {
                    try {
                        const formattedText = `📢 *Notice: ${title}*\n\n${content}\n\n━━━━━━━━━━━━━━━━━━━━\n📌 *Priority:* ${priority || "NORMAL"}\n🏷️ *Category:* ${category || "GENERAL"}\n📅 *Date:* ${new Date().toLocaleDateString()}`;
                        await fetch(webhookUrl, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                text: formattedText,
                                message: formattedText,
                                group_id: process.env.WHATSAPP_GROUP_ID || "",
                                title,
                                content,
                                priority: priority || "NORMAL",
                                category: category || "GENERAL",
                                hostelId: hostelId || null,
                                expiresAt: expiresAt || null
                            })
                        });
                        console.log("[NoticeService] WhatsApp webhook dispatched successfully");
                    } catch (e: any) {
                        console.error("[NoticeService] Failed to dispatch WhatsApp webhook:", e.message);
                    }
                });
            }

            return newNotice;
        } catch (error: any) {
            throw new Error(`Failed to create notice: ${error.message}`);
        }
    }

    async updateNotice(id: string, data: any) {
        try {
            const result = await prisma.notice.update({
                where: { id },
                data: {
                    ...data,
                    expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
                }
            });
            await invalidatePattern('notices:*');
            return result;
        } catch (error: any) {
            throw new Error(`Failed to update notice: ${error.message}`);
        }
    }

    async deleteNotice(id: string) {
        try {
            const result = await prisma.notice.update({
                where: { id },
                data: { isActive: false }
            });
            await invalidatePattern('notices:*');
            return result;
        } catch (error: any) {
            throw new Error(`Failed to delete notice: ${error.message}`);
        }
    }

    async getNoticeStats(hostelId: string | null = null) {
        const cacheKey = `notices:stats:${hostelId || 'all'}`;
        const cached = await getCache<any>(cacheKey);
        if (cached) return cached;

        try {
            const where = hostelId ? { hostelId } : {};
            const [total, active] = await Promise.all([
                prisma.notice.count({ where }),
                prisma.notice.count({ where: { ...where, isActive: true } })
            ]);
            const result = { total, active };
            await setCache(cacheKey, result, 600);
            return result;
        } catch (error: any) {
            throw new Error(`Failed to fetch notice stats: ${error.message}`);
        }
    }
}

export default NoticeService;
