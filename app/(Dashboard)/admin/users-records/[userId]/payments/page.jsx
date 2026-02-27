"use client"
import React, { use } from 'react';
import SectionHeader from '@/components/admin/SectionHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { format } from 'date-fns';
import { usePayments } from '@/hooks/usePayments';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export default function PaymentsPage({ params }) {
    const { userId } = use(params);
    const { data: payments = [], isLoading, error } = usePayments(userId);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm font-medium">Syncing Ledger...</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-center text-rose-500 font-medium bg-rose-50 rounded-lg mx-6 mt-6">Failed to retrieve financial records.</div>;
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <SectionHeader title="Resident Payment History" backHref={`/admin/users-records/${userId}`} />
            <Card className="rounded-lg shadow-sm border">
                <CardHeader className="border-b bg-gray-50/50 py-4">
                    <CardTitle className="text-base font-semibold">Payment Ledger</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50">
                                <TableHead className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Entry Date</TableHead>
                                <TableHead className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Classification</TableHead>
                                <TableHead className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Amount (PKR)</TableHead>
                                <TableHead className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y">
                            {payments.map((p) => (
                                <TableRow key={p.id} className="hover:bg-gray-50 transition-colors">
                                    <TableCell className="px-6 py-4 text-sm whitespace-nowrap">{p.date || p.createdAt ? format(new Date(p.date || p.createdAt), 'MMM dd, yyyy') : '—'}</TableCell>
                                    <TableCell className="px-6 py-4 text-sm font-medium capitalize">{p.type}</TableCell>
                                    <TableCell className="px-6 py-4 text-sm font-bold text-gray-900">
                                        {p.amount.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-center">
                                        <Badge variant={p.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-[10px] uppercase font-black px-3 py-0.5">
                                            {p.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {payments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="p-12 text-center text-muted-foreground italic">
                                        No financial data established for this node.
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
