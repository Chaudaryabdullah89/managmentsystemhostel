"use client"
import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    ArrowLeft, User, Mail, Phone, MapPin, Calendar,
    Clock, ShieldCheck, Building2, Hash, CreditCard,
    DollarSign, History, AlertCircle, CheckCircle2,
    Briefcase, Loader2, Wallet, Plus, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserById } from "@/hooks/useusers";
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
import Loader from "@/components/ui/Loader";
import { useEffect } from "react";
import { checkAuth } from "@/hooks/Authstate";

const WardenProfilePage = () => {
    const params = useParams();
    const { data: user, isLoading, error } = useUserById(params.id);
    const { data: payments, isLoading: paymentsLoading } = useWardenPayments(params.id);
    const payWarden = usePayWarden();

    const [isPayDialogOpen, setIsPayDialogOpen] = React.useState(false);
    const [formData, setFormData] = React.useState({
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

    useEffect(() => {
        checkAuth();
    }, []);

    if (isLoading) return (
        <Loader label="Loading Warden Profile" subLabel="Fetching warden details..." icon={User} fullScreen={false} />
    );

    if (error || !user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 gap-4 font-sans">
                <div className="h-16 w-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-2">
                    <User className="h-8 w-8 text-rose-400" />
                </div>
                <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">Profile Not Found</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Could not load warden profile</p>
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
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const InfoRow = ({ icon: Icon, label, value }) => (
        <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</span>
                <span className="text-[12px] font-bold text-gray-900 mt-0.5 truncate">{value || "N/A"}</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">

            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-4">
                        <Link href="/admin/hostels">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 text-gray-500 shrink-0">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="h-8 w-1 bg-blue-600 rounded-full shrink-0" />
                        <div className="flex flex-col">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight uppercase">Profile</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate">{user.name}</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500 hidden sm:block" />
                                <span className={`text-[9px] font-bold uppercase tracking-wider hidden sm:block ${user.isActive ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-9 px-4 md:px-6 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-[10px] uppercase tracking-widest shadow-sm transition-all flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                <span>Pay</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white">
                            <div className="bg-gray-900 p-8 text-white text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/5 -skew-x-12 translate-x-20" />
                                <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/10">
                                    <Wallet className="h-6 w-6" />
                                </div>
                                <h2 className="text-xl font-bold uppercase tracking-tight">Pay</h2>
                                <p className="text-[9px] text-gray-400 font-bold tracking-widest mt-1 uppercase">Pay {user.name}</p>
                            </div>
                            <form onSubmit={handlePaySubmit} className="p-8 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Basic Amount</Label>
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
                                            className="h-10 rounded-xl border-gray-100 bg-gray-50 font-bold text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Month</Label>
                                        <Input
                                            required
                                            placeholder="January 2026"
                                            value={formData.month}
                                            onChange={e => setFormData({ ...formData, month: e.target.value })}
                                            className="h-10 rounded-xl border-gray-100 bg-gray-50 font-bold text-sm"
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

                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total</span>
                                        <span className="text-lg font-black text-gray-900 tracking-tight">PKR {Number(formData.amount || 0).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Payment Method</Label>
                                    <Select value={formData.paymentMethod} onValueChange={v => setFormData({ ...formData, paymentMethod: v })}>
                                        <SelectTrigger className="h-10 rounded-xl border-gray-100 bg-gray-50 font-bold text-[10px] uppercase tracking-wider">
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
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Notes (Optional)</Label>
                                    <Textarea
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="rounded-xl border-gray-100 bg-gray-50 text-[11px] font-medium resize-none h-20"
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
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">

                {/* Profile Hero Card */}
                <div className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start gap-5 md:gap-8">

                        {/* Avatar */}
                        <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
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
                                <h2 className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-tight">{user.name}</h2>
                                <Badge variant="outline" className={`${getRoleBadge(user.role)} text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-widest shrink-0`}>
                                    {user.role}
                                </Badge>
                                <Badge variant="outline" className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-widest shrink-0 ${user.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>

                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                {user.designation || "Warden"}
                            </p>

                            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-1">
                                <div className="flex items-center gap-1.5">
                                    <Hash className="h-3 w-3 text-gray-400" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">{user.id?.slice(-10).toUpperCase()}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3 text-gray-400" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-3 w-3 text-gray-400" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
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
                    <div className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                            <div className="h-8 w-1 bg-blue-600 rounded-full" />
                            <h3 className="text-[11px] md:text-xs font-black uppercase tracking-widest text-gray-900">Personal</h3>
                        </div>
                        <InfoRow icon={Mail} label="Email Address" value={user.email} />
                        <InfoRow icon={Phone} label="Phone Number" value={user.phone} />
                        <InfoRow icon={CreditCard} label="CNIC Number" value={user.cnic} />
                        <InfoRow icon={ShieldCheck} label="Account Role" value={user.role} />
                    </div>

                    {/* Location Info */}
                    <div className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                            <div className="h-8 w-1 bg-blue-600 rounded-full" />
                            <h3 className="text-[11px] md:text-xs font-black uppercase tracking-widest text-gray-900">Address</h3>
                        </div>
                        <InfoRow icon={MapPin} label="Address" value={user.address} />
                        <InfoRow icon={Building2} label="City" value={user.city} />
                        <InfoRow icon={MapPin} label="Country" value={user.country || "Pakistan"} />
                        {user.Hostel && (
                            <InfoRow icon={Building2} label="Assigned Hostel" value={user.Hostel?.name} />
                        )}
                    </div>

                    {/* Stats Card */}
                    <div className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                            <div className="h-8 w-1 bg-emerald-600 rounded-full" />
                            <h3 className="text-[11px] md:text-xs font-black uppercase tracking-widest text-gray-900">Stats</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Total Paid</span>
                                <span className="text-sm font-black text-gray-900">PKR {(payments?.reduce((acc, p) => acc + p.amount, 0) || 0).toLocaleString()}</span>
                            </div>
                            <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Last Pay</span>
                                <span className="text-sm font-black text-gray-900">{payments?.[0] ? `PKR ${payments[0].amount.toLocaleString()}` : 'N/A'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 py-2">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-900 uppercase">Verification Complete</span>
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Node status: active</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment History Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="h-5 w-1 bg-gray-900 rounded-full" />
                        <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-gray-900">History</h3>
                    </div>

                    {paymentsLoading ? (
                        <div className="py-20 flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                        </div>
                    ) : payments?.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {payments.map((payment) => (
                                <div key={payment.id} className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="h-12 w-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:bg-gray-900 group-hover:text-white transition-colors duration-300">
                                                <History className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-900">{payment.month}</span>
                                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                        Paid
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <CreditCard className="h-3 w-3 text-gray-400" />
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{payment.paymentMethod.replace('_', ' ')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="h-3 w-3 text-gray-400" />
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                                                            {format(new Date(payment.paymentDate), 'PPP')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 px-6 border-l border-gray-100 md:h-12">
                                            <div className="text-right">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Base + Bonus</span>
                                                <p className="text-[11px] font-bold text-gray-900">PKR {(payment.basicSalary + payment.bonuses).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-rose-400 block mb-0.5">Deductions</span>
                                                <p className="text-[11px] font-bold text-rose-600">PKR {payment.deductions.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right min-w-[120px]">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Total</span>
                                                <p className="text-lg font-black text-gray-900 tracking-tight">PKR {payment.amount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {payment.notes && (
                                        <div className="mt-4 pt-4 border-t border-gray-50">
                                            <p className="text-[10px] font-medium text-gray-500 italic uppercase">Notes: {payment.notes}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center bg-white border border-dashed border-gray-200 rounded-[2rem] text-center px-6">
                            <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-6">
                                <AlertCircle className="h-8 w-8 text-gray-200" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">No Payment History</h3>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] mt-2 max-w-xs mx-auto">This warden has not received any salary disbursements through the node yet.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default WardenProfilePage;

