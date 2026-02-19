import { NextResponse } from "next/server";
import ComplaintServices from "@/lib/services/complaintservices/complaintservices";

const complaintServices = new ComplaintServices();

export async function POST(request) {
    try {
        const body = await request.json();
        const { complaintId, userId, message } = body;

        if (!complaintId || !userId || !message) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const comment = await complaintServices.addComment({ complaintId, userId, message });
        return NextResponse.json({ success: true, data: comment });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
