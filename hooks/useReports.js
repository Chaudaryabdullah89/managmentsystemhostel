import { useQuery } from "@tanstack/react-query";

export const useReports = (period = 'month', hostelId = null) => {
    return useQuery({
        queryKey: ['reports', period, hostelId],
        queryFn: async () => {
            const url = hostelId
                ? `/api/reports?period=${period}&hostelId=${hostelId}`
                : `/api/reports?period=${period}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Failed to fetch reports");
            }
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });
};
