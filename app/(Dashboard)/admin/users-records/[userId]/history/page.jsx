"use client"
import React, { use } from 'react';
import SectionHeader from '@/components/admin/SectionHeader';
import ActivityFeed from '@/components/admin/ActivityFeed';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useBookingHistory } from '@/hooks/useBookingHistory';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';

export default function BookingHistoryPage({ params }) {
    const { userId } = use(params);
    const { data: bookings = [], isLoading, error } = useBookingHistory(userId);

    const events = bookings.map((b) => ({
        id: b.id,
        title: `Booking Update: ${b.status}`,
        description: `Room ${b.Room?.roomNumber || 'N/A'} - Resident lifecycle event.`,
        date: new Date(b.createdAt),
        status: b.status,
        icon: b.status === 'ACTIVE' ? CheckCircle2 : Clock,
        color: b.status === 'ACTIVE' ? 'text-emerald-600' : 'text-gray-500',
        bgColor: b.status === 'ACTIVE' ? 'bg-emerald-50' : 'bg-gray-50'
    }));

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm font-medium">Reconstructing Timeline...</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-center text-rose-500 font-medium bg-rose-50 rounded-lg mx-6 mt-6">Protocol Error: Could not fetch stay history.</div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <SectionHeader title="Stay Cycle History" backHref={`/admin/users-records/${userId}`} />
            <Card className="rounded-lg shadow-sm border">
                <CardHeader className="border-b bg-gray-50/50 py-4">
                    <CardTitle className="text-base font-semibold">Booking Timeline</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <ActivityFeed events={events} />
                </CardContent>
            </Card>
        </div>
    );
}
