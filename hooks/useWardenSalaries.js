import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const WardenSalaryQueryKeys = {
    all: (filters) => ['warden-salaries', filters],
    byWardenId: (wardenId) => ['warden-salaries', 'detail', wardenId],
};

export function useAllWardenSalaries(filters = {}) {
    return useQuery({
        queryKey: WardenSalaryQueryKeys.all(filters),
        queryFn: async () => {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== 'All') params.append(key, value);
            });

            const response = await fetch(`/api/warden-salary?${params.toString()}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.payments;
        }
    });
}

export function useWardenPayments(wardenId) {
    return useQuery({
        queryKey: WardenSalaryQueryKeys.byWardenId(wardenId),
        queryFn: async () => {
            if (!wardenId) return null;
            const response = await fetch(`/api/warden-salary?wardenId=${wardenId}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.payments;
        },
        enabled: !!wardenId
    });
}

export function usePayWarden() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (paymentData) => {
            const response = await fetch("/api/warden-salary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(paymentData),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['warden-salaries'] });
            toast.success(data.message || "Payment processed successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to process payment");
        },
    });
}

export function useGenerateWardenPayroll() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ month, hostelId }) => {
            const response = await fetch("/api/warden-salary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month, hostelId }),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['warden-salaries'] });
            toast.success(data.message || "Warden Payroll generated successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to generate payroll");
        },
    });
}

export function useDeleteWardenSalary() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const response = await fetch(`/api/warden-salary?id=${id}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warden-salaries'] });
            toast.success("Salary record removed");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete record");
        },
    });
}

export function useUpdateWardenSalary() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...data }) => {
            const response = await fetch(`/api/warden-salary`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, ...data }),
            });
            const resData = await response.json();
            if (!resData.success) throw new Error(resData.error);
            return resData;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warden-salaries'] });
            toast.success("Salary updated successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update salary");
        },
    });
}
