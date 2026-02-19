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
    });
}

export function useComplaintById(id: string) {
    return useQuery({
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
            queryClient.invalidateQueries({ queryKey: ComplaintQueryKeys.all });
            toast.success("Grievance logged successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to log grievance");
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ComplaintQueryKeys.all });
            toast.success("Complaint status updated");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update complaint");
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
            queryClient.invalidateQueries({ queryKey: ComplaintQueryKeys.all });
            toast.success("Message sent");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to send message");
        },
    });
}
