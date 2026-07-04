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
        <div className="max-h-[420px] overflow-y-auto pr-1.5 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
            {events.map((e, i) => {
                const IconComp = e.icon || Clock;
                return (
                    <div key={i} className="flex gap-3.5 p-3.5 bg-slate-50/80 dark:bg-muted/30 rounded-2xl border border-slate-100 dark:border-border/50 items-start hover:bg-white dark:hover:bg-card transition-all">
                        <div className={`mt-0.5 p-2 rounded-xl ${e.bgColor || "bg-indigo-50 text-indigo-600"} ${e.color || "text-indigo-600"} border border-current/10 shrink-0`}>
                            <IconComp className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-foreground truncate">{e.title}</h4>
                                <span className="shrink-0 text-[10px] font-medium text-slate-400 dark:text-slate-500 font-mono">{(e.date && !isNaN(e.date.getTime())) ? format(e.date, 'MMM dd, HH:mm') : '—'}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5 line-clamp-2">{e.description}</p>
                            <div className="mt-2">
                                <Badge variant="outline" className="text-[8px] px-2 py-0.5 uppercase font-black tracking-wider bg-white dark:bg-muted/40 border-slate-200 dark:border-border">
                                    {e.status}
                                </Badge>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
