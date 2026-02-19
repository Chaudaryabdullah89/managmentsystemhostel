import HostelServices from "../../../../../lib/services/hostelservices/hostelservices";

const { NextResponse, Request } = require("next/server")



export async function POST(req) {
    console.log("[API] POST /api/hostels/edithostel - Request received");

    const data = await req.json()
    const hostelServices = new HostelServices()
    const response = await hostelServices.updatehostel(data.id, data)
    return response


}