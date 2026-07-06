export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRoles } from "@/lib/apiAuth";
import { errorResponse } from "@/lib/apiResponse";


export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const hostelId = searchParams.get("hostelId");

        let messMenus;

        if (hostelId) {
            messMenus = await prisma.messMenu.findMany({
                where: { hostelId },
                orderBy: {
                    dayOfWeek: 'asc'
                }
            });
        } else {
            messMenus = await prisma.messMenu.findMany({
                orderBy: {
                    dayOfWeek: 'asc'
                }
            });
        }

        return NextResponse.json({ success: true, data: messMenus });
    } catch (error) {
        console.error("Error fetching mess menus:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req) {
    const auth = await requireRoles(['ADMIN', 'WARDEN']);
    if (!auth.success) return errorResponse(auth.error, auth.status);

    try {
        const body = await req.json();
        const {
            hostelId,
            dayOfWeek,
            breakfast,
            breakfastTime,
            lunch,
            lunchTime,
            dinner,
            dinnerTime
        } = body;

        if (!hostelId || !dayOfWeek) {
            return NextResponse.json({ success: false, message: "Hostel ID and day of week are required" }, { status: 400 });
        }

        const messMenu = await prisma.messMenu.upsert({
            where: {
                hostelId_dayOfWeek: {
                    hostelId,
                    dayOfWeek
                }
            },
            update: {
                breakfast,
                breakfastTime,
                lunch,
                lunchTime,
                dinner,
                dinnerTime
            },
            create: {
                hostelId,
                dayOfWeek,
                breakfast,
                breakfastTime,
                lunch,
                lunchTime,
                dinner,
                dinnerTime
            }
        });

        // Trigger real-time push notification to all residents of this hostel
        try {
            const recipients = await prisma.user.findMany({
                where: {
                    hostelId: hostelId,
                    pushToken: { not: null }
                },
                select: { id: true, pushToken: true }
            });

            const tokens = recipients.map(r => r.pushToken).filter(Boolean);

            if (tokens.length > 0) {
                const chunkSize = 100;
                const notifTitle = `🍽️ Mess Menu Update: ${dayOfWeek}`;
                const notifBody = `The mess menu for ${dayOfWeek} has been updated. Breakfast: ${breakfast || "N/A"}, Lunch: ${lunch || "N/A"}, Dinner: ${dinner || "N/A"}.`;

                for (let i = 0; i < tokens.length; i += chunkSize) {
                    const chunk = tokens.slice(i, i + chunkSize);
                    const expoMessages = chunk.map(token => ({
                        to: token,
                        sound: "default",
                        title: notifTitle,
                        body: notifBody.length > 150 ? notifBody.substring(0, 150) + "..." : notifBody,
                        data: { 
                            title: notifTitle, 
                            body: notifBody,
                            screen: "mess"
                        }
                    }));

                    await fetch("https://exp.host/--/api/v2/push/send", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(expoMessages)
                    });
                }

                // Log in database MobileNotification logs for notice board compatibility
                await prisma.mobileNotification.create({
                    data: {
                        title: notifTitle,
                        body: notifBody,
                        targetType: "hostel",
                        targetHostelId: hostelId,
                        recipientCount: tokens.length,
                        sentById: auth.user.id || auth.user.userId
                    }
                });
            }
        } catch (pushErr) {
            console.error("[Push Notification] Failed to broadcast mess update:", pushErr.message);
        }

        return NextResponse.json({ success: true, data: messMenu });
    } catch (error) {
        console.error("Error creating/updating mess menu:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
