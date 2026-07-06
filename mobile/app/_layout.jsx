import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

// Create TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F9FAFB' }, // Matches light background of Next.js portal
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="auth/restricted" />
        <Stack.Screen name="(resident)" />
        <Stack.Screen name="(warden)" />
        <Stack.Screen name="(staff)" />
        <Stack.Screen name="(admin)" />
      </Stack>
    </QueryClientProvider>
  );
}
