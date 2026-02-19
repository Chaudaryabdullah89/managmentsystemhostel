import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const ExpenseQueryKeys = {
    all: () => ['expenses'],
    list: (filters) => ['expenses', 'list', filters],
    stats: (hostelId) => ['expenses', 'stats', hostelId],
};

export function useExpenses(filters = {}) {
    return useQuery({
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
            queryClient.invalidateQueries({ queryKey: ExpenseQueryKeys.all() });
            toast.success("Expense record successfully archived");
        },
        onError: (error) => {
            toast.error(error.message || "Archive protocol failed");
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ExpenseQueryKeys.all() });
            toast.success("Authorization state updated");
        },
        onError: (error) => {
            toast.error(error.message || "Status authorization failed");
        },
    });
}
