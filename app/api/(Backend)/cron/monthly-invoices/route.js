import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/checkRole';
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/lib/utils/sendmail";
import { buildEmailTemplate } from "@/lib/utils/emailTemplates";

export async function GET(req) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    const authHeader = req.headers.get('authorization');
    // You can set a CRON_SECRET in your env to protect this route
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const today = new Date();
        const monthName = today.toLocaleString('default', { month: 'long' });
        const year = today.getFullYear();
        const currentMonthIdentifier = `${monthName} ${year}`;

        // 1. Fetch all active bookings
        const activeBookings = await prisma.booking.findMany({
            where: {
                status: {
                    in: ['CONFIRMED', 'CHECKED_IN']
                }
            },
            include: {
                User: true,
                Room: {
                    include: {
                        Hostel: true
                    }
                }
            }
        });

        const results = {
            processed: 0,
            created: 0,
            emailsSent: 0,
            errors: []
        };

        for (const booking of activeBookings) {
            results.processed++;
            try {
                // 2. Check if rent invoice for this month already exists
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

                const existingPayment = await prisma.payment.findFirst({
                    where: {
                        bookingId: booking.id,
                        type: 'RENT',
                        createdAt: {
                            gte: startOfMonth,
                            lte: endOfMonth
                        }
                    }
                });

                if (!existingPayment) {
                    // 3. Create new payment record
                    const newPayment = await prisma.payment.create({
                        data: {
                            id: crypto.randomUUID(),
                            userId: booking.userId,
                            bookingId: booking.id,
                            amount: booking.Room.monthlyrent, // Use actual room monthly rent for recurring billing
                            type: 'RENT',
                            status: 'PENDING',
                            dueDate: new Date(today.getFullYear(), today.getMonth(), 10), // Due by 10th
                            notes: `Automated monthly rent invoice for ${currentMonthIdentifier}`,
                            updatedAt: new Date()
                        }
                    });
                    results.created++;

                    // 3.1 Calculate total outstanding for the resident (including this new one)
                    const userPayments = await prisma.payment.findMany({
                        where: {
                            userId: booking.userId,
                            status: { in: ['PENDING', 'PARTIAL'] }
                        }
                    });
                    const totalOutstanding = userPayments.reduce((acc, p) => acc + p.amount, 0);

                    // 4. Send Email
                    const bodyHtml = `
                      <p style="margin:0 0 14px; font-size:14px; color:#4b5563;">
                        Hello <strong>${booking.User.name}</strong>,
                      </p>
                      <p style="margin:0 0 16px; font-size:14px; color:#4b5563;">
                        Your monthly rent invoice for <strong>${currentMonthIdentifier}</strong> is now available.
                      </p>

                      <div style="margin:26px 0 28px; padding:20px 18px; background:#f9fafb; border-radius:14px; border:1px solid #e5e7eb;">
                        <h3 style="margin:0 0 14px; font-size:12px; letter-spacing:0.14em; text-transform:uppercase; color:#9ca3af; font-weight:700;">
                          Invoice summary
                        </h3>
                        <table style="width:100%; font-size:13px; border-collapse:collapse;">
                          <tr>
                            <td style="padding:6px 0; color:#6b7280;">Unit</td>
                            <td style="padding:6px 0; color:#111827; font-weight:600; text-align:right;">
                              Room ${booking.Room.roomNumber}, ${booking.Room.Hostel.name}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:6px 0; color:#6b7280;">Tariff</td>
                            <td style="padding:6px 0; color:#111827; font-weight:600; text-align:right;">
                              Monthly rent
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:6px 0; color:#6b7280;">Due date</td>
                            <td style="padding:6px 0; color:#111827; font-weight:600; text-align:right;">
                              ${new Date(newPayment.dueDate).toLocaleDateString()}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:16px 0 4px; color:#6b7280; font-size:12px;">This month</td>
                            <td style="padding:16px 0 4px; color:#111827; font-weight:700; text-align:right;">
                              PKR ${booking.Room.monthlyrent.toLocaleString()}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:4px 0; color:#6b7280; font-size:12px;">Total outstanding</td>
                            <td style="padding:4px 0; color:#16a34a; font-weight:800; text-align:right; font-size:18px;">
                              PKR ${totalOutstanding.toLocaleString()}
                            </td>
                          </tr>
                        </table>
                      </div>

                      <div style="text-align:center; margin-top:24px;">
                        <a href="http://localhost:3000/admin/bookings/${booking.id}/payments"
                           style="display:inline-block; padding:12px 24px; background:#111827; color:#ffffff; text-decoration:none; border-radius:999px; font-size:13px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase;">
                          View & pay invoice
                        </a>
                        <p style="margin:10px 0 0; font-size:11px; color:#9ca3af;">
                          Please complete payment by the due date to avoid service disruption.
                        </p>
                      </div>
                    `;

                    const emailHtml = buildEmailTemplate({
                        title: `Monthly rent invoice – ${currentMonthIdentifier}`,
                        subtitle: `Unit ${booking.Room.roomNumber} • ${booking.Room.Hostel.name}`,
                        bodyHtml,
                    });

                    await sendEmail({
                        to: booking.User.email,
                        subject: `Monthly Rent Invoice - ${currentMonthIdentifier} - Unit ${booking.Room.roomNumber}`,
                        html: emailHtml
                    });
                    results.emailsSent++;
                }
            } catch (err) {
                console.error(`Error processing booking ${booking.id}:`, err);
                results.errors.push({ id: booking.id, error: err.message });
            }
        }

        return Response.json(results);
    } catch (error) {
        console.error("Cron Job Failed:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
