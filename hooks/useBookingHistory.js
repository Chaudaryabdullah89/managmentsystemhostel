"use client"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

/**
 * Fetch booking history for a resident/user.
 * Expected backend endpoint: GET /api/bookings/history?userId=XYZ
 */
export function useBookingHistory(userId) {
    return useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        queryKey: ['bookingHistory', userId],
        queryFn: async () => {
            if (!userId) return []
            const res = await fetch(`/api/bookings/history?userId=${userId}`)
            const data = await res.json()
            if (!data.success) throw new Error(data.error)
            return data.bookings ?? []
        },
        enabled: !!userId,
        onError: (err) => toast.error(err.message || 'Failed to load booking history')
    })
}
