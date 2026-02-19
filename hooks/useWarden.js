import { useQuery } from "@tanstack/react-query";

export const useWardenStats = (userId) => {
    return useQuery({
        queryKey: ["warden", "stats", userId],
        queryFn: async () => {
            const response = await fetch(`/api/warden/stats?userId=${userId}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        enabled: !!userId,
    });
};

export const useWardenResidents = (userId) => {
    return useQuery({
        queryKey: ["warden", "residents", userId],
        queryFn: async () => {
            const response = await fetch(`/api/warden/residents?userId=${userId}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        enabled: !!userId,
    });
};

export const useWardenRooms = (userId) => {
    return useQuery({
        queryKey: ["warden", "rooms", userId],
        queryFn: async () => {
            const response = await fetch(`/api/warden/rooms?userId=${userId}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        enabled: !!userId,
    });
};

export const useWardenLogs = (userId, type) => {
    return useQuery({
        queryKey: ["warden", "logs", userId, type],
        queryFn: async () => {
            const response = await fetch(`/api/warden/logs?userId=${userId}&type=${type}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        enabled: !!userId && !!type,
    });
};

export const useWardenDueServices = (userId) => {
    return useQuery({
        queryKey: ["warden", "services", "due", userId],
        queryFn: async () => {
            const response = await fetch(`/api/warden/services/due?userId=${userId}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        enabled: !!userId,
    });
};
