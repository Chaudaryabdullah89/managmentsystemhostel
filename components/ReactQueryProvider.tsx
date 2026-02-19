"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { QueryClient } from "@/lib/queryclient";

export const ReactQueryProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <QueryClientProvider client={QueryClient}>
            {children}
        </QueryClientProvider>
    );
};
