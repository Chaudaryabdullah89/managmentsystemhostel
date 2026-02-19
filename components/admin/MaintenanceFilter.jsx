"use client"
import React, { useState } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

/**
 * Simple filter UI for the Maintenance Overview page.
 * Allows filtering by status and a date range (start / end).
 */
export default function MaintenanceFilter({ onFilter }) {
    const [status, setStatus] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');

    const handleApply = () => {
        onFilter({ status, start, end });
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-[2rem] border border-gray-100 mb-6">
            {/* Status dropdown */}
            <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In‑Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
            </Select>

            {/* Start date */}
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Input
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    placeholder="Start date"
                    className="w-[180px]"
                />
            </div>

            {/* End date */}
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Input
                    type="date"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    placeholder="End date"
                    className="w-[180px]"
                />
            </div>

            <Button onClick={handleApply} className="h-10 px-6 rounded-xl bg-black text-white hover:bg-gray-800">
                Apply Filters
            </Button>
        </div>
    );
}
