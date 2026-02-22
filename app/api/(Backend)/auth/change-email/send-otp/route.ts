
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/utils/sendmail";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        console.log(`[API] POST /api/auth/change-email/send-otp - Request received for: ${email}`);

        if (!email) {
            console.warn(`[API] POST /api/auth/change-email/send-otp - Email missing`);
            return NextResponse.json({ message: "Email is required" }, { status: 400 });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save to DB
        console.log(`[API] POST /api/auth/change-email/send-otp - Saving OTP to DB`);
        await prisma.otpVerification.create({
            data: {
                email,
                otp,
                expiresAt,
                // type: "EMAIL_UPDATE"
            }
        });

        // Send Email
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #0056b3;">Email Verification</h2>
                <p>You requested to change your email address.</p>
                <p>Your verification code is:</p>
                <h1 style="color: #333; letter-spacing: 5px;">${otp}</h1>
                <p>This code will expire in 10 minutes.</p>
                <p>If you did not request this change, please ignore this email.</p>
            </div>
        `;

        console.log(`[API] POST /api/auth/change-email/send-otp - Sending email`);
        await sendEmail({ to: email, subject: "Verify your new email - GreenView Hostels", html });
        console.log(`[API] POST /api/auth/change-email/send-otp - OTP sent successfully`);

        return NextResponse.json({ message: "OTP sent successfully" });
    } catch (error) {
        console.error(`[API] POST /api/auth/change-email/send-otp - Error: ${error}`);
        return NextResponse.json({ message: "Failed to send OTP" }, { status: 500 });
    }
}
