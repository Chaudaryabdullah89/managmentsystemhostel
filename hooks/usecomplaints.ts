import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const ComplaintQueryKeys = {
    all: ["complaints"],
    byUser: (userId: string) => ["complaints", "user", userId],
    byHostel: (hostelId: string) => ["complaints", "hostel", hostelId],
};

export function useComplaints(filters: any = {}) {
    return useQuery({
        queryKey: [...ComplaintQueryKeys.all, filters],
        queryFn: async () => {
            // Remove undefined keys to avoid "undefined" string in query params
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== undefined && v !== null && v !== '')
            );
            const params = new URLSearchParams(cleanFilters as any);
            const response = await fetch(`/api/complaints?${params.toString()}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
}

export function useComplaintById(id: string) {
    return useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        queryKey: ["complaints", id],
        queryFn: async () => {
            const response = await fetch(`/api/complaints/${id}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        enabled: !!id
    });
}

export function useCreateComplaint() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (complaintData: any) => {
            const response = await fetch("/api/complaints", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(complaintData),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        onSuccess: () => {
            toast.success("Grievance logged successfully");
        },
    });
}

export function useUpdateComplaint() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status, resolutionNotes, assignedToId }: { id: string, status?: string, resolutionNotes?: string, assignedToId?: string }) => {
            const response = await fetch("/api/complaints", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status, resolutionNotes, assignedToId }),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        onMutate: async (newComplaintObj) => {
            // Cancel any outgoing refetches to prevent them overwriting our optimistic update
            await queryClient.cancelQueries({ queryKey: ComplaintQueryKeys.all });

            // Snapshot the previous value
            const previousComplaints = queryClient.getQueryData(ComplaintQueryKeys.all);

            // Optimistically update to the new value by mapping over cache or returning it if not array. We must gracefully fall back.
            queryClient.setQueriesData({ queryKey: ComplaintQueryKeys.all }, (oldData: any) => {
                if (!oldData || !Array.isArray(oldData)) return oldData;
                return oldData.map((c: any) =>
                    c.id === newComplaintObj.id ? { ...c, ...newComplaintObj } : c
                );
            });

            // Return a context object with the snapshotted value
            return { previousComplaints };
        },
        onError: (error: any, newComplaintObj, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousComplaints) {
                queryClient.setQueriesData({ queryKey: ComplaintQueryKeys.all }, context.previousComplaints);
            }
            toast.error(error.message || "Failed to update complaint");
        },
        onSettled: () => {
            // Always refetch after error or success to ensure strict synchronization
            queryClient.invalidateQueries({ queryKey: ComplaintQueryKeys.all });
        },
        onSuccess: () => {
            toast.success("Complaint status updated");
        },
    });
}

export function useAddComplaintComment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ complaintId, userId, message }: { complaintId: string, userId: string, message: string }) => {
            const response = await fetch("/api/complaints/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ complaintId, userId, message }),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        onSuccess: () => {
            toast.success("Message sent");
        },
    });
}
