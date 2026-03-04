import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const WardenNames = ({ wardenIds, wardenUsers = [] }) => {
    const [names, setNames] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // If we already have user objects, use them immediately
        if (wardenUsers && wardenUsers.length > 0) {
            setNames(wardenUsers.map(u => u.name));
            setLoading(false);
            return;
        }

        const fetchNames = async () => {
            if (!wardenIds || wardenIds.length === 0) {
                setNames([]);
                setLoading(false);
                return;
            }

            try {
                const promises = wardenIds.map(async (id) => {
                    try {
                        const response = await fetch(`/api/users/warden/${id}`);
                        const data = await response.json();
                        return data.success ? data.data.name : 'Unknown';
                    } catch (e) {
                        return 'Error';
                    }
                });
                const fetchedNames = await Promise.all(promises);
                setNames(fetchedNames);
            } catch (error) {
                console.error("Error fetching warden names:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNames();
    }, [wardenIds, wardenUsers]);

    if (loading && (!wardenUsers || wardenUsers.length === 0)) return <span className="text-xs text-gray-400 animate-pulse">Loading...</span>;
    if (names.length === 0) return <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">No warden assigned</span>;

    return (
        <div className="flex flex-wrap gap-1">
            {names.map((name, idx) => (
                <Link
                    href={`/admin/wardens/${wardenUsers[idx]?.id || wardenIds?.[idx]}`}
                    key={idx}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:scale-105 transition-transform"
                >
                    <span className="text-[10px] font-bold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg text-indigo-600 uppercase tracking-tight">
                        {name}
                    </span>
                </Link>
            ))}
        </div>
    );
};

export default WardenNames;
