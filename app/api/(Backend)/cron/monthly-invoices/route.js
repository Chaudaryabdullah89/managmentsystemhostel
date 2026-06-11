export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/checkRole';
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/lib/utils/sendmail";
import { buildEmailTemplate, monthlyRentEmail } from "@/lib/utils/emailTemplates";

export async function GET(req) {
  // Check authorization
  const authHeader = req.headers.get('authorization');
  const isCronSecretValid = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
  
  // If not cron secret, check if it's an admin manually triggering it
  if (!isCronSecretValid) {
    const auth = await checkRole(["ADMIN"]);
    if (!auth.success) return NextResponse.json({ success: false, message: "Unauthorized. Admin access or valid CRON_SECRET required." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const force = searchParams.get('force') === 'true';

  try {
    const settings = await prisma.systemSettings.findUnique({ where: { id: 'global' } });
    const today = new Date();
    const monthName = today.toLocaleString('default', { month: 'long' });
    const year = today.getFullYear();
    const currentMonthIdentifier = `${monthName} ${year}`;

    const results = {
      rent: { processed: 0, created: 0, emailsSent: 0, skipped: 0 },
      salary: { processed: 0, created: 0, emailsSent: 0, skipped: 0 },
      errors: []
    };

    // ─── 1. Monthly Rent Invoices ───────────────────────────────────────────
    if (force || settings?.autoGenerateRentInvoices) {
      const activeBookings = await prisma.booking.findMany({
        where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
        include: { User: true, Room: { include: { Hostel: true } } }
      });

      const rentEmailPromises = [];

      for (const booking of activeBookings) {
        results.rent.processed++;
        try {
          const existingPayment = await prisma.payment.findFirst({
            where: {
              bookingId: booking.id,
              type: { in: ['RENT', 'MONTHLY_RENT'] },
              month: monthName,
              year: year,
              status: { notIn: ["REJECTED", "FAILED", "REFUNDED"] }
            }
          });

          if (!existingPayment) {
            const rentAmount = booking.monthlyRent || booking.Room.montlyrent || booking.Room.price || 0;
            const newPayment = await prisma.payment.create({
              data: {
                id: crypto.randomUUID(),
                userId: booking.userId,
                bookingId: booking.id,
                amount: rentAmount,
                type: 'RENT',
                status: 'PENDING',
                dueDate: new Date(today.getFullYear(), today.getMonth(), 10),
                month: monthName,
                year: year,
                notes: `Automated monthly rent invoice for ${currentMonthIdentifier}`,
                updatedAt: new Date()
              }
            });

            // Note: We do NOT mutate booking.totalAmount here.
            // All financial totals are derived from Payment records directly.
            // booking.totalAmount remains the original contract snapshot.

            results.rent.created++;

            if (booking.User.email && settings?.enablePaymentEmails) {
              const bodyHtml = `
                <p>Hello <strong>${booking.User.name}</strong>, your monthly rent invoice for <strong>${currentMonthIdentifier}</strong> is now available.</p>
                <div style="margin:26px 0; padding:20px; background:#f9fafb; border-radius:14px; border:1px solid #e5e7eb;">
                  <table style="width:100%; font-size:13px;">
                    <tr><td>Unit</td><td style="text-align:right; font-weight:600;">Room ${booking.Room.roomNumber}, ${booking.Room.Hostel.name}</td></tr>
                    <tr><td>Due Date</td><td style="text-align:right; font-weight:600;">${new Date(newPayment.dueDate).toLocaleDateString()}</td></tr>
                    <tr><td>Amount</td><td style="text-align:right; font-weight:700; color:#2563eb;">PKR ${rentAmount.toLocaleString()}</td></tr>
                  </table>
                </div>
              `;
              rentEmailPromises.push(
                sendEmail({
                  to: booking.User.email,
                  subject: `Monthly Rent Invoice - ${currentMonthIdentifier}`,
                  html: buildEmailTemplate({ title: "Monthly Rent Invoice", subtitle: currentMonthIdentifier, bodyHtml })
                }).then(() => { results.rent.emailsSent++; })
                .catch(err => console.error("[Cron Email] Rent email failed for", booking.id, err))
              );
            }
          } else {
            results.rent.skipped++;
          }
        } catch (err) {
          results.errors.push({ type: 'RENT', id: booking.id, error: err.message });
        }
      }
      if (rentEmailPromises.length > 0) {
        await Promise.allSettled(rentEmailPromises);
      }
    }

    // ─── 2. Monthly Staff Salaries ─────────────────────────────────────────
    if (force || settings?.autoGenerateStaffSalaries) {
      const activeStaff = await prisma.staffProfile.findMany({
        include: { User: true }
      });

      const salaryEmailPromises = [];

      for (const staff of activeStaff) {
        results.salary.processed++;
        try {
          const existingSalary = await prisma.salary.findFirst({
            where: { staffProfileId: staff.id, month: currentMonthIdentifier }
          });

          if (!existingSalary) {
            const amount = (staff.basicSalary || 0) + (staff.allowances || 0);
            await prisma.salary.create({
              data: {
                id: crypto.randomUUID(),
                uid: `SAL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
                staffProfileId: staff.id,
                month: currentMonthIdentifier,
                amount,
                basicSalary: staff.basicSalary || 0,
                allowances: staff.allowances || 0,
                status: 'PENDING',
                updatedAt: new Date()
              }
            });

            results.salary.created++;

            if (staff.User.email && settings?.enableEmailService) {
              salaryEmailPromises.push(
                sendEmail({
                  to: staff.User.email,
                  subject: `Salary Generated — ${currentMonthIdentifier}`,
                  html: monthlyRentEmail({
                    name: staff.User.name,
                    amount,
                    month: monthName,
                    year,
                    type: "SALARY",
                  }),
                }).then(() => { results.salary.emailsSent++; })
                .catch(err => console.error("[Cron Email] Salary email failed for", staff.id, err))
              );
            }
          } else {
            results.salary.skipped++;
          }
        } catch (err) {
          results.errors.push({ type: 'SALARY', id: staff.id, error: err.message });
        }
      }
      if (salaryEmailPromises.length > 0) {
        await Promise.allSettled(salaryEmailPromises);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Cron Job Failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
