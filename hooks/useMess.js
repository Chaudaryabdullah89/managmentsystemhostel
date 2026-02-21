import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Fetch mess menu for a specific hostel
export const useMessMenu = (hostelId) => {
    return useQuery({
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
