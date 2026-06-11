import { useQuery } from "@tanstack/react-query";

export function useGuestDashboard() {
    return useQuery({
        queryKey: ["guestDashboard"],
        queryFn: async () => {
            const response = await fetch("/api/guest/dashboard");
            const data = await response.json();
            if (!data.success) throw new Error(data.error || "Failed to fetch dashboard data");
            return {
                bookings: data.bookings || [],
                payments: data.payments || [],
                complaints: data.complaints || [],
                notices: data.notices || []
            };
        },
        gcTime: 5 * 60 * 1000,
        staleTime: 30 * 1000, // 30 seconds stale time
    });
}
