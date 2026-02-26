import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const SalaryQueryKeys = {
    all: () => ['salaries'],
    list: (filters) => ['salaries', 'list', filters],
    byId: (id) => ['salaries', 'detail', id],
    staff: (hostelId) => ['staff', 'list', { hostelId }],
    staffHistory: (staffId) => ['staff', 'salaryHistory', staffId],
};

export function useStaffList(hostelId) {
    return useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        queryKey: SalaryQueryKeys.staff(hostelId),
        queryFn: async () => {
            const url = hostelId ? `/api/staff?hostelId=${hostelId}` : "/api/staff";
            const response = await fetch(url);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        }
    });
}

export function useStaffSalaryHistory(staffId) {
    return useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        queryKey: SalaryQueryKeys.staffHistory(staffId),
        queryFn: async () => {
            if (!staffId) return null;
            const response = await fetch(`/api/salaries/staff/${staffId}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        enabled: !!staffId
    });
}

export function useCreateSalary() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (salaryData) => {
            const response = await fetch("/api/salaries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(salaryData),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: SalaryQueryKeys.all() });
            toast.success(data.message || "Salary node initialized");
        },
    });
}

export function useAllSalaries(filters = {}) {
    return useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        queryKey: SalaryQueryKeys.list(filters),
        queryFn: async () => {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await fetch(`/api/salaries?${params.toString()}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.salaries;
        }
    });
}

export function useGeneratePayroll() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ month, hostelId }) => {
            const response = await fetch("/api/salaries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month, hostelId }),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: SalaryQueryKeys.all() });
            toast.success(data.message || "Payroll generated successfully");
        },
    });
}

export function useUpdateSalary() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updateData }) => {
            const response = await fetch(`/api/salaries/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.salary;
        },
        onMutate: async (newRecord) => {
            await queryClient.cancelQueries({ queryKey: ["salaries"] });
            const previousData = queryClient.getQueryData(["salaries"]);
            queryClient.setQueryData(["salaries"], (old) => {
                if (!old || !Array.isArray(old)) return old;
                // Basic snapshot fallback
                return old.map(item => item.id === newRecord.id ? { ...item, ...newRecord } : item);
            });
            return { previousData };
        },
        onError: (err, newRecord, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(["salaries"], context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["salaries"] });
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: SalaryQueryKeys.all() });
            toast.success(`Salary for ${data.StaffProfile.User.name} updated`);
        },
    });
}

export function useDeleteSalary() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const response = await fetch(`/api/salaries/${id}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data;
        },
        onMutate: async (newRecord) => {
            await queryClient.cancelQueries({ queryKey: ["salaries"] });
            const previousData = queryClient.getQueryData(["salaries"]);
            queryClient.setQueryData(["salaries"], (old) => {
                if (!old || !Array.isArray(old)) return old;
                // Basic snapshot fallback
                return old.map(item => item.id === newRecord.id ? { ...item, ...newRecord } : item);
            });
            return { previousData };
        },
        onError: (err, newRecord, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(["salaries"], context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["salaries"] });
        },
        onSuccess: () => {
            toast.success("Salary record removed");
        },
    });
}

export function useSubmitAppeal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, appealText }) => {
            const response = await fetch(`/api/salaries/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appealText, appealStatus: 'PENDING' }),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.salary;
        },
        onSuccess: () => {
            toast.success("Appeal submitted for node verification");
        },
    });
}
