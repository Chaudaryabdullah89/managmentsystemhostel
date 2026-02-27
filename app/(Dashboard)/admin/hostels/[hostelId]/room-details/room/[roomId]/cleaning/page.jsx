"use client"
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Sparkle,
    Calendar,
    Clock,
    Search,
    LayoutGrid,
    CheckCircle2,
    History as HistoryIcon,
    Plus,
    Loader2,
    MoreVertical,
    Edit2,
    CheckCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useSingleRoomByHostelId, useCreateCleaningLog, useUpdateCleaningLog } from "@/hooks/useRoom";
import Loader from "@/components/ui/Loader";

const CleaningPage = () => {
    const params = useParams();
    const router = useRouter();
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const hostelId = searchParams.get('hostelId');
    const { roomId, hostelId: hostelName } = params;

    const { data: roomData, isLoading } = useSingleRoomByHostelId(hostelId, roomId);
    const createCleaning = useCreateCleaningLog();
    const updateCleaning = useUpdateCleaningLog();

    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);

    const [formData, setFormData] = useState({
        notes: "",
        status: "COMPLETED"
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createCleaning.mutateAsync({
                ...formData,
                roomId: roomId,
                performedAt: new Date().toISOString()
            });
            setIsDialogOpen(false);
            setFormData({ notes: "", status: "COMPLETED" });
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateCleaning.mutateAsync({
                id: selectedLog.id,
                ...formData
            });
            setIsUpdateDialogOpen(false);
            setSelectedLog(null);
        } catch (error) {
            console.error(error);
        }
    };

    const openUpdate = (log) => {
        setSelectedLog(log);
        setFormData({
            notes: log.notes || "",
            status: log.status
        });
        setIsUpdateDialogOpen(true);
    };

    if (isLoading) return <Loader label="Loading Cleaning Logs" subLabel="Fetching cleaning sessions..." icon={Sparkle} fullScreen={false} />;

    const logs = roomData?.data?.CleaningLog || [];

    const stats = {
        total: logs.length,
        completed: logs.filter(l => l.status === 'COMPLETED').length,
        pending: logs.filter(l => l.status === 'PENDING').length
    };

    const filteredLogs = logs.filter(log =>
        log.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50/30 pb-20">
            <header className="bg-white border-b sticky top-0 z-40 py-2 md:h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl hover:bg-gray-100 h-9 w-9 shrink-0">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="h-6 w-px bg-gray-100 hidden md:block" />
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm md:text-lg font-black text-gray-900 tracking-tight leading-none truncate uppercase">Sanitation Ledger</h1>
                            <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 truncate">
                                Unit {roomData?.data?.roomNumber} • <span className="text-blue-500">{decodeURIComponent(hostelName)}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative hidden lg:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                className="pl-9 h-9 w-48 xl:w-64 bg-gray-50/50 border-none text-[10px] font-black uppercase tracking-widest focus:bg-white transition-all rounded-xl shadow-inner"
                                placeholder="Scan Records..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-9 px-4 md:px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 gap-2">
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Log Service</span>
                                    <span className="sm:hidden">Log</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden gap-0 border-none shadow-2xl">
                                <div className="p-6 bg-gray-50 border-b border-gray-100">
                                    <DialogTitle className="text-lg font-black tracking-tight uppercase">Record Service</DialogTitle>
                                    <DialogDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Add hygiene protocol entry</DialogDescription>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Protocol Vector</Label>
                                        <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                            <SelectTrigger className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest border-gray-100">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-100">
                                                <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                                                <SelectItem value="PENDING">PENDING REVIEW</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Service Manifest</Label>
                                        <Textarea
                                            placeholder="Floors mopped, sanitization complete..."
                                            className="min-h-[100px] rounded-xl font-medium text-sm resize-none pt-3 border-gray-100 focus:ring-indigo-500"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg mt-2 transition-all active:scale-[0.98]" disabled={createCleaning.isPending}>
                                        {createCleaning.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commit to Audit"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto px-6 py-8">
                {/* Metrics Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-10">
                    {[
                        { label: 'Total Services', value: stats.total, sub: 'All Sessions', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: HistoryIcon },
                        { label: 'Completed', value: stats.completed, sub: 'Verified Protocols', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
                        { label: 'Pending Audit', value: stats.pending, sub: 'Requires Review', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
                    ].map((s, i) => (
                        <Card key={i} className={`bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all active:scale-[0.98] cursor-default relative overflow-hidden ${i === 2 ? 'col-span-2 lg:col-span-1' : ''}`}>
                            <div className={`absolute top-0 right-0 h-12 w-12 ${s.bg} opacity-10 rounded-bl-full translate-x-6 -translate-y-6`} />
                            <div className={`h-11 w-11 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                <s.icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">{s.label}</p>
                                <p className="text-xl font-black text-gray-900 leading-tight truncate">{s.value}</p>
                                <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-0.5 truncate">{s.sub}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Audit Ribbon Feed */}
                <div className="space-y-3">
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => (
                            <Card key={log.id} className="group bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden active:scale-[0.99] cursor-pointer" onClick={() => openUpdate(log)}>
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${log.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'} opacity-70`} />
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${log.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' : 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white'}`}>
                                        {log.status === 'COMPLETED' ? <Sparkle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">{new Date(log.performedAt).toLocaleDateString()}</h3>
                                            <Badge variant="outline" className={`h-5 border-none rounded-full text-[8px] font-black uppercase tracking-widest px-2 shadow-sm ${log.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {log.status === 'COMPLETED' ? 'Sanitized' : 'Pending Audit'}
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] font-medium text-gray-500 line-clamp-1 italic">{log.notes || "Standard hygiene protocol applied at node level."}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                <HistoryIcon className="h-3 w-3" />
                                                Node {roomData?.data?.roomNumber}
                                            </div>
                                            <span className="h-1 w-1 rounded-full bg-gray-200" />
                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                <Clock className="h-3 w-3" />
                                                {new Date(log.performedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-6 md:gap-10 border-t md:border-t-0 border-gray-50 pt-4 md:pt-0">
                                    <div className="flex flex-col items-start md:items-end">
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Audit State</span>
                                        <Badge className={`mt-0.5 h-6 text-[8px] font-black px-3 py-0 border-none rounded-full shadow-sm ${log.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {log.status}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <div className="h-9 w-9 rounded-xl flex items-center justify-center text-gray-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all border border-transparent group-hover:border-indigo-100 hidden sm:flex">
                                            <Edit2 className="h-4 w-4" />
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 text-gray-400">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-gray-100 shadow-2xl">
                                                <DropdownMenuItem className="p-3 gap-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-600 focus:bg-gray-50 cursor-pointer" onClick={() => openUpdate(log)}>
                                                    <Edit2 className="h-4 w-4" /> Update Logistics
                                                </DropdownMenuItem>
                                                {log.status !== 'COMPLETED' && (
                                                    <DropdownMenuItem
                                                        className="p-3 gap-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-emerald-600 focus:bg-emerald-50 cursor-pointer"
                                                        onClick={() => updateCleaning.mutate({ id: log.id, status: 'COMPLETED' })}
                                                    >
                                                        <CheckCircle className="h-4 w-4" /> Execute Approval
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-100">
                            <Sparkle className="h-10 w-10 text-gray-100 mb-4 animate-pulse" />
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Hygiene logs void of data</p>
                        </div>
                    )}
                </div>
            </div>


            {/* Edit Dialog - Updated Style */}
            <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden gap-0 border-none shadow-2xl">
                    <div className="p-6 bg-gray-50 border-b border-gray-100">
                        <DialogTitle className="text-lg font-black tracking-tight uppercase">Edit Protocol</DialogTitle>
                        <DialogDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Modify hygiene vector details</DialogDescription>
                    </div>
                    <form onSubmit={handleUpdate} className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Protocol Vector</Label>
                            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                <SelectTrigger className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest border-gray-100">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100">
                                    <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                                    <SelectItem value="PENDING">PENDING REVIEW</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Update Manifest</Label>
                            <Textarea
                                className="min-h-[100px] rounded-xl font-medium text-sm resize-none pt-3 border-gray-100"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                        <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg mt-2 transition-all active:scale-[0.98]" disabled={updateCleaning.isPending}>
                            {updateCleaning.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CleaningPage;
