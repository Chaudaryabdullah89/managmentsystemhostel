import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import ComplaintServices from "@/lib/services/complaintservices/complaintservices";

const complaintServices = new ComplaintServices();

export async function GET(request, { params }) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { complaintId } = await params;

        // getComplaints accepts a filter object. Passing { id: complaintId } fetches that specific record.
        const complaints = await complaintServices.getComplaints({ id: complaintId });

        if (!complaints || complaints.length === 0) {
            return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: complaints[0] });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
