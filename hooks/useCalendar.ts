import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalendarBooking = {
  id: string;
  uid: string | null;
  checkIn: string;
  checkOut: string | null;
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "REJECTED" | "COMPLETED";
  totalAmount: number;
  monthlyRent: number | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    cnic?: string;
  };
  latestPayment: { id: string; status: string; amount: number; dueDate: string | null } | null;
};

export type CalendarRoom = {
  id: string;
  roomNumber: string;
  floor: number;
  type: "SINGLE" | "DOUBLE" | "TRIPLE" | "DORMITORY";
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "CLEANING";
  monthlyRent: number | null;
  bookings: CalendarBooking[];
};

export type CalendarData = {
  data: CalendarRoom[];
  meta: {
    hostelId: string;
    startDate: string;
    endDate: string;
  };
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCalendarData({
  hostelId,
  startDate,
  endDate,
  enabled = true,
}: {
  hostelId?: string;
  startDate: Date;
  endDate: Date;
  enabled?: boolean;
}) {
  const startStr = format(startDate, "yyyy-MM-dd");
  const endStr = format(endDate, "yyyy-MM-dd");

  return useQuery<CalendarData>({
    queryKey: ["calendar", hostelId, startStr, endStr],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate: startStr, endDate: endStr });
      if (hostelId) params.set("hostelId", hostelId);

      const res = await fetch(`/api/bookings/calendar?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch calendar data");
      }
      return res.json();
    },
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 30_000, // 30s — calendar data changes infrequently
    refetchOnWindowFocus: false,
  });
}

// ─── Quick-action mutation (update booking status) ────────────────────────────

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: string;
    }) => {
      const res = await fetch(`/api/bookings/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookingId, status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update booking");
      }
      return res.json();
    },
    onSuccess: (_, { status }) => {
      toast.success(`Booking ${status.toLowerCase().replace("_", " ")} successfully`);
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update booking");
    },
  });
}
