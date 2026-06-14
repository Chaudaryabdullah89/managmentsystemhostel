import Link from 'next/link';
import React from 'react';
import { useQuery } from '@tanstack/react-query';

const WardenNameItem = ({ id, wardenUser }) => {
    const { data: name, isLoading } = useQuery({
        queryKey: ['warden', 'name', id],
        queryFn: async () => {
            if (wardenUser?.name) return wardenUser.name;
            const response = await fetch(`/api/users/warden/${id}`);
            const data = await response.json();
            return data.success ? data.data.name : 'Unknown';
        },
        enabled: !!id && !wardenUser?.name,
        initialData: wardenUser?.name,
        staleTime: 15 * 60 * 1000, // Keep warden names fresh for 15 minutes
        gcTime: 30 * 60 * 1000,
    });

    if (isLoading) return <span className="text-[10px] text-gray-400 animate-pulse px-2">Loading...</span>;

    return (
        <Link
            href={`/admin/wardens/${id}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:scale-105 transition-transform"
        >
            <span className="text-[10px] font-bold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg text-indigo-600 uppercase tracking-tight">
                {name || 'Unknown'}
            </span>
        </Link>
    );
};

const WardenNames = ({ wardenIds = [], wardenUsers = [] }) => {
    const list = wardenUsers && wardenUsers.length > 0
        ? wardenUsers.map(u => ({ id: u.id, user: u }))
        : (wardenIds || []).map((id) => ({ id, user: null }));

    if (list.length === 0) return <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">No warden assigned</span>;

    return (
        <div className="flex flex-wrap gap-1">
            {list.map((item, idx) => (
                <WardenNameItem key={item.id || idx} id={item.id} wardenUser={item.user} />
            ))}
        </div>
    );
};

export default WardenNames;
