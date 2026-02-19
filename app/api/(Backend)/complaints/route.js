import { NextResponse } from "next/server";
import ComplaintServices from "@/lib/services/complaintservices/complaintservices";

const complaintServices = new ComplaintServices();

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const hostelId = searchParams.get('hostelId');
        const stats = searchParams.get('stats');

        if (stats) {
            const complaintStats = await complaintServices.getComplaintStats(hostelId);
            return NextResponse.json({ success: true, data: complaintStats });
        }

        let filter = {};
        if (userId) filter.userId = userId;
        if (hostelId) filter.hostelId = hostelId;

        const assignedToId = searchParams.get('assignedToId');
        if (assignedToId) filter.assignedToId = assignedToId;

        const complaints = await complaintServices.getComplaints(filter);
        return NextResponse.json({ success: true, data: complaints });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const complaint = await complaintServices.createComplaint(body);
        return NextResponse.json({ success: true, data: complaint });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, status, resolutionNotes, assignedToId } = body;
        const complaint = await complaintServices.updateComplaintStatus(id, status, resolutionNotes, assignedToId);
        return NextResponse.json({ success: true, data: complaint });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
