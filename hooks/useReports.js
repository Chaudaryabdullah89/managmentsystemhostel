import { useQuery } from "@tanstack/react-query";

export const useReports = (period = 'month', hostelId = null, startDate = null, endDate = null) => {
    return useQuery({
        queryKey: ['reports', period, hostelId, startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (period) params.append('period', period);
            if (hostelId) params.append('hostelId', hostelId);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await fetch(`/api/reports?${params.toString()}`);
            if (!response.ok) {
                throw new Error("Failed to fetch reports");
            }
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },

    });
};
