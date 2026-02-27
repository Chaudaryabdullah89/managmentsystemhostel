"use client";
import React, { useState, useEffect } from "react";
import {
    ArrowRightLeft, Search, Building2, Bed, Users, CheckCircle,
    Loader2, AlertCircle, ChevronRight, X, DollarSign, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useHostel } from "@/hooks/usehostel";
import { useRoomByHostelId } from "@/hooks/useRoom";
import { useQueryClient } from "@tanstack/react-query";
import { BookingQueryKeys } from "@/hooks/useBooking";

const RoomTransferDialog = ({ booking, onSuccess }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedHostelId, setSelectedHostelId] = useState(booking?.Room?.hostelId || '');
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [adjustRent, setAdjustRent] = useState(false);
    const [newAmount, setNewAmount] = useState(booking?.totalAmount || '');
    const [isTransferring, setIsTransferring] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const queryClient = useQueryClient();
    const { data: hostelsData } = useHostel();
    const { data: roomsData, isLoading: roomsLoading } = useRoomByHostelId(selectedHostelId);

    const hostels = hostelsData?.data || [];
    const allRooms = roomsData?.data || [];
    const availableRooms = allRooms.filter(r =>
        r.status === 'AVAILABLE' &&
        r.id !== booking?.roomId &&
        (r.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.type?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const currentRoom = booking?.Room;
    const selectedRoom = allRooms.find(r => r.id === selectedRoomId);

    const handleTransfer = async () => {
        if (!selectedRoomId) return toast.error("Please select a target room");

        setIsTransferring(true);
        try {
            const res = await fetch('/api/bookings/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: booking.id,
                    newRoomId: selectedRoomId,
                    reason: 'Admin initiated room transfer',
                    ...(adjustRent ? { adjustAmount: parseFloat(newAmount) } : {})
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Room transfer completed successfully!");
                setIsOpen(false);
                queryClient.invalidateQueries({ queryKey: BookingQueryKeys.byId(booking.id) });
                queryClient.invalidateQueries({ queryKey: BookingQueryKeys.all() });
                onSuccess?.();
            } else {
                toast.error(data.error || "Transfer failed");
            }
        } catch (e) {
            toast.error("Transfer failed. Please try again.");
        } finally {
            setIsTransferring(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-10 px-4 rounded-xl border-gray-200 font-bold text-[10px] uppercase tracking-wider hover:bg-black hover:text-white transition-all flex items-center gap-2">
                    <ArrowRightLeft className="h-3.5 w-3.5" /> Transfer Room
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl bg-white flex flex-col max-h-[90vh]">
                <DialogHeader className="p-8 pb-0">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0">
                            <ArrowRightLeft className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-gray-900 uppercase tracking-tight">Transfer Room</DialogTitle>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Move resident to another room</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-6 overflow-y-auto flex-1">
                    {/* Current Room Summary */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                        <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0">
                            <Bed className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Current Room</p>
                            <p className="text-sm font-bold text-gray-900">Room {currentRoom?.roomNumber} — {currentRoom?.Hostel?.name}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                            <Bed className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">New Room</p>
                            <p className="text-sm font-bold text-indigo-600">{selectedRoom ? `Room ${selectedRoom.roomNumber}` : 'Select below'}</p>
                        </div>
                    </div>

                    {/* Hostel selector */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Hostel</Label>
                        <Select value={selectedHostelId} onValueChange={(v) => { setSelectedHostelId(v); setSelectedRoomId(''); }}>
                            <SelectTrigger className="h-12 rounded-xl border-gray-100 font-bold text-sm">
                                <SelectValue placeholder="Select Hostel" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 shadow-2xl p-1">
                                {hostels.map(h => (
                                    <SelectItem key={h.id} value={h.id} className="rounded-xl font-bold text-xs uppercase py-3">
                                        {h.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Room Search */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Available Rooms</Label>
                            <span className="text-[9px] font-bold text-gray-400 uppercase">{availableRooms.length} available</span>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                            <Input
                                className="h-11 pl-10 rounded-xl border-gray-100 font-bold text-sm bg-gray-50"
                                placeholder="Search by room number..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                            {roomsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                                </div>
                            ) : availableRooms.length > 0 ? availableRooms.map(room => (
                                <button
                                    key={room.id}
                                    type="button"
                                    onClick={() => { setSelectedRoomId(room.id); setNewAmount(room.monthlyrent || room.montlyrent || room.price || booking?.totalAmount || 0); }}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${selectedRoomId === room.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${selectedRoomId === room.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            <Bed className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 uppercase">Room {room.roomNumber}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{room.type} • Floor {room.floor} • {room.capacity} beds</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-indigo-600">PKR {(room.monthlyrent || room.montlyrent || room.price || 0).toLocaleString()}/mo</p>
                                        <Badge className="bg-emerald-50 text-emerald-700 border-none text-[8px] font-bold mt-0.5">Available</Badge>
                                    </div>
                                </button>
                            )) : (
                                <div className="text-center py-8 text-gray-300">
                                    <Bed className="h-8 w-8 mx-auto mb-2" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">No available rooms</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rent Adjustment */}
                    {selectedRoom && (
                        <div className="space-y-3 p-4 bg-indigo-50 rounded-2xl">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">Adjust Monthly Rent?</Label>
                                <button
                                    type="button"
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${adjustRent ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                    onClick={() => setAdjustRent(!adjustRent)}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${adjustRent ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            {adjustRent && (
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                                    <Input
                                        type="number"
                                        className="h-12 pl-10 rounded-xl border-indigo-200 bg-white font-bold text-sm"
                                        placeholder="New monthly rent amount"
                                        value={newAmount}
                                        onChange={e => setNewAmount(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wide leading-relaxed">
                            The old room will be freed automatically if no other active bookings remain. This action cannot be undone without creating a new booking.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="h-12 rounded-xl border-gray-100 font-bold text-[10px] uppercase tracking-widest" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200"
                            onClick={handleTransfer}
                            disabled={!selectedRoomId || isTransferring}
                        >
                            {isTransferring ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRightLeft className="h-4 w-4 mr-2" /> Confirm Transfer</>}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default RoomTransferDialog;
