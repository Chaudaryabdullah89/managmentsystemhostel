"use client"
import React, { useState } from 'react';
import SectionHeader from '@/components/admin/SectionHeader';
import MaintenanceFilter from '@/components/admin/MaintenanceFilter';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useMaintenances } from '@/hooks/useMaintenances';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Maintenance Overview – admin page that lists all maintenance tasks across hostels.
 * URL: /admin/maintenances/overview
 */
export default function MaintenanceOverviewPage() {
    const [filters, setFilters] = useState({ status: '', start: '', end: '' });
    const { data: maintenances = [], isLoading, error } = useMaintenances(filters);

    const handleFilter = (newFilters) => {
        setFilters(newFilters);
    };

    if (isLoading) {
        return <p className="p-8 text-center text-gray-500">Loading maintenance records…</p>;
    }
    if (error) {
        return <p className="p-8 text-center text-red-500">Failed to load maintenance records.</p>;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <SectionHeader title="Hostel Maintenance Overview" backHref="/admin/users-records" />
            <MaintenanceFilter onFilter={handleFilter} />
            <Card className="shadow-sm border border-gray-100 rounded-[2rem]">
                <CardHeader className="bg-gray-50 rounded-t-[2rem] p-6">
                    <CardTitle className="text-xl font-bold">Maintenance Tasks</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</TableHead>
                                <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Hostel</TableHead>
                                <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Room</TableHead>
                                <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Title</TableHead>
                                <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</TableHead>
                                <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {maintenances.map((m) => (
                                <TableRow key={m.id} className="hover:bg-gray-50 transition-colors">
                                    <TableCell className="px-6 py-4 text-sm text-gray-700">{format(new Date(m.createdAt), 'PPP')}</TableCell>
                                    <TableCell className="px-6 py-4 text-sm text-gray-700">{m.Hostel?.name || 'N/A'}</TableCell>
                                    <TableCell className="px-6 py-4 text-sm text-gray-700">{m.Room?.roomNumber || 'N/A'}</TableCell>
                                    <TableCell className="px-6 py-4 text-sm font-medium text-gray-900">{m.title}</TableCell>
                                    <TableCell className="px-6 py-4">
                                        <Badge variant={m.status === 'COMPLETED' ? 'default' : 'secondary'} className="uppercase text-xs">
                                            {m.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        <Link href={`/admin/maintenances/${m.id}`}>
                                            <Button variant="outline" size="sm" className="h-8 px-3 rounded-xl">View</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {maintenances.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="p-6 text-center text-gray-400">
                                        No maintenance records match the current filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
