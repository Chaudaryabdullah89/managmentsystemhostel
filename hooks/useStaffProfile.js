import { useQuery } from "@tanstack/react-query";

export function useStaffProfile(userId) {
    return useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        queryKey: ['staffProfile', userId],
        queryFn: async () => {
            if (!userId) return null;
            const response = await fetch(`/api/staff/profile?userId=${userId}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        enabled: !!userId
    });
}
