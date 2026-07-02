"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, Loader2, Sparkles, User, Home, Building2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function InitiateRoomSwapModal({ open, onOpenChange, onSuccess }) {
    const [bookings, setBookings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedBookingId, setSelectedBookingId] = useState("");
    const [selectedToRoomId, setSelectedToRoomId] = useState("");
    const [swapReason, setSwapReason] = useState("");
    const [autoApprove, setAutoApprove] = useState(true);

    const fetchData = async () => {
        setIsLoadingData(true);
        try {
            const [bookingsRes, roomsRes] = await Promise.all([
                fetch('/api/bookings'),
                fetch('/api/rooms')
            ]);
            const bookingsJson = await bookingsRes.json();
            const roomsJson = await roomsRes.json();

            const allBookings = bookingsJson.data || [];
            // Filter to only active/checked-in bookings with user and room info
            const activeBookings = allBookings.filter(b => b.status === 'CHECKED_IN' || b.status === 'CONFIRMED');
            setBookings(activeBookings);

            const allRooms = roomsJson.data || [];
            setRooms(allRooms);
        } catch (e) {
            console.error("Failed to load swap modal data:", e);
            toast.error("Failed to load residents or room data");
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchData();
            setSelectedBookingId("");
            setSelectedToRoomId("");
            setSwapReason("");
            setAutoApprove(true);
        }
    }, [open]);

    const selectedBooking = bookings.find(b => b.id === selectedBookingId);
    const currentRoomId = selectedBooking?.roomId;
    const currentHostelId = selectedBooking?.Room?.hostelId;

    // Filter available destination rooms (same hostel, different room, not full)
    const availableRooms = rooms.filter(r => {
        if (!currentRoomId) return true;
        if (r.id === currentRoomId) return false;
        if (currentHostelId && r.hostelId !== currentHostelId) return false;
        return true;
    });

    const handleSubmit = async () => {
        if (!selectedBooking) return toast.error("Please select a resident to swap");
        if (!selectedToRoomId) return toast.error("Please select a destination room");
        if (!swapReason.trim()) return toast.error("Please enter a reason for the room swap");

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/guest/room-swap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedBooking.userId,
                    toRoomId: selectedToRoomId,
                    reason: swapReason.trim(),
                    autoApprove
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(
                    autoApprove
                        ? "Room swap executed & completed immediately!"
                        : "Room swap request submitted successfully!"
                );
                onOpenChange(false);
                if (onSuccess) onSuccess();
            } else {
                toast.error(data.error || "Failed to initiate room swap");
            }
        } catch (e) {
            console.error("Initiate room swap error:", e);
            toast.error("Failed to initiate room swap");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-card">
                {/* Header Banner */}
                <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                            <ArrowLeftRight className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black uppercase tracking-tight text-white">
                                Initiate Room Swap
                            </DialogTitle>
                            <DialogDescription className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">
                                Reassign Resident Room / Direct Transfer
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-8 space-y-6">
                    {isLoadingData ? (
                        <div className="h-48 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Resident & Room Registry...</p>
                        </div>
                    ) : (
                        <>
                            {/* Step 1: Select Resident */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    1. Select Active Resident
                                </Label>
                                <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 dark:border-border font-bold text-xs">
                                        <SelectValue placeholder="Search or select resident..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl max-h-60">
                                        {bookings.map(b => (
                                            <SelectItem key={b.id} value={b.id} className="text-xs font-bold py-2.5">
                                                {b.User?.name} — Currently Room {b.Room?.roomNumber || 'N/A'} ({b.Room?.Hostel?.name || 'Hostel'})
                                            </SelectItem>
                                        ))}
                                        {bookings.length === 0 && (
                                            <div className="p-4 text-center text-xs font-bold text-slate-400 uppercase">
                                                No active checked-in residents found
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Current Room Indicator */}
                            {selectedBooking && (
                                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <User className="h-4 w-4 text-indigo-600" />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-900 dark:text-foreground uppercase">{selectedBooking.User?.name}</span>
                                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                                Current: Room {selectedBooking.Room?.roomNumber} ({selectedBooking.Room?.Hostel?.name})
                                            </span>
                                        </div>
                                    </div>
                                    <Badge className="bg-indigo-600 text-white font-mono text-[9px] uppercase">
                                        Checked In
                                    </Badge>
                                </div>
                            )}

                            {/* Step 2: Select Target Room */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    2. Select Destination Room
                                </Label>
                                <Select value={selectedToRoomId} onValueChange={setSelectedToRoomId} disabled={!selectedBookingId}>
                                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 dark:border-border font-bold text-xs">
                                        <SelectValue placeholder={selectedBookingId ? "Select destination room..." : "Select resident first..."} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl max-h-60">
                                        {availableRooms.map(r => (
                                            <SelectItem key={r.id} value={r.id} className="text-xs font-bold py-2.5">
                                                Room {r.roomNumber} (Floor {r.floor}, {r.type}) — Capacity: {r.capacity}
                                            </SelectItem>
                                        ))}
                                        {availableRooms.length === 0 && (
                                            <div className="p-4 text-center text-xs font-bold text-slate-400 uppercase">
                                                No destination rooms available
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Step 3: Execution Mode */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    3. Execution Mode
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setAutoApprove(true)}
                                        className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${autoApprove
                                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400'
                                            : 'border-slate-200 dark:border-border text-slate-500'
                                            }`}
                                    >
                                        <span className="text-xs font-black uppercase tracking-tight">Direct Transfer</span>
                                        <span className="text-[9px] font-bold opacity-75">Execute swap immediately</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setAutoApprove(false)}
                                        className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${!autoApprove
                                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400'
                                            : 'border-slate-200 dark:border-border text-slate-500'
                                            }`}
                                    >
                                        <span className="text-xs font-black uppercase tracking-tight">Pending Request</span>
                                        <span className="text-[9px] font-bold opacity-75">Log for approval later</span>
                                    </button>
                                </div>
                            </div>

                            {/* Step 4: Reason */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    4. Reason / Swap Notes
                                </Label>
                                <Textarea
                                    value={swapReason}
                                    onChange={e => setSwapReason(e.target.value)}
                                    placeholder="e.g. Relocation requested due to study hours preference..."
                                    className="rounded-2xl border-slate-200 dark:border-border text-xs font-medium min-h-[80px]"
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Controls */}
                <DialogFooter className="p-8 pt-0 flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="h-12 flex-1 rounded-2xl border-slate-200 dark:border-border font-bold text-xs uppercase tracking-wider"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || isLoadingData}
                        className="h-12 flex-1 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            autoApprove ? "Execute Swap" : "Submit Request"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
