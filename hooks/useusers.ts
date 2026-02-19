
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { QueryClient, QueryKeys } from "../lib/queryclient";
import { toast } from "sonner";
import { Filter } from "lucide-react";

export const useUsers = () => {
    const queryClient = useQueryClient();
    const { data, isLoading, error } = useQuery({
        queryKey: [...QueryKeys.userlist()],
        queryFn: async () => {
            const response = await fetch("http://localhost:3000/api/users");
            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }
            const data = await response.json();
            return data;
        },
        gcTime: 30 * 60 * 1000,
        staleTime: 60 * 1000,

    });
    return { data, isLoading, error };
};

export const useUserById = (id: string) => {
    const { data, isLoading, error } = useQuery({
        queryKey: QueryKeys.userbyid(id),
        queryFn: async () => {
            if (!id) return null;
            const response = await fetch(`/api/auth/user/${id}`);
            console.log(response, "this is response from query by id")
            if (!response.ok) {
                // toast("Failed to fetch user");
                return null;
            }
            return await response.json();
        },
        enabled: !!id,
        gcTime: 30 * 60 * 1000,
        staleTime: 60 * 1000,
    });
    return { data, isLoading, error };

};

export const useUserUpdate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            const response = await fetch(`/api/users/profile/${id}/update`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                toast("Failed to update user");
            }
            toast("User updated successfully");
            return await response.json();
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: QueryKeys.userbyid(variables.id) });
        },
        onError: (error) => {
            toast("Failed to update user");
        },
    });
};

export const useSessions = () => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["sessions"],
        queryFn: async () => {
            const response = await fetch("/api/user/sessions");
            if (!response.ok) {
                return { sessions: [] };
            }
            return await response.json();
        },
        gcTime: 30 * 60 * 1000,
        staleTime: 60 * 1000,
    });
    return { data, isLoading, error, refetch };
};

export const useTerminateSessions = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (sessionId: string) => {
            const response = await fetch(`/api/user/sessions?sessionId=${sessionId}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to terminate session");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessions"] });
            toast.success("Session terminated");
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to terminate session");
        },
    });
};

export const useTerminateAllSessions = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await fetch(`/api/user/sessions`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to terminate all sessions");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessions"] });
            toast.success("All sessions terminated");
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to terminate sessions");
        },
    });
};
export const useuserbyrole = (role: string) => {
    const { data, isLoading, error } = useQuery({
        queryKey: QueryKeys.userbyrole(role),
        queryFn: async () => {
            const response = await fetch(`/api/users/warden`);
            if (!response.ok) {
                return { users: [] };
            }
            return await response.json();
        },
        gcTime: 30 * 60 * 1000,
        staleTime: 60 * 1000,
    });
    return { data, isLoading, error };
}

export const useUserDetailedProfile = (id: string) => {
    const { data, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: QueryKeys.userDetailedProfile(id),
        queryFn: async () => {
            if (!id) return null;
            const response = await fetch(`/api/auth/user/${id}/details`);
            if (!response.ok) {
                throw new Error("Failed to fetch detailed profile");
            }
            return await response.json();
        },
        enabled: !!id,
    });
    return { data, isLoading, error, refetch, isFetching };
};
