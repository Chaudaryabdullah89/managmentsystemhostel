import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const WardenNames = ({ wardenIds }) => {
    const [names, setNames] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
    }, [wardenIds]);

    if (loading) return <span className="text-xs text-gray-400">Loading...</span>;
    if (names.length === 0) return <span className="text-xs text-gray-400 italic">No wardens assigned</span>;

    return (
        <div className="flex flex-wrap gap-1.5">
            {names.map((name, idx) => (
                <Link href={`/admin/wardens/${wardenIds[idx]}`} key={idx} >
                    <span key={idx} className="text-xs bg-gray-50 border border-gray-100 px-2 py-1 rounded-md text-gray-600">
                        {name}
                    </span>

                </Link>
            ))}
        </div>
    );
};

export default WardenNames;
