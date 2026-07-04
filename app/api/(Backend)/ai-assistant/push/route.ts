import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { buildPretrainedPrompt } from "@/lib/aiPromptEngine";

/**
 * POST /api/ai-assistant/push
 * Internal endpoint: inject a proactive AI-generated message into a user's chat.
 * Called from payment, complaint, and notice event hooks.
 *
 * Body: { userId, alertType, data }
 * alertType: "RENT_DUE" | "TICKET_RESOLVED" | "NEW_NOTICE" | "TICKET_IN_PROGRESS"
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, alertType, data, secret } = body;

        // Internal secret key check to prevent unauthorized push
        if (secret !== process.env.AI_PUSH_SECRET) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        if (!userId || !alertType) {
            return NextResponse.json({ success: false, error: "Missing userId or alertType" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, role: true, hostelId: true }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        let reply = "";
        let cardType: string | null = null;
        let cardData: any = null;
        let suggestions: string[] = [];

        switch (alertType) {
            case "RENT_DUE": {
                const amount = data?.amount || 0;
                const dueDate = data?.dueDate ? new Date(data.dueDate).toLocaleDateString() : "end of month";
                reply = `🔔 **Rent Reminder!**\n\nHey ${user.name}, your rent of **PKR ${amount.toLocaleString()}** is due by **${dueDate}**.\n\nPlease make sure to clear your dues on time to avoid any late payment charges.`;
                cardType = "PAYMENT_CARD";
                cardData = data;
                suggestions = ["Pay now", "Check rent balance", "Download receipt", "Manager contact"];
                break;
            }

            case "TICKET_RESOLVED": {
                const uid = data?.uid || data?.id?.slice(-6)?.toUpperCase();
                const category = data?.category || "your";
                reply = `✅ **Ticket #${uid} Resolved!**\n\nGreat news! Your **${category}** maintenance complaint has been resolved by our team.\n\n${data?.resolutionNotes ? `📋 Resolution Notes: *${data.resolutionNotes}*` : "Please check your room and let us know if the issue persists."}\n\nWe hope everything is working perfectly now!`;
                cardType = "COMPLAINT_CARD";
                cardData = data;
                suggestions = ["Check complaint status", "File new complaint", "Rate your experience"];
                break;
            }

            case "TICKET_IN_PROGRESS": {
                const uid = data?.uid || data?.id?.slice(-6)?.toUpperCase();
                reply = `🔧 **Update on Ticket #${uid}**\n\nYour complaint is now **In Progress**! Our maintenance team has picked it up and is working on it.\n\nWe'll notify you once it's resolved. Thank you for your patience!`;
                cardType = "COMPLAINT_CARD";
                cardData = data;
                suggestions = ["Check complaint status", "Manager contact", "File new complaint"];
                break;
            }

            case "NEW_NOTICE": {
                reply = `📢 **New Hostel Announcement!**\n\n**${data?.title || "New Notice Posted"}**\n\n${data?.content || data?.description || "Please check the hostel notice board for the latest update."}\n\n— Hostel Management`;
                cardType = "NOTICE_CARD";
                cardData = { notices: [data] };
                suggestions = ["Show all notices", "Manager contact", "Today's Mess Menu"];
                break;
            }

            default: {
                reply = `📱 **HostelAI Update:** ${data?.message || "You have a new update from your hostel management."}`;
                suggestions = ["Show notices", "Check rent", "Manager contact"];
            }
        }

        // Save proactive message to DB
        await prisma.chatMessage.create({
            data: {
                userId: user.id,
                role: "bot",
                content: reply,
                cardType,
                cardData,
                suggestions,
                isRead: false,
                isProactive: true
            }
        });

        console.log(`📤 [HostelAI Push] Alert "${alertType}" sent to user ${user.name} (${userId})`);

        return NextResponse.json({
            success: true,
            message: `Proactive alert "${alertType}" delivered to user ${userId}`
        });

    } catch (error: any) {
        console.error("❌ AI Push Alert Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
