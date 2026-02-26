import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/checkRole';
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/lib/utils/sendmail";

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
                    const emailHtml = `
                        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                            <div style="background-color: #000; color: #fff; padding: 50px 40px; text-align: center;">
                                <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 3px; font-weight: 800;">Monthly Rent Protocol</h1>
                                <p style="margin-top: 10px; opacity: 0.6; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Invoice for ${currentMonthIdentifier}</p>
                            </div>
                            <div style="padding: 40px; background-color: #ffffff;">
                                <p style="font-size: 16px; color: #333; font-weight: 600;">Hello ${booking.User.name},</p>
                                <p style="color: #666; font-size: 14px; line-height: 1.8;">The automated fiscal cycle for your residency has initiated. Your monthly rent invoice for <strong>${currentMonthIdentifier}</strong> is now available for settlement.</p>
                                
                                <div style="margin: 35px 0; padding: 30px; background-color: #f8f9fa; border-radius: 15px; border-left: 5px solid #000;">
                                    <h3 style="margin: 0 0 20px 0; font-size: 11px; text-transform: uppercase; color: #999; letter-spacing: 1px; font-weight: 800;">Settlement Summary</h3>
                                    <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                                        <tr>
                                            <td style="padding: 10px 0; color: #777; font-weight: 500;">Unit Address:</td>
                                            <td style="padding: 10px 0; font-weight: 700; text-align: right; color: #000;">Room ${booking.Room.roomNumber}, ${booking.Room.Hostel.name}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 10px 0; color: #777; font-weight: 500;">Tariff Type:</td>
                                            <td style="padding: 10px 0; font-weight: 700; text-align: right; color: #000;">Monthly Rent</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 10px 0; color: #777; font-weight: 500;">Due On:</td>
                                            <td style="padding: 10px 0; font-weight: 700; text-align: right; color: #000;">${new Date(newPayment.dueDate).toLocaleDateString()}</td>
                                        </tr>
                                        <tr style="border-top: 1px solid #eee;">
                                            <td style="padding: 20px 0 0 0; color: #000; font-weight: 800; text-transform: uppercase; font-size: 10px;">Current Month:</td>
                                            <td style="padding: 20px 0 0 0; font-weight: 900; text-align: right; color: #000; font-size: 14px;">PKR ${booking.Room.monthlyrent.toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 10px 0 0 0; color: #000; font-weight: 800; text-transform: uppercase; font-size: 12px;">Total Liability:</td>
                                            <td style="padding: 10px 0 0 0; font-weight: 900; text-align: right; color: #10b981; font-size: 20px;">PKR ${totalOutstanding.toLocaleString()}</td>
                                        </tr>
                                    </table>
                                </div>

                                <div style="text-align: center; margin-top: 40px;">
                                    <a href="http://localhost:3000/admin/bookings/${booking.id}/payments" style="display: inline-block; padding: 18px 35px; background-color: #000; color: #fff; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">Execute Payment Protocol</a>
                                    <p style="font-size: 11px; color: #aaa; margin-top: 25px; font-weight: 500;">Please ensure settlement by the due date to avoid service disruptions.</p>
                                </div>
                            </div>
                            <div style="background-color: #fafafa; padding: 25px; text-align: center; color: #bbb; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-top: 1px solid #f0f0f0;">
                                © 2026 GreenView Hostels • Advanced Housing Systems Node
                            </div>
                        </div>
                    `;

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
