"use client"
import React, { use } from 'react';
import SectionHeader from '@/components/admin/SectionHeader';
import ActivityFeed from '@/components/admin/ActivityFeed';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useWardenRecords } from '@/hooks/useWardenRecords';
import { CheckCircle2, ClipboardList, Wrench, Loader2 } from 'lucide-react';

export default function WardenRecordsPage({ params }) {
    const { userId } = use(params);
    const { data: records = { complaints: [], maintenance: [], hostels: [] }, isLoading, error } = useWardenRecords(userId);

    const events = [];
    records.complaints.forEach((c) => {
        events.push({
            id: c.id,
            title: `Assigned: ${c.title}`,
            description: c.description?.slice(0, 100),
            date: new Date(c.createdAt),
            status: c.status,
            icon: ClipboardList,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50'
        });
    });
    records.maintenance.forEach((m) => {
        events.push({
            id: m.id,
            title: `Maintenance: ${m.title}`,
            description: m.description?.slice(0, 100),
            date: new Date(m.createdAt),
            status: m.status,
            icon: Wrench,
            color: 'text-rose-600',
            bgColor: 'bg-rose-50'
        });
    });
    records.hostels.forEach((h) => {
        events.push({
            id: h.id,
            title: `Site Supervised: ${h.name}`,
            description: `Active management of institutional node ${h.name}.`,
            date: new Date(h.updatedAt || h.createdAt),
            status: 'ACTIVE',
            icon: CheckCircle2,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50'
        });
    });

    events.sort((a, b) => b.date - a.date);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm font-medium">Aggregating Operational Data...</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-center text-rose-500 font-medium bg-rose-50 rounded-lg mx-6 mt-6">Registry Failure: Operational records inaccessible.</div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <SectionHeader title="Operational Log" backHref={`/admin/users-records/${userId}`} />
            <Card className="rounded-lg shadow-sm border">
                <CardHeader className="border-b bg-gray-50/50 py-4">
                    <CardTitle className="text-base font-semibold">Activity Ledger</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <ActivityFeed events={events} />
                </CardContent>
            </Card>
        </div>
    );
}
