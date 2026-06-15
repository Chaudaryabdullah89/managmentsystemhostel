"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePayment } from "@/hooks/usePayment";
import { useBookings } from "@/hooks/useBooking";
import { toast } from "sonner";
import { Loader2, Plus, Home, DoorOpen, User, DollarSign, FileText } from "lucide-react";

export default function CreateDueModal({ isOpen, onOpenChange, isAdmin, user, hostels }) {
  const [selectedHostel, setSelectedHostel] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState("");
  
  const [formData, setFormData] = useState({
    amount: "",
    type: "RENT",
    method: "CASH",
    status: "PENDING",
    date: new Date().toISOString().split("T")[0],
    month: new Date().toLocaleString("default", { month: "long" }),
    year: new Date().getFullYear().toString(),
    notes: "",
  });

  const createPayment = useCreatePayment();

  // Initialize warden's hostel automatically
  useEffect(() => {
    if (!isAdmin && user?.hostelId) {
      setSelectedHostel(user.hostelId);
    }
  }, [isAdmin, user?.hostelId, isOpen]);

  // Fetch all bookings for the selected hostel
  const { data: bookingsData, isLoading: isLoadingBookings } = useBookings({
    hostelId: selectedHostel || undefined,
  });

  const bookings = bookingsData || [];

  // Derived rooms based on active bookings in the hostel
  // (We use bookings to get rooms because we only care about occupied rooms)
  const availableRooms = useMemo(() => {
    if (!bookings.length) return [];
    const roomsMap = new Map();
    bookings.forEach((b) => {
      if ((b.status === "CONFIRMED" || b.status === "CHECKED_IN") && b.Room) {
        if (!roomsMap.has(b.Room.id)) {
          roomsMap.set(b.Room.id, b.Room);
        }
      }
    });
    return Array.from(roomsMap.values());
  }, [bookings]);

  // Derived residents based on the selected room
  const availableResidents = useMemo(() => {
    if (!selectedRoom || !bookings.length) return [];
    return bookings.filter(
      (b) => b.roomId === selectedRoom && (b.status === "CONFIRMED" || b.status === "CHECKED_IN")
    );
  }, [selectedRoom, bookings]);

  // Reset dependent fields when parent fields change
  useEffect(() => {
    setSelectedRoom("");
    setSelectedBookingId("");
  }, [selectedHostel]);

  useEffect(() => {
    setSelectedBookingId("");
  }, [selectedRoom]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingId) {
      return toast.error("Please select a resident");
    }
    if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
      return toast.error("Please enter a valid amount");
    }

    const booking = availableResidents.find((b) => b.id === selectedBookingId);
    if (!booking) return toast.error("Invalid booking selected");

    try {
      await createPayment.mutateAsync({
        bookingId: booking.id,
        userId: booking.userId,
        amount: Number(formData.amount),
        type: formData.type,
        method: formData.method,
        status: formData.status,
        date: new Date(formData.date).toISOString(),
        month: formData.month,
        year: Number(formData.year),
        notes: formData.notes,
      });

      onOpenChange(false);
      // Reset form
      setFormData({
        amount: "",
        type: "RENT",
        method: "CASH",
        status: "PENDING",
        date: new Date().toISOString().split("T")[0],
        month: new Date().toLocaleString("default", { month: "long" }),
        year: new Date().getFullYear().toString(),
        notes: "",
      });
      setSelectedBookingId("");
      if (isAdmin) {
        setSelectedHostel("");
      } else {
        setSelectedRoom("");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-950">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-800 p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-2xl animate-pulse" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center shadow-inner hover:scale-110 transition-transform duration-300">
              <Plus className="h-6 w-6 text-white stroke-[2.5]" />
            </div>
            <div className="flex flex-col text-left">
              <DialogTitle className="text-xl md:text-2xl font-black tracking-tight uppercase">
                Create New Due
              </DialogTitle>
              <DialogDescription className="text-indigo-100/90 text-xs md:text-sm font-medium mt-1">
                Issue a custom fee, rent, or penalty to a specific resident.
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Scope Selection */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-zinc-800/80">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                01
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-350">
                Scope Selection
              </h3>
            </div>

            {/* Hostel Select */}
            <div className="space-y-1.5 group">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 ml-1">
                Hostel
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 dark:text-zinc-500 dark:group-focus-within:text-indigo-455 transition-colors duration-200">
                  <Home className="h-4 w-4" />
                </div>
                <select
                  className="w-full h-12 pl-10 pr-8 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-950/30 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:bg-white dark:focus:bg-zinc-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 hover:border-slate-350 dark:hover:border-zinc-700 transition-all duration-200 outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
                  value={selectedHostel}
                  onChange={(e) => setSelectedHostel(e.target.value)}
                  disabled={!isAdmin}
                  required
                >
                  <option value="" disabled>Select Hostel</option>
                  {hostels?.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 group-hover:text-slate-500 dark:text-zinc-500 transition-colors duration-200">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Room Select */}
            <div className="space-y-1.5 group">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 ml-1">
                Room
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 dark:text-zinc-500 dark:group-focus-within:text-indigo-455 transition-colors duration-200">
                  <DoorOpen className="h-4 w-4" />
                </div>
                <select
                  className="w-full h-12 pl-10 pr-8 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-950/30 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:bg-white dark:focus:bg-zinc-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 hover:border-slate-350 dark:hover:border-zinc-700 transition-all duration-200 outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  disabled={!selectedHostel || isLoadingBookings}
                  required
                >
                  <option value="" disabled>Select Room</option>
                  {availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.roomNumber} (Cap: {r.capacity})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 group-hover:text-slate-500 dark:text-zinc-500 transition-colors duration-200">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Resident Select */}
            <div className="space-y-1.5 group">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 ml-1">
                Resident
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 dark:text-zinc-500 dark:group-focus-within:text-indigo-455 transition-colors duration-200">
                  <User className="h-4 w-4" />
                </div>
                <select
                  className="w-full h-12 pl-10 pr-8 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-950/30 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:bg-white dark:focus:bg-zinc-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 hover:border-slate-350 dark:hover:border-zinc-700 transition-all duration-200 outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  disabled={!selectedRoom}
                  required
                >
                  <option value="" disabled>Select Resident</option>
                  {availableResidents.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.User?.name} ({b.User?.email})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 group-hover:text-slate-550 dark:text-zinc-500 transition-colors duration-200">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Due Specifications */}
          <div className="space-y-5 pt-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-zinc-800/80">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                02
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-355">
                Due Specifications
              </h3>
            </div>

            {/* Amount Input */}
            <div className="space-y-1.5 group">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 ml-1">
                Amount (PKR)
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 dark:text-zinc-555 dark:group-focus-within:text-indigo-455 transition-colors duration-200">
                  <DollarSign className="h-4 w-4" />
                </div>
                <Input
                  type="number"
                  min="1"
                  required
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-950/30 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:bg-white dark:focus:bg-zinc-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 hover:border-slate-350 dark:hover:border-zinc-700 transition-all duration-200 outline-none"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="e.g. 15000"
                />
              </div>
            </div>

            {/* Type & Status Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 group">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 ml-1">
                  Type
                </Label>
                <div className="relative">
                  <select
                    className="w-full h-12 px-3.5 pr-8 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-950/30 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:bg-white dark:focus:bg-zinc-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 hover:border-slate-350 dark:hover:border-zinc-700 transition-all duration-200 outline-none cursor-pointer appearance-none"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="RENT">Rent</option>
                    <option value="MESS">Mess</option>
                    <option value="LAUNDRY">Laundry</option>
                    <option value="FINE">Fine</option>
                    <option value="SECURITY">Security</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-555">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 group">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-555 ml-1">
                  Status
                </Label>
                <div className="relative">
                  <select
                    className="w-full h-12 px-3.5 pr-8 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-950/30 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:bg-white dark:focus:bg-zinc-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 hover:border-slate-350 dark:hover:border-zinc-700 transition-all duration-200 outline-none cursor-pointer appearance-none"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="PENDING">Pending (Due)</option>
                    <option value="PAID">Paid</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-555">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Month & Year Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 group">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 ml-1">
                  Month
                </Label>
                <div className="relative">
                  <select
                    className="w-full h-12 px-3.5 pr-8 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-950/30 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:bg-white dark:focus:bg-zinc-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 hover:border-slate-355 dark:hover:border-zinc-700 transition-all duration-200 outline-none cursor-pointer appearance-none"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  >
                    {[
                      "January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"
                    ].map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-555">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 group">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-555 ml-1">
                  Year
                </Label>
                <Input
                  type="number"
                  className="w-full h-12 px-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-950/30 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:bg-white dark:focus:bg-zinc-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 hover:border-slate-355 dark:hover:border-zinc-700 transition-all duration-200 outline-none"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                />
              </div>
            </div>

            {/* Notes Input */}
            <div className="space-y-1.5 group">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-555 ml-1 flex items-center gap-1">
                <FileText className="h-3 w-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" /> Notes
              </Label>
              <Textarea
                placeholder="Optional details..."
                className="w-full min-h-[70px] p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-950/30 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:bg-white dark:focus:bg-zinc-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 hover:border-slate-350 dark:hover:border-zinc-700 transition-all duration-200 outline-none resize-none placeholder:text-slate-400 dark:placeholder:text-zinc-605"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-4 pt-6 border-t border-slate-100 dark:border-zinc-850">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 rounded-xl uppercase font-bold text-[10px] tracking-widest h-12 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-500 dark:text-zinc-400 transition-colors duration-200"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 hover:shadow-indigo-500/20 text-white uppercase font-bold text-[10px] tracking-widest h-12 shadow-lg shadow-indigo-600/20 dark:shadow-indigo-900/10 active:scale-[0.98] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
              disabled={createPayment.isPending}
            >
              {createPayment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  Create Due
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
