
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/utils/sendmail";

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
                email,
                otp,
                expiresAt,
                type: "EMAIL_UPDATE"
            }
        });

        // Send Email
        const html = `
<div style="margin:0; padding:0; background-color:#f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        
        <table width="100%" cellpadding="0" cellspacing="0" 
          style="max-width:600px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 25px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #0056b3, #007bff); padding:30px; text-align:center;">
              <h2 style="color:#ffffff; margin:0; font-size:22px; letter-spacing:1px;">
                Email Verification
              </h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 30px; text-align:center; color:#444;">
              
              <p style="font-size:16px; margin:0 0 20px;">
                You requested to change your email address.
              </p>

              <p style="font-size:15px; margin:0 0 15px;">
                Use the verification code below:
              </p>

              <!-- OTP Box -->
              <div style="
                display:inline-block;
                padding:18px 35px;
                font-size:28px;
                font-weight:700;
                letter-spacing:8px;
                color:#0056b3;
                background:#f1f7ff;
                border-radius:12px;
                border:2px dashed #cfe2ff;
                margin:20px 0;
              ">
                ${otp}
              </div>

              <p style="font-size:14px; color:#888; margin:20px 0 0;">
                This code will expire in <strong>10 minutes</strong>.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafc; padding:20px; text-align:center; font-size:13px; color:#999;">
              If you did not request this change, you can safely ignore this email.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</div>
`;

        // console.log(`[API] POST /api/auth/change-email/send-otp - Sending email`);
        await sendEmail({ to: email, subject: "Verify your new email - GreenView Hostels", html });
        // console.log(`[API] POST /api/auth/change-email/send-otp - OTP sent successfully`);

        return NextResponse.json({ message: "OTP sent successfully" });
    } catch (error) {
        console.error(`[API] POST /api/auth/change-email/send-otp - Error: ${error}`);
        return NextResponse.json({ message: "Failed to send OTP" }, { status: 500 });
    }
}
