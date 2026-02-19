"use client"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

/**
 * Fetch records related to a warden (assigned complaints, maintenance tasks, hostel assignments).
 * Expected backend endpoint: GET /api/wardens/records?wardenId=XYZ
 */
export function useWardenRecords(wardenId) {
    return useQuery({
        queryKey: ['wardenRecords', wardenId],
        queryFn: async () => {
            if (!wardenId) return { complaints: [], maintenance: [], hostels: [] }
            const res = await fetch(`/api/wardens/records?wardenId=${wardenId}`)
            const data = await res.json()
            if (!data.success) throw new Error(data.error)
            return {
                complaints: data.complaints ?? [],
                maintenance: data.maintenance ?? [],
                hostels: data.hostels ?? []
            }
        },
        enabled: !!wardenId,
        onError: (err) => toast.error(err.message || 'Failed to load warden records')
    })
}
