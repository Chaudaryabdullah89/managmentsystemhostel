import { checkRole } from '@/lib/checkRole';

import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/utils/sendmail";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sign } from "jsonwebtoken";
import { buildEmailTemplate } from "@/lib/utils/emailTemplates";

export async function POST(req) {
  // const auth = await checkRole([]);
  // if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

  try {
    const { email } = await req.json();
    console.log(`[API] POST /api/mails/forget-password - Request received for email: ${email}`);

    if (!email) {
      console.log(`[API] POST /api/mails/forget-password - Email is missing in request body`);
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`[API] POST /api/mails/forget-password - User not found for email: ${email}`);
      return NextResponse.json({ message: "Email Not Found. Try To register or check your email" }, { status: 500, error: "Email Not Found. Try To register or check your email" });
    }

    console.log(`[API] POST /api/mails/forget-password - User found: ${user.id}`);

    const secret = process.env.JWT_SECRET || "your-secret-key-change-in-production";

    const token = sign({ id: user.id, email: user.email }, secret, { expiresIn: "1h" });
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const resetLink = `${baseUrl}/auth/reset-password?token=${hashedToken}&email=${user.email}&userId=${user.id}`;

    const bodyHtml = `
          <p style="margin:0 0 16px; font-size:14px; color:#4b5563;">
            Hello <strong>${user.name || "User"}</strong>,
          </p>
          <p style="margin:0 0 16px; font-size:14px; color:#4b5563;">
            We received a request to reset the password for your GreenView Hostels account.
          </p>
          <p style="margin:0 0 24px; font-size:14px; color:#4b5563;">
            Click the button below to choose a new password. This link will be valid for <strong>1 hour</strong>.
          </p>
          <div style="text-align:center; margin:24px 0 28px;">
            <a href="${resetLink}"
               style="display:inline-block; padding:12px 24px; background:#2563eb; color:#ffffff; text-decoration:none; border-radius:999px; font-size:13px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase;">
              Reset password
            </a>
          </div>
          <p style="margin:0 0 12px; font-size:13px; color:#6b7280;">
            If you did not request this, you can safely ignore this email – your password will remain unchanged.
          </p>
        `;

    const html = buildEmailTemplate({
      title: "Reset your password",
      subtitle: "Secure access to your GreenView Hostels account",
      bodyHtml,
    });

    console.log(`[API] POST /api/mails/forget-password - Upserting reset token in database`);
    await prisma.resetPassword.upsert({
      where: { email: user.email },
      update: {
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
      create: {
        email: user.email,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        userId: user.id,
        id: user.id
      },
    });


    console.log(`[API] POST /api/mails/forget-password - Sending email to: ${email}`);
    await sendEmail({ to: email, subject: "Password Reset - GreenView Hostels", html });
    console.log(`[API] POST /api/mails/forget-password - Email sent successfully`);

    return NextResponse.json({ message: "Email sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return NextResponse.json({ message: "Failed to send email", error: error.message }, { status: 500 });
  }
}
