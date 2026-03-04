import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import WardenServices from "@/lib/services/wardenservices/wardenservices";

const wardenServices = new WardenServices();

export async function GET(request) {
    const auth = await checkRole(['ADMIN', 'SUPERADMIN']);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const data = await wardenServices.getAllDueServices();
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
