"use client"
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SectionHeader({ title, backHref = '/admin/users-records', actionLabel, onAction }) {
    return (
        <div className="flex items-center justify-between border-b pb-4 mb-6">
            <div className="flex items-center gap-3">
                <Link href={backHref}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-xl font-semibold tracking-tight text-gray-900">{title}</h1>
            </div>
            {actionLabel && (
                <Button onClick={onAction} size="sm">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
