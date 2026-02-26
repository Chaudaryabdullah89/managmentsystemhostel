import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { QueryClient, QueryKeys } from "../lib/queryclient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useRoom() {
    const { data, isLoading, isPending } = useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        queryKey: [...QueryKeys.Roomlist()],
        queryFn: async () => {
            const response = await fetch("/api/rooms");
            const data = await response.json();
            return data;
        }
    })
    return { data, isLoading, isPending }
}
export function useRoomById(id) {
    const { data, isLoading, isPending } = useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        queryKey: [...QueryKeys.Roombyid(id)],
        queryFn: async () => {
            const response = await fetch(`  /api/rooms/${id}`);
            const data = await response.json();
            return data;
        }
    })
    return { data, isLoading, isPending }
}

export function useRoomByHostelId(id) {
    const { data, isLoading, isPending } = useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        queryKey: [...QueryKeys.Roombyhostelid(id)],
        queryFn: async () => {
            const response = await fetch(`/api/rooms/roombyhostel?hostelId=${id}`);
            const data = await response.json();
            return data;
        }
    })
    return { data, isLoading, isPending }
}
export function useSingleRoomByHostelId(hostelId, roomid) {
    const { data, isLoading, isPending } = useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        queryKey: [...QueryKeys.singleRoombyHostelId(hostelId, roomid)],
        queryFn: async () => {
            const response = await fetch(`/api/rooms/singleroombyhostelId?hostelId=${hostelId}&roomid=${roomid}`);
            const data = await response.json();
            return data;
        }
    })
    return { data, isLoading, isPending }
}

export function useCreateMaintenance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload) => {
            const response = await fetch("/api/rooms/maintenance/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error("Failed to create maintenance record");
            return response.json();
        },
        onSuccess: () => {
            toast.success("Maintenance request submitted successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to submit request");
        }
    });
}

export function useCreateCleaningLog() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload) => {
            const response = await fetch("/api/rooms/cleaning/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error("Failed to create cleaning log");
            return response.json();
        },
        onSuccess: () => {
            toast.success("Cleaning log added successfully");
        },
    });
}

export function useCreateLaundryLog() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload) => {
            const response = await fetch("/api/rooms/laundry/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error("Failed to create laundry log");
            return response.json();
        },
        onSuccess: () => {
            toast.success("Laundry log recorded successfully");
        },
    });
}

export function useUpdateMaintenance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...payload }) => {
            const response = await fetch("/api/rooms/maintenance/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, ...payload }),
            });
            if (!response.ok) throw new Error("Failed to update maintenance record");
            return response.json();
        },
        onMutate: async (newRecord) => {
            await queryClient.cancelQueries({ queryKey: ["rooms"] });
            const previousData = queryClient.getQueryData(["rooms"]);
            queryClient.setQueryData(["rooms"], (old) => {
                if (!old || !Array.isArray(old)) return old;
                // Basic snapshot fallback
                return old.map(item => item.id === newRecord.id ? { ...item, ...newRecord } : item);
            });
            return { previousData };
        },
        onError: (err, newRecord, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(["rooms"], context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["rooms"] });
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: [QueryKeys.Rooms] });
            toast.success("Maintenance record synchronized");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update record");
        }
    });
}

export function useUpdateCleaningLog() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...payload }) => {
            const response = await fetch("/api/rooms/cleaning/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, ...payload }),
            });
            if (!response.ok) throw new Error("Failed to update cleaning log");
            return response.json();
        },
        onMutate: async (newRecord) => {
            await queryClient.cancelQueries({ queryKey: ["rooms"] });
            const previousData = queryClient.getQueryData(["rooms"]);
            queryClient.setQueryData(["rooms"], (old) => {
                if (!old || !Array.isArray(old)) return old;
                // Basic snapshot fallback
                return old.map(item => item.id === newRecord.id ? { ...item, ...newRecord } : item);
            });
            return { previousData };
        },
        onError: (err, newRecord, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(["rooms"], context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["rooms"] });
        },
        onSuccess: () => {
            toast.success("Cleaning protocol updated");
        },
    });
}

export function useUpdateLaundryLog() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...payload }) => {
            const response = await fetch("/api/rooms/laundry/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, ...payload }),
            });
            if (!response.ok) throw new Error("Failed to update laundry log");
            return response.json();
        },
        onMutate: async (newRecord) => {
            await queryClient.cancelQueries({ queryKey: ["rooms"] });
            const previousData = queryClient.getQueryData(["rooms"]);
            queryClient.setQueryData(["rooms"], (old) => {
                if (!old || !Array.isArray(old)) return old;
                // Basic snapshot fallback
                return old.map(item => item.id === newRecord.id ? { ...item, ...newRecord } : item);
            });
            return { previousData };
        },
        onError: (err, newRecord, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(["rooms"], context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["rooms"] });
        },
        onSuccess: () => {
            toast.success("Laundry log updated");
        },
    });
}