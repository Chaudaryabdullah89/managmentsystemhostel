import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookingQueryKeys } from "./useBooking";

export const PaymentQueryKeys = {
    all: () => ['payments'],
    stats: (hostelId) => ['payments', 'stats', hostelId],
    list: (filters) => ['payments', 'list', filters],
    byId: (id) => ['payments', 'detail', id],
};

export function useCreatePayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (paymentData) => {
            const response = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(paymentData),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.payment;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: PaymentQueryKeys.all() });
            if (variables.bookingId) {
                queryClient.invalidateQueries({ queryKey: BookingQueryKeys.byId(variables.bookingId) });
            }
            toast.success("Payment recorded successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to record payment");
        },
    });
}

export function useAllPayments(filters = {}) {
    return useQuery({
        queryKey: PaymentQueryKeys.list(filters),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.hostelId) params.append('hostelId', filters.hostelId);
            if (filters.search) params.append('search', filters.search);
            if (filters.userId) params.append('userId', filters.userId);
            if (filters.page) params.append('page', filters.page);
            if (filters.limit) params.append('limit', filters.limit);

            const response = await fetch(`/api/payments?${params.toString()}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data;
        }
    });
}

export function useFinancialStats(hostelId) {
    return useQuery({
        queryKey: PaymentQueryKeys.stats(hostelId),
        queryFn: async () => {
            const url = hostelId ? `/api/payments?type=stats&hostelId=${hostelId}` : "/api/payments?type=stats";
            const response = await fetch(url);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.stats;
        }
    });
}

export function useReconcilePayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ bookingId, amount, userId, method, notes }) => {
            const response = await fetch("/api/payments/reconcile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId, amount, userId, method, notes }),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: PaymentQueryKeys.all() });
            if (variables.bookingId) {
                queryClient.invalidateQueries({ queryKey: BookingQueryKeys.byId(variables.bookingId) });
            }
            toast.success("Bulk reconciliation completed successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Reconciliation cycle failed");
        },
    });
}
export function usePaymentById(id) {
    return useQuery({
        queryKey: PaymentQueryKeys.byId(id),
        queryFn: async () => {
            if (!id) return null;
            const response = await fetch(`/api/payments/${id}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.payment;
        },
        enabled: !!id
    });
}

export function useUpdatePayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status, notes, amount, type, method }) => {
            const response = await fetch(`/api/payments/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, notes, amount, type, method }),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.payment;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: PaymentQueryKeys.all() });
            queryClient.invalidateQueries({ queryKey: PaymentQueryKeys.byId(data.id) });
            const bookingQuery = queryClient.getQueriesData({ queryKey: BookingQueryKeys.all() });
            if (bookingQuery.length > 0) {
                queryClient.invalidateQueries({ queryKey: BookingQueryKeys.all() });
            }
            toast.success(`Payment ${data.id.slice(-6).toUpperCase()} updated successfully`);
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update payment");
        },
    });
}

export function useDeletePayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const response = await fetch(`/api/payments/${id}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: PaymentQueryKeys.all() });
            const bookingQuery = queryClient.getQueriesData({ queryKey: BookingQueryKeys.all() });
            if (bookingQuery.length > 0) {
                queryClient.invalidateQueries({ queryKey: BookingQueryKeys.all() });
            }
            toast.success("Payment deleted successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete payment");
        },
    });
}
