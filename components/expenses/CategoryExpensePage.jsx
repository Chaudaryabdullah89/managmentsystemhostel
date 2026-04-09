"use client"
import React, { useState, useMemo } from "react";
import {
    ChevronRight,
    ChevronLeft,
    Search,
    Download,
    Plus,
    CheckCircle2,
    Clock,
    Calendar,
    Receipt,
    Zap,
    ShieldCheck,
    Wallet,
    History,
    BarChart3,
    Loader2,
    Filter,
    X,
    Building2,
    User,
    FileText,
    Trash2,
    Sparkles,
    Pencil,
    Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import useAuthStore from "@/hooks/Authstate";
import { useExpenses, useExpenseStats, useCreateExpense, useUpdateExpenseStatus, useDeleteExpense, useUpdateExpenseFields } from "@/hooks/useExpenses";
import { useHostel } from "@/hooks/usehostel";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import UnifiedReceipt from "@/components/receipt/UnifiedReceipt";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ListPageSkeleton } from "@/components/ui/skeletons";
import Link from "next/link";

/**
 * Reusable category-specific expense page.
 * Aligned with the premium design system of Dashboard, Payments, and Bookings.
 */
export default function CategoryExpensePage({ category, backHref, isAdmin = false }) {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState("current");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isExportingExpenses, setIsExportingExpenses] = useState(false);
    const [quickTitle, setQuickTitle] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editDraft, setEditDraft] = useState({ title: "", amount: "" });

    const currentMonthLabel = format(new Date(), 'MMMM yyyy');

    // Granular permission check
    const hasPermission = isAdmin ||
        user?.role === 'ADMIN' ||
        user?.canManageExpenses ||
        (category.perm && user?.[category.perm]);

    // Enhanced state initialization
    const [filterHostel, setFilterHostel] = useState(() => {
        if (!isAdmin && user?.role === 'WARDEN') return user.hostelId;
        return "all";
    });

    // Auto-sync filterHostel when user loads (handles initial undefined user)
    React.useEffect(() => {
        if (user?.role === 'WARDEN' && !isAdmin && filterHostel === 'all') {
            setFilterHostel(user.hostelId);
        }
    }, [user, isAdmin]);

    const BASE_PARAMS = {
        hostelId: filterHostel,
        status: filterStatus,
        category: category.key,
    };

    console.log(`[Frontend] Fetching Category Expenses:`, { ...BASE_PARAMS, activeTab, user: !!user });

    const { data: expenses, isLoading: expensesLoading } = useExpenses({
        ...BASE_PARAMS,
        ...(activeTab === "current" && {
            startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
            endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        })
    });

    const { data: hostelsData } = useHostel();
    const hostels = hostelsData?.data || [];

    const createExpense = useCreateExpense();
    const updateStatus = useUpdateExpenseStatus();
    const deleteExpense = useDeleteExpense();
    const updateExpenseFields = useUpdateExpenseFields();

    const [newExpenseForm, setNewExpenseForm] = useState({
        title: "",
        category: category.key,
        amount: "",
        hostelId: (!isAdmin && user?.role === 'WARDEN') ? user.hostelId : "",
        date: format(new Date(), 'yyyy-MM-dd'),
        description: "",
        submittedById: user?.id || ""
    });
    const QUICK_AMOUNTS = [1000, 2500, 5000, 10000, 25000];
    const quickTitles = {
        MESS: ["Milk & Groceries", "Kitchen Supplies", "Daily Food Purchase"],
        GENERAL: ["Office Stationery", "Cleaning Material", "Operational Expense"],
        UTILITY_BILL: ["Electricity Bill", "Internet Bill", "Water Bill"],
        MAINTENANCE: ["Plumbing Repair", "Electric Repair", "Room Maintenance"],
        SALARY: ["Staff Salary Adjustment", "Advance Salary", "Payroll Correction"],
    };

    // Sync form hostelId when user loads
    React.useEffect(() => {
        if (user?.role === 'WARDEN' && !isAdmin && !newExpenseForm.hostelId) {
            setNewExpenseForm(prev => ({ ...prev, hostelId: user.hostelId }));
        }
    }, [user, isAdmin]);

    const filteredExpenses = useMemo(() => {
        if (!expenses) return [];
        return expenses.filter(exp => {
            const q = searchQuery.toLowerCase();
            const amountText = String(exp.amount || "");
            return (
                exp.title.toLowerCase().includes(q) ||
                exp.id.toLowerCase().includes(q) ||
                (exp.Hostel?.name || '').toLowerCase().includes(q) ||
                amountText.includes(q)
            );
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [expenses, searchQuery]);

    const latestEntry = useMemo(() => {
        if (!filteredExpenses?.length) return null;
        return filteredExpenses[0];
    }, [filteredExpenses]);

    const stats = useMemo(() => {
        const total = filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0);
        const paid = filteredExpenses.filter(e => e.status === 'PAID').reduce((s, e) => s + (e.amount || 0), 0);
        const pending = filteredExpenses.filter(e => e.status === 'PENDING').length;
        const count = filteredExpenses.length;
        return { total, paid, pending, count };
    }, [filteredExpenses]);

    // Permissions check - moved AFTER hooks to prevent React Hook violation (Rendered more/fewer hooks than during previous render)
    if (!hasPermission && user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50/50 p-6 font-sans">
                <div className="bg-white border border-gray-100 rounded-[3rem] p-12 shadow-xl flex flex-col items-center text-center max-w-md animate-in fade-in zoom-in duration-500">
                    <div className="h-20 w-20 rounded-[2rem] bg-rose-50 flex items-center justify-center mb-6">
                        <ShieldCheck className="h-10 w-10 text-rose-500" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Access Restricted</h1>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2 mb-8 leading-relaxed">
                        You do not have permission to access the {category.label} ledger.
                    </p>
                    <Link href={backHref}>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-12 font-bold uppercase tracking-wider text-[10px] shadow-lg shadow-blue-100 flex items-center gap-2">
                            Go Back
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const handleAddSubmit = async () => {
        try {
            if (!newExpenseForm.title || !newExpenseForm.amount || !newExpenseForm.hostelId) {
                toast.error("Please fill in all required fields");
                return;
            }
            if (Number(newExpenseForm.amount) <= 0) {
                toast.error("Amount must be greater than zero");
                return;
            }
            if (!user?.id) { toast.error("User identity verification failed"); return; }
            await createExpense.mutateAsync({
                ...newExpenseForm,
                category: category.key,
                amount: parseFloat(newExpenseForm.amount),
                date: new Date(newExpenseForm.date).toISOString(),
                submittedById: user.id
            });
            setIsAddOpen(false);
            setNewExpenseForm({
                title: "",
                category: category.key,
                amount: "",
                hostelId: (!isAdmin && user?.role === 'WARDEN') ? user.hostelId : "",
                date: format(new Date(), 'yyyy-MM-dd'),
                description: "",
                submittedById: user?.id || ""
            });
            toast.success("Expense added successfully!");
        } catch (error) {
            toast.error(error.message || "Failed to save expense");
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            if (!user) { toast.error("Authorization failed"); return; }
            await updateStatus.mutateAsync({
                id, status: newStatus,
                approvedById: (newStatus === 'APPROVED' || newStatus === 'PAID') ? user.id : null,
                rejectedById: newStatus === 'REJECTED' ? user.id : null
            });
            setIsDetailOpen(false);
            toast.success(`Status updated to ${newStatus}`);
        } catch (error) {
            toast.error(error.message || "Failed to update status");
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm("Are you sure you want to PERMANENTLY delete this expense record? This action cannot be undone.")) return;
        try {
            await deleteExpense.mutateAsync(id);
            setIsDetailOpen(false);
            setSelectedExpense(null);
        } catch (error) {
            toast.error(error.message || "Failed to delete record");
        }
    };

    const startInlineEdit = (expense, e) => {
        e.stopPropagation();
        setEditingId(expense.id);
        setEditDraft({ title: expense.title || "", amount: String(expense.amount || "") });
    };

    const cancelInlineEdit = (e) => {
        e.stopPropagation();
        setEditingId(null);
        setEditDraft({ title: "", amount: "" });
    };

    const saveInlineEdit = async (expenseId, e) => {
        e.stopPropagation();
        try {
            const nextTitle = String(editDraft.title || "").trim();
            const nextAmount = Number(editDraft.amount);
            if (!nextTitle) {
                toast.error("Title is required");
                return;
            }
            if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
                toast.error("Enter a valid amount greater than zero");
                return;
            }
            await updateExpenseFields.mutateAsync({
                id: expenseId,
                title: nextTitle,
                amount: nextAmount,
            });
            setEditingId(null);
            setEditDraft({ title: "", amount: "" });
        } catch (error) {
            toast.error(error.message || "Failed to update expense");
        }
    };

    const handleExportCSV = () => {
        const headers = ["ID", "Date", "Hostel", "Title", "Amount", "Status"];
        const rows = filteredExpenses.map(exp => [
            `EXP-${exp.id.slice(-8).toUpperCase()}`,
            format(new Date(exp.date), 'yyyy-MM-dd'),
            (exp.Hostel?.name || '').replace(',', ''),
            exp.title.replace(',', ''),
            exp.amount,
            exp.status
        ]);
        const csv = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${category.label}_Expenses_${format(new Date(), 'yyyyMMdd')}.csv`;
        link.click();
        toast.success("CSV Exported!");
    };

    const handleExportPDF = async () => {
        setIsExportingExpenses(true);
        try {
            const doc = new jsPDF('landscape');
            doc.setFillColor(37, 99, 235); // Blue-600
            doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text(`${category.label.toUpperCase()} EXPENSE REPORT`, doc.internal.pageSize.width / 2, 18, { align: "center" });
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`${activeTab === 'current' ? currentMonthLabel : 'All History'} | ${filteredExpenses.length} Records Found`, doc.internal.pageSize.width / 2, 26, { align: "center" });

            doc.setTextColor(100, 116, 139); // Slate-500
            doc.setFontSize(9);
            doc.text(`Generated on: ${format(new Date(), 'PPP p')}`, 14, 45);
            doc.text(`Total Category Spending: PKR ${stats.total.toLocaleString()}`, doc.internal.pageSize.width - 14, 45, { align: "right" });

            autoTable(doc, {
                startY: 55,
                head: [["S.No", "Expense ID", "Date", "Hostel", "Title", "Amount", "Status"]],
                body: filteredExpenses.map((exp, i) => [
                    i + 1,
                    `EXP-${exp.id.slice(-8).toUpperCase()}`,
                    format(new Date(exp.date), 'dd/MM/yyyy'),
                    exp.Hostel?.name || 'N/A',
                    exp.title,
                    `PKR ${exp.amount.toLocaleString()}`,
                    exp.status
                ]),
                theme: 'grid',
                headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
                bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                styles: { cellPadding: 4, valign: 'middle' },
            });
            doc.save(`${category.label}_Report_${format(new Date(), 'MMM_yyyy')}.pdf`);
            toast.success("PDF Exported!");
        } catch { toast.error("Failed to export PDF"); }
        finally { setIsExportingExpenses(false); }
    };

    const applyLastEntry = () => {
        if (!latestEntry) {
            toast.error("No previous entry found");
            return;
        }
        setNewExpenseForm((prev) => ({
            ...prev,
            title: latestEntry.title || "",
            amount: String(latestEntry.amount || ""),
            description: latestEntry.description || "",
            date: format(new Date(), 'yyyy-MM-dd'),
        }));
        toast.success("Copied from latest entry");
    };

    if (expensesLoading) return <ListPageSkeleton />;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Header — Same pattern as all dashboard pages */}
            <div className="bg-white border-b sticky top-0 z-50 py-2 md:h-16">
                <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-4">
                        <Link href={backHref} className="h-9 w-9 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors group">
                            <ChevronLeft className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                        </Link>
                        <div className="h-8 w-1 bg-blue-600 rounded-full" />
                        <div className="flex flex-col">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight uppercase">{category.label} Expenses</h1>
                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400">{category.description}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-2 mr-2">
                            <Button variant="ghost" className="h-9 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600" onClick={handleExportCSV}>
                                <Download className="h-3.5 w-3.5 mr-2" /> CSV
                            </Button>
                            <Button variant="ghost" className="h-9 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600" onClick={handleExportPDF} disabled={isExportingExpenses}>
                                {isExportingExpenses ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Download className="h-3.5 w-3.5 mr-2" />} PDF
                            </Button>
                        </div>
                        {(searchQuery || filterStatus !== "all" || filterHostel !== "all") && (
                            <Button
                                variant="ghost"
                                className="h-9 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-rose-600"
                                onClick={() => {
                                    setSearchQuery("");
                                    setFilterStatus("all");
                                    setFilterHostel(!isAdmin && user?.role === "WARDEN" ? user.hostelId : "all");
                                }}
                            >
                                Clear
                            </Button>
                        )}
                        <Button className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider gap-2 shadow-lg shadow-blue-100" onClick={() => setIsAddOpen(true)}>
                            <Plus className="h-4 w-4" /> Add Record
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
                {/* Stats Row — 4 slots for density */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {[
                        { label: 'Total Volume', value: `PKR ${stats.total.toLocaleString()}`, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Paid Amount', value: `PKR ${stats.paid.toLocaleString()}`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Pending Count', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Total Records', value: stats.count, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm">
                            <div className={`h-9 w-9 md:h-11 md:w-11 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>
                                <s.icon className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{s.label}</span>
                                <span className="text-sm md:text-xl font-bold text-gray-900 tracking-tight truncate">{s.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter & Search Bar — Unified modern aesthetic */}
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="bg-white border border-gray-100 rounded-2xl p-1.5 flex flex-1 items-center gap-3 shadow-sm w-full group focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-600" />
                        </div>
                        <Input
                            placeholder={`Search ${category.label} entries by title or ID...`}
                            className="border-none shadow-none focus-visible:ring-0 font-bold text-xs bg-transparent h-10 px-0 placeholder:text-gray-300"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-gray-100" onClick={() => setSearchQuery("")}>
                                <X className="h-3 w-3 text-gray-400" />
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 p-1 bg-white border border-gray-100 rounded-2xl shadow-sm w-full md:w-auto overflow-x-auto scrollbar-hide">
                        {/* Hostel Selector */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 px-4 rounded-xl font-bold text-[9px] uppercase tracking-widest text-gray-500 hover:bg-gray-50 gap-2 shrink-0">
                                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                                    {filterHostel === 'all' ? 'All Hostels' : hostels.find(h => h.id === filterHostel)?.name || 'Hostel'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl border-gray-100 shadow-xl p-2 w-56">
                                <DropdownMenuItem onClick={() => setFilterHostel('all')} className="rounded-xl h-10 font-bold text-[10px] uppercase tracking-wider">All Hostels</DropdownMenuItem>
                                {hostels.map(h => (
                                    <DropdownMenuItem key={h.id} onClick={() => setFilterHostel(h.id)} className="rounded-xl h-10 font-bold text-[10px] uppercase tracking-wider">{h.name}</DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="h-4 w-px bg-gray-100" />

                        {/* Status Selector */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 px-4 rounded-xl font-bold text-[9px] uppercase tracking-widest text-gray-500 hover:bg-gray-50 gap-2 shrink-0">
                                    <Filter className="h-3.5 w-3.5 text-gray-400" />
                                    {filterStatus === 'all' ? 'Status: All' : filterStatus}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl border-gray-100 shadow-xl p-2 w-48">
                                {['all', 'PENDING', 'APPROVED', 'REJECTED', 'PAID'].map(st => (
                                    <DropdownMenuItem key={st} onClick={() => setFilterStatus(st)} className="rounded-xl h-10 font-bold text-[10px] uppercase tracking-wider">{st}</DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {!isAdmin && user?.role === "WARDEN" && (
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant={filterStatus === "PENDING" ? "default" : "outline"}
                            className={`h-8 rounded-lg text-[9px] font-bold uppercase tracking-widest ${filterStatus === "PENDING" ? "bg-amber-500 hover:bg-amber-600 text-white" : "border-gray-200 text-gray-600"}`}
                            onClick={() => setFilterStatus("PENDING")}
                        >
                            Pending First
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 rounded-lg text-[9px] font-bold uppercase tracking-widest border-gray-200 text-gray-600"
                            onClick={() => {
                                setFilterStatus("all");
                                setSearchQuery("");
                                setActiveTab("current");
                            }}
                        >
                            Today Workflow
                        </Button>
                    </div>
                )}

                {/* Tabs & Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <TabsList className="bg-white border border-gray-100 p-1 rounded-xl h-11 shadow-sm w-full sm:w-auto">
                            <TabsTrigger value="current" className="h-full px-6 rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
                                <Zap className="h-3.5 w-3.5 mr-2" /> Current Ledger
                            </TabsTrigger>
                            <TabsTrigger value="history" className="h-full px-6 rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
                                <History className="h-3.5 w-3.5 mr-2" /> Full History
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white border border-gray-100 px-4 py-2.5 rounded-xl shadow-sm self-end sm:self-auto">
                            Found <span className="text-blue-600">{filteredExpenses.length}</span> Records
                        </div>
                    </div>

                    <TabsContent value={activeTab} className="space-y-3 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {filteredExpenses.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-gray-100 rounded-[3rem] p-16 md:p-32 text-center">
                                <div className="h-20 w-20 rounded-[2rem] bg-gray-50 flex items-center justify-center mx-auto mb-6">
                                    <Receipt className="h-10 w-10 text-gray-200" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Empty Ledger</h3>
                                <p className="text-gray-400 font-bold text-[9px] uppercase tracking-[0.2em] mt-2 max-w-xs mx-auto">
                                    No {category.label.toLowerCase()} expenses found for the selected filters.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => { setFilterHostel('all'); setFilterStatus('all'); setSearchQuery(''); }}
                                    className="mt-8 rounded-xl h-11 px-8 font-bold uppercase text-[10px] tracking-widest hover:bg-gray-50 border-gray-100 text-gray-500"
                                >
                                    Reset Filters
                                </Button>
                            </div>
                        ) : (
                            filteredExpenses.map(expense => (
                                <div
                                    key={expense.id}
                                    className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md transition-all group relative overflow-hidden cursor-pointer active:scale-[0.99]"
                                    onClick={() => {
                                        if (editingId) return;
                                        setSelectedExpense(expense);
                                        setIsDetailOpen(true);
                                    }}
                                >
                                    {/* Vertical Ribbon — Visual categorization */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${expense.status === 'PAID' ? 'bg-emerald-500' : expense.status === 'REJECTED' ? 'bg-rose-500' : expense.status === 'APPROVED' ? 'bg-blue-500' : 'bg-amber-400'} opacity-80 rounded-l-2xl`} />

                                    <div className="flex items-center gap-4 flex-1 min-w-0 pl-3">
                                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                                            <span className="text-xl">{category.Icon ? <category.Icon className={`h-5 w-5 ${expense.status === 'PAID' ? 'text-emerald-500' : 'text-gray-400'}`} /> : '🧾'}</span>
                                        </div>
                                        <div className="flex flex-col min-w-0 w-full">
                                            <div className="flex items-center gap-2 w-full">
                                                {editingId === expense.id ? (
                                                    <Input
                                                        value={editDraft.title}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={(e) => setEditDraft((prev) => ({ ...prev, title: e.target.value }))}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") saveInlineEdit(expense.id, e);
                                                            if (e.key === "Escape") cancelInlineEdit(e);
                                                        }}
                                                        className="h-8 rounded-lg border-gray-200 bg-white text-[12px] font-bold"
                                                        placeholder="Expense title"
                                                    />
                                                ) : (
                                                    <h4 className="text-[13px] font-bold text-gray-900 uppercase tracking-tight truncate">{expense.title}</h4>
                                                )}
                                                <Badge variant="outline" className="text-[8px] font-mono border-gray-100 text-gray-400 px-1.5 py-0 h-4">EXP-{expense.id.slice(-5).toUpperCase()}</Badge>
                                            </div>
                                            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5">
                                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                                    <Building2 className="h-2.5 w-2.5" />
                                                    {expense.Hostel?.name}
                                                </span>
                                                <div className="h-1 w-1 rounded-full bg-gray-200" />
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                    <Calendar className="h-2.5 w-2.5" />
                                                    {format(new Date(expense.date), 'dd MMM yyyy')}
                                                </span>
                                                {expense.User_Expense_submittedByIdToUser?.name && (
                                                    <>
                                                        <div className="h-1 w-1 rounded-full bg-gray-200" />
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                            <User className="h-2.5 w-2.5" />
                                                            {expense.User_Expense_submittedByIdToUser.name}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 self-end md:self-auto pl-14 md:pl-0">
                                        <div className="flex flex-col items-end shrink-0">
                                            {editingId === expense.id ? (
                                                <Input
                                                    type="number"
                                                    value={editDraft.amount}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => setEditDraft((prev) => ({ ...prev, amount: e.target.value }))}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") saveInlineEdit(expense.id, e);
                                                        if (e.key === "Escape") cancelInlineEdit(e);
                                                    }}
                                                    className="h-8 w-28 rounded-lg border-gray-200 bg-white text-[12px] font-bold text-right"
                                                />
                                            ) : (
                                                <span className="text-base md:text-lg font-bold text-gray-900 tracking-tight">PKR {expense.amount.toLocaleString()}</span>
                                            )}
                                            <Badge className={`mt-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-none shadow-sm ${expense.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                                                expense.status === 'APPROVED' ? 'bg-blue-50 text-blue-700' :
                                                    expense.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' :
                                                        'bg-amber-50 text-amber-700'
                                                }`}>{expense.status}</Badge>
                                        </div>
                                        {hasPermission && (
                                            editingId === expense.id ? (
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                                        onClick={(e) => saveInlineEdit(expense.id, e)}
                                                        disabled={updateExpenseFields.isPending}
                                                    >
                                                        {updateExpenseFields.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg border-gray-200"
                                                        onClick={cancelInlineEdit}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg border-gray-200"
                                                    onClick={(e) => startInlineEdit(expense, e)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            )
                                        )}
                                        <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:translate-x-1 transition-all">
                                            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-600" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </main>

            {/* Add Expense — Consistent Dialog Style */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-xl max-h-[90vh] p-0 overflow-y-auto rounded-[2rem] border-none shadow-2xl bg-white animate-in zoom-in-95 duration-200">
                    <div className="bg-blue-600 p-8 text-white relative flex items-center gap-6 overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-full bg-white/10 skew-x-12 translate-x-12" />
                        <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/10 backdrop-blur-sm text-2xl">
                            {category.Icon ? <category.Icon className="h-6 w-6" /> : '🧾'}
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold uppercase tracking-tight">Add {category.label} Record</h2>
                            <p className="text-[10px] text-blue-100 font-bold tracking-widest uppercase mt-0.5">Submit new financial entry</p>
                        </div>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-blue-600 mb-2 flex items-center gap-1.5">
                                <Sparkles className="h-3 w-3" /> Quick Fill
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                <button
                                    type="button"
                                    onClick={applyLastEntry}
                                    className="h-8 px-3 rounded-lg border border-blue-100 bg-white text-[9px] font-bold uppercase tracking-wider text-blue-700"
                                >
                                    Repeat Last Entry
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {(quickTitles[category.key] || []).map((title) => (
                                    <button
                                        key={title}
                                        type="button"
                                        onClick={() => {
                                            setQuickTitle(title);
                                            setNewExpenseForm((prev) => ({ ...prev, title }));
                                        }}
                                        className={`h-8 px-3 rounded-lg border text-[9px] font-bold uppercase tracking-wider ${quickTitle === title ? "border-blue-200 bg-blue-100 text-blue-700" : "border-blue-100 bg-white text-blue-600"
                                            }`}
                                    >
                                        {title}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {QUICK_AMOUNTS.map((amount) => (
                                    <button
                                        key={amount}
                                        type="button"
                                        onClick={() => setNewExpenseForm((prev) => ({ ...prev, amount: String(amount) }))}
                                        className="h-8 px-3 rounded-lg border border-blue-100 bg-white text-[9px] font-bold uppercase tracking-wider text-blue-600"
                                    >
                                        PKR {amount.toLocaleString()}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2 col-span-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Objective / Title*</Label>
                                <Input placeholder="e.g., Monthly Electricity Bill" value={newExpenseForm.title} onChange={e => setNewExpenseForm({ ...newExpenseForm, title: e.target.value })} className="rounded-xl border-gray-100 bg-gray-50 h-12 font-bold text-sm px-4 focus:bg-white transition-all" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Grand Amount (PKR)*</Label>
                                <Input type="number" placeholder="0.00" value={newExpenseForm.amount} onChange={e => setNewExpenseForm({ ...newExpenseForm, amount: e.target.value })} className="rounded-xl border-gray-100 bg-gray-50 h-12 font-bold text-sm px-4 focus:bg-white transition-all" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Entry Date*</Label>
                                <Input type="date" value={newExpenseForm.date} onChange={e => setNewExpenseForm({ ...newExpenseForm, date: e.target.value })} className="rounded-xl border-gray-100 bg-gray-50 h-12 font-bold text-sm px-4 focus:bg-white transition-all" />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Hostel Authority*</Label>
                                {(!isAdmin && user?.role === 'WARDEN') ? (
                                    <div className="w-full h-12 rounded-xl border border-gray-100 bg-gray-50/50 px-4 flex items-center gap-3">
                                        <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
                                            {hostels.find(h => h.id === user.hostelId)?.name || "Assigned Hostel Facility"}
                                        </span>
                                        <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-[8px] font-black uppercase text-blue-600 tracking-tighter">
                                            <ShieldCheck className="h-3 w-3" /> Locked
                                        </div>
                                    </div>
                                ) : (
                                    <select
                                        className="w-full h-12 rounded-xl border border-gray-100 bg-gray-50 px-4 text-[11px] font-bold uppercase tracking-wider outline-none focus:bg-white focus:ring-1 focus:ring-blue-100 transition-all cursor-pointer"
                                        value={newExpenseForm.hostelId}
                                        onChange={e => setNewExpenseForm({ ...newExpenseForm, hostelId: e.target.value })}
                                    >
                                        <option value="">Select Hostel Facility</option>
                                        {hostels.map(h => (
                                            <option key={h.id} value={h.id}>{h.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Ref. Notes / Description</Label>
                            <Textarea placeholder="Additional context for auditing..." value={newExpenseForm.description} onChange={e => setNewExpenseForm({ ...newExpenseForm, description: e.target.value })} className="rounded-xl border-gray-100 bg-gray-50 font-medium text-sm px-4 py-3 resize-none h-24 focus:bg-white transition-all" />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="ghost" className="flex-1 rounded-xl h-12 font-bold text-[10px] uppercase tracking-widest text-gray-400" onClick={() => setIsAddOpen(false)}>Discard</Button>
                            <Button
                                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                                onClick={handleAddSubmit}
                                disabled={createExpense.isPending}
                            >
                                {createExpense.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck className="h-4 w-4" /> Finalize Entry</>}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Expense Detail — Voucher Style */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white animate-in slide-in-from-bottom-4 duration-300">
                    {selectedExpense && (
                        <>
                            <div className={`p-8 md:p-10 text-white relative overflow-hidden ${selectedExpense.status === 'PAID' ? 'bg-emerald-600' :
                                selectedExpense.status === 'APPROVED' ? 'bg-blue-600' :
                                    selectedExpense.status === 'REJECTED' ? 'bg-rose-700' :
                                        'bg-slate-800'
                                }`}>
                                <div className="absolute top-0 right-0 w-72 h-full bg-white/10 skew-x-12 translate-x-32" />
                                <div className="flex flex-col md:flex-row md:justify-between items-start relative z-10 gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/10 text-3xl shrink-0">
                                            {category.Icon ? <category.Icon className="h-8 w-8" /> : '🧾'}
                                        </div>
                                        <div className="flex flex-col">
                                            <Badge className="bg-white/20 text-white border-none text-[8px] font-black uppercase tracking-[0.2em] w-fit mb-2">{category.label}</Badge>
                                            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight leading-tight">{selectedExpense.title}</h2>
                                            <div className="flex items-center gap-2 mt-2 opacity-80">
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{selectedExpense.Hostel?.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-3 w-full md:w-auto">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-white/60 block">Settlement Amount</span>
                                            <div className="text-3xl md:text-4xl font-bold tracking-tighter">PKR {selectedExpense.amount.toLocaleString()}</div>
                                        </div>
                                        <Badge className={`text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full border-none ${selectedExpense.status === 'PAID' ? 'bg-emerald-500' :
                                            selectedExpense.status === 'APPROVED' ? 'bg-blue-500' :
                                                selectedExpense.status === 'REJECTED' ? 'bg-rose-600' :
                                                    'bg-amber-400 text-amber-900'
                                            } shadow-lg shadow-black/10`}>{selectedExpense.status}</Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 md:p-10 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                                <History className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Filing Timeline</span>
                                                <p className="text-sm font-bold text-gray-900 leading-tight">{format(new Date(selectedExpense.date), 'PPPP')}</p>
                                                <p className="text-[10px] font-medium text-gray-400 mt-1">Submitted {format(new Date(selectedExpense.createdAt || new Date()), 'p')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                                <Building2 className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Hostel Facility</span>
                                                <p className="text-sm font-bold text-gray-900">{selectedExpense.Hostel?.name}</p>
                                                <p className="text-[10px] font-medium text-gray-400 mt-1">ID: {selectedExpense.hostelId?.slice(-6).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                                <User className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Originator</span>
                                                <p className="text-sm font-bold text-gray-900">{selectedExpense.User_Expense_submittedByIdToUser?.name || 'Authorized User'}</p>
                                                <Badge variant="outline" className="mt-1 text-[8px] font-bold border-gray-100 bg-gray-50 text-gray-500 uppercase px-2">{selectedExpense.User_Expense_submittedByIdToUser?.role || 'Staff'}</Badge>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                                <FileText className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Record ID</span>
                                                <Badge className="bg-slate-100 text-slate-700 border-none font-mono font-bold text-[10px] px-2">EXP-{selectedExpense.id.slice(-10).toUpperCase()}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {selectedExpense.description && (
                                    <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 relative group transition-all hover:bg-white hover:border-blue-100">
                                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest block mb-3 group-hover:text-blue-400 transition-colors">Audit Notes & Context</span>
                                        <p className="text-sm font-medium text-slate-600 italic leading-relaxed">&ldquo; {selectedExpense.description} &rdquo;</p>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-50">
                                    {isAdmin && (
                                        <div className="flex gap-3 flex-1 order-2 sm:order-1">
                                            {selectedExpense.status === 'PENDING' ? (
                                                <>
                                                    <Button className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-100" onClick={() => handleStatusUpdate(selectedExpense.id, 'APPROVED')}>Authorize</Button>
                                                    <Button variant="outline" className="flex-1 h-12 border-rose-100 text-rose-600 hover:bg-rose-50 font-bold text-[10px] uppercase tracking-widest rounded-xl" onClick={() => handleStatusUpdate(selectedExpense.id, 'REJECTED')}>Reject</Button>
                                                </>
                                            ) : (selectedExpense.status === 'APPROVED' || selectedExpense.status === 'PARTIAL') ? (
                                                <Button className="w-full h-12 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-blue-100" onClick={() => handleStatusUpdate(selectedExpense.id, 'PAID')}>Mark as Settled</Button>
                                            ) : null}
                                            <Button
                                                variant="ghost"
                                                className="h-12 px-4 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 group transition-all"
                                                onClick={() => handleDeleteExpense(selectedExpense.id)}
                                                disabled={deleteExpense.isPending}
                                            >
                                                {deleteExpense.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    )}
                                    <div className="flex-1 sm:max-w-[200px] order-1 sm:order-2 ml-auto">
                                        <UnifiedReceipt data={selectedExpense} type="expense">
                                            <Button variant="outline" className="w-full h-12 border-gray-200 text-slate-600 hover:bg-gray-50 font-bold text-[10px] uppercase tracking-widest rounded-xl gap-2">
                                                <Download className="h-4 w-4" /> Export Voucher
                                            </Button>
                                        </UnifiedReceipt>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
