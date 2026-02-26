"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    Monitor, Smartphone, Globe, LogOut, Shield, Clock,
    ChevronLeft, RefreshCw, Trash2, CheckCircle2, AlertCircle,
    Wifi, MapPin, Activity, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';

function getDeviceIcon(device = '') {
    const d = device.toLowerCase();
    if (d.includes('mobile') || d.includes('iphone') || d.includes('android')) return Smartphone;
    return Monitor;
}

function getDeviceLabel(device = '') {
    if (!device) return 'Unknown Device';
    if (device.length > 50) return device.slice(0, 50) + '...';
    return device;
}

export default function SessionsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['user-sessions'],
        queryFn: async () => {
            const res = await fetch('/api/user/sessions');
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to load sessions');
            return json.sessions || [];
        },
        staleTime: 2 * 60 * 1000,
    });

    const terminateMutation = useMutation({
        mutationFn: async (sessionId) => {
            const url = sessionId ? `/api/user/sessions?sessionId=${sessionId}` : '/api/user/sessions';
            const res = await fetch(url, { method: 'DELETE' });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            return json;
        },
        onSuccess: (_, sessionId) => {
            queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
            toast.success(sessionId ? 'Session terminated' : 'All other sessions terminated');
        },
        onError: (err) => toast.error(err.message || 'Failed to terminate session'),
    });

    const sessions = data || [];
    const activeSessions = sessions.filter(s => s.isActive);
    const inactiveSessions = sessions.filter(s => !s.isActive);

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16 shadow-sm shadow-black/5">
                <div className="max-w-4xl mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9" onClick={() => router.back()}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-100" />
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                                <Shield className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-sm font-black text-gray-900 uppercase tracking-tight">Active Sessions</h1>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Device Security Management</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-xl text-[9px] font-black uppercase tracking-widest border-gray-100"
                            onClick={() => refetch()}
                        >
                            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
                        </Button>
                        {activeSessions.length > 1 && (
                            <Button
                                size="sm"
                                className="h-9 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-black uppercase tracking-widest shadow-sm"
                                onClick={() => terminateMutation.mutate(null)}
                                disabled={terminateMutation.isPending}
                            >
                                <LogOut className="h-3.5 w-3.5 mr-1.5" /> End All Others
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
                {/* Security Status Banner */}
                <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <Lock className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Account Security</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                                {sessions.length} total sessions · {activeSessions.length} active
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Secured</span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm animate-pulse">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-gray-100" />
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 bg-gray-100 rounded-full w-1/3" />
                                        <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-[2rem] p-16 text-center shadow-sm">
                        <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                            <Activity className="h-8 w-8 text-gray-300" />
                        </div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">No Sessions Found</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Your session history is empty</p>
                    </div>
                ) : (
                    <>
                        {/* Active Sessions */}
                        {activeSessions.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-5 w-1 bg-emerald-500 rounded-full" />
                                    <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Active Sessions</h3>
                                    <Badge className="bg-emerald-100 text-emerald-700 border-none text-[8px] font-black rounded-full px-2">
                                        {activeSessions.length}
                                    </Badge>
                                </div>
                                {activeSessions.map((session, i) => {
                                    const DeviceIcon = getDeviceIcon(session.device);
                                    const isCurrentSession = i === 0; // Assume first (most recent) is current
                                    return (
                                        <div
                                            key={session.id}
                                            className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${isCurrentSession ? 'border-indigo-200 bg-indigo-50/20' : 'border-gray-100'}`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${isCurrentSession ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                        <DeviceIcon className="h-5 w-5" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[12px] font-black text-gray-900 uppercase tracking-tight">
                                                                {getDeviceLabel(session.device)}
                                                            </span>
                                                            {isCurrentSession && (
                                                                <Badge className="bg-indigo-600 text-white border-none text-[8px] font-black rounded-full px-2 py-0.5">
                                                                    This Device
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                {session.ipAddress || 'Unknown IP'}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {session.lastActive ? formatDistanceToNow(new Date(session.lastActive), { addSuffix: true }) : 'N/A'}
                                                            </span>
                                                        </div>
                                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                                                            Started {session.createdAt ? format(new Date(session.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {!isCurrentSession && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 px-3 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 text-[9px] font-black uppercase tracking-widest shrink-0"
                                                        onClick={() => terminateMutation.mutate(session.id)}
                                                        disabled={terminateMutation.isPending}
                                                    >
                                                        <LogOut className="h-3.5 w-3.5 mr-1.5" /> Revoke
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Inactive Sessions */}
                        {inactiveSessions.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-5 w-1 bg-gray-300 rounded-full" />
                                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Past Sessions</h3>
                                    <Badge variant="outline" className="border-gray-200 text-gray-400 text-[8px] font-black rounded-full px-2">
                                        {inactiveSessions.length}
                                    </Badge>
                                </div>
                                {inactiveSessions.slice(0, 5).map((session) => {
                                    const DeviceIcon = getDeviceIcon(session.device);
                                    return (
                                        <div key={session.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm opacity-60 hover:opacity-100 transition-opacity">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 text-gray-400">
                                                    <DeviceIcon className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-[11px] font-black text-gray-600 uppercase tracking-tight block truncate">
                                                        {getDeviceLabel(session.device)}
                                                    </span>
                                                    <div className="flex items-center gap-3 text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                                                        <span>{session.ipAddress || 'Unknown'}</span>
                                                        <span>·</span>
                                                        <span>Expired {session.lastActive ? formatDistanceToNow(new Date(session.lastActive), { addSuffix: true }) : ''}</span>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="border-gray-100 text-gray-400 text-[8px] font-black rounded-full px-2 shrink-0">
                                                    Inactive
                                                </Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
