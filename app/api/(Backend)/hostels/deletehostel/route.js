import HostelServices from "../../../../../lib/services/hostelservices/hostelservices";
import { requireRoles } from '@/lib/apiAuth';

const { NextResponse, Request } = require("next/server")



export async function POST(req) {
    const guard = await requireRoles(['ADMIN']);
    if (!guard.ok) return guard.response;

    console.log("[API] POST /api/hostels/deletehostel - Request received");

    const data = await req.json()
    const hostelServices = new HostelServices()
    const response = await hostelServices.deletehostel(data.id)
    return response


}