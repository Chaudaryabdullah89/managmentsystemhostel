import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const TaskQueryKeys = {
    all: ["tasks"],
    byUser: (userId: string) => ["tasks", "user", userId],
    byHostel: (hostelId: string) => ["tasks", "hostel", hostelId],
};

export function useTasks(filters: any = {}) {
    return useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
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
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
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
            toast.success("Task created successfully");
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
        onMutate: async (newRecord) => {
            await queryClient.cancelQueries({ queryKey: TaskQueryKeys.all });
            const previousData = queryClient.getQueryData(TaskQueryKeys.all);
            queryClient.setQueryData(TaskQueryKeys.all, (old: any) => {
                if (!old || !Array.isArray(old)) return old;
                return old.map((item: any) => item.id === newRecord.id ? { ...item, ...newRecord } : item);
            });
            return { previousData };
        },
        onError: (err: any, newRecord: any, context: any) => {
            if (context?.previousData) {
                queryClient.setQueryData(TaskQueryKeys.all, context.previousData);
            }
            toast.error(err.message || "Failed to update task");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: TaskQueryKeys.all });
        },
        onSuccess: () => {
            toast.success("Task updated");
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
            toast.success("Comment added");
        },
    });
}
