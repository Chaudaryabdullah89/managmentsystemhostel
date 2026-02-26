import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const BookingQueryKeys = {
    all: () => ["bookings"],
    byId: (id) => ["bookings", id],
};

export function useBookings(options = {}) {
    const { userId, hostelId } = options;
    return useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        queryKey: ["bookings", { userId, hostelId }],
        queryFn: async () => {
            let url = "/api/bookings";
            const params = new URLSearchParams();
            if (userId && userId !== 'undefined') params.append("userId", userId);
            if (hostelId && hostelId !== 'undefined') params.append("hostelId", hostelId);

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
            toast.success("Booking confirmed successfully");
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
        onMutate: async (newBookingStatus) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["bookings"] });

            // Snapshot the previous value
            const previousBookings = queryClient.getQueriesData({ queryKey: ["bookings"] });

            // Optimistically update
            queryClient.setQueriesData({ queryKey: ["bookings"] }, (old) => {
                if (!old || !Array.isArray(old)) return old;
                return old.map((booking) =>
                    booking.id === newBookingStatus.id ? { ...booking, status: newBookingStatus.status } : booking
                );
            });

            return { previousBookings };
        },
        onError: (error, newBookingStatus, context) => {
            if (context?.previousBookings) {
                // Rollback if the update fails
                queryClient.setQueriesData({ queryKey: ["bookings"] }, context.previousBookings);
            }
            toast.error(error.message || "Failed to update status");
        },
        onSettled: () => {
            // Always sync back to reality on success or error
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
        },
        onSuccess: () => {
            toast.success("Booking status updated");
        },
    });
}

export function useBookingById(id) {
    return useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
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
        onMutate: async (newRecord) => {
            await queryClient.cancelQueries({ queryKey: ["bookings"] });
            const previousData = queryClient.getQueryData(["bookings"]);
            queryClient.setQueryData(["bookings"], (old) => {
                if (!old || !Array.isArray(old)) return old;
                // Basic snapshot fallback
                return old.map(item => item.id === newRecord.id ? { ...item, ...newRecord } : item);
            });
            return { previousData };
        },
        onError: (err, newRecord, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(["bookings"], context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
        },

        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: BookingQueryKeys.all() });
            queryClient.invalidateQueries({ queryKey: BookingQueryKeys.byId(variables.id) });
            toast.success("Booking updated successfully");
        },
    });
}
