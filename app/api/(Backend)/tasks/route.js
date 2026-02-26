import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import TaskServices from "@/lib/services/taskservices/taskservices";

const taskServices = new TaskServices();

export async function GET(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { searchParams } = new URL(request.url);
        const hostelId = searchParams.get('hostelId');
        const assignedToId = searchParams.get('assignedToId');
        const createdById = searchParams.get('createdById');
        const stats = searchParams.get('stats');

        if (stats) {
            const taskStats = await taskServices.getTaskStats(hostelId);
            return NextResponse.json({ success: true, data: taskStats });
        }

        let filter = {};
        if (hostelId) filter.hostelId = hostelId;
        if (assignedToId) filter.assignedToId = assignedToId;
        if (createdById) filter.createdById = createdById;

        const tasks = await taskServices.getTasks(filter);
        return NextResponse.json({ success: true, data: tasks });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const body = await request.json();
        const task = await taskServices.createTask(body);
        return NextResponse.json({ success: true, data: task });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const body = await request.json();
        const { id, ...data } = body;
        const task = await taskServices.updateTask(id, data);
        return NextResponse.json({ success: true, data: task });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
