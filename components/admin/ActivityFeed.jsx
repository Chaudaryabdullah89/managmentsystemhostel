"use client"
import React from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function ActivityFeed({ events }) {
    if (!events || events.length === 0) {
        return (
            <div className="py-12 text-center border-2 border-dashed rounded-lg">
                <Clock className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">No activity recorded</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {events.map((e, i) => (
                <div key={i} className="flex gap-4 p-4 bg-white rounded-lg border shadow-sm items-start">
                    <div className={`mt-1 p-2 rounded-md ${e.bgColor} ${e.color}`}>
                        <e.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">{e.title}</h4>
                            <span className="shrink-0 text-[11px] text-gray-500 whitespace-nowrap">{format(e.date, 'MMM dd, HH:mm')}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{e.description}</p>
                        <div className="mt-2">
                            <Badge variant="outline" className="text-[10px] px-2 py-0 uppercase font-bold tracking-wider">
                                {e.status}
                            </Badge>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
