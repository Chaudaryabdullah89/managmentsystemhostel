export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/apiAuth';
import { NextResponse } from "next/server";
import WardenServices from "@/lib/services/wardenservices/wardenservices";
import { errorResponse } from '@/lib/apiResponse';

const wardenServices = new WardenServices();

export async function GET(request) {
    const auth = await requireAuth();
    if (!auth.success) return errorResponse(auth.error, auth.status);

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
