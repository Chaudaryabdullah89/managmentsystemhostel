
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/utils/sendmail";
import { buildEmailTemplate } from "@/lib/utils/emailTemplates";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    // console.log(`[API] POST /api/auth/change-email/send-otp - Request received for: ${email}`);

    if (!email) {
      // console.warn(`[API] POST /api/auth/change-email/send-otp - Email missing`);
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save to DB
    // console.log(`[API] POST /api/auth/change-email/send-otp - Saving OTP to DB`);
    await prisma.otpVerification.create({
      data: {
        id: randomUUID(),
        email,
        otp,
        expiresAt,
        type: "EMAIL_UPDATE",
      },
    });

    // Send Email
    const bodyHtml = `
          <p style="margin:0 0 16px; font-size:14px; color:#4b5563; text-align:left;">
            You requested to update the email address associated with your GreenView Hostels account.
          </p>
          <p style="margin:0 0 12px; font-size:14px; color:#4b5563; text-align:left;">
            Use the verification code below to confirm this change:
          </p>
          <div style="text-align:center; margin:22px 0 26px;">
            <div style="
              display:inline-block;
              padding:16px 32px;
              font-size:26px;
              font-weight:700;
              letter-spacing:0.35em;
              color:#111827;
              background:#eff6ff;
              border-radius:14px;
              border:1px dashed #bfdbfe;
              ">
              ${otp}
            </div>
          </div>
          <p style="margin:0 0 8px; font-size:13px; color:#6b7280; text-align:left;">
            This code will expire in <strong>10 minutes</strong>.
          </p>
          <p style="margin:0; font-size:12px; color:#9ca3af; text-align:left;">
            If you did not request an email change, please ignore this message – no changes will be made to your account.
          </p>
        `;

    const html = buildEmailTemplate({
      title: "Confirm your new email",
      subtitle: "Security verification for your account",
      bodyHtml,
    });

    // console.log(`[API] POST /api/auth/change-email/send-otp - Sending email`);
    await sendEmail({ to: email, subject: "Verify your new email - GreenView Hostels", html });
    // console.log(`[API] POST /api/auth/change-email/send-otp - OTP sent successfully`);

    return NextResponse.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(`[API] POST /api/auth/change-email/send-otp - Error: ${error}`);
    return NextResponse.json({ message: "Failed to send OTP" }, { status: 500 });
  }
}
