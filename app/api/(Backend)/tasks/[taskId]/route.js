import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import TaskServices from "@/lib/services/taskservices/taskservices";

const taskServices = new TaskServices();

export async function GET(request, { params }) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { taskId } = params;
        const task = await taskServices.getTasks({ id: taskId });
        if (task.length === 0) {
            return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: task[0] });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { taskId } = params;
        const body = await request.json();
        const comment = await taskServices.addTaskComment({ ...body, taskId });
        return NextResponse.json({ success: true, data: comment });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
