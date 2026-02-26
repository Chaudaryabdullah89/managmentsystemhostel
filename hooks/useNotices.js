import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const NoticeQueryKeys = {
    all: ["notices"],
    byHostel: (hostelId) => ["notices", "hostel", hostelId],
};

export function useNotices(filters = {}) {
    return useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
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
            toast.success("Notice published successfully");
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
        onMutate: async (newRecord) => {
            await queryClient.cancelQueries({ queryKey: ["notices"] });
            const previousData = queryClient.getQueryData(["notices"]);
            queryClient.setQueryData(["notices"], (old) => {
                if (!old || !Array.isArray(old)) return old;
                // Basic snapshot fallback
                return old.map(item => item.id === newRecord.id ? { ...item, ...newRecord } : item);
            });
            return { previousData };
        },
        onError: (err, newRecord, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(["notices"], context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["notices"] });
        },
        onSuccess: () => {
            toast.success("Notice updated");
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
        onMutate: async (newRecord) => {
            await queryClient.cancelQueries({ queryKey: ["notices"] });
            const previousData = queryClient.getQueryData(["notices"]);
            queryClient.setQueryData(["notices"], (old) => {
                if (!old || !Array.isArray(old)) return old;
                // Basic snapshot fallback
                return old.map(item => item.id === newRecord.id ? { ...item, ...newRecord } : item);
            });
            return { previousData };
        },
        onError: (err, newRecord, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(["notices"], context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["notices"] });
        },
        onSuccess: () => {
            toast.success("Notice removed");
        },
    });
}
