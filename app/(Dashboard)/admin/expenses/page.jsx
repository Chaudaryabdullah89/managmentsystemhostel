"use client"
import React, { useState, useMemo } from "react";
import {
    ChevronRight,
    Search,
    Download,
    Plus,
    DollarSign,
    CheckCircle2,
    Clock,
    Building2,
    Calendar,
    Receipt,
    TrendingDown,
    FileText,
    Filter,
    ArrowUpRight,
    Zap,
    ShieldCheck,
    Wallet,
    History,
    MoreVertical,
    Trash2,
    Eye,
    BarChart3,
    ArrowDownRight,
    Info,
    RefreshCw,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import useAuthStore from "@/hooks/Authstate";
import { useExpenses, useExpenseStats, useCreateExpense, useUpdateExpenseStatus } from "@/hooks/useExpenses";
import { useHostel } from "@/hooks/usehostel";
// import { useAuth } from "@/hooks/useAuth"; // Removed as we use Authstate
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import UnifiedReceipt from "@/components/receipt/UnifiedReceipt";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Loader from "@/components/ui/Loader";

const ExpensesPage = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState("current");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterHostel, setFilterHostel] = useState("all");
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isExportingExpenses, setIsExportingExpenses] = useState(false);

    const currentMonthLabel = format(new Date(), 'MMMM yyyy');

    // Queries
    const { data: expenses, isLoading: expensesLoading } = useExpenses({
        hostelId: filterHostel,
        status: filterStatus,
        category: filterCategory,
        ...(activeTab === "current" && {
            startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
            endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
        })
    });
    const { data: statsData, isLoading: statsLoading } = useExpenseStats(filterHostel);
    const { data: hostelsData } = useHostel();
    const hostels = hostelsData?.data || [];

    // Mutations
    const createExpense = useCreateExpense();
    const updateStatus = useUpdateExpenseStatus();

    const [newExpenseForm, setNewExpenseForm] = useState({
        title: "",
        category: "",
        amount: "",
        hostelId: "",
        date: format(new Date(), 'yyyy-MM-dd'),
        description: "",
        submittedById: user?.id || ""
    });

    const handleAddSubmit = async () => {
        try {
            if (!newExpenseForm.title || !newExpenseForm.amount || !newExpenseForm.hostelId || !newExpenseForm.category) {
                toast.error("Please fill in all required fields");
                return;
            }
            if (!user?.id) {
                toast.error("User identity verification failed");
                return;
            }
            await createExpense.mutateAsync({
                ...newExpenseForm,
                amount: parseFloat(newExpenseForm.amount),
                date: new Date(newExpenseForm.date).toISOString(),
                submittedById: user.id
            });
            setIsAddOpen(false);
            setNewExpenseForm({
                title: "",
                category: "",
                amount: "",
                hostelId: "",
                date: format(new Date(), 'yyyy-MM-dd'),
                description: "",
                submittedById: user?.id || ""
            });
        } catch (error) {
            console.error("Error:", error);
            toast.error(error.message || "Failed to save expense");
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            if (!user) {
                toast.error("Authorization failed: No user found");
                return;
            }
            await updateStatus.mutateAsync({
                id,
                status: newStatus,
                approvedById: (newStatus === 'APPROVED' || newStatus === 'PAID') ? user.id : null,
                rejectedById: newStatus === 'REJECTED' ? user.id : null
            });
            setIsDetailOpen(false);
        } catch (error) {
            console.error("Error:", error);
            toast.error(error.message || "Failed to update status");
        }
    };

    const filteredExpenses = useMemo(() => {
        if (!expenses) return [];
        return expenses.filter(exp => {
            const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                exp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                exp.Hostel?.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [expenses, searchQuery]);

    const handleExportCSV = () => {
        const headers = ["ID", "Date", "Hostel", "Title", "Category", "Amount", "Status"];
        const rows = filteredExpenses.map(exp => [
            `EXP-${exp.id.slice(-8).toUpperCase()}`,
            format(new Date(exp.date), 'yyyy-MM-dd'),
            exp.Hostel?.name.replace(',', ''),
            exp.title.replace(',', ''),
            exp.category,
            exp.amount,
            exp.status
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Expenses_${format(new Date(), 'yyyyMMdd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Expenses CSV Exported!");
    };

    const handleExportPDF = async () => {
        setIsExportingExpenses(true);
        try {
            const doc = new jsPDF('landscape');
            doc.setFont("helvetica", "bold");
            const stats = statsData?.summary || { totalAmount: 0, paidAmount: 0, pendingAmount: 0, totalCount: 0 };

            // Header Section
            doc.setFillColor(79, 70, 229); // indigo-600
            doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.text("EXPENSE REPORT", doc.internal.pageSize.width / 2, 18, { align: "center" });
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Period: ${activeTab === 'current' ? currentMonthLabel : 'All Time'} | Record Count: ${filteredExpenses.length}`, doc.internal.pageSize.width / 2, 26, { align: "center" });

            doc.setTextColor(80, 80, 80);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Generated On: ${format(new Date(), 'PPP p')}`, 14, 45);
            doc.text(`Total Expense: PKR ${stats.totalAmount.toLocaleString()}`, doc.internal.pageSize.width - 14, 45, { align: "right" });

            // Draw Line
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.line(14, 49, doc.internal.pageSize.width - 14, 49);

            const headers = [
                ["S.No", "Expense ID", "Date", "Hostel", "Title", "Category", "Amount", "Status"]
            ];

            const rows = filteredExpenses.map((exp, index) => [
                index + 1,
                `EXP-${exp.id.slice(-8).toUpperCase()}`,
                format(new Date(exp.date), 'dd/MM/yyyy'),
                exp.Hostel?.name || 'N/A',
                exp.title,
                exp.category,
                `PKR ${exp.amount.toLocaleString()}`,
                exp.status
            ]);

            autoTable(doc, {
                startY: 55,
                head: headers,
                body: rows,
                theme: 'grid',
                headStyles: {
                    fillColor: [67, 56, 202], // indigo-700
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 9,
                    halign: 'center'
                },
                bodyStyles: {
                    fontSize: 9,
                    textColor: [50, 50, 50]
                },
                alternateRowStyles: {
                    fillColor: [245, 247, 255]
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },
                },
                styles: {
                    overflow: 'linebreak',
                    cellPadding: 4,
                    valign: 'middle'
                },
                didDrawPage: function (data) {
                    let str = "Page " + doc.internal.getNumberOfPages();
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);
                    doc.text(str, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
                    doc.text("Official GreenView Expense Tracking", 14, doc.internal.pageSize.height - 10);
                }
            });

            doc.save(`Expense_Report_${format(new Date(), 'MMM_yyyy')}.pdf`);
            toast.success("Expense Report Exported! \uD83D\uDCC4");
        } catch (error) {
            toast.error("Failed to export PDF");
            console.error(error);
        } finally {
            setIsExportingExpenses(false);
        }
    };

    if (expensesLoading || statsLoading) return <Loader label="Loading" subLabel="Updates..." icon={Receipt} fullScreen={false} />;

    const stats = statsData?.summary || { totalAmount: 0, paidAmount: 0, pendingAmount: 0, totalCount: 0 };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight print:hidden">
            {/* Premium Header - Synchronized Design */}
            <div className="bg-white border-b sticky top-0 z-50 py-2 md:h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-8 w-1 bg-indigo-600 rounded-full shrink-0" />
                        <div className="flex flex-col">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight uppercase">Expenses</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400">Hostel</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-emerald-600">Live</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                className="h-9 px-3 md:px-4 rounded-xl border-gray-200 bg-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-600 flex-1 sm:flex-none flex items-center justify-center gap-2"
                                onClick={handleExportCSV}
                            >
                                <Download className="h-3.5 w-3.5 text-gray-400" /> <span className="hidden sm:inline">Export CSV</span><span className="inline sm:hidden">CSV</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-9 px-3 md:px-4 rounded-xl border-indigo-200 bg-indigo-50 font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-indigo-700 hover:bg-indigo-100 transition-all shadow-sm flex-1 sm:flex-none flex items-center justify-center gap-2"
                                onClick={handleExportPDF}
                                disabled={isExportingExpenses}
                            >
                                {isExportingExpenses ? <Loader2 className="h-3.5 w-3.5 text-indigo-700 animate-spin" /> : <Download className="h-3.5 w-3.5 text-indigo-700" />}
                                <span className="hidden sm:inline">Export PDF</span><span className="inline sm:hidden">PDF</span>
                            </Button>
                        </div>
                        <Button
                            className="h-9 px-4 md:px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider shadow-sm transition-all flex-1 sm:flex-none flex items-center justify-center gap-2"
                            onClick={() => setIsAddOpen(true)}
                        >
                            <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add New</span><span className="inline sm:hidden">New</span>
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Metrics Matrix - Standardized Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {[
                        { label: 'Total', value: `PKR ${(stats.totalAmount / 1000).toFixed(1)}k`, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Paid', value: `PKR ${(stats.paidAmount / 1000).toFixed(1)}k`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Pending', value: `PKR ${(stats.pendingAmount / 1000).toFixed(1)}k`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'History', value: stats.totalCount, icon: History, color: 'text-purple-600', bg: 'bg-purple-50' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl p-4 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm group hover:shadow-md transition-shadow min-w-0">
                            <div className={`h-9 w-9 md:h-11 md:w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                <stat.icon className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{stat.label}</span>
                                <span className="text-sm md:text-xl font-bold text-gray-900 tracking-tight truncate">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Operations Bar - Unified Search & Filter */}
                <div className="bg-white border border-gray-100 rounded-2xl p-2 flex flex-col md:flex-row items-center gap-2 md:gap-4 shadow-sm">
                    <div className="flex-1 relative w-full group">
                        <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                        <Input
                            placeholder="Search"
                            className="w-full h-11 md:h-12 pl-10 md:pl-12 bg-transparent border-none shadow-none font-bold text-xs md:text-sm focus-visible:ring-0 placeholder:text-gray-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="h-8 w-px bg-gray-100 mx-2 hidden md:block" />

                    <div className="flex items-center gap-1.5 md:gap-2 p-1 bg-gray-50 rounded-xl w-full md:w-auto overflow-x-auto scrollbar-hide">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 md:h-10 px-3 md:px-4 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 flex-1 md:flex-none">
                                    <Building2 className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                    <span className="truncate">{filterHostel === 'all' ? 'Hostel' : hostels.find(h => h.id === filterHostel)?.name}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[240px] rounded-xl">
                                <DropdownMenuItem onClick={() => setFilterHostel('all')}>Hostel</DropdownMenuItem>
                                {hostels.map(h => (
                                    <DropdownMenuItem key={h.id} onClick={() => setFilterHostel(h.id)} className="text-[10px] font-bold uppercase tracking-wider">
                                        {h.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 md:h-10 px-3 md:px-4 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 flex-1 md:flex-none">
                                    <Zap className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                    <span className="truncate">{filterCategory === 'all' ? 'Category' : filterCategory}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px] rounded-xl">
                                {['all', 'UTILITIES', 'MAINTENANCE', 'SALARIES', 'SUPPLIES', 'GROCERIES', 'OTHER'].map(cat => (
                                    <DropdownMenuItem key={cat} onClick={() => setFilterCategory(cat)} className="text-[10px] font-bold uppercase tracking-wider">
                                        {cat}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 md:h-10 px-3 md:px-4 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 flex-1 md:flex-none">
                                    <ShieldCheck className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                    <span className="truncate">{filterStatus === 'all' ? 'Status' : filterStatus}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px] rounded-xl">
                                {['all', 'PENDING', 'APPROVED', 'REJECTED', 'PAID'].map(st => (
                                    <DropdownMenuItem key={st} onClick={() => setFilterStatus(st)} className="text-[10px] font-bold uppercase tracking-wider">
                                        {st}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                    <TabsList className="bg-white border border-gray-100 p-1 rounded-xl h-11 w-full lg:w-auto shadow-sm overflow-x-auto scrollbar-hide flex justify-start lg:justify-center">
                        <TabsTrigger value="current" className="h-full px-4 md:px-8 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wider data-[state=active]:bg-indigo-600 data-[state=active]:text-white shrink-0">
                            <Zap className="h-3.5 w-3.5 mr-2" /> Month <span className="hidden sm:inline">({currentMonthLabel})</span>
                        </TabsTrigger>
                        <TabsTrigger value="history" className="h-full px-4 md:px-8 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wider data-[state=active]:bg-indigo-600 data-[state=active]:text-white shrink-0">
                            <History className="h-3.5 w-3.5 mr-2" /> All Time
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="current" className="space-y-4">
                        {filteredExpenses.map((expense) => (
                            <div
                                key={expense.id}
                                className="bg-white border border-gray-100 rounded-2xl p-4 md:p-6 flex flex-col lg:flex-row items-center justify-between gap-4 md:gap-8 hover:shadow-md transition-shadow group relative overflow-hidden cursor-pointer"
                                onClick={() => { setSelectedExpense(expense); setIsDetailOpen(true); }}
                            >
                                <div className={`absolute left-0 top-0 bottom-0 w-1 md:w-1.5 ${expense.status === 'PAID' ? 'bg-emerald-500' : expense.status === 'APPROVED' ? 'bg-blue-500' : expense.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500'} opacity-70`} />

                                <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0 w-full lg:w-auto">
                                    <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-indigo-600 transition-colors shrink-0">
                                        <Receipt className="h-5 w-5 md:h-6 md:w-6 text-gray-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <h4 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-tight truncate">{expense.title}</h4>
                                        <div className="flex items-center flex-wrap gap-2 md:gap-3 mt-0.5 md:mt-1">
                                            <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{expense.category}</span>
                                            <div className="h-0.5 w-0.5 rounded-full bg-gray-200" />
                                            <span className="text-[9px] md:text-[10px] font-bold text-emerald-600 uppercase tracking-widest truncate">{expense.Hostel?.name}</span>
                                        </div>
                                    </div>
                                    <div className="lg:hidden">
                                        <Badge variant="outline" className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${expense.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : expense.status === 'APPROVED' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                            {expense.status}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 flex-[1.5] w-full min-w-0 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:pl-8 border-gray-50">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Date</span>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3 text-blue-400 shrink-0" />
                                            <p className="text-[10px] md:text-xs font-bold text-gray-600 uppercase truncate">{format(new Date(expense.date), 'MMM dd, yyyy')}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Amount</span>
                                        <div className="flex items-center gap-1.5">
                                            <DollarSign className="h-3 w-3 text-rose-400 shrink-0" />
                                            <p className="text-[10px] md:text-xs font-black text-rose-600 uppercase truncate">PKR {expense.amount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="col-span-2 md:col-span-1 flex items-center justify-between md:justify-start">
                                        <Badge variant="outline" className={`px-3 md:px-4 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${expense.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : expense.status === 'APPROVED' ? 'bg-blue-50 text-blue-700 border-blue-100' : expense.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'} shadow-sm`}>
                                            {expense.status}
                                        </Badge>
                                        <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-gray-300 md:ml-auto group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredExpenses.length === 0 && (
                            <div className="bg-white border border-dashed border-gray-200 rounded-[2rem] p-24 text-center">
                                <BarChart3 className="h-16 w-16 text-gray-200 mx-auto mb-6" />
                                <h3 className="text-xl font-bold text-gray-900 uppercase">Empty</h3>
                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Clear</p>
                                <Button
                                    onClick={() => { setFilterHostel('all'); setFilterCategory('all'); setFilterStatus('all'); }}
                                    className="mt-8 bg-indigo-600 text-white rounded-xl px-8 h-12 font-bold uppercase text-[10px] tracking-widest"
                                >
                                    Reset Filters
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="history" className="space-y-4 outline-none">
                        {filteredExpenses.length > 0 ? filteredExpenses.map((expense) => (
                            <div
                                key={expense.id}
                                className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col lg:flex-row items-center gap-4 lg:gap-8 hover:shadow-md cursor-pointer transition-all min-w-0 relative group"
                                onClick={() => { setSelectedExpense(expense); setIsDetailOpen(true); }}
                            >
                                <div className={`absolute left-0 top-0 bottom-0 w-1 md:w-1.5 ${expense.status === 'PAID' ? 'bg-emerald-500' : expense.status === 'APPROVED' ? 'bg-blue-500' : expense.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500'} opacity-70`} />

                                <div className="flex items-center gap-4 md:gap-6 flex-1 w-full min-w-0">
                                    <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                        <Receipt className="h-5 w-5 md:h-6 md:w-6 text-gray-400 group-hover:text-indigo-600" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <h4 className="text-[13px] md:text-base font-bold text-gray-900 uppercase tracking-tight truncate">{expense.title}</h4>
                                        <div className="flex items-center flex-wrap gap-2 md:gap-3 mt-0.5 md:mt-1">
                                            <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{expense.category}</span>
                                            <div className="h-0.5 w-0.5 rounded-full bg-gray-200" />
                                            <span className="text-[9px] md:text-[10px] font-bold text-emerald-600 uppercase tracking-widest truncate">{expense.Hostel?.name}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 flex-[1.5] w-full min-w-0 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:pl-8 border-gray-50">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Date</span>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3 text-blue-400 shrink-0" />
                                            <p className="text-[10px] md:text-xs font-bold text-gray-600 uppercase truncate">{format(new Date(expense.date), 'MMM dd, yyyy')}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Amount</span>
                                        <div className="flex items-center gap-1.5">
                                            <DollarSign className="h-3 w-3 text-rose-400 shrink-0" />
                                            <p className="text-[10px] md:text-xs font-black text-rose-600 uppercase truncate">PKR {expense.amount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="col-span-2 md:col-span-1 flex items-center justify-between md:justify-start">
                                        <Badge variant="outline" className={`px-3 md:px-4 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${expense.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : expense.status === 'APPROVED' ? 'bg-blue-50 text-blue-700 border-blue-100' : expense.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'} shadow-sm`}>
                                            {expense.status}
                                        </Badge>
                                        <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-gray-300 md:ml-auto group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="py-20 md:py-32 text-center bg-white border border-dashed border-gray-100 rounded-[2.5rem] px-6">
                                <Receipt className="h-10 w-10 md:h-12 md:w-12 text-gray-100 mx-auto mb-4" />
                                <h3 className="text-sm md:text-lg font-black text-gray-900 uppercase tracking-widest">Clear</h3>
                                <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">No records.</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </main>

            {/* Add Expense Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-xl p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-white">
                    <div className="bg-indigo-600 p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                        <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/10 shadow-lg">
                            <Plus className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold uppercase tracking-tight">New</h2>
                        <p className="text-[10px] text-indigo-100 font-bold tracking-[0.2em] mt-2 uppercase tracking-widest">Details</p>
                    </div>
                    <div className="p-10 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Title*</Label>
                                <Input
                                    placeholder="e.g., Electricity Bill"
                                    value={newExpenseForm.title}
                                    onChange={e => setNewExpenseForm({ ...newExpenseForm, title: e.target.value })}
                                    className="rounded-xl border-gray-100 bg-gray-50 h-12 font-bold text-xs focus:ring-1 focus:ring-indigo-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Category*</Label>
                                <select
                                    className="w-full h-12 rounded-xl border-gray-100 bg-gray-50 px-4 text-[10px] font-bold uppercase tracking-wider focus:ring-1 focus:ring-indigo-600 outline-none"
                                    value={newExpenseForm.category}
                                    onChange={e => setNewExpenseForm({ ...newExpenseForm, category: e.target.value })}
                                >
                                    <option value="">Category</option>
                                    {['UTILITIES', 'MAINTENANCE', 'SALARIES', 'SUPPLIES', 'GROCERIES', 'OTHER'].map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Amount*</Label>
                                <Input
                                    type="number"
                                    placeholder="PKR 0.00"
                                    value={newExpenseForm.amount}
                                    onChange={e => setNewExpenseForm({ ...newExpenseForm, amount: e.target.value })}
                                    className="rounded-xl border-gray-100 bg-gray-50 h-12 font-bold text-rose-600 focus:ring-1 focus:ring-indigo-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Hostel*</Label>
                                <select
                                    className="w-full h-12 rounded-xl border-gray-100 bg-gray-50 px-4 text-[10px] font-bold uppercase tracking-wider focus:ring-1 focus:ring-indigo-600 outline-none"
                                    value={newExpenseForm.hostelId}
                                    onChange={e => setNewExpenseForm({ ...newExpenseForm, hostelId: e.target.value })}
                                >
                                    <option value="">Hostel</option>
                                    {hostels.map(h => (
                                        <option key={h.id} value={h.id}>{h.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Date*</Label>
                            <Input
                                type="date"
                                value={newExpenseForm.date}
                                onChange={e => setNewExpenseForm({ ...newExpenseForm, date: e.target.value })}
                                className="rounded-xl border-gray-100 bg-gray-50 h-12 font-bold text-xs"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</Label>
                            <Textarea
                                placeholder="Notes"
                                value={newExpenseForm.description}
                                onChange={e => setNewExpenseForm({ ...newExpenseForm, description: e.target.value })}
                                className="rounded-xl border-gray-100 bg-gray-50 font-medium text-xs resize-none h-24"
                            />
                        </div>
                        <div className="flex gap-4 pt-4">
                            <Button variant="ghost" className="flex-1 rounded-xl h-12 font-bold text-[10px] uppercase tracking-wider text-gray-400" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button
                                className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2"
                                onClick={handleAddSubmit}
                                disabled={createExpense.isPending}
                            >
                                {createExpense.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck className="h-4 w-4" /> Save</>}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Expense Details Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-3xl bg-white">
                    {selectedExpense && (
                        <>
                            <div className={`p-10 text-white relative overflow-hidden ${selectedExpense.status === 'PAID' ? 'bg-emerald-600' : selectedExpense.status === 'APPROVED' ? 'bg-indigo-600' : 'bg-slate-900'}`}>
                                <div className="absolute top-0 right-0 w-64 h-full bg-white/10 skew-x-12 translate-x-32" />
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex flex-col gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/10">
                                            <Receipt className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold uppercase tracking-tight">{selectedExpense.title}</h2>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge className="bg-white/20 text-white border-none text-[8px] font-bold uppercase tracking-widest">{selectedExpense.category}</Badge>
                                                <div className="h-1 w-1 rounded-full bg-white/50" />
                                                <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{selectedExpense.Hostel?.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Amount</span>
                                            <div className="text-3xl font-bold tracking-tighter">PKR {selectedExpense.amount.toLocaleString()}</div>
                                        </div>
                                        <UnifiedReceipt data={selectedExpense} type="expense">
                                            <Button variant="outline" className="h-8 bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold text-[8px] uppercase tracking-widest rounded-lg">
                                                <Download className="h-3 w-3 mr-1" /> Receipt
                                            </Button>
                                        </UnifiedReceipt>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Expense ID</span>
                                            <Badge className="bg-gray-100 text-gray-700 border-none text-[10px] font-mono font-bold px-2 py-0.5 w-fit">
                                                EXP-{selectedExpense.id.slice(-8).toUpperCase()}
                                            </Badge>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Date Added</span>
                                            <p className="text-sm font-bold text-gray-900">{format(new Date(selectedExpense.date), 'PPPP')}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">User</span>
                                            <p className="text-sm font-bold text-gray-900">{selectedExpense.User_Expense_submittedByIdToUser?.name} ({selectedExpense.User_Expense_submittedByIdToUser?.role})</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Hostel</span>
                                            <p className="text-sm font-bold text-gray-900">{selectedExpense.Hostel?.city} Network</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Notes</span>
                                    <p className="text-sm font-medium text-gray-700 leading-relaxed">
                                        "{selectedExpense.description || 'No details.'}"
                                    </p>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    {selectedExpense.status === 'PENDING' ? (
                                        <>
                                            <Button
                                                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-600/20"
                                                onClick={() => handleStatusUpdate(selectedExpense.id, 'APPROVED')}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex-1 h-12 border-rose-100 text-rose-600 hover:bg-rose-50 font-bold text-[10px] uppercase tracking-widest rounded-xl"
                                                onClick={() => handleStatusUpdate(selectedExpense.id, 'REJECTED')}
                                            >
                                                Reject
                                            </Button>
                                        </>
                                    ) : (selectedExpense.status === 'APPROVED' || selectedExpense.status === 'PARTIAL') ? (
                                        <Button
                                            className="w-full h-12 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg"
                                            onClick={() => handleStatusUpdate(selectedExpense.id, 'PAID')}
                                        >
                                            Pay
                                        </Button>
                                    ) : (
                                        <div className="w-full h-12 bg-gray-100 rounded-xl flex items-center justify-center gap-3">
                                            <ShieldCheck className={`h-4 w-4 ${selectedExpense.status === 'PAID' ? 'text-emerald-500' : 'text-gray-400'}`} />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status: {selectedExpense.status}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ExpensesPage;
