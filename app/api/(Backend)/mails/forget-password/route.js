
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/utils/sendmail";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sign } from "jsonwebtoken";

export async function POST(req) {
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

        const html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #0056b3;">Password Reset Request</h2>
                <p>Hello ${user.name || "User"},</p>
                <p>You have requested to reset your password. Please click the link below to proceed:</p>
                <p>
                    <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; margin: 10px 0; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px;">Reset Password</a>
                </p>
                <p>This link will expire in 1 hour.</p>
                <p>If you did not request this, please ignore this email.</p>
            </div>
        `;

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
