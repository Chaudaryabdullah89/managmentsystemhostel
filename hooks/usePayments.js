"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

/**
 * Fetch all payments for a given resident/user.
 * Expected backend endpoint: GET /api/payments?userId=XYZ
 */
export function usePayments(userId) {
    return useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        queryKey: ['payments', userId],
        queryFn: async () => {
            if (!userId) return []
            const res = await fetch(`/api/payments?userId=${userId}`)
            const data = await res.json()
            if (!data.success) throw new Error(data.error)
            return data.payments ?? []
        },
        enabled: !!userId,
    })
}

export function useCreatePayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (paymentData) => {
            const response = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(paymentData),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.payment;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            toast.success("Payment notification submitted successfully");
        },
    });
}
