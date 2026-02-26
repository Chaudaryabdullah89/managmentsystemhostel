import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useAttendance = (userId) => {
    const queryClient = useQueryClient();

    const { data: attendanceHistory, isLoading: historyLoading } = useQuery({
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        queryKey: ["attendanceHistory", userId],
        queryFn: async () => {
            if (!userId) return [];
            const res = await fetch(`/api/staff/attendance?userId=${userId}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        enabled: !!userId
    });

    const activeCheckIn = attendanceHistory?.find(a => !a.checkOut);

    const punchMutation = useMutation({
        mutationFn: async ({ status, notes }) => {
            const res = await fetch("/api/staff/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, status, notes })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        onSuccess: (data) => {
            toast.success(data.checkOut ? "Shift ended successfully" : "Shift started successfully");
            queryClient.invalidateQueries(["attendanceHistory", userId]);
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    return {
        attendanceHistory,
        activeCheckIn,
        historyLoading,
        punchIn: (notes) => punchMutation.mutate({ status: "CHECK_IN", notes }),
        punchOut: (notes) => punchMutation.mutate({ status: "CHECK_OUT", notes }),
        isPunching: punchMutation.isPending
    };
};
