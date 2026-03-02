import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { stringSimilarity } from "string-similarity-js";
import Fuse from "fuse.js";

const INTENTS = [
    { name: 'GREETING', keywords: ['hello', 'hi', 'hey', 'salaam', 'how are you', 'morning', 'night'] },
    { name: 'MESS', keywords: ['food', 'mess', 'menu', 'eat', 'dinner', 'lunch', 'breakfast', 'daal', 'roti', 'chicken'] },
    { name: 'FINANCE', keywords: ['payment', 'bill', 'due', 'money', 'rent', 'unpaid', 'finance', 'fee', 'charge'] },
    { name: 'ROOM', keywords: ['room', 'where', 'bed', 'assigned', 'location', 'floor', 'stay'] },
    { name: 'SUPPORT', keywords: ['complaint', 'issue', 'problem', 'fix', 'broken', 'repair', 'light', 'fan', 'wifi'] },
    { name: 'MANAGEMENT', keywords: ['manager', 'warden', 'contact', 'admin', 'help', 'office', 'number'] },
    { name: 'NOTICES', keywords: ['notice', 'announcement', 'news', 'update', 'happening', 'info'] },
    { name: 'IDENTITY', keywords: ['who are you', 'what can you do', 'ai', 'help', 'commands'] },
    { name: 'THANKS', keywords: ['thank', 'thanks', 'jazakallah', 'shukriya'] }
];

export async function POST(req) {
    try {
        const { message, userId } = await req.json();

        if (!userId || !message) {
            return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                Booking: { include: { Room: true } },
                Payment: { orderBy: { createdAt: 'desc' }, take: 10 },
                Complaint_Complaint_userIdToUser: { orderBy: { createdAt: 'desc' }, take: 5 },
                Hostel_User_hostelIdToHostel: {
                    include: {
                        MessMenu: true,
                        User_Hostel_managerIdToUser: { select: { name: true, phone: true } },
                        Notice: { where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 5 }
                    }
                }
            }
        });

        if (!user) return NextResponse.send(new Response("User not found", { status: 404 }));

        const msg = message.toLowerCase();

        // 1. Identify Intent using String Similarity
        let bestIntent = { name: 'UNKNOWN', score: 0 };
        for (const intent of INTENTS) {
            for (const keyword of intent.keywords) {
                const score = stringSimilarity(msg, keyword);
                if (score > bestIntent.score) {
                    bestIntent = { name: intent.name, score };
                }
            }
        }

        // 2. Data Preparation
        const hostel = user.Hostel_User_hostelIdToHostel;
        const activeBooking = user.Booking.find(b => ['CONFIRMED', 'CHECKED_IN'].includes(b.status));
        const room = activeBooking?.Room;
        const messMenu = hostel?.MessMenu || [];
        const notices = hostel?.Notice || [];
        const manager = hostel?.User_Hostel_managerIdToUser;
        const payments = user.Payment;
        const complaints = user.Complaint_Complaint_userIdToUser;

        let reply = "";

        // 3. Logic Router (Intelligent Responses)
        const hour = new Date().getHours();
        const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

        if (bestIntent.score < 0.2 && !msg.includes('?') && msg.length < 3) {
            bestIntent.name = 'GREETING'; // Fallback for short texts
        }

        switch (bestIntent.name) {
            case 'GREETING':
                reply = `${timeGreeting}, ${user.name.split(' ')[0]}! 👋 I'm your AI Hostel Assistant. I'm here to help you manage your stay at **${hostel?.name || 'our hostel'}**. \n\nWhat can I look up for you?`;
                break;

            case 'IDENTITY':
                reply = "I am the **Hostel Intelligence System**. 🤖\n\nI can:\n• Check **Today's Menu**\n• Track your **Payments & Bills**\n• Show **Manager Details**\n• Check **Latest Notices**\n• Status of your **Complaints**";
                break;

            case 'MESS':
                const isTomorrow = msg.includes('tomorrow');
                const targetDate = new Date();
                if (isTomorrow) targetDate.setDate(targetDate.getDate() + 1);

                const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
                const targetMenu = messMenu.find(m => m.dayOfWeek === dayName);

                if (!targetMenu) {
                    reply = `🍴 The mess menu for ${isTomorrow ? 'tomorrow' : 'today'} (${dayName}) hasn't been uploaded yet.`;
                } else {
                    const fuseMenu = new Fuse([
                        { type: 'breakfast', item: targetMenu.breakfast, time: targetMenu.breakfastTime },
                        { type: 'lunch', item: targetMenu.lunch, time: targetMenu.lunchTime },
                        { type: 'dinner', item: targetMenu.dinner, time: targetMenu.dinnerTime }
                    ], { keys: ['type', 'item'], threshold: 0.4 });

                    const searchResult = fuseMenu.search(msg);
                    if (searchResult.length > 0 && !msg.includes('menu')) {
                        const m = searchResult[0].item;
                        reply = `🍳 **${m.type.toUpperCase()}** (${m.time}) for ${isTomorrow ? 'tomorrow' : 'today'}:\n\n${m.item}`;
                    } else {
                        reply = `🍴 **${isTomorrow ? "Tomorrow's" : "Today's"} Menu (${dayName})**:\n\n• **Breakfast**: ${targetMenu.breakfast || 'N/A'}\n• **Lunch**: ${targetMenu.lunch || 'N/A'}\n• **Dinner**: ${targetMenu.dinner || 'N/A'}`;
                    }
                }
                break;

            case 'FINANCE':
                const pending = payments.filter(p => p.status !== 'PAID' && p.status !== 'REFUNDED');
                if (pending.length > 0) {
                    const totalDues = pending.reduce((s, p) => s + p.amount, 0);
                    reply = `🧾 You have **${pending.length} unpaid invoices**. \n\n• **Total Owed**: PKR ${totalDues.toLocaleString()}\n• **Latest Due**: ${pending[0].notes || 'Monthly Rent'}\n\nPlease clear these in the **Payments** section.`;
                } else {
                    reply = "✅ Great news! All your dues are clear. Your account is in good standing.";
                }
                break;

            case 'ROOM':
                if (activeBooking && room) {
                    reply = `🏠 **Room Profile**:\n• **Number**: ${room.roomNumber}\n• **Floor**: ${room.floor}\n• **Type**: ${room.type}\n• **Status**: ${room.status}\n\nLocated at **${hostel.name}**.`;
                } else {
                    reply = "You don't have an active room booking currently. If you've paid but don't see your room, please wait for admin approval.";
                }
                break;

            case 'SUPPORT':
                const activeIssues = complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'REJECTED');
                if (activeIssues.length > 0) {
                    reply = `🛠️ **Issue Tracker**:\nYou have **${activeIssues.length} active complaint(s)**.\n\nLatest: "${activeIssues[0].title}" is currently **${activeIssues[0].status}**. Our staff is notified!`;
                } else {
                    reply = "You don't have any pending issues. If something is broken, just head to the **Support** page to report it!";
                }
                break;

            case 'NOTICES':
            case 'MANAGEMENT':
                if (msg.includes('manager') || msg.includes('contact') || bestIntent.name === 'MANAGEMENT') {
                    reply = manager ? `👔 **Hostel Manager**: ${manager.name}\n📞 **Contact**: ${manager.phone || 'N/A'}\n\nYou can find him in the main Admin Office during working hours.` : "Hostel manager details are not updated. Please visit the reception.";
                } else {
                    if (notices.length > 0) {
                        const topNotice = notices[0];
                        reply = `🔔 **Latest Announcement**:\n\n**${topNotice.title}**\n${topNotice.content}\n\n*Posted on ${new Date(topNotice.createdAt).toLocaleDateString()}*`;
                    } else {
                        reply = "There are no new notices for your hostel right now.";
                    }
                }
                break;

            case 'THANKS':
                reply = "You're very welcome! I'm here to make your stay at our hostel as smooth as possible. Have a great day! 😊";
                break;

            default:
                reply = "I'm not exactly sure what you need. Could you try asking about **'dinner'**, **'my room'**, **'unpaid bills'**, or **'notices'**?";
                break;
        }

        return NextResponse.json({ success: true, reply });

    } catch (error) {
        console.error("AI Upgrade Error:", error);
        return NextResponse.json({ success: false, error: "AI logic failure" }, { status: 500 });
    }
}
