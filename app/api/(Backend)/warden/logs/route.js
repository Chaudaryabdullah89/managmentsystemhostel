import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import WardenServices from "@/lib/services/wardenservices/wardenservices";

const wardenServices = new WardenServices();

export async function GET(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const type = searchParams.get('type'); // 'cleaning' or 'laundry'

        if (!userId || !type) {
            return NextResponse.json({ success: false, error: "User ID and type are required" }, { status: 400 });
        }

        const logs = await wardenServices.getOperationalLogs(userId, type);
        return NextResponse.json({ success: true, data: logs });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
