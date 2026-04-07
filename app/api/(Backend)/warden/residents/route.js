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

        if (!userId) {
            return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
        }

        const residents = await wardenServices.getHostelResidents(userId);
        return NextResponse.json({ success: true, data: residents });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
