"use client"
import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    ArrowLeft, User, Mail, Phone, MapPin, Calendar,
    Clock, ShieldCheck, Building2, Hash, CreditCard,
    DollarSign, History, AlertCircle, CheckCircle2,
    Briefcase, Loader2, Wallet, Plus, Trash2, Settings2, Eye, EyeOff,
    TrendingUp, TrendingDown, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserById } from "@/hooks/useusers";
import { useReports } from "@/hooks/useReports";
import { useWardenPayments, usePayWarden } from "@/hooks/useWardenSalaries";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { DetailPageSkeleton } from "@/components/ui/skeletons";
import { useEffect, useState } from "react";
import { checkAuth } from "@/hooks/Authstate";
import SalarySlip from "@/components/SalarySlip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import PageHeader from "@/components/Dashboard/PageHeader";
import SectionTitle from "@/components/Dashboard/SectionTitle";
import ErrorState from "@/components/ui/states/ErrorState";

const WardenProfilePage = () => {
    const params = useParams();
    const queryClient = useQueryClient();
    const {
        data: user,
        isLoading,
        error,
        isError: isUserError,
        refetch: refetchUser,
    } = useUserById(params.id);
    const { data: reports, isLoading: reportsLoading } = useReports('month', user?.hostelId);
    const {
        data: payments,
        isLoading: paymentsLoading,
        isError: isPaymentsError,
        refetch: refetchPayments,
    } = useWardenPayments(params.id);
    const payWarden = usePayWarden();

    // ── Permissions state + mutation ────────────────────────────
    const [perms, setPerms] = useState(null); // local copy so toggles feel instant
    useEffect(() => {
        if (user) setPerms({
            canManageExpenses: user.canManageExpenses || false,
            canManageMess: user.canManageMess || false,
            canManageGeneral: user.canManageGeneral || false,
            canManageUtilities: user.canManageUtilities || false,
            canManageMaintenance: user.canManageMaintenance || false,
            canManageSalaries: user.canManageSalaries || false,
        });
    }, [user]);

    const updatePerms = useMutation({
        mutationFn: async (data) => {
            const res = await fetch(`/api/users/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to update permissions');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Permissions saved');
            queryClient.invalidateQueries({ queryKey: ['user', params.id] });
        },
        onError: () => toast.error('Could not save permissions')
    });

    const handlePermToggle = (key) => {
        const updated = { ...perms };

        if (key === 'canManageExpenses') {
            const nextMaster = !perms.canManageExpenses;
            if (!nextMaster) {
                const confirmed = window.confirm(
                    "Disable full expense access and clear all category permissions for this warden?"
                );
                if (!confirmed) return;
            }
            updated.canManageExpenses = nextMaster;
            // Turning OFF master means fully restricted expense access.
            if (!nextMaster) {
                updated.canManageMess = false;
                updated.canManageGeneral = false;
                updated.canManageUtilities = false;
                updated.canManageMaintenance = false;
                updated.canManageSalaries = false;
            }
        } else {
            // Category toggles are granular access; keep master OFF in this mode.
            if (perms[key]) {
                const remainingEnabled = Object.entries(perms)
                    .filter(([permKey]) => permKey !== "canManageExpenses")
                    .filter(([, enabled]) => Boolean(enabled)).length;
                if (remainingEnabled === 1) {
                    const confirmed = window.confirm(
                        "This will remove the last category permission and fully restrict expense access. Continue?"
                    );
                    if (!confirmed) return;
                }
            }
            updated[key] = !perms[key];
            updated.canManageExpenses = false;
        }

        setPerms(updated);
        updatePerms.mutate(updated);
    };

    const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
    const [isSlipDialogOpen, setIsSlipDialogOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [formData, setFormData] = useState({
        amount: "0",
        basicSalary: "0",
        bonuses: "0",
        deductions: "0",
        month: format(new Date(), 'MMMM yyyy'),
        paymentMethod: "BANK_TRANSFER",
        notes: ""
    });

    useEffect(() => {
        if (user) {
            const basic = user.basicSalary || 0;
            const allow = user.allowances || 0;
            const total = Number(basic) + Number(allow);
            setFormData(prev => ({
                ...prev,
                basicSalary: basic.toString(),
                amount: total.toString()
            }));
        }
    }, [user]);

    // useEffect(() => {
    //     checkAuth();
    // }, []);

    if (isLoading) return <DetailPageSkeleton />;
    if (isUserError || isPaymentsError) {
        return (
            <div className="max-w-[1200px] mx-auto px-6 py-8">
                <ErrorState
                    title="Unable to load warden details"
                    description="Warden profile or payment records could not be fetched right now."
                    onRetry={() => {
                        refetchUser?.();
                        refetchPayments?.();
                    }}
                    retryLabel="Retry"
                />
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-background gap-4 font-sans">
                <div className="h-16 w-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-2">
                    <User className="h-8 w-8 text-rose-400" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-foreground uppercase tracking-tight">Profile Not Found</h3>
                <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Could not load warden profile</p>
                <Link href="/admin/hostels">
                    <Button className="mt-4 h-10 px-8 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-[10px] uppercase tracking-widest">
                        Go Back
                    </Button>
                </Link>
            </div>
        );
    }

    const handlePaySubmit = async (e) => {
        e.preventDefault();
        try {
            await payWarden.mutateAsync({
                wardenId: user.id,
                ...formData
            });
            setIsPayDialogOpen(false);
            setFormData({
                amount: "",
                basicSalary: "",
                bonuses: "0",
                deductions: "0",
                month: format(new Date(), 'MMMM yyyy'),
                paymentMethod: "BANK_TRANSFER",
                notes: ""
            });
        } catch (err) {
            console.error(err);
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case "ADMIN": return "bg-rose-50 text-rose-700 border-rose-100";
            case "WARDEN": return "bg-blue-50 text-blue-700 border-blue-100";
            default: return "bg-gray-100 text-gray-700 dark:text-foreground border-gray-200 dark:border-border";
        }
    };

    const InfoRow = ({ icon: Icon, label, value }) => (
        <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-gray-50 dark:bg-muted/10 border border-gray-100 dark:border-border flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-3.5 w-3.5 text-gray-400 dark:text-muted-foreground" />
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground">{label}</span>
                <span className="text-[12px] font-bold text-gray-900 dark:text-foreground mt-0.5 truncate">{value || "N/A"}</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background pb-20 font-sans tracking-tight">

            <PageHeader
                title="Profile"
                subtitleStart={user.name}
                subtitleEnd={user.isActive ? "Active" : "Inactive"}
                subtitleDotClassName="hidden sm:block"
                maxWidthClass="max-w-[1600px]"
                accentColorClass="bg-blue-600"
                dotColorClass="bg-emerald-500"
                subtitleEndClass={user.isActive ? "text-emerald-600 hidden sm:block" : "text-rose-500 hidden sm:block"}
                stickyClassName="bg-white dark:bg-card border-b sticky top-0 z-50 h-16"
                leftSlot={(
                    <Link href="/admin/hostels">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 text-gray-500 dark:text-muted-foreground shrink-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                )}
                rightSlot={(
                    <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-9 px-4 md:px-6 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-[10px] uppercase tracking-widest shadow-sm transition-all flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                <span>Pay</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-card">
                            <div className="bg-gray-900 p-8 text-white text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-white dark:bg-card/5 -skew-x-12 translate-x-20" />
                                <div className="h-12 w-12 bg-white dark:bg-card/10 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/10">
                                    <Wallet className="h-6 w-6" />
                                </div>
                                <h2 className="text-xl font-bold uppercase tracking-tight">Pay</h2>
                                <p className="text-[9px] text-gray-400 dark:text-muted-foreground font-bold tracking-widest mt-1 uppercase">Pay {user.name}</p>
                            </div>
                            <form onSubmit={handlePaySubmit} className="p-8 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Basic Amount</Label>
                                        <Input
                                            type="number"
                                            required
                                            placeholder="25000"
                                            value={formData.basicSalary}
                                            onChange={e => {
                                                const basic = e.target.value;
                                                const total = Number(basic) + Number(formData.bonuses) - Number(formData.deductions);
                                                setFormData({ ...formData, basicSalary: basic, amount: total.toString() });
                                            }}
                                            className="h-10 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-bold text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Month</Label>
                                        <Input
                                            required
                                            placeholder="January 2026"
                                            value={formData.month}
                                            onChange={e => setFormData({ ...formData, month: e.target.value })}
                                            className="h-10 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-bold text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Bonuses</Label>
                                        <Input
                                            type="number"
                                            value={formData.bonuses}
                                            onChange={e => {
                                                const bonus = e.target.value;
                                                const total = Number(formData.basicSalary) + Number(bonus) - Number(formData.deductions);
                                                setFormData({ ...formData, bonuses: bonus, amount: total.toString() });
                                            }}
                                            className="h-10 rounded-xl border-emerald-50 bg-emerald-50/30 text-emerald-600 font-bold text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-rose-500">Deductions</Label>
                                        <Input
                                            type="number"
                                            value={formData.deductions}
                                            onChange={e => {
                                                const ded = e.target.value;
                                                const total = Number(formData.basicSalary) + Number(formData.bonuses) - Number(ded);
                                                setFormData({ ...formData, deductions: ded, amount: total.toString() });
                                            }}
                                            className="h-10 rounded-xl border-rose-50 bg-rose-50/30 text-rose-600 font-bold text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-muted/10 rounded-2xl p-4 border border-gray-100 dark:border-border">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Total</span>
                                        <span className="text-lg font-black text-gray-900 dark:text-foreground tracking-tight">PKR {Number(formData.amount || 0).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Payment Method</Label>
                                    <Select value={formData.paymentMethod} onValueChange={v => setFormData({ ...formData, paymentMethod: v })}>
                                        <SelectTrigger className="h-10 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-bold text-[10px] uppercase tracking-wider">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl">
                                            <SelectItem value="BANK_TRANSFER" className="text-[10px] font-bold uppercase tracking-widest">Bank Transfer</SelectItem>
                                            <SelectItem value="CASH" className="text-[10px] font-bold uppercase tracking-widest">Cash</SelectItem>
                                            <SelectItem value="ONLINE" className="text-[10px] font-bold uppercase tracking-widest">Online Transfer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Notes (Optional)</Label>
                                    <Textarea
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 text-[11px] font-medium resize-none h-20"
                                        placeholder="Add any specific details..."
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={payWarden.isPending}
                                    className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg transition-all"
                                >
                                    {payWarden.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pay'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            />

            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">

                {/* Profile Hero Card */}
                <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start gap-5 md:gap-8">

                        {/* Avatar */}
                        <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-gray-100 border border-gray-200 dark:border-border flex items-center justify-center overflow-hidden shrink-0">
                            {user.image ? (
                                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl md:text-3xl font-black text-gray-300 uppercase">
                                    {user.name?.charAt(0)}
                                </span>
                            )}
                        </div>

                        {/* Identity */}
                        <div className="flex flex-col flex-1 min-w-0 gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg md:text-2xl font-black text-gray-900 dark:text-foreground uppercase tracking-tight">{user.name}</h2>
                                <Badge variant="outline" className={`${getRoleBadge(user.role)} text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-widest shrink-0`}>
                                    {user.role}
                                </Badge>
                                <Badge variant="outline" className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-widest shrink-0 ${user.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>

                            <p className="text-[11px] font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-widest">
                                {user.designation || "Warden"}
                            </p>

                            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-1">
                                <div className="flex items-center gap-1.5">
                                    <Hash className="h-3 w-3 text-gray-400 dark:text-muted-foreground" />
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest font-mono">{user.id?.slice(-10).toUpperCase()}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3 text-gray-400 dark:text-muted-foreground" />
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                                        Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-3 w-3 text-gray-400 dark:text-muted-foreground" />
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                                        Last Login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Never"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

                    {/* Personal Info */}
                    <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                            <div className="h-8 w-1 bg-blue-600 rounded-full" />
                            <h3 className="text-[11px] md:text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground">Personal</h3>
                        </div>
                        <InfoRow icon={Mail} label="Email Address" value={user.email} />
                        <InfoRow icon={Phone} label="Phone Number" value={user.phone} />
                        <InfoRow icon={CreditCard} label="CNIC Number" value={user.cnic} />
                        <InfoRow icon={ShieldCheck} label="Account Role" value={user.role} />
                        <InfoRow icon={Wallet} label="Expense Management" value={user.canManageExpenses ? "Allowed" : "Restricted"} />
                    </div>

                    {/* Location Info */}
                    <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                            <div className="h-8 w-1 bg-blue-600 rounded-full" />
                            <h3 className="text-[11px] md:text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground">Address</h3>
                        </div>
                        <InfoRow icon={MapPin} label="Address" value={user.address} />
                        <InfoRow icon={Building2} label="City" value={user.city} />
                        <InfoRow icon={MapPin} label="Country" value={user.country || "Pakistan"} />
                        {user.Hostel && (
                            <InfoRow icon={Building2} label="Assigned Hostel" value={user.Hostel?.name} />
                        )}
                    </div>

                    {/* Stats Card */}
                    <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                            <div className="h-8 w-1 bg-emerald-600 rounded-full" />
                            <h3 className="text-[11px] md:text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground">Stats</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-background rounded-2xl p-4 border border-gray-100 dark:border-border">
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground block mb-1">Total Paid</span>
                                <span className="text-sm font-black text-gray-900 dark:text-foreground">PKR {(payments?.reduce((acc, p) => acc + p.amount, 0) || 0).toLocaleString()}</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-background rounded-2xl p-4 border border-gray-100 dark:border-border">
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground block mb-1">Last Pay</span>
                                <span className="text-sm font-black text-gray-900 dark:text-foreground">{payments?.[0] ? `PKR ${payments[0].amount.toLocaleString()}` : 'N/A'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 py-2">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-900 dark:text-foreground uppercase">Verification Complete</span>
                                <span className="text-[8px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Node status: active</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Hostel Performance Reports ── */}
                {user.hostelId && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <SectionTitle
                                title="Hostel Insights"
                                accentColorClass="bg-indigo-600"
                                containerClassName="flex items-center gap-3"
                                titleClassName="text-xs md:text-sm font-black uppercase tracking-widest text-gray-900 dark:text-foreground"
                            />
                            {reports && (
                                <Link href={`/admin/reports?hostelId=${user.hostelId}`}>
                                    <Button variant="ghost" className="h-8 text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:bg-indigo-50">
                                        Full Report <ArrowUpRight className="ml-1 h-3 w-3" />
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {reportsLoading ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-6 shadow-sm animate-pulse">
                                        <div className="h-8 w-8 bg-gray-100 rounded-lg mb-4" />
                                        <div className="h-2 w-12 bg-gray-50 dark:bg-muted/10 rounded mb-2" />
                                        <div className="h-4 w-20 bg-gray-100 rounded" />
                                    </div>
                                ))}
                            </div>
                        ) : reports ? (
                            <>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        {
                                            label: 'Revenue',
                                            value: reports.overall?.totalRevenue,
                                            icon: TrendingUp,
                                            color: 'text-emerald-600',
                                            bg: 'bg-emerald-50',
                                            change: reports.overall?.revenueChange
                                        },
                                        {
                                            label: 'Expenses',
                                            value: reports.overall?.totalExpenses,
                                            icon: TrendingDown,
                                            color: 'text-rose-600',
                                            bg: 'bg-rose-50',
                                            change: reports.overall?.expenseChange
                                        },
                                        {
                                            label: 'Net Profit',
                                            value: reports.overall?.netProfit,
                                            icon: DollarSign,
                                            color: 'text-indigo-600',
                                            bg: 'bg-indigo-50',
                                            change: reports.overall?.profitChange
                                        },
                                        {
                                            label: 'Occupancy',
                                            value: `${reports.overall?.occupancyRate}%`,
                                            icon: Building2,
                                            color: 'text-amber-600',
                                            bg: 'bg-amber-50',
                                            change: reports.overall?.occupancyChange
                                        },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className={`h-8 w-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                                    <stat.icon className="h-4 w-4" />
                                                </div>
                                                {stat.change !== undefined && (
                                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${Number(stat.change) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                        }`}>
                                                        {Number(stat.change) > 0 ? '+' : ''}{stat.change}%
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[8px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest block">{stat.label}</span>
                                            <span className="text-sm md:text-base font-black text-gray-900 dark:text-foreground tracking-tight mt-0.5 block">
                                                {typeof stat.value === 'number' ? `PKR ${stat.value.toLocaleString()}` : stat.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Mini Trend Chart */}
                                <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-foreground">6 Month Trend</span>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                                <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-tight">Revenue</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                                                <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-tight">Expenses</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-32 flex items-end gap-2 px-2">
                                        {reports.monthlyTrends?.map((d, i) => {
                                            const maxVal = Math.max(...reports.monthlyTrends.flatMap(t => [t.revenue, t.expenses, 1]));
                                            const revH = (d.revenue / maxVal) * 100;
                                            const expH = (d.expenses / maxVal) * 100;
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                                    <div className="w-full flex items-end gap-0.5 h-20">
                                                        <div className="flex-1 bg-indigo-500/80 rounded-t-sm group-hover:bg-indigo-600 transition-colors" style={{ height: `${Math.max(revH, 2)}%` }} />
                                                        <div className="flex-1 bg-rose-400/80 rounded-t-sm group-hover:bg-rose-500 transition-colors" style={{ height: `${Math.max(expH, 2)}%` }} />
                                                    </div>
                                                    <span className="text-[7px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">{d.month}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="py-10 text-center bg-white dark:bg-card border border-dashed border-gray-200 dark:border-border rounded-2xl">
                                <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">No detailed reports available for this hostel yet</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Expense Permissions Card ── */}
                {perms && (
                    <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-50 mb-5">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-1 bg-indigo-600 rounded-full" />
                                <div>
                                    <h3 className="text-[11px] md:text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground">Expense Access</h3>
                                    <p className="text-[8px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mt-0.5">What this warden can add / view</p>
                                </div>
                            </div>
                            {updatePerms.isPending && (
                                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                            )}
                        </div>

                        {/* Master toggle */}
                        <div className={`flex items-center justify-between p-4 rounded-2xl mb-3 border transition-all ${perms.canManageExpenses ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 dark:bg-muted/10 border-gray-100 dark:border-border'
                            }`}>
                            <div className="flex items-center gap-3">
                                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${perms.canManageExpenses ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400 dark:text-muted-foreground'
                                    }`}>
                                    <Wallet className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-black text-gray-900 dark:text-foreground uppercase tracking-tight block">All Expenses</span>
                                    <span className="text-[8px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                                        {perms.canManageExpenses ? 'Warden can manage all expenses' : 'Warden cannot manage expenses'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => handlePermToggle('canManageExpenses')}
                                disabled={updatePerms.isPending}
                                className={`relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${perms.canManageExpenses ? 'bg-indigo-600' : 'bg-gray-200'
                                    }`}
                            >
                                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white dark:bg-card shadow transition-transform duration-200 ${perms.canManageExpenses ? 'translate-x-5' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>

                        <div className={`mb-4 px-3 py-2 rounded-xl border text-[8px] font-bold uppercase tracking-widest ${perms.canManageExpenses
                                ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            }`}>
                            {perms.canManageExpenses
                                ? 'Mode: Full Access (all expense categories enabled)'
                                : 'Mode: Granular Access (only selected categories enabled)'}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                            {[
                                { key: 'canManageMess', label: 'Mess / Food', desc: 'Food & mess expenses' },
                                { key: 'canManageGeneral', label: 'General', desc: 'Miscellaneous expenses' },
                                { key: 'canManageUtilities', label: 'Utilities', desc: 'Electricity, water, gas' },
                                { key: 'canManageMaintenance', label: 'Maintenance', desc: 'Repair & upkeep costs' },
                                { key: 'canManageSalaries', label: 'Salaries', desc: 'Staff salary expenses' },
                            ].map(({ key, label, desc }) => (
                                <div
                                    key={key}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${perms[key] ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 dark:bg-muted/10 border-gray-100 dark:border-border'
                                        }`}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-800 dark:text-foreground uppercase tracking-tight">{label}</span>
                                        <span className="text-[8px] font-bold text-gray-400 dark:text-muted-foreground">{desc}</span>
                                    </div>
                                    <button
                                        onClick={() => handlePermToggle(key)}
                                        disabled={updatePerms.isPending}
                                        className={`relative h-5 w-9 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 shrink-0 ${perms[key] ? 'bg-emerald-500' : 'bg-gray-200'
                                            }`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white dark:bg-card shadow transition-transform duration-200 ${perms[key] ? 'translate-x-4' : 'translate-x-0'
                                            }`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Payment History Section */}
                <div className="space-y-4">
                    <SectionTitle
                        title="History"
                        accentColorClass="bg-gray-900"
                        containerClassName="flex items-center gap-3 px-2"
                        titleClassName="text-xs md:text-sm font-black uppercase tracking-widest text-gray-900 dark:text-foreground"
                    />

                    {paymentsLoading ? (
                        <div className="py-20 flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                        </div>
                    ) : payments?.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {payments.map((payment) => (
                                <div key={payment.id} className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="h-12 w-12 rounded-2xl bg-gray-50 dark:bg-muted/10 border border-gray-100 dark:border-border flex items-center justify-center shrink-0 group-hover:bg-gray-900 group-hover:text-white transition-colors duration-300">
                                                <History className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-foreground">{payment.month}</span>
                                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                        Paid
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <CreditCard className="h-3 w-3 text-gray-400 dark:text-muted-foreground" />
                                                        <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-tight">{payment.paymentMethod.replace('_', ' ')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="h-3 w-3 text-gray-400 dark:text-muted-foreground" />
                                                        <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-tight">
                                                            {format(new Date(payment.paymentDate), 'PPP')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 px-6 border-l border-gray-100 dark:border-border md:h-12">
                                            <div className="text-right">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground block mb-0.5">Base + Bonus</span>
                                                <p className="text-[11px] font-bold text-gray-900 dark:text-foreground">PKR {(payment.basicSalary + payment.bonuses).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-rose-400 block mb-0.5">Deductions</span>
                                                <p className="text-[11px] font-bold text-rose-600">PKR {payment.deductions.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right min-w-[100px]">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground block mb-0.5">Total</span>
                                                <p className="text-lg font-black text-gray-900 dark:text-foreground tracking-tight">PKR {payment.amount.toLocaleString()}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setSelectedPayment(payment);
                                                    setIsSlipDialogOpen(true);
                                                }}
                                                className="h-9 w-9 rounded-xl hover:bg-gray-100 text-gray-400 dark:text-muted-foreground hover:text-indigo-600 group/btn"
                                                title="View Salary Slip"
                                            >
                                                <Eye className="h-4.5 w-4.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    {payment.notes && (
                                        <div className="mt-4 pt-4 border-t border-gray-50">
                                            <p className="text-[10px] font-medium text-gray-500 dark:text-muted-foreground italic uppercase">Notes: {payment.notes}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center bg-white dark:bg-card border border-dashed border-gray-200 dark:border-border rounded-[2rem] text-center px-6">
                            <div className="h-16 w-16 rounded-2xl bg-gray-50 dark:bg-muted/10 flex items-center justify-center mb-6">
                                <AlertCircle className="h-8 w-8 text-gray-200" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-foreground uppercase tracking-tight">No Payment History</h3>
                            <p className="text-gray-400 dark:text-muted-foreground font-bold uppercase tracking-widest text-[9px] mt-2 max-w-xs mx-auto">This warden has not received any salary disbursements through the node yet.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Salary Slip Dialog */}
            <Dialog open={isSlipDialogOpen} onOpenChange={setIsSlipDialogOpen}>
                <DialogContent className="max-w-3xl p-0 bg-transparent border-none overflow-y-auto max-h-[95vh] shadow-none">
                    {selectedPayment && (
                        <SalarySlip
                            salary={{
                                ...selectedPayment,
                                StaffProfile: {
                                    User: user,
                                    designation: user.designation || "Warden"
                                }
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WardenProfilePage;

