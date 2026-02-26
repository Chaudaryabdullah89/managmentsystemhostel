import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const ExpenseQueryKeys = {
    all: () => ['expenses'],
    list: (filters) => ['expenses', 'list', filters],
    stats: (hostelId) => ['expenses', 'stats', hostelId],
};

export function useExpenses(filters = {}) {
    return useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        queryKey: ExpenseQueryKeys.list(filters),
        queryFn: async () => {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
            const response = await fetch(`/api/expenses?${params.toString()}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        }
    });
}

export function useExpenseStats(hostelId = 'all') {
    return useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        queryKey: ExpenseQueryKeys.stats(hostelId),
        queryFn: async () => {
            const response = await fetch(`/api/expenses?stats=true&hostelId=${hostelId}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        }
    });
}

export function useCreateExpense() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (expenseData) => {
            const response = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(expenseData),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data;
        },
        onSuccess: () => {
            toast.success("Expense record successfully archived");
        },
    });
}

export function useUpdateExpenseStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status, approvedById, rejectedById }) => {
            const response = await fetch("/api/expenses", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status, approvedById, rejectedById }),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data;
        },
        onMutate: async (newRecord) => {
            await queryClient.cancelQueries({ queryKey: ["expenses"] });
            const previousData = queryClient.getQueryData(["expenses"]);
            queryClient.setQueryData(["expenses"], (old) => {
                if (!old || !Array.isArray(old)) return old;
                // Basic snapshot fallback
                return old.map(item => item.id === newRecord.id ? { ...item, ...newRecord } : item);
            });
            return { previousData };
        },
        onError: (err, newRecord, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(["expenses"], context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
        },
        onSuccess: () => {
            toast.success("Authorization state updated");
        },
    });
}
