"use client"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

/**
 * Fetch maintenance records with optional filters.
 * Endpoint: GET /api/maintenances?status=&start=&end=
 */
export function useMaintenances({ status = "", start = "", end = "" } = {}) {
    const queryKey = ['maintenances', status, start, end]
    return useQuery({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams()
            if (status) params.append('status', status)
            if (start) params.append('start', start)
            if (end) params.append('end', end)
            const res = await fetch(`/api/maintenances?${params.toString()}`)
            const data = await res.json()
            if (!data.success) throw new Error(data.error)
            return data.maintenances ?? []
        },
        keepPreviousData: true,
        onError: (err) => toast.error(err.message || 'Failed to load maintenances')
    })
}
