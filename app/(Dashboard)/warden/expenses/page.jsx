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
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import UnifiedReceipt from "@/components/receipt/UnifiedReceipt";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const WardenExpensesPage = () => {
    const { user } = useAuthStore();
    const hostelId = user?.hostelId;

    const [activeTab, setActiveTab] = useState("current");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterCategory, setFilterCategory] = useState("all");
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isExportingExpenses, setIsExportingExpenses] = useState(false);

    const currentMonthLabel = format(new Date(), 'MMMM yyyy');

    const { data: expenses, isLoading: expensesLoading } = useExpenses({
        hostelId: hostelId,
        status: filterStatus,
        category: filterCategory,
        ...(activeTab === "current" && {
            startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
            endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
        })
    });

    const { data: statsData, isLoading: statsLoading } = useExpenseStats(hostelId);
    const createExpense = useCreateExpense();

    const [newExpenseForm, setNewExpenseForm] = useState({
        title: "",
        category: "",
        amount: "",
        date: format(new Date(), 'yyyy-MM-dd'),
        description: "",
        submittedById: user?.id || ""
    });

    const handleAddSubmit = async () => {
        try {
            if (!newExpenseForm.title || !newExpenseForm.amount || !newExpenseForm.category) {
                toast.error("Please fill in all required fields");
                return;
            }
            await createExpense.mutateAsync({
                ...newExpenseForm,
                hostelId: hostelId,
                amount: parseFloat(newExpenseForm.amount),
                date: new Date(newExpenseForm.date).toISOString(),
                submittedById: user.id
            });
            setIsAddOpen(false);
            setNewExpenseForm({
                title: "",
                category: "",
                amount: "",
                date: format(new Date(), 'yyyy-MM-dd'),
                description: "",
                submittedById: user?.id || ""
            });
        } catch (error) {
            toast.error(error.message || "Failed to save expense");
        }
    };

    const filteredExpenses = useMemo(() => {
        if (!expenses) return [];
        return expenses.filter(exp => {
            return exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                exp.id.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [expenses, searchQuery]);

    const handleExportPDF = async () => {
        setIsExportingExpenses(true);
        try {
            const doc = new jsPDF('landscape');
            doc.setFont("helvetica", "bold");
            const stats = statsData?.summary || { totalAmount: 0, paidAmount: 0, pendingAmount: 0, totalCount: 0 };

            doc.setFillColor(79, 70, 229); // indigo-600
            doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.text("EXPENSE REPORT", doc.internal.pageSize.width / 2, 18, { align: "center" });
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Hostel: ${user?.Hostel?.name} | Period: ${activeTab === 'current' ? currentMonthLabel : 'All Time'}`, doc.internal.pageSize.width / 2, 26, { align: "center" });

            doc.setTextColor(80, 80, 80);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Generated On: ${format(new Date(), 'PPP p')}`, 14, 45);
            doc.text(`Total Expense: PKR ${stats.totalAmount.toLocaleString()}`, doc.internal.pageSize.width - 14, 45, { align: "right" });

            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.line(14, 49, doc.internal.pageSize.width - 14, 49);

            const headers = [["S.No", "Expense ID", "Date", "Title", "Category", "Amount", "Status"]];
            const rows = filteredExpenses.map((exp, index) => [
                index + 1,
                `EXP-${exp.id.slice(-8).toUpperCase()}`,
                format(new Date(exp.date), 'dd/MM/yyyy'),
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
                headStyles: { fillColor: [67, 56, 202], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9, halign: 'center' },
                didDrawPage: (data) => {
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);
                    doc.text("Page " + doc.internal.getNumberOfPages(), doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
                }
            });

            doc.save(`Expense_Report_${user?.Hostel?.name.replace(/\s+/g, '_')}_${format(new Date(), 'MMM_yyyy')}.pdf`);
            toast.success("Expense Report Exported!");
        } catch (error) {
            toast.error("Failed to export PDF");
        } finally {
            setIsExportingExpenses(false);
        }
    };

    if (expensesLoading || statsLoading) return (
        <div className="flex h-screen items-center justify-center bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
    );

    const stats = statsData?.summary || { totalAmount: 0, paidAmount: 0, pendingAmount: 0, totalCount: 0 };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-indigo-600 rounded-full" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">Expense Tracking</h1>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Branch: {user?.Hostel?.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="h-9 px-4 rounded-xl border-indigo-200 bg-indigo-50 font-bold text-[10px] uppercase tracking-wider text-indigo-700 hover:bg-indigo-100 shadow-sm"
                            onClick={handleExportPDF}
                            disabled={isExportingExpenses}
                        >
                            {isExportingExpenses ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Download className="h-3.5 w-3.5 mr-2" />}
                            Export PDF
                        </Button>
                        <Button
                            className="h-9 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider"
                            onClick={() => setIsAddOpen(true)}
                        >
                            <Plus className="h-3.5 w-3.5 mr-2" /> Add Expense
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Expenses', value: `PKR ${(stats.totalAmount / 1000).toFixed(1)}k`, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Paid Expenses', value: `PKR ${(stats.paidAmount / 1000).toFixed(1)}k`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Pending Expenses', value: `PKR ${(stats.pendingAmount / 1000).toFixed(1)}k`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Total Count', value: stats.totalCount, icon: History, color: 'text-purple-600', bg: 'bg-purple-50' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                            <div className={`h-11 w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                                <span className="text-xl font-bold text-gray-900 tracking-tight">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-2 flex items-center gap-4 shadow-sm">
                    <div className="flex-1 relative w-full group px-2">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by ID or Title..."
                            className="w-full h-12 pl-10 border-none shadow-none font-bold text-sm focus-visible:ring-0"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-white border border-gray-100 p-1 rounded-xl h-11">
                        <TabsTrigger value="current" className="h-full px-8 rounded-lg font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                            This Month
                        </TabsTrigger>
                        <TabsTrigger value="history" className="h-full px-8 rounded-lg font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                            All Time
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="current" className="space-y-4">
                        {filteredExpenses.map((expense) => (
                            <div
                                key={expense.id}
                                className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col lg:flex-row items-center gap-8 hover:shadow-md cursor-pointer transition-shadow"
                                onClick={() => { setSelectedExpense(expense); setIsDetailOpen(true); }}
                            >
                                <div className="flex items-center gap-6 flex-1">
                                    <div className="h-14 w-14 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                        <Receipt className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="text-base font-bold text-gray-900 uppercase tracking-tight">{expense.title}</h4>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{expense.category}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-[1.5]">
                                    <div>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Date</span>
                                        <p className="text-sm font-bold text-blue-600 uppercase">{format(new Date(expense.date), 'MMM dd, yyyy')}</p>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Amount</span>
                                        <p className="text-sm font-bold text-rose-600">PKR {expense.amount.toLocaleString()}</p>
                                    </div>
                                    <Badge variant="outline" className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest w-fit h-fit ${expense.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                        {expense.status}
                                    </Badge>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-300" />
                            </div>
                        ))}
                    </TabsContent>
                </Tabs>
            </main>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-xl p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-white">
                    <div className="bg-indigo-600 p-10 text-white text-center">
                        <h2 className="text-2xl font-bold uppercase tracking-tight">Add New Expense</h2>
                    </div>
                    <div className="p-10 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest">Title*</Label>
                                <Input value={newExpenseForm.title} onChange={e => setNewExpenseForm({ ...newExpenseForm, title: e.target.value })} className="rounded-xl h-12" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest">Category*</Label>
                                <select className="w-full h-12 rounded-xl border-gray-100 bg-gray-50 px-4 text-[10px] font-bold uppercase outline-none" value={newExpenseForm.category} onChange={e => setNewExpenseForm({ ...newExpenseForm, category: e.target.value })}>
                                    <option value="">Select Category</option>
                                    {['UTILITIES', 'MAINTENANCE', 'SALARIES', 'SUPPLIES', 'GROCERIES', 'OTHER'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest">Amount*</Label>
                                <Input type="number" value={newExpenseForm.amount} onChange={e => setNewExpenseForm({ ...newExpenseForm, amount: e.target.value })} className="rounded-xl h-12 font-bold text-rose-600" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest">Date*</Label>
                                <Input type="date" value={newExpenseForm.date} onChange={e => setNewExpenseForm({ ...newExpenseForm, date: e.target.value })} className="rounded-xl h-12" />
                            </div>
                        </div>
                        <Textarea placeholder="Description..." value={newExpenseForm.description} onChange={e => setNewExpenseForm({ ...newExpenseForm, description: e.target.value })} className="rounded-xl h-24" />
                        <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest rounded-xl shadow-lg" onClick={handleAddSubmit} disabled={createExpense.isPending}>
                            {createExpense.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Expense'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WardenExpensesPage;
