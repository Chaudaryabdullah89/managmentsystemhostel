"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, X, CheckCheck, AlertCircle, Info, Zap, Megaphone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNotices } from "@/hooks/useNotices";

const STORAGE_KEY = "mgh_read_notices";

const PRIORITY_CONFIG = {
    HIGH:   { color: "bg-red-100 text-red-700",    icon: AlertCircle,  dot: "bg-red-500"    },
    MEDIUM: { color: "bg-amber-100 text-amber-700", icon: Zap,          dot: "bg-amber-500"  },
    LOW:    { color: "bg-gray-100 text-gray-600",   icon: Info,         dot: "bg-gray-400"   },
    URGENT: { color: "bg-rose-100 text-rose-700",   icon: Megaphone,    dot: "bg-rose-600"   },
};

export default function NotificationBell({ hostelId, userRole }) {
    const [readIds, setReadIds]       = useState(new Set());
    const [open, setOpen]             = useState(false);
    const dropdownRef                 = useRef(null);

    // Load read IDs from localStorage
    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            setReadIds(new Set(stored));
        } catch { /* ignore */ }
    }, []);

    // Fetch notices with react-query
    const filters = {};
    if (hostelId) filters.hostelId = hostelId;
    const { data: noticesData, isLoading: loading, refetch } = useNotices(filters);

    const notices = Array.isArray(noticesData)
        ? noticesData.filter(n =>
            n.isActive &&
            (!userRole || !n.targetRoles?.length || n.targetRoles.includes(userRole))
          )
        : [];

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const unreadCount = notices.filter(n => !readIds.has(n.id)).length;

    const markAllRead = () => {
        const allIds = notices.map(n => n.id);
        const next = new Set([...readIds, ...allIds]);
        setReadIds(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    };

    const markRead = (id) => {
        const next = new Set([...readIds, id]);
        setReadIds(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => { setOpen(v => !v); if (!open) refetch(); }}
                className="relative h-8 w-8 rounded-xl bg-gray-100 hover:bg-blue-50 flex items-center justify-center transition-all duration-150 group"
                title="Notifications"
            >
                <Bell className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute left-0 top-10 z-[200] w-80 bg-white rounded-2xl shadow-2xl shadow-gray-900/15 border border-gray-100 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <Bell className="h-3.5 w-3.5 text-blue-600" />
                            <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Notices</span>
                            {unreadCount > 0 && (
                                <span className="h-4 px-1.5 bg-blue-100 text-blue-700 text-[9px] font-black rounded-full flex items-center">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="flex items-center gap-1 text-[9px] font-bold text-gray-400 hover:text-blue-600 uppercase tracking-wider transition-colors px-1.5 py-0.5 rounded-lg hover:bg-blue-50"
                                >
                                    <CheckCheck className="h-3 w-3" /> All read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="h-6 w-6 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                                <X className="h-3 w-3 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {loading ? (
                            <div className="space-y-2 p-4">
                                {[1,2,3].map(i => (
                                    <div key={i} className="animate-pulse flex gap-3">
                                        <div className="h-8 w-8 bg-gray-100 rounded-xl shrink-0" />
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-2.5 bg-gray-100 rounded-full w-3/4" />
                                            <div className="h-2 bg-gray-100 rounded-full w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : notices.length === 0 ? (
                            <div className="py-10 text-center">
                                <Bell className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No notices</p>
                            </div>
                        ) : (
                            notices.slice(0, 15).map(notice => {
                                const isRead = readIds.has(notice.id);
                                const cfg = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.MEDIUM;
                                const Icon = cfg.icon;
                                return (
                                    <div
                                        key={notice.id}
                                        onClick={() => markRead(notice.id)}
                                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50/80 transition-colors ${!isRead ? "bg-blue-50/30" : ""}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`h-8 w-8 rounded-xl ${cfg.color} flex items-center justify-center shrink-0`}>
                                                <Icon className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[11px] font-black truncate ${!isRead ? "text-gray-900" : "text-gray-600"}`}>
                                                        {notice.title}
                                                    </span>
                                                    {!isRead && <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} shrink-0`} />}
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-medium leading-relaxed line-clamp-2 mt-0.5">
                                                    {notice.content}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${cfg.color}`}>
                                                        {notice.priority}
                                                    </span>
                                                    <span className="text-[9px] text-gray-300 font-medium">
                                                        {formatDistanceToNow(new Date(notice.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notices.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-gray-50 bg-gray-50/30">
                            <a href="/admin/notices" className="text-[9px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors">
                                View all notices →
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
