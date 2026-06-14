"use client"
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    ChevronLeft,
    ChevronRight,
    User,
    Building2,
    Calendar,
    DollarSign,
    ShieldCheck,
    Loader2,
    Save,
    AlertCircle,
    CheckCircle2,
    ArrowUpRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { useBookingById, useUpdateBooking } from "@/hooks/useBooking";
import { useHostel } from "@/hooks/usehostel";
import { useRoomByHostelId } from "@/hooks/useRoom";
import { DetailPageSkeleton } from "@/components/ui/skeletons";

const EditBookingPage = () => {
    const params = useParams();
    const router = useRouter();
    const { bookingId } = params;

    const { data: booking, isLoading: bookingLoading, isError } = useBookingById(bookingId);
    const { data: hostelsResponse } = useHostel();
    const updateBooking = useUpdateBooking();

    const hostels = hostelsResponse?.data || [];

    const [formData, setFormData] = useState({
        guestName: "",
        guestEmail: "",
        guestPhone: "",
        cnic: "",
        guardianName: "",
        guardianPhone: "",
        emergencyContact: "",
        address: "",
        city: "",
        hostelId: "",
        roomId: "",
        checkIn: "",
        checkOut: "",
        status: "",
        totalAmount: 0,
        securityDeposit: 0,
    });

    const { data: roomsResponse } = useRoomByHostelId(formData.hostelId);
    const rooms = roomsResponse?.data || [];

    useEffect(() => {
        if (booking) {
            setFormData({
                guestName: booking.User?.name || "",
                guestEmail: booking.User?.email || "",
                guestPhone: booking.User?.phone || "",
                cnic: booking.User?.cnic || "",
                guardianName: booking.User?.ResidentProfile?.guardianName || "",
                guardianPhone: booking.User?.ResidentProfile?.guardianPhone || "",
                emergencyContact: booking.User?.ResidentProfile?.emergencyContact || "",
                address: booking.User?.address || booking.User?.ResidentProfile?.address || "",
                city: booking.User?.city || booking.User?.ResidentProfile?.city || "",
                hostelId: booking.Room?.hostelId || "",
                roomId: booking.roomId || "",
                checkIn: booking.checkIn ? new Date(booking.checkIn).toISOString().split('T')[0] : "",
                checkOut: booking.checkOut ? new Date(booking.checkOut).toISOString().split('T')[0] : "",
                status: booking.status || "PENDING",
                totalAmount: booking.totalAmount || 0,
                securityDeposit: booking.securityDeposit || 0,
            });
        }
    }, [booking]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        try {
            await updateBooking.mutateAsync({ id: bookingId, data: formData });
            router.push(`/warden/bookings/${bookingId}`);
        } catch (error) { }
    };

    if (bookingLoading) return <DetailPageSkeleton />;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background pb-20 font-sans">
            {/* Minimal Premium Header */}
            <div className="bg-white dark:bg-card border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 dark:bg-muted/20 h-9 w-9" onClick={() => router.back()}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-200" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 dark:text-foreground tracking-tight">Modify Registry</h1>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Update Node #{bookingId.slice(-6).toUpperCase()}</p>
                        </div>
                    </div>
                    <Badge variant="outline" className={`h-7 px-3 rounded-lg text-[9px] font-bold uppercase tracking-widest border shadow-sm ${formData.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        formData.status === 'PENDING' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30' :
                            'bg-gray-50 dark:bg-muted/10 text-gray-600 dark:text-muted-foreground border-gray-100 dark:border-border'
                        }`}>
                        {formData.status}
                    </Badge>
                </div>
            </div>

            <main className="max-w-[1200px] mx-auto px-6 py-8 space-y-8">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 space-y-8">
                        {/* Tenant Identity */}
                        <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-muted/10 flex items-center justify-center border border-gray-100 dark:border-border">
                                    <User className="h-5 w-5 text-gray-400 dark:text-muted-foreground" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-foreground uppercase">Tenant Identity</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Legal Name</Label>
                                    <Input name="guestName" value={formData.guestName} onChange={handleInputChange} className="h-12 rounded-xl border-gray-100 dark:border-border font-bold bg-gray-50 dark:bg-muted/10/30" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Email Node</Label>
                                    <Input name="guestEmail" value={formData.guestEmail} onChange={handleInputChange} className="h-12 rounded-xl border-gray-100 dark:border-border font-bold bg-gray-50 dark:bg-muted/10/30" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Phone Vector</Label>
                                    <Input name="guestPhone" value={formData.guestPhone} onChange={handleInputChange} className="h-12 rounded-xl border-gray-100 dark:border-border font-bold bg-gray-50 dark:bg-muted/10/30" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">CNIC Registry</Label>
                                    <Input name="cnic" value={formData.cnic} onChange={handleInputChange} className="h-12 rounded-xl border-gray-100 dark:border-border font-bold bg-gray-50 dark:bg-muted/10/30" />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Permanent Root</Label>
                                    <Textarea name="address" value={formData.address} onChange={handleInputChange} className="min-h-[80px] rounded-xl border-gray-100 dark:border-border font-bold resize-none pt-3 bg-gray-50 dark:bg-muted/10/30" />
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-gray-50 dark:border-border/50 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Guardian Identity</Label>
                                    <Input name="guardianName" value={formData.guardianName} onChange={handleInputChange} className="h-12 rounded-xl border-gray-100 dark:border-border font-bold bg-gray-50 dark:bg-muted/10/30" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Guardian Phone</Label>
                                    <Input name="guardianPhone" value={formData.guardianPhone} onChange={handleInputChange} className="h-12 rounded-xl border-gray-100 dark:border-border font-bold bg-gray-50 dark:bg-muted/10/30" />
                                </div>
                            </div>
                        </div>

                        {/* Asset Allocation */}
                        <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-muted/10 flex items-center justify-center border border-gray-100 dark:border-border">
                                    <Building2 className="h-5 w-5 text-gray-400 dark:text-muted-foreground" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-foreground uppercase">Asset Allocation</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Hostel Portfolio</Label>
                                    <Select value={formData.hostelId} onValueChange={(v) => handleSelectChange('hostelId', v)}>
                                        <SelectTrigger className="h-12 rounded-xl border-gray-100 dark:border-border font-bold bg-gray-50 dark:bg-muted/10/30">
                                            <SelectValue placeholder="Select Asset" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-gray-100 dark:border-border p-1">
                                            {hostels.map(h => (
                                                <SelectItem key={h.id} value={h.id} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg">
                                                    {h.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Unit Vector</Label>
                                    <Select value={formData.roomId} onValueChange={(v) => handleSelectChange('roomId', v)} disabled={!formData.hostelId}>
                                        <SelectTrigger className="h-12 rounded-xl border-gray-100 dark:border-border font-bold bg-gray-50 dark:bg-muted/10/30">
                                            <SelectValue placeholder="Select Unit" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-gray-100 dark:border-border p-1">
                                            {rooms.map(r => (
                                                <SelectItem key={r.id} value={r.id} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg">
                                                    Room {r.roomNumber} ({r.type})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Fiscal & Actions */}
                    <div className="space-y-8">
                        {/* Timeline & State */}
                        <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-muted/10 flex items-center justify-center border border-gray-100 dark:border-border">
                                    <Calendar className="h-5 w-5 text-gray-400 dark:text-muted-foreground" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-foreground uppercase">Residency State</h3>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Deployment Date</Label>
                                    <Input type="date" name="checkIn" value={formData.checkIn} onChange={handleInputChange} className="h-12 rounded-xl border-gray-100 dark:border-border font-bold bg-gray-50 dark:bg-muted/10/30" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Decommission Date</Label>
                                    <Input type="date" name="checkOut" value={formData.checkOut} onChange={handleInputChange} className="h-12 rounded-xl border-gray-100 dark:border-border font-bold bg-gray-50 dark:bg-muted/10/30" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Registry Status</Label>
                                    <Select value={formData.status} onValueChange={(v) => handleSelectChange('status', v)}>
                                        <SelectTrigger className="h-12 rounded-xl border-gray-100 dark:border-border font-bold bg-gray-50 dark:bg-muted/10/30">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-gray-100 dark:border-border p-1">
                                            {["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"].map(s => (
                                                <SelectItem key={s} value={s} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg">
                                                    {s.replace('_', ' ')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Fiscal Ledger */}
                        <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30">
                                    <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-foreground uppercase italic">Fiscal Ledger</h3>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Base Liability</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-muted-foreground text-xs font-bold">PKR</span>
                                        <Input
                                            name="totalAmount"
                                            value={formData.totalAmount}
                                            onChange={handleInputChange}
                                            className="h-12 pl-14 rounded-xl border-gray-100 dark:border-border font-black bg-gray-50 dark:bg-muted/10/30"
                                            type="number"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Security Bond</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-muted-foreground text-xs font-bold">PKR</span>
                                        <Input
                                            name="securityDeposit"
                                            value={formData.securityDeposit}
                                            onChange={handleInputChange}
                                            className="h-12 pl-14 rounded-xl border-gray-100 dark:border-border font-black bg-gray-50 dark:bg-muted/10/30"
                                            type="number"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Deck */}
                        <div className="space-y-3">
                            <Button
                                className="w-full h-14 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-[11px] uppercase tracking-widest shadow-sm active:scale-95 transition-all gap-2"
                                onClick={handleSubmit}
                                disabled={updateBooking.isPending}
                            >
                                {updateBooking.isPending ? 'Syncing...' : 'Save Configuration'}
                                <Save className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full h-12 rounded-xl border-gray-200 dark:border-border font-bold text-[11px] uppercase tracking-widest text-gray-400 dark:text-muted-foreground hover:bg-gray-50 dark:hover:bg-muted/5 dark:bg-muted/10"
                                onClick={() => router.back()}
                            >
                                Discard Changes
                            </Button>
                        </div>
                    </div>
                </div>


            </main>
        </div>
    );
};

export default EditBookingPage;
