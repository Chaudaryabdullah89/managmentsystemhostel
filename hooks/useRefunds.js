import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const RefundQueryKeys = {
    all: () => ['refunds'],
    list: (filters) => ['refunds', 'list', filters],
};

export function useRefundRequests(filters = {}) {
    return useQuery({
        queryKey: RefundQueryKeys.list(filters),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.userId) params.append('userId', filters.userId);
            if (filters.paymentId) params.append('paymentId', filters.paymentId);

            const response = await fetch(`/api/payments/refund/list?${params.toString()}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.refundRequests;
        }
    });
}

export function useUpdateRefundStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status, notes }) => {
            const response = await fetch(`/api/payments/refund/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, notes }),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.refundRequest;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: RefundQueryKeys.all() });
            toast.success("Refund status updated");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update refund");
        }
    });
}
