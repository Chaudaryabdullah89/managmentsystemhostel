import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const TaskQueryKeys = {
    all: ["tasks"],
    byUser: (userId: string) => ["tasks", "user", userId],
    byHostel: (hostelId: string) => ["tasks", "hostel", hostelId],
};

export function useTasks(filters: any = {}) {
    return useQuery({
        queryKey: [...TaskQueryKeys.all, filters],
        queryFn: async () => {
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== undefined && v !== null && v !== '')
            );
            const params = new URLSearchParams(cleanFilters as any);
            const response = await fetch(`/api/tasks?${params.toString()}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
    });
}

export function useTaskById(id: string) {
    return useQuery({
        queryKey: ["tasks", id],
        queryFn: async () => {
            const response = await fetch(`/api/tasks/${id}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        enabled: !!id
    });
}

export function useCreateTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (taskData: any) => {
            const response = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(taskData),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TaskQueryKeys.all });
            toast.success("Task created successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to create task");
        },
    });
}

export function useUpdateTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (updateData: { id: string, [key: string]: any }) => {
            const response = await fetch("/api/tasks", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TaskQueryKeys.all });
            toast.success("Task updated");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update task");
        },
    });
}

export function useAddTaskComment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ taskId, userId, message }: { taskId: string, userId: string, message: string }) => {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, message }),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TaskQueryKeys.all });
            toast.success("Comment added");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to add comment");
        },
    });
}
