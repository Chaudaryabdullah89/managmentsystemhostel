import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

        return NextResponse.json({ success: true, data: messMenu });
    } catch (error) {
        console.error("Error creating/updating mess menu:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
