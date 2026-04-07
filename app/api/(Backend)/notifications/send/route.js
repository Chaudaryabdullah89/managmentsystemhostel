import { requireAuth } from '@/lib/apiAuth';
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/utils/sendmail";
import { errorResponse } from '@/lib/apiResponse';

export async function POST(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    try {
        const { to, subject, html } = await request.json();

        if (!to || !subject || !html) {
            return NextResponse.json(
                { error: "Missing required fields: to, subject, html" },
                { status: 400 }
            );
        }

        const result = await sendEmail({ to, subject, html });

        if (result) {
            return NextResponse.json({
                success: true,
                message: `Email sent successfully to ${to}`,
                messageId: result.messageId
            });
        } else {
            return NextResponse.json(
                { error: "Failed to send email" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Notification API error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
