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
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
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
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
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
    });
}
export function usePaymentById(id) {
    return useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
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
        mutationFn: async ({ id, status, notes, amount, type, method, receiptUrl }) => {
            const response = await fetch(`/api/payments/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, notes, amount, type, method, receiptUrl }),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.payment;
        },
        onMutate: async (newRecord) => {
            await queryClient.cancelQueries({ queryKey: ["payments"] });
            const previousData = queryClient.getQueryData(["payments"]);
            queryClient.setQueryData(["payments"], (old) => {
                if (!old || !Array.isArray(old)) return old;
                // Basic snapshot fallback
                return old.map(item => item.id === newRecord.id ? { ...item, ...newRecord } : item);
            });
            return { previousData };
        },
        onError: (err, newRecord, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(["payments"], context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["payments"] });
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
        onMutate: async (newRecord) => {
            await queryClient.cancelQueries({ queryKey: ["payments"] });
            const previousData = queryClient.getQueryData(["payments"]);
            queryClient.setQueryData(["payments"], (old) => {
                if (!old || !Array.isArray(old)) return old;
                // Basic snapshot fallback
                return old.map(item => item.id === newRecord.id ? { ...item, ...newRecord } : item);
            });
            return { previousData };
        },
        onError: (err, newRecord, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(["payments"], context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["payments"] });
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: PaymentQueryKeys.all() });
            const bookingQuery = queryClient.getQueriesData({ queryKey: BookingQueryKeys.all() });
            if (bookingQuery.length > 0) {
                queryClient.invalidateQueries({ queryKey: BookingQueryKeys.all() });
            }
            toast.success("Payment deleted successfully");
        },
    });
}

export function useBulkApprovePayments() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (paymentIds) => {
            const response = await fetch('/api/payments/bulk-approve', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentIds }),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: PaymentQueryKeys.all() });
            toast.success(data.message || "Bulk approval successful");
        },
        onError: (err) => {
            toast.error(err.message || "Failed to process bulk approvals");
        }
    });
}
export function useInitializeRent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await fetch('/api/payments/initialize-dues', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: PaymentQueryKeys.all() });
            toast.success(data.message || "Rent successfully initialized for all residents.");
        },
        onError: (err) => {
            toast.error(err.message || "Failed to initialize rent records.");
        }
    });
}
