import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const UserQueryKeys = {
    all: () => ['users'],
    list: (filters) => ['users', 'list', filters],
    byId: (id) => ['users', 'detail', id],
};

export function useUserDetails(id) {
    return useQuery({

        gcTime: 10 * 60 * 1000,
        queryKey: UserQueryKeys.byId(id),
        queryFn: async () => {
            if (!id) return null;
            const response = await fetch(`/api/users/${id}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.user;
        },
        enabled: !!id
    });
}

export function useAllUsers(filters = {}) {
    return useQuery({

        gcTime: 10 * 60 * 1000,
        queryKey: UserQueryKeys.list(filters),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.role) params.append('role', filters.role);
            if (filters.query) params.append('query', filters.query);
            if (filters.hostelId) params.append('hostelId', filters.hostelId);

            const response = await fetch(`/api/users?${params.toString()}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        }
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userData) => {
            const response = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.user;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: UserQueryKeys.all() });
            toast.success(`User ${data.name} initialized successfully`);
        },
    });
}
export function useUpdateUser(id) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (updateData) => {
            const response = await fetch(`/api/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.user;
        },
        onMutate: async (newRecord) => {
            await queryClient.cancelQueries({ queryKey: ["users"] });
            const previousData = queryClient.getQueryData(["users"]);
            queryClient.setQueryData(["users"], (old) => {
                if (!old || !Array.isArray(old)) return old;
                return old.map(item => item.id === id ? { ...item, ...newRecord } : item);
            });
            return { previousData };
        },
        onError: (err, newRecord, context) => {
            // Rollback optimistic update on failure
            if (context?.previousData) {
                queryClient.setQueryData(["users"], context.previousData);
            }
            toast.error(err.message || "Failed to update user");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
        onSuccess: () => {
            toast.success("Identity synchronized successfully");
        },
    });
}

export function useUpdateAnyUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }) => {
            const response = await fetch(`/api/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const resData = await response.json();
            if (!resData.success) throw new Error(resData.error);
            return resData.user;
        },
        onMutate: async ({ id: mutatedId, data: newData }) => {
            await queryClient.cancelQueries({ queryKey: ["users"] });
            const previousData = queryClient.getQueryData(["users"]);
            queryClient.setQueryData(["users"], (old) => {
                if (!old || !Array.isArray(old)) return old;
                // Correctly destructure {id, data} argument shape
                return old.map(item => item.id === mutatedId ? { ...item, ...newData } : item);
            });
            return { previousData };
        },
        onError: (err, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(["users"], context.previousData);
            }
            toast.error(err.message || "Failed to update user");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
        onSuccess: () => {
            toast.success("User record updated");
        },
    });
}

export function useResetPassword() {
    return useMutation({
        mutationFn: async ({ id, newPassword }) => {
            const response = await fetch(`/api/auth/changepassword/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword, isReset: true }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to reset password");
            return data;
        },
        onSuccess: () => {
            toast.success("Access key reset successfully");
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const response = await fetch(`/api/users/${id}`, {
                method: "DELETE"
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data;
        },
        onMutate: async (deletedId) => {
            await queryClient.cancelQueries({ queryKey: ["users"] });
            const previousData = queryClient.getQueryData(["users"]);
            // Correctly filter out the deleted user by their string id
            queryClient.setQueryData(["users"], (old) => {
                if (!old || !Array.isArray(old)) return old;
                return old.filter(item => item.id !== deletedId);
            });
            return { previousData };
        },
        onError: (err, deletedId, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(["users"], context.previousData);
            }
            toast.error(err.message || "Failed to delete user");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
        onSuccess: () => {
            toast.success("User node purged from registry");
        },
    });
}
