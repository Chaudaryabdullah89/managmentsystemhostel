import { hostelValidationSchema } from "@/lib/validations/schemas";
import HostelServices from "../../../../../lib/services/hostelservices/hostelservices";
import { checkRole } from "@/lib/checkRole";

const { NextResponse } = require("next/server")

export async function POST(req) {
    console.log("[API] POST /api/hostels/edithostel - Request received");

    // 1. RBAC Check
    const auth = await checkRole(['ADMIN', 'SUPER_ADMIN']);
    if (!auth.success) {
        return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }

    try {
        const rawData = await req.json();
        const validation = hostelValidationSchema.safeParse(rawData);

        if (!validation.success) {
            console.error("[API] POST /api/hostels/edithostel - Validation failed:", validation.error.flatten());
            return NextResponse.json({ success: false, message: "Invalid input data", errors: validation.error.flatten() }, { status: 400 });
        }

        const hostelServices = new HostelServices()
        const response = await hostelServices.updatehostel(validation.data.id || rawData.id, validation.data)
        return response
    } catch (error) {
        console.error("[API] POST /api/hostels/edithostel - Error parsing JSON:", error);
        return NextResponse.json({ success: false, message: "Invalid JSON format" }, { status: 400 });
    }
}