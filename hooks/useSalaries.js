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
        onError: (error) => {
            toast.error(error.message || "Failed to create salary entry");
        },
    });
}

export function useAllSalaries(filters = {}) {
    return useQuery({
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
        onError: (error) => {
            toast.error(error.message || "Failed to generate payroll");
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
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: SalaryQueryKeys.all() });
            toast.success(`Salary for ${data.StaffProfile.User.name} updated`);
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update salary");
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SalaryQueryKeys.all() });
            toast.success("Salary record removed");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete salary");
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
            queryClient.invalidateQueries({ queryKey: SalaryQueryKeys.all() });
            toast.success("Appeal submitted for node verification");
        },
        onError: (error) => {
            toast.error(error.message || "Appeal submission failed");
        },
    });
}
