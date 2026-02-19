import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { QueryClient, QueryKeys } from "../lib/queryclient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useRoom() {
    const { data, isLoading, isPending } = useQuery({
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
            queryClient.invalidateQueries({ queryKey: QueryKeys.Roomlist() });
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
            queryClient.invalidateQueries({ queryKey: QueryKeys.Roomlist() });
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
            queryClient.invalidateQueries({ queryKey: QueryKeys.Roomlist() });
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QueryKeys.Rooms] });
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QueryKeys.Rooms] });
            toast.success("Laundry log updated");
        },
    });
}