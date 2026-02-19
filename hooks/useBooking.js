import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const BookingQueryKeys = {
    all: () => ["bookings"],
    byId: (id) => ["bookings", id],
};

export function useBookings(options = {}) {
    const { userId, hostelId } = options;
    return useQuery({
        queryKey: ["bookings", { userId, hostelId }],
        queryFn: async () => {
            let url = "/api/bookings";
            const params = new URLSearchParams();
            if (userId) params.append("userId", userId);
            if (hostelId) params.append("hostelId", hostelId);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            if (!data.success) throw new Error(data.error || "Failed to fetch bookings");
            return data.data;
        },
    });
}

export function useCreateBooking() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (bookingData) => {
            const response = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bookingData),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BookingQueryKeys.all() });
            toast.success("Booking confirmed successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create booking");
        },
    });
}

export function useUpdateBookingStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }) => {
            const response = await fetch(`/api/bookings/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status }),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BookingQueryKeys.all() });
            toast.success("Booking status updated");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update status");
        },
    });
}

export function useBookingById(id) {
    return useQuery({
        queryKey: BookingQueryKeys.byId(id),
        queryFn: async () => {
            const response = await fetch(`/api/bookings/${id}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.booking;
        },
        enabled: !!id,
    });
}

export function useUpdateBooking() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }) => {
            const response = await fetch(`/api/bookings/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            return result.booking;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: BookingQueryKeys.all() });
            queryClient.invalidateQueries({ queryKey: BookingQueryKeys.byId(variables.id) });
            toast.success("Booking updated successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update booking");
        },
    });
}
