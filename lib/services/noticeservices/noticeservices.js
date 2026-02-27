import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/utils/sendmail";
import { buildEmailTemplate } from "@/lib/utils/emailTemplates";

class NoticeService {
    async getNotices(filter = {}) {
        try {
            return await prisma.notice.findMany({
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
        } catch (error) {
            throw new Error(`Failed to fetch notices: ${error.message}`);
        }
    }

    async createNotice(data) {
        try {
            const { title, content, priority, category, authorId, hostelId, expiresAt } = data;
            const newNotice = await prisma.notice.create({
                data: {
                    title,
                    content,
                    priority: priority || "MEDIUM",
                    category: category || "GENERAL",
                    authorId,
                    hostelId: hostelId || null,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                }
            });

            // Asynchronously dispatch email alerts to affected residents
            setImmediate(async () => {
                try {
                    let usersToEmail = [];
                    if (hostelId) {
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
                            A new notice has been published by GreenView Hostels management.
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

                        const html = buildEmailTemplate({
                            title: priority === 'URGENT' ? 'Urgent hostel notice' : 'New hostel notice',
                            subtitle: hostelId ? 'Important update for your hostel' : 'Network-wide resident announcement',
                            bodyHtml,
                        });

                        // Send utilizing BCC to avoid sharing email addresses
                        await sendEmail({
                            to: process.env.EMAIL_USER || 'admin@greenview.com', // fallback required usually 
                            bcc: emailAddresses.join(', '),
                            subject,
                            html
                        });
                    }
                } catch (e) {
                    console.error("Failed to disptach notice emails:", e);
                }
            });

            return newNotice;
        } catch (error) {
            throw new Error(`Failed to create notice: ${error.message}`);
        }
    }

    async updateNotice(id, data) {
        try {
            return await prisma.notice.update({
                where: { id },
                data: {
                    ...data,
                    expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
                }
            });
        } catch (error) {
            throw new Error(`Failed to update notice: ${error.message}`);
        }
    }

    async deleteNotice(id) {
        try {
            return await prisma.notice.update({
                where: { id },
                data: { isActive: false }
            });
        } catch (error) {
            throw new Error(`Failed to delete notice: ${error.message}`);
        }
    }

    async getNoticeStats(hostelId = null) {
        try {
            const where = hostelId ? { hostelId } : {};
            const [total, active] = await Promise.all([
                prisma.notice.count({ where }),
                prisma.notice.count({ where: { ...where, isActive: true } })
            ]);
            return { total, active };
        } catch (error) {
            throw new Error(`Failed to fetch notice stats: ${error.message}`);
        }
    }
}

export default NoticeService;
