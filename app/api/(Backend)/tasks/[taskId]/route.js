export const dynamic = 'force-dynamic';
import TaskServices from "@/lib/services/taskservices/taskservices";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

const taskServices = new TaskServices();

export async function GET(request, { params }) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    try {
        const { taskId } = await params;
        const task = await taskServices.getTasks({ id: taskId });
        if (task.length === 0) {
            return errorResponse("Task not found", 404);
        }
        return successResponse({ data: task[0] });
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}

export async function POST(request, { params }) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    try {
        const { taskId } = await params;
        const body = await request.json();
        const comment = await taskServices.addTaskComment({ ...body, taskId });
        return successResponse({ data: comment });
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}
