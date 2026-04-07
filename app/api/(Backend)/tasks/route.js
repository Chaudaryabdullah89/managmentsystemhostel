export const dynamic = 'force-dynamic';
import TaskServices from "@/lib/services/taskservices/taskservices";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

const taskServices = new TaskServices();

export async function GET(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    try {
        const { searchParams } = new URL(request.url);
        const hostelId = searchParams.get('hostelId');
        const assignedToId = searchParams.get('assignedToId');
        const createdById = searchParams.get('createdById');
        const stats = searchParams.get('stats');

        if (stats) {
            const taskStats = await taskServices.getTaskStats(hostelId);
            return successResponse({ data: taskStats });
        }

        let filter = {};
        if (hostelId) filter.hostelId = hostelId;
        if (assignedToId) filter.assignedToId = assignedToId;
        if (createdById) filter.createdById = createdById;

        const tasks = await taskServices.getTasks(filter);
        return successResponse({ data: tasks });
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}

export async function POST(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    try {
        const body = await request.json();
        const task = await taskServices.createTask(body);
        return successResponse({ data: task });
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}

export async function PUT(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    try {
        const body = await request.json();
        const { id, ...data } = body;
        const task = await taskServices.updateTask(id, data);
        return successResponse({ data: task });
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}
