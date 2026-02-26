import { checkRole } from '@/lib/checkRole';
import HostelServices from "../../../../../lib/services/hostelservices/hostelservices";

const { NextResponse, Request } = require("next/server")



export async function POST(req) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    console.log("[API] POST /api/hostels/deletehostel - Request received");

    const data = await req.json()
    const hostelServices = new HostelServices()
    const response = await hostelServices.deletehostel(data.id)
    return response


}