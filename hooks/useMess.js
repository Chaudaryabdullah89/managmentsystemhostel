import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Fetch mess menu for a specific hostel
export const useMessMenu = (hostelId) => {
    return useQuery({

        gcTime: 10 * 60 * 1000,
        queryKey: ["messMenu", hostelId],
        queryFn: async () => {
            const response = await fetch(`/api/mess${hostelId ? `?hostelId=${hostelId}` : ''}`);
            if (!response.ok) {
                throw new Error("Failed to fetch mess menu");
            }
            const data = await response.json();
            return data.data;
        },
        enabled: true, // we might want to fetch all if no hostelId inside admin
    });
};

// Create or update mess menu for a day
export const useUpsertMessMenu = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (menuData) => {
            const response = await fetch("/api/mess", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(menuData)
            });

            if (!response.ok) {
                throw new Error("Failed to update mess menu");
            }

            const data = await response.json();
            return data.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(["messMenu"]);
        },
    });
};

export const useMessFeedback = (hostelId) => {
    return useQuery({
        queryKey: ["messFeedback", hostelId],
        queryFn: async () => {
            if (!hostelId) return { feedbacks: [], averages: { BREAKFAST: { avg: 0, count: 0 }, LUNCH: { avg: 0, count: 0 }, DINNER: { avg: 0, count: 0 } } };
            const response = await fetch(`/api/guest/mess/feedback?hostelId=${hostelId}`);
            if (!response.ok) throw new Error("Failed to fetch mess feedback");
            const data = await response.json();
            return data;
        },
        enabled: !!hostelId,
    });
};

export const useSubmitMessFeedback = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (feedbackData) => {
            const response = await fetch("/api/guest/mess/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(feedbackData)
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to submit feedback");
            }
            return response.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(["messFeedback", variables.hostelId]);
        }
    });
};
