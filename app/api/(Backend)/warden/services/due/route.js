import { NextResponse } from "next/server";
import WardenServices from "@/lib/services/wardenservices/wardenservices";

const wardenServices = new WardenServices();

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
        }

        const data = await wardenServices.getDueServices(userId);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
