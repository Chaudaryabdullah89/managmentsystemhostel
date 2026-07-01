"use client"
import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import {
    DollarSign, Calendar, CheckCircle2, AlertCircle,
    Search, Download, Eye, User, Building2,
    CreditCard, Plus, ShieldCheck,
    Wallet, FileText, Boxes,
    Loader2, CheckCircle,
    Settings2, Trash2, MoreVertical,
    ArrowUpRight, Coins, Calculator, Zap,
    MessageSquare, Wallet2, Activity, TrendingUp,
    RefreshCw, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
    Dialog, DialogContent,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    useAllSalaries, useGeneratePayroll, useUpdateSalary,
    useDeleteSalary, useStaffList, useCreateSalary
} from "@/hooks/useSalaries";
import { useHostel } from "@/hooks/usehostel";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import SalarySlip from "@/components/SalarySlip";
import { GridPageSkeleton } from "@/components/ui/skeletons";

const statusConfig = {
    PAID: { label: "Paid", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" },
    PENDING: { label: "Pending", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600", border: "border-amber-200 dark:border-amber-800", dot: "bg-amber-500" },
    FAILED: { label: "Failed", bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-600", border: "border-rose-200 dark:border-rose-800", dot: "bg-rose-500" },
};

const StatusBadge = ({ status }) => {
    const cfg = statusConfig[status] || statusConfig.PENDING;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
};

const SalariesPage = () => {
    const [activeTab, setActiveTab] = useState("current");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterHostel, setFilterHostel] = useState("All");
    const [isSlipDialogOpen, setIsSlipDialogOpen] = useState(false);

    const currentMonth = format(new Date(), 'MMMM yyyy');
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
    const [isAddSalaryDialogOpen, setIsAddSalaryDialogOpen] = useState(false);
    const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
    const [isExportingSalaries, setIsExportingSalaries] = useState(false);
    const [selectedSalary, setSelectedSalary] = useState(null);

    const [resolveFormData, setResolveFormData] = useState({ appealStatus: "RESOLVED", appealResponse: "" });
    const [addSalaryForm, setAddSalaryForm] = useState({ staffId: "", month: currentMonth, customBonuses: 0, customDeductions: 0, customNotes: "" });
    const [editFormData, setEditFormData] = useState({ basicSalary: 0, allowances: 0, bonuses: 0, deductions: 0, notes: "" });
    const [payFormData, setPayFormData] = useState({ paymentMethod: "BANK_TRANSFER", paymentDate: format(new Date(), 'yyyy-MM-dd'), notes: "" });

    const { data: salaries, isLoading: salariesLoading } = useAllSalaries({ month: activeTab === "current" ? currentMonth : null });
    const { data: staffList } = useStaffList();
    const { data: hostelsData } = useHostel();
    const hostels = hostelsData?.data || [];

    const generatePayroll = useGeneratePayroll();
    const createSalary = useCreateSalary();
    const updateSalary = useUpdateSalary();
    const deleteSalary = useDeleteSalary();

    const [settings, setSettings] = useState(null);
    const [isTriggering, setIsTriggering] = useState(false);

    React.useEffect(() => {
        fetch('/api/settings').then(res => res.json()).then(data => {
            if (data.success) setSettings(data.settings);
        });
    }, []);

    const handleManualGeneration = async () => {
        setIsTriggering(true);
        try {
            const res = await fetch('/api/cron/monthly-invoices?force=true');
            const data = await res.json();
            if (data.success) {
                toast.success(`Payroll generated — Staff: ${data.results?.salary?.created ?? 0}, Wardens: ${data.results?.wardenSalaries?.created ?? 0}`);
            } else {
                toast.error(data.error || "Failed to generate payroll");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsTriggering(false);
        }
    };

    const filteredSalaries = useMemo(() => {
        const data = salaries || [];
        return data.filter(item => {
            const name = item.StaffProfile?.User?.name?.toLowerCase() || "";
            const email = item.StaffProfile?.User?.email?.toLowerCase() || "";
            const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
            const matchesHostel = filterHostel === "All" || item.StaffProfile?.User?.hostelId === filterHostel;
            const matchesStatus = filterStatus === "All" || item.status === filterStatus;
            if (activeTab === "appeals") return item.appealStatus && item.appealStatus !== "NONE";
            return matchesSearch && matchesHostel && matchesStatus;
        });
    }, [salaries, searchQuery, filterHostel, filterStatus, activeTab]);

    const stats = useMemo(() => {
        const data = salaries || [];
        const total = data.reduce((acc, c) => acc + Number(c.amount || 0), 0);
        const paidVolume = data.filter(s => s.status === 'PAID').reduce((acc, c) => acc + Number(c.amount || 0), 0);
        const pendingVolume = data.filter(s => s.status === 'PENDING').reduce((acc, c) => acc + Number(c.amount || 0), 0);
        const appealCount = data.filter(s => s.appealStatus === 'PENDING').length;
        return { total, paidVolume, pendingVolume, count: data.length, paidCount: data.filter(s => s.status === 'PAID').length, pendingCount: data.filter(s => s.status === 'PENDING').length, appealCount };
    }, [salaries]);

    const handleExportCSV = () => {
        const rows = filteredSalaries.map(s => [s.uid || s.id, s.StaffProfile?.User?.name, s.month, s.basicSalary, s.allowances, s.bonuses, s.deductions, s.amount, s.status, s.paymentMethod || 'N/A', s.paymentDate ? format(new Date(s.paymentDate), 'yyyy-MM-dd') : 'N/A']);
        const headers = ["ID", "Staff Name", "Month", "Basic", "Allowances", "Bonus", "Deductions", "Net", "Status", "Method", "Date"];
        const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `Staff_Payroll_${selectedMonth.replace(' ', '_')}.csv`;
        a.click(); URL.revokeObjectURL(url);
        toast.success("CSV exported!");
    };

    const handleExportPDF = async () => {
        setIsExportingSalaries(true);
        try {
            const doc = new jsPDF('landscape');
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, doc.internal.pageSize.width, 38, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("STAFF PAYROLL REPORT", doc.internal.pageSize.width / 2, 16, { align: "center" });
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text(`${selectedMonth}  ·  ${filteredSalaries.length} records  ·  PKR ${stats.total.toLocaleString()}`, doc.internal.pageSize.width / 2, 27, { align: "center" });
            doc.text(`Generated: ${format(new Date(), 'PPP p')}`, 14, 48);
            autoTable(doc, {
                startY: 55,
                head: [["#", "Name", "Month", "Basic", "Allow.", "Bonus", "Ded.", "Net", "Status", "Date"]],
                body: filteredSalaries.map((s, i) => [i + 1, s.StaffProfile?.User?.name || 'N/A', s.month, (s.basicSalary || 0).toLocaleString(), (s.allowances || 0).toLocaleString(), (s.bonuses || 0).toLocaleString(), (s.deductions || 0).toLocaleString(), (s.amount || 0).toLocaleString(), s.status, s.paymentDate ? format(new Date(s.paymentDate), 'dd/MM/yy') : 'N/A']),
                theme: 'grid',
                headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8 },
                bodyStyles: { fontSize: 7.5 },
                alternateRowStyles: { fillColor: [248, 250, 252] },
            });
            doc.save(`Staff_Payroll_${selectedMonth.replace(' ', '_')}.pdf`);
            toast.success("PDF exported!");
        } catch { toast.error("Export failed"); }
        finally { setIsExportingSalaries(false); }
    };

    const handleGeneratePayroll = async () => { try { await generatePayroll.mutateAsync({ month: currentMonth }); } catch { } };
    const handleEditOpen = (salary) => { setSelectedSalary(salary); setEditFormData({ basicSalary: salary.basicSalary, allowances: salary.allowances, bonuses: salary.bonuses, deductions: salary.deductions, notes: salary.notes || "" }); setIsEditDialogOpen(true); };
    const handleEditSubmit = async () => { try { await updateSalary.mutateAsync({ id: selectedSalary.id, ...editFormData }); setIsEditDialogOpen(false); } catch { } };
    const handlePayOpen = (salary) => { setSelectedSalary(salary); setIsPayDialogOpen(true); };
    const handlePaySubmit = async () => { try { await updateSalary.mutateAsync({ id: selectedSalary.id, status: 'PAID', ...payFormData, paymentDate: new Date(payFormData.paymentDate).toISOString() }); setIsPayDialogOpen(false); } catch { } };
    const handleAddSalarySubmit = async () => { try { await createSalary.mutateAsync(addSalaryForm); setIsAddSalaryDialogOpen(false); setAddSalaryForm({ staffId: "", month: currentMonth, customBonuses: 0, customDeductions: 0, customNotes: "" }); } catch { } };
    const handleResolveSubmit = async () => { try { await updateSalary.mutateAsync({ id: selectedSalary.id, ...resolveFormData }); setIsResolveDialogOpen(false); } catch { } };
    const handleDeleteConfirm = async () => { try { await deleteSalary.mutateAsync(selectedSalary.id); setIsDeleteDialogOpen(false); } catch { } };

    if (salariesLoading) return <GridPageSkeleton accentColor="bg-indigo-600" />;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background pb-24 font-sans">

            {/* ── Sticky Header ─────────────────────────────────────────── */}
            <div className="sticky top-0 z-40 bg-white/95 dark:bg-card/95 backdrop-blur border-b border-gray-100 dark:border-border">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                            <Wallet className="h-4.5 w-4.5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-gray-900 dark:text-foreground uppercase tracking-widest">Staff Salaries</h1>
                            <p className="text-[10px] text-gray-400 dark:text-muted-foreground font-bold uppercase tracking-wider">{filteredSalaries.length} Records · {currentMonth}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Cron status pill */}
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-muted/10 border border-gray-100 dark:border-border rounded-xl">
                            <span className={`h-2 w-2 rounded-full ${settings?.autoGenerateStaffSalaries ? 'bg-indigo-500 animate-pulse' : 'bg-gray-300'}`} />
                            <span className="text-[9px] font-black text-gray-500 dark:text-muted-foreground uppercase tracking-widest">
                                Auto {settings?.autoGenerateStaffSalaries ? 'ON' : 'OFF'}
                            </span>
                        </div>

                        {/* Search */}
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input placeholder="Search staff..." className="h-9 pl-9 w-[200px] rounded-xl border-gray-200 dark:border-border bg-gray-50 dark:bg-muted/10 text-xs font-bold" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>

                        {/* Hostel Filter */}
                        <Select value={filterHostel} onValueChange={setFilterHostel}>
                            <SelectTrigger className="h-9 w-[140px] rounded-xl border-gray-200 dark:border-border bg-white dark:bg-card text-[10px] font-black uppercase tracking-wider">
                                <SelectValue placeholder="All Hostels" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-xl">
                                <SelectItem value="All" className="text-[10px] font-black uppercase">All Hostels</SelectItem>
                                {hostels.map(h => <SelectItem key={h.id} value={h.id} className="text-[10px] font-bold uppercase">{h.name}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        {/* Generate Button */}
                        <Button onClick={handleManualGeneration} disabled={isTriggering}
                            className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none gap-2 transition-all active:scale-95">
                            {isTriggering ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                            Generate
                        </Button>

                        {/* Actions Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-gray-200 dark:border-border">
                                    <MoreVertical className="h-4 w-4 text-gray-500" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl p-2">
                                <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-gray-400 p-3">Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={handleGeneratePayroll} className="p-3 rounded-xl gap-3 text-[10px] font-black uppercase cursor-pointer">
                                    <Calculator className="h-4 w-4 text-indigo-600" /> Bulk Auto-Generate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsAddSalaryDialogOpen(true)} className="p-3 rounded-xl gap-3 text-[10px] font-black uppercase cursor-pointer">
                                    <Plus className="h-4 w-4 text-emerald-600" /> Add Single Record
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleExportPDF} className="p-3 rounded-xl gap-3 text-[10px] font-black uppercase cursor-pointer text-rose-600">
                                    <FileText className="h-4 w-4" /> Export PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportCSV} className="p-3 rounded-xl gap-3 text-[10px] font-black uppercase cursor-pointer text-emerald-600">
                                    <Boxes className="h-4 w-4" /> Export CSV
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

                {/* ── Stats Row ───────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Total Payroll", value: `PKR ${(stats.total / 1000).toFixed(1)}k`, sub: `${stats.count} records`, icon: TrendingUp, accent: "text-gray-900 dark:text-foreground", iconBg: "bg-gray-100 dark:bg-muted/20", bg: "bg-white dark:bg-card" },
                        { label: "Paid Out", value: `PKR ${(stats.paidVolume / 1000).toFixed(1)}k`, sub: `${stats.paidCount} paid`, icon: CheckCircle2, accent: "text-emerald-600", iconBg: "bg-emerald-100 dark:bg-emerald-950/40", bg: "bg-emerald-50/50 dark:bg-card" },
                        { label: "Pending", value: `PKR ${(stats.pendingVolume / 1000).toFixed(1)}k`, sub: `${stats.pendingCount} pending`, icon: Clock, accent: "text-amber-600", iconBg: "bg-amber-100 dark:bg-amber-950/40", bg: "bg-amber-50/50 dark:bg-card" },
                        { label: "Appeals", value: stats.appealCount, sub: "to review", icon: MessageSquare, accent: "text-rose-600", iconBg: "bg-rose-100 dark:bg-rose-950/40", bg: "bg-rose-50/50 dark:bg-card" },
                    ].map((s, i) => (
                        <div key={i} className={`${s.bg} border border-gray-100 dark:border-border rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all`}>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
                                <p className={`text-2xl font-black ${s.accent} leading-none`}>{s.value}</p>
                                <p className="text-[9px] text-gray-400 dark:text-muted-foreground font-bold uppercase tracking-wider mt-1">{s.sub}</p>
                            </div>
                            <div className={`h-11 w-11 ${s.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                                <s.icon className={`h-5 w-5 ${s.accent}`} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Appeals Alert ────────────────────────────────────────── */}
                {stats.appealCount > 0 && (
                    <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 rounded-2xl p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-rose-100 dark:bg-rose-950/40 rounded-xl flex items-center justify-center flex-shrink-0">
                                <MessageSquare className="h-5 w-5 text-rose-600" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-rose-900 dark:text-rose-200 uppercase tracking-wide">{stats.appealCount} Open Appeals</p>
                                <p className="text-[10px] text-rose-600 font-bold mt-0.5 uppercase tracking-wider">Require administrative attention</p>
                            </div>
                        </div>
                        <Button onClick={() => setActiveTab("appeals")}
                            className="h-9 px-5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl gap-2 flex-shrink-0 shadow-lg shadow-rose-200 dark:shadow-none">
                            Review <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                )}

                {/* ── Tab Switcher ─────────────────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 p-1.5 bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl shadow-sm">
                        {[
                            { key: "current", label: "This Month" },
                            { key: "appeals", label: "Appeals", badge: stats.appealCount },
                            { key: "history", label: "All History" },
                        ].map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.key ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md' : 'text-gray-400 dark:text-muted-foreground hover:text-gray-700 dark:hover:text-foreground'}`}>
                                {tab.label}
                                {tab.badge > 0 && <span className="h-4 w-4 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center">{tab.badge}</span>}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Status filter */}
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="h-8 w-[120px] rounded-xl border-gray-200 dark:border-border bg-white dark:bg-card text-[9px] font-black uppercase tracking-wider">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-xl">
                                <SelectItem value="All" className="text-[10px] font-black uppercase">All Status</SelectItem>
                                <SelectItem value="PENDING" className="text-[10px] font-black uppercase text-amber-600">Pending</SelectItem>
                                <SelectItem value="PAID" className="text-[10px] font-black uppercase text-emerald-600">Paid</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-gray-400 dark:text-muted-foreground font-bold uppercase tracking-wider">{filteredSalaries.length} shown</p>
                    </div>
                </div>

                {/* ── Salary Cards Grid ─────────────────────────────────────── */}
                <Tabs value={activeTab} className="mt-0">
                    <TabsContent value="current" className="mt-0">
                        {filteredSalaries.length === 0 ? (
                            <div className="text-center py-24 bg-white dark:bg-card border border-dashed border-gray-200 dark:border-border rounded-3xl">
                                <div className="h-16 w-16 bg-gray-50 dark:bg-muted/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Wallet className="h-8 w-8 text-gray-300 dark:text-muted-foreground" />
                                </div>
                                <p className="text-sm font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">No Salary Records</p>
                                <p className="text-[10px] text-gray-300 dark:text-muted-foreground font-bold mt-1 uppercase tracking-wider">Click Generate to create monthly payroll</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {filteredSalaries.map(salary => (
                                    <div key={salary.id} className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all group">

                                        {/* Card Top Bar */}
                                        <div className={`h-1 w-full ${salary.status === 'PAID' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} />

                                        {/* Card Header */}
                                        <div className="p-5 pb-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-11 w-11 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow-lg shadow-indigo-200 dark:shadow-none">
                                                        {salary.StaffProfile?.User?.name?.charAt(0) || "S"}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-black text-gray-900 dark:text-foreground">{salary.StaffProfile?.User?.name}</h3>
                                                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{salary.StaffProfile?.designation || "Staff"}</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <Building2 className="h-2.5 w-2.5 text-gray-400" />
                                                            <p className="text-[9px] text-gray-400 dark:text-muted-foreground font-bold uppercase">{salary.StaffProfile?.User?.Hostel_User_hostelIdToHostel?.name || "Unassigned"}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <StatusBadge status={salary.status} />
                                            </div>
                                        </div>

                                        {/* Salary Breakdown */}
                                        <div className="px-5 py-3 grid grid-cols-4 gap-2 bg-gray-50/60 dark:bg-muted/5 border-y border-gray-100 dark:border-border">
                                            {[
                                                { label: "Basic", val: salary.basicSalary || 0, color: "text-gray-900 dark:text-foreground" },
                                                { label: "Allow.", val: salary.allowances || 0, color: "text-blue-600" },
                                                { label: "Bonus", val: salary.bonuses || 0, color: "text-emerald-600" },
                                                { label: "Ded.", val: salary.deductions || 0, color: "text-rose-600" },
                                            ].map((item, i) => (
                                                <div key={i} className="text-center">
                                                    <p className="text-[8px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                                                    <p className={`text-[11px] font-black ${item.color}`}>{Number(item.val).toLocaleString()}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Net + Month */}
                                        <div className="px-5 py-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest mb-1">Net Salary</p>
                                                    <p className="text-xl font-black text-gray-900 dark:text-foreground">PKR {Number(salary.amount || 0).toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest mb-1">Period</p>
                                                    <p className="text-[10px] font-black text-gray-600 dark:text-muted-foreground uppercase">{salary.month}</p>
                                                    {salary.paymentDate && (
                                                        <p className="text-[9px] text-gray-400 dark:text-muted-foreground font-bold mt-0.5">
                                                            {format(new Date(salary.paymentDate), 'dd MMM yyyy')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="mt-3">
                                                <div className="h-1 bg-gray-100 dark:bg-muted/20 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-700 ${salary.status === 'PAID' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                                                        style={{ width: salary.status === 'PAID' ? '100%' : '40%' }} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="px-5 pb-5 flex items-center gap-2">
                                            {salary.status === 'PENDING' ? (
                                                <Button className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl gap-1.5 shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95"
                                                    onClick={() => handlePayOpen(salary)}>
                                                    <Coins className="h-3.5 w-3.5" /> Pay Now
                                                </Button>
                                            ) : (
                                                <Button className="flex-1 h-9 bg-white dark:bg-muted/10 border border-gray-200 dark:border-border hover:bg-gray-50 text-gray-900 dark:text-foreground text-[10px] font-black uppercase tracking-widest rounded-xl gap-1.5 transition-all"
                                                    onClick={() => { setSelectedSalary(salary); setIsSlipDialogOpen(true); }}>
                                                    <Eye className="h-3.5 w-3.5" /> View Slip
                                                </Button>
                                            )}

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-gray-200 dark:border-border hover:border-indigo-300 hover:bg-indigo-50">
                                                        <MoreVertical className="h-4 w-4 text-gray-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 shadow-xl">
                                                    <DropdownMenuItem onClick={() => { setSelectedSalary(salary); setIsSlipDialogOpen(true); }} className="p-3 rounded-xl gap-3 text-[10px] font-black uppercase cursor-pointer">
                                                        <FileText className="h-4 w-4" /> View Slip
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEditOpen(salary)} className="p-3 rounded-xl gap-3 text-[10px] font-black uppercase cursor-pointer">
                                                        <Settings2 className="h-4 w-4" /> Edit Record
                                                    </DropdownMenuItem>
                                                    {salary.appealStatus === 'PENDING' && (
                                                        <DropdownMenuItem onClick={() => { setSelectedSalary(salary); setIsResolveDialogOpen(true); }} className="p-3 rounded-xl gap-3 text-[10px] font-black uppercase text-amber-600 hover:bg-amber-50 cursor-pointer">
                                                            <MessageSquare className="h-4 w-4" /> Resolve Appeal
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => { setSelectedSalary(salary); setIsDeleteDialogOpen(true); }} className="p-3 rounded-xl gap-3 text-[10px] font-black uppercase text-rose-600 hover:bg-rose-50 cursor-pointer">
                                                        <Trash2 className="h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* ── Appeals Tab ──────────────────────────────────────── */}
                    <TabsContent value="appeals" className="mt-0">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                            {salaries?.filter(s => s.appealStatus && s.appealStatus !== 'NONE').length === 0 ? (
                                <div className="col-span-full py-24 bg-white dark:bg-card border border-dashed border-gray-200 dark:border-border rounded-3xl text-center">
                                    <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                    </div>
                                    <p className="text-sm font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">No Open Appeals</p>
                                    <p className="text-[10px] text-gray-300 dark:text-muted-foreground font-bold mt-1 uppercase">All salary appeals have been resolved</p>
                                </div>
                            ) : (
                                salaries?.filter(s => s.appealStatus && s.appealStatus !== 'NONE').map(salary => (
                                    <div key={salary.id} className="bg-white dark:bg-card border-2 border-rose-100 dark:border-rose-900/30 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                        <div className="h-1 bg-gradient-to-r from-rose-400 to-red-500" />
                                        <div className="p-6 bg-rose-50/30 dark:bg-rose-950/10 border-b border-rose-100 dark:border-rose-900/20">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-rose-100 dark:bg-rose-950/40 rounded-xl flex items-center justify-center">
                                                        <AlertCircle className="h-5 w-5 text-rose-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-gray-900 dark:text-foreground">{salary.StaffProfile?.User?.name}</h4>
                                                        <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">{salary.StaffProfile?.designation} · {salary.month}</p>
                                                    </div>
                                                </div>
                                                <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest">
                                                    {salary.appealStatus}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <div className="bg-gray-50 dark:bg-muted/10 rounded-2xl p-4 border border-gray-100 dark:border-border">
                                                <p className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest mb-2">Staff Message</p>
                                                <p className="text-xs font-bold text-gray-700 dark:text-foreground italic">"{salary.appealText || "No message provided."}"</p>
                                            </div>
                                            {salary.appealResponse && (
                                                <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/30">
                                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Admin Response</p>
                                                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">{salary.appealResponse}</p>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3">
                                                <Button variant="outline" className="flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-gray-200 dark:border-border"
                                                    onClick={() => { setSelectedSalary(salary); setIsSlipDialogOpen(true); }}>
                                                    <Eye className="h-3.5 w-3.5 mr-2" /> View Slip
                                                </Button>
                                                {salary.appealStatus === 'PENDING' && (
                                                    <Button className="flex-1 h-10 bg-gray-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg"
                                                        onClick={() => { setSelectedSalary(salary); setIsResolveDialogOpen(true); }}>
                                                        <Settings2 className="h-3.5 w-3.5" /> Resolve
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {(salaries || []).length === 0 ? (
                                <div className="col-span-full py-24 bg-white dark:bg-card border border-dashed border-gray-200 dark:border-border rounded-3xl text-center">
                                    <Wallet className="h-10 w-10 text-gray-200 mx-auto mb-4" />
                                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No History</p>
                                </div>
                            ) : (
                                (salaries || []).map(salary => (
                                    <div key={salary.id} className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-all gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black flex-shrink-0">
                                                {salary.StaffProfile?.User?.name?.charAt(0) || "S"}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-gray-900 dark:text-foreground">{salary.StaffProfile?.User?.name}</p>
                                                <p className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase">{salary.month}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-sm font-black text-gray-900 dark:text-foreground">PKR {Number(salary.amount || 0).toLocaleString()}</p>
                                            </div>
                                            <StatusBadge status={salary.status} />
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => { setSelectedSalary(salary); setIsSlipDialogOpen(true); }}>
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* ── Salary Slip Dialog ──────────────────────────────────────── */}
            <Dialog open={isSlipDialogOpen} onOpenChange={setIsSlipDialogOpen}>
                <DialogContent className="max-w-3xl p-0 bg-transparent border-none overflow-y-auto max-h-[95vh]">
                    {selectedSalary && <SalarySlip salary={selectedSalary} />}
                </DialogContent>
            </Dialog>

            {/* ── Pay Dialog ──────────────────────────────────────────────── */}
            <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-card">
                    <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 h-32 w-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="h-11 w-11 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-black uppercase tracking-widest">Confirm Payment</h2>
                                <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider mt-0.5">to {selectedSalary?.StaffProfile?.User?.name}</p>
                            </div>
                        </div>
                        <div className="mt-4 relative z-10">
                            <p className="text-[9px] text-emerald-300 font-black uppercase tracking-widest">Net Amount</p>
                            <p className="text-3xl font-black text-white mt-1">PKR {Number(selectedSalary?.amount || 0).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="p-8 space-y-5">
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Payment Method</Label>
                            <Select value={payFormData.paymentMethod} onValueChange={v => setPayFormData({ ...payFormData, paymentMethod: v })}>
                                <SelectTrigger className="h-11 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-black text-[10px] uppercase focus:ring-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl shadow-2xl">
                                    <SelectItem value="BANK_TRANSFER" className="text-[10px] font-black uppercase">Bank Transfer</SelectItem>
                                    <SelectItem value="CASH" className="text-[10px] font-black uppercase">Cash</SelectItem>
                                    <SelectItem value="ONLINE" className="text-[10px] font-black uppercase">Online Transfer</SelectItem>
                                    <SelectItem value="CHEQUE" className="text-[10px] font-black uppercase">Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Payment Date</Label>
                            <Input type="date" value={payFormData.paymentDate} onChange={e => setPayFormData({ ...payFormData, paymentDate: e.target.value })} className="rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-bold h-11 focus:ring-0" />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="flex-1 rounded-xl h-11 font-black text-[10px] uppercase tracking-widest border-gray-100 dark:border-border" onClick={() => setIsPayDialogOpen(false)}>Cancel</Button>
                            <Button className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-100 dark:shadow-none"
                                onClick={handlePaySubmit} disabled={updateSalary.isPending}>
                                {updateSalary.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm & Pay'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Edit Dialog ─────────────────────────────────────────────── */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-card">
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 h-32 w-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="h-11 w-11 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                                <Calculator className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-black uppercase tracking-widest">Edit Record</h2>
                                <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider mt-0.5">{selectedSalary?.StaffProfile?.User?.name} · {selectedSalary?.month}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: "Basic Salary", key: "basicSalary", color: "gray" },
                                { label: "Allowances", key: "allowances", color: "blue" },
                                { label: "Bonus", key: "bonuses", color: "emerald" },
                                { label: "Deductions", key: "deductions", color: "rose" },
                            ].map(f => (
                                <div key={f.key} className="space-y-2">
                                    <Label className={`text-[9px] font-black uppercase tracking-widest text-${f.color}-500`}>{f.label}</Label>
                                    <Input type="number" value={editFormData[f.key]} onChange={e => setEditFormData({ ...editFormData, [f.key]: Number(e.target.value) })}
                                        className="rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-black h-11 focus:ring-0" />
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Notes</Label>
                            <Textarea value={editFormData.notes} onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })}
                                className="rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-bold text-xs resize-none h-20 focus:ring-0" placeholder="Add notes..." />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="flex-1 rounded-xl h-11 font-black text-[10px] uppercase tracking-widest border-gray-100 dark:border-border" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                            <Button className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none"
                                onClick={handleEditSubmit} disabled={updateSalary.isPending}>
                                {updateSalary.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Add Single Record Dialog ─────────────────────────────────── */}
            <Dialog open={isAddSalaryDialogOpen} onOpenChange={setIsAddSalaryDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-card">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 h-32 w-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="h-11 w-11 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                                <Wallet2 className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-black uppercase tracking-widest">Add Salary Record</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Manual Entry</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Staff Member</Label>
                            <Select value={addSalaryForm.staffId} onValueChange={v => setAddSalaryForm({ ...addSalaryForm, staffId: v })}>
                                <SelectTrigger className="h-11 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-black text-xs focus:ring-0">
                                    <SelectValue placeholder="Choose staff member" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl shadow-2xl max-h-[300px]">
                                    {staffList?.map(s => <SelectItem key={s.id} value={s.id} className="text-xs font-bold">{s.User?.name} — {s.designation}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Month</Label>
                            <Input value={addSalaryForm.month} onChange={e => setAddSalaryForm({ ...addSalaryForm, month: e.target.value })}
                                className="h-11 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-black focus:ring-0" placeholder="e.g. July 2026" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Bonus</Label>
                                <Input type="number" value={addSalaryForm.customBonuses} onChange={e => setAddSalaryForm({ ...addSalaryForm, customBonuses: Number(e.target.value) })}
                                    className="rounded-xl border-emerald-50 bg-emerald-50/30 font-black h-11 text-emerald-600 focus:ring-0" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-rose-500">Deductions</Label>
                                <Input type="number" value={addSalaryForm.customDeductions} onChange={e => setAddSalaryForm({ ...addSalaryForm, customDeductions: Number(e.target.value) })}
                                    className="rounded-xl border-rose-50 bg-rose-50/30 font-black h-11 text-rose-600 focus:ring-0" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Notes</Label>
                            <Textarea value={addSalaryForm.customNotes} onChange={e => setAddSalaryForm({ ...addSalaryForm, customNotes: e.target.value })}
                                className="rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-bold text-xs resize-none h-20 focus:ring-0" placeholder="Add notes..." />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="flex-1 rounded-xl h-11 font-black text-[10px] uppercase tracking-widest border-gray-100 dark:border-border" onClick={() => setIsAddSalaryDialogOpen(false)}>Cancel</Button>
                            <Button className="flex-1 h-11 bg-gray-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl"
                                onClick={handleAddSalarySubmit} disabled={createSalary.isPending}>
                                {createSalary.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Record'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Resolve Appeal Dialog ─────────────────────────────────────── */}
            <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-card">
                    <div className="bg-gradient-to-br from-rose-600 to-red-800 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 h-32 w-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="h-11 w-11 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                                <MessageSquare className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-black uppercase tracking-widest">Resolve Appeal</h2>
                                <p className="text-[10px] text-rose-200 font-bold uppercase tracking-wider mt-0.5">for {selectedSalary?.StaffProfile?.User?.name}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 space-y-5">
                        {selectedSalary?.appealText && (
                            <div className="bg-gray-50 dark:bg-muted/10 rounded-2xl p-4 border border-gray-100 dark:border-border">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Staff Message</p>
                                <p className="text-xs font-bold text-gray-600 dark:text-muted-foreground italic">"{selectedSalary.appealText}"</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Resolution</Label>
                            <Select value={resolveFormData.appealStatus} onValueChange={v => setResolveFormData({ ...resolveFormData, appealStatus: v })}>
                                <SelectTrigger className="h-11 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-black text-[10px] uppercase focus:ring-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl shadow-2xl">
                                    <SelectItem value="RESOLVED" className="text-[10px] font-black uppercase text-emerald-600">Resolved</SelectItem>
                                    <SelectItem value="REJECTED" className="text-[10px] font-black uppercase text-rose-600">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Admin Response</Label>
                            <Textarea value={resolveFormData.appealResponse} onChange={e => setResolveFormData({ ...resolveFormData, appealResponse: e.target.value })}
                                className="rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-bold text-xs resize-none h-28 focus:ring-0"
                                placeholder="Write your response..." />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="flex-1 rounded-xl h-11 font-black text-[10px] uppercase tracking-widest border-gray-100 dark:border-border" onClick={() => setIsResolveDialogOpen(false)}>Cancel</Button>
                            <Button className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-rose-100 dark:shadow-none"
                                onClick={handleResolveSubmit} disabled={updateSalary.isPending}>
                                {updateSalary.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Finalize'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Delete Alert ─────────────────────────────────────────────── */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-8 max-w-sm text-center">
                    <div className="h-16 w-16 bg-rose-50 dark:bg-rose-950/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Trash2 className="h-8 w-8 text-rose-600" />
                    </div>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-black uppercase tracking-tight">Delete Record?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest leading-relaxed mt-2">
                            This will permanently remove the salary record. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-8">
                        <AlertDialogCancel className="h-11 w-full rounded-xl bg-gray-50 dark:bg-muted/10 border-none font-black text-[10px] uppercase tracking-widest">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="h-11 w-full rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-100 dark:shadow-none">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default SalariesPage;
