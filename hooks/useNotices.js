import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const NoticeQueryKeys = {
    all: ["notices"],
    byHostel: (hostelId) => ["notices", "hostel", hostelId],
};

export function useNotices(filters = {}) {
    return useQuery({
        queryKey: [...NoticeQueryKeys.all, filters],
        queryFn: async () => {
            const params = new URLSearchParams(filters);
            const response = await fetch(`/api/notices?${params.toString()}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
    });
}

export function useCreateNotice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (noticeData) => {
            const response = await fetch("/api/notices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(noticeData),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NoticeQueryKeys.all });
            toast.success("Notice published successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to publish notice");
        },
    });
}

export function useUpdateNotice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (updateData) => {
            const response = await fetch("/api/notices", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NoticeQueryKeys.all });
            toast.success("Notice updated");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update notice");
        },
    });
}

export function useDeleteNotice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const response = await fetch(`/api/notices?id=${id}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NoticeQueryKeys.all });
            toast.success("Notice removed");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to remove notice");
        },
    });
}
