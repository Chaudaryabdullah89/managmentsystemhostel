import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/utils/sendmail";

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
                        const html = `
                            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                                <div style="background-color: ${priority === 'URGENT' ? '#e11d48' : '#4f46e5'}; padding: 20px; text-align: center;">
                                    <h1 style="color: white; margin: 0; text-transform: uppercase;">Notice Board</h1>
                                </div>
                                <div style="padding: 30px;">
                                    <h2 style="margin-top: 0; color: #111;">${title}</h2>
                                    <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                                        <strong>Category:</strong> ${category} <br/>
                                        <strong>Priority:</strong> <span style="color: ${priority === 'URGENT' ? '#e11d48' : '#333'}">${priority}</span>
                                    </p>
                                    <p style="font-size: 16px; line-height: 1.5; color: #444;">${content}</p>
                                </div>
                                <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #eee;">
                                    <p style="color: #888; font-size: 12px; margin: 0;">GreenView Hostels Management</p>
                                </div>
                            </div>
                        `;

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
