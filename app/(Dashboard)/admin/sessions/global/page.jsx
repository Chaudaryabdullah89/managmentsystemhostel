"use client"
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    Shield, ShieldAlert, Monitor, Smartphone, Globe, LogOut,
    Clock, Search, User, Trash2, RefreshCw, Filter,
    Activity, ArrowUpRight, CheckCircle2, XCircle, MoreVertical,
    ChevronLeft, Fingerprint, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow, format } from 'date-fns';

export default function GlobalSessionsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['admin-global-sessions'],
        queryFn: async () => {
            const res = await fetch('/api/admin/sessions');
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to load sessions');
            return json.sessions || [];
        },
        staleTime: 60 * 1000,
    });

    const terminateMutation = useMutation({
        mutationFn: async ({ sessionId, userId }) => {
            const query = sessionId ? `sessionId=${sessionId}` : `userId=${userId}`;
            const res = await fetch(`/api/admin/sessions?${query}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to purge session');
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-global-sessions'] });
            toast.success('Session purged from system');
        },
        onError: (err) => toast.error(err.message),
    });

    const sessions = data || [];

    const filteredSessions = useMemo(() => {
        return sessions.filter(s => {
            const matchesSearch = 
                s.User?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.User?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.ipAddress?.includes(searchQuery) ||
                s.device?.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesRole = filterRole === 'all' || s.User?.role === filterRole;
            
            return matchesSearch && matchesRole;
        });
    }, [sessions, searchQuery, filterRole]);

    const stats = useMemo(() => ({
        total: sessions.length,
        active: sessions.filter(s => s.isActive).length,
        admins: sessions.filter(s => s.User?.role === 'ADMIN').length,
    }), [sessions]);

    const roles = ['all', 'ADMIN', 'WARDEN', 'STAFF', 'RESIDENT'];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background pb-20 font-sans tracking-tight">
            {/* Header */}
            <header className="bg-white dark:bg-card border-b sticky top-0 z-50 h-16 shadow-sm shadow-black/5">
                <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9" onClick={() => router.back()}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-100" />
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-600/20">
                                <ShieldAlert className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-sm font-black text-gray-900 dark:text-foreground uppercase tracking-tight">Session Guard</h1>
                                <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Global Watch</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 max-w-md relative hidden md:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                        <Input 
                            placeholder="Filter by user, IP, or device..." 
                            className="h-10 pl-10 rounded-xl border-gray-100 bg-gray-50 dark:bg-muted/10 font-bold text-[11px] uppercase tracking-wider"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 rounded-xl text-[9px] font-black uppercase tracking-widest"
                            onClick={() => refetch()}
                        >
                            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Sync
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: 'Total Nodes', value: stats.total, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Active Streams', value: stats.active, icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Privileged Access', value: stats.admins, icon: Shield, color: 'text-rose-600', bg: 'bg-rose-50' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-[2rem] p-6 shadow-sm flex items-center gap-5">
                            <div className={`h-14 w-14 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center`}>
                                <s.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-3xl font-black tracking-tighter text-gray-900 dark:text-foreground">{s.value}</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {roles.map(role => (
                        <Button
                            key={role}
                            variant={filterRole === role ? 'default' : 'outline'}
                            className={`h-9 px-6 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${filterRole === role ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'border-gray-100 text-gray-400 opacity-60 hover:opacity-100'}`}
                            onClick={() => setFilterRole(role)}
                        >
                            {role}
                        </Button>
                    ))}
                </div>

                {/* Sessions Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-48 bg-white dark:bg-card border border-gray-100 dark:border-border rounded-[2.5rem] animate-pulse" />
                        ))}
                    </div>
                ) : filteredSessions.length === 0 ? (
                    <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-[3rem] p-24 text-center shadow-sm">
                        <div className="h-20 w-20 rounded-3xl bg-gray-50 flex items-center justify-center mx-auto mb-6">
                            <Fingerprint className="h-10 w-10 text-gray-200" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-foreground uppercase tracking-tight">No Matches</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2 max-w-xs mx-auto">No sessions found matching your current filter criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSessions.map((session) => (
                            <div 
                                key={session.id} 
                                className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all group relative overflow-hidden"
                            >
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[4rem] opacity-20 -mr-12 -mt-12 group-hover:bg-indigo-600 transition-colors duration-500" />
                                
                                <div className="relative flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-indigo-50 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-indigo-600 font-black text-xl">
                                            {session.User?.image ? (
                                                <img src={session.User.image} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                session.User?.name?.[0]?.toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-gray-900 dark:text-foreground uppercase tracking-tight truncate max-w-[150px]">
                                                {session.User?.name || 'Ghost User'}
                                            </h3>
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">{session.User?.role}</p>
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-gray-100">
                                                <MoreVertical className="h-4 w-4 text-gray-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-gray-100">
                                            <DropdownMenuItem 
                                                onClick={() => router.push(`/admin/users-records/${session.userId}`)}
                                                className="h-12 rounded-xl px-4 font-bold text-[10px] uppercase tracking-widest gap-3 cursor-pointer"
                                            >
                                                <User className="h-4 w-4 text-indigo-600" /> Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => terminateMutation.mutate({ userId: session.userId })}
                                                className="h-12 rounded-xl px-4 font-bold text-[10px] uppercase tracking-widest gap-3 text-rose-600 focus:bg-rose-50 cursor-pointer"
                                            >
                                                <LogOut className="h-4 w-4" /> Purge User All
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-5 relative">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Client</p>
                                            <div className="flex items-center gap-2">
                                                <Smartphone className="h-3.5 w-3.5 text-gray-400" />
                                                <span className="text-xs font-bold text-gray-700 dark:text-foreground truncate block">{session.device || 'Standard Agent'}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Network</p>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                                <span className="text-xs font-bold text-gray-700 dark:text-foreground font-mono">{session.ipAddress || '0.0.0.0'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 dark:bg-muted/10 rounded-2xl border border-gray-100 dark:border-border flex items-center justify-between group-hover:bg-white transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Clock className="h-4 w-4 text-gray-300" />
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest line-none">Last Active</p>
                                                <p className="text-xs font-black text-gray-600 dark:text-muted-foreground uppercase">{formatDistanceToNow(new Date(session.lastActive), { addSuffix: true })}</p>
                                            </div>
                                        </div>
                                        <div className="h-8 w-px bg-gray-200" />
                                        <div className="text-right">
                                            <Badge className={`bg-emerald-50 text-emerald-600 border-none text-[8px] font-black rounded-full px-2 py-0.5`}>
                                                Active Now
                                            </Badge>
                                        </div>
                                    </div>

                                    <Button 
                                        className="w-full h-12 bg-gray-950 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-gray-200 mt-2 hover:bg-rose-600 transition-all duration-300 group-hover:scale-[1.02]"
                                        onClick={() => {
                                            if (confirm("Forcibly disconnect this session?")) {
                                                terminateMutation.mutate({ sessionId: session.id });
                                            }
                                        }}
                                        disabled={terminateMutation.isPending}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" /> Revoke Stream
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
