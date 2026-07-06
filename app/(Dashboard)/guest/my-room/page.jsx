"use client";

import React, { useState } from "react";
import {
  Bed,
  Building2,
  MapPin,
  ShieldCheck,
  Users,
  Wifi,
  Coffee,
  Wind,
  Zap,
  CheckCircle,
  Phone,
  Mail,
  AlertCircle,
  FileText,
  Receipt,
  ChevronRight,
  Home,
  ArrowRight,
  Star,
  Send,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  X,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useAuthStore from "@/hooks/Authstate";
import { useBookings } from "@/hooks/useBooking";
import { useAllPayments } from "@/hooks/usePayment";
import { useRoomByHostelId } from "@/hooks/useRoom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";
import { DetailPageSkeleton } from "@/components/ui/skeletons";

const GuestRoomPage = () => {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState("space"); // "space" | "roommates" | "swap"
  const [selectedRoommate, setSelectedRoommate] = useState(null);

  /* ─────────── Tanstack Queries ─────────── */
  const { data: bookingsData, isLoading } = useBookings({ userId: user?.id });
  const { data: paymentsData } = useAllPayments({
    userId: user?.id,
    limit: 50,
  });

  const currentBooking =
    bookingsData?.find((b) => ["CONFIRMED", "CHECKED_IN"].includes(b.status)) ||
    bookingsData?.[0];
  const room = currentBooking?.Room;
  const hostel = room?.Hostel;

  const { data: roomsData, isLoading: isRoomsLoading } = useRoomByHostelId(hostel?.id);
  
  const { data: swapRequests, refetch: refetchSwaps } = useQuery({
    queryKey: ["roomSwapRequests", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/guest/room-swap");
      if (!res.ok) throw new Error("Failed to fetch swap requests");
      const json = await res.json();
      return json.requests || [];
    },
    enabled: !!user?.id,
  });

  const { data: dashboardData } = useQuery({
    queryKey: ["guestDashboardWeb", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/guest/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard info");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const roommates = dashboardData?.roommates || [];

  const [selectedRoom, setSelectedRoom] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allRooms = roomsData?.success && Array.isArray(roomsData.data) ? roomsData.data : [];
  const availableRooms = allRooms.filter((r) => {
    if (r.id === room?.id) return false;
    const isFull = (r.Booking?.length || 0) >= r.capacity || r.status?.toUpperCase() === "OCCUPIED";
    return !isFull;
  });

  const pendingSwap = swapRequests?.find((s) => s.status?.toUpperCase() === "PENDING");

  const handleSwapSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom || !reason.trim()) {
      toast.error("Please choose a target room and write a reason.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/guest/room-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toRoomId: selectedRoom, reason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Room change request submitted successfully!");
        setSelectedRoom("");
        setReason("");
        refetchSwaps();
      } else {
        toast.error(data.error || "Failed to submit room change request");
      }
    } catch (error) {
      toast.error("Something went wrong while submitting request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const payments = paymentsData?.payments || [];
  const paidPayments = payments.filter(
    (p) => p.status === "PAID" && p.type !== "SECURITY_REFUND"
  );
  const pendingPayments = payments.filter((p) =>
    ["PENDING", "OVERDUE", "PARTIAL"].includes(p.status)
  );
  const totalPaid = paidPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalPending = pendingPayments.reduce(
    (s, p) => s + Number(p.amount || 0),
    0
  );

  const checkInDate = currentBooking?.checkIn
    ? new Date(currentBooking.checkIn)
    : null;
  const today = new Date();
  const daysStayed = checkInDate
    ? Math.floor((today - checkInDate) / (1000 * 60 * 60 * 24))
    : 0;

  if (isLoading) return <DetailPageSkeleton />;

  if (!currentBooking || !room) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-background flex flex-col items-center justify-center gap-6 p-8">
        <div className="h-16 w-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 animate-bounce">
          <Bed className="h-8 w-8" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-slate-900 dark:text-foreground uppercase tracking-tight">
            No Active Room Assigned
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Your room assignment is currently being processed by our management team.
          </p>
        </div>
        <Link href="/guest/bookings">
          <Button className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm transition-all duration-200">
            View My Bookings
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background pb-20 font-sans tracking-tight animate-fade-in">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .animate-slide-up {
          animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-left {
          animation: slideLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Inline Page Title — no sticky, layout header handles global nav */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-foreground tracking-tight uppercase">
              My Room Space
            </h1>
            <p className="text-[10.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
              Room #{room.roomNumber} • Floor {room.floor}
            </p>
          </div>
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-black uppercase px-3 py-1 rounded-lg">
            Active Resident
          </Badge>
        </div>
        {/* Boarding Pass Premium Pass Ticket */}
        <div className="bg-slate-900 text-white rounded-3xl overflow-hidden shadow-lg border border-indigo-900/30">
          <div className="p-8 md:p-10 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_50%)]" />
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-[9.5px] font-black text-indigo-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Building2 className="h-3 w-3" />
                  {hostel?.name || "HMS Premium Properties"}
                </p>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-200">
                  Room {room.roomNumber}
                </h2>
              </div>
              <Badge className="bg-indigo-600/30 text-indigo-300 border border-indigo-500/20 text-[9px] font-black uppercase px-3 py-1 rounded-lg">
                {room.type} Suite
              </Badge>
            </div>
          </div>

          {/* Ticket cutout separator line */}
          <div className="h-px flex items-center relative">
            <div className="w-full border-t border-dashed border-white/10 mx-8" />
            <div className="h-8 w-8 rounded-full bg-slate-50/50 dark:bg-background absolute -left-4" />
            <div className="h-8 w-8 rounded-full bg-slate-50/50 dark:bg-background absolute -right-4" />
          </div>

          <div className="p-8 md:p-10 bg-slate-950/40 relative z-10 grid grid-cols-3 gap-4">
            <div className="flex flex-col">
              <span className="text-[8.5px] font-black text-indigo-300 uppercase tracking-widest mb-0.5">
                Residency Check-In
              </span>
              <span className="text-xs md:text-sm font-black text-white">
                {checkInDate ? format(checkInDate, "MMM dd, yyyy") : "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8.5px] font-black text-indigo-300 uppercase tracking-widest mb-0.5">
                WING SECTION
              </span>
              <span className="text-xs md:text-sm font-black text-indigo-200">
                {room.wing || "Main Wing"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8.5px] font-black text-indigo-300 uppercase tracking-widest mb-0.5">
                MONTHLY RENT
              </span>
              <span className="text-xs md:text-sm font-black text-white">
                PKR {(room.monthlyRent || room.price || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Summary Quick Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Rent Paid",
              value: `PKR ${totalPaid.toLocaleString()}`,
              icon: CheckCircle,
              color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30",
            },
            {
              label: "Unpaid Dues",
              value: `PKR ${totalPending.toLocaleString()}`,
              icon: AlertCircle,
              color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30",
            },
            {
              label: "Booking Code",
              value:
                currentBooking.uid ||
                "#" + currentBooking.id?.slice(-6).toUpperCase(),
              icon: FileText,
              color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30",
            },
            {
              label: "Security Deposit",
              value: `PKR ${(currentBooking.securityDeposit || 0).toLocaleString()}`,
              icon: ShieldCheck,
              color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white dark:bg-card border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col gap-2 hover:-translate-y-1 hover:shadow-md transition-all duration-300"
            >
              <div
                className={`h-9 w-9 rounded-xl ${item.color} border flex items-center justify-center`}
              >
                <item.icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[9.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {item.label}
                </p>
                <p className="text-xs md:text-sm font-black text-slate-900 dark:text-foreground mt-0.5 truncate">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Glossy Tabs bar */}
        <div className="bg-slate-200/50 dark:bg-card border dark:border-slate-800 p-1.5 rounded-2xl flex items-center gap-1">
          {[
            { id: "space", label: "Room Space Details", icon: Building2 },
            { id: "roommates", label: `Roommates (${roommates.length})`, icon: Users },
            { id: "swap", label: "Room Swap Hub", icon: Send },
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 relative ${
                  isTabActive
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.id === "swap" && pendingSwap && (
                  <span className="absolute top-2.5 right-4 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content panels */}
        <div className="transition-all duration-500">
          {activeTab === "space" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
              {/* Left Column: Payments Overview */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-card border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Recent Payments
                    </h3>
                    <Link href="/guest/payments">
                      <Button
                        variant="ghost"
                        className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800"
                      >
                        View All Payments{" "}
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {payments.length > 0 ? (
                      payments.slice(0, 5).map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${payment.status === "PAID" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}
                            >
                              <Receipt className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                                {payment.notes || payment.type || "Monthly Rent"}
                              </p>
                              <p className="text-[9.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                                {format(new Date(payment.date), "MMM dd, yyyy")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-slate-900 dark:text-foreground">
                              PKR {payment.amount?.toLocaleString()}
                            </p>
                            <Badge
                              className={`mt-0.5 text-[8.5px] font-black border-none px-2 py-0.5 rounded-md ${payment.status === "PAID" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                            >
                              {payment.status === "PAID" ? "Paid ✓" : "Unpaid"}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <p className="text-xs font-semibold">
                          No payment records found yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Active Stay Specifications & Contacts */}
              <div className="lg:col-span-1 space-y-6">
                {/* Stay Specifications details */}
                <div className="bg-white dark:bg-card border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-4">
                  <h3 className="text-[10.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Stay Specifications
                  </h3>
                  
                  {[
                    { label: "Floor Level", value: `${room.floor} Level`, icon: Home },
                    { label: "Wing Section", value: room.wing || "Main Block", icon: Building2 },
                    { label: "Total Nights stayed", value: `${daysStayed} Nights`, icon: Calendar },
                    { label: "Hostel Block", value: hostel?.name, icon: MapPin },
                  ].map((spec, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-slate-50 dark:bg-slate-800 border flex items-center justify-center shrink-0">
                        <spec.icon className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest">
                          {spec.label}
                        </p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {spec.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Directory Contacts Card */}
                <div className="bg-white dark:bg-card border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-4">
                  <h3 className="text-[10.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Hostel Contact Info
                  </h3>
                  {[
                    { label: "Hostel Name", value: hostel?.name, icon: Building2 },
                    {
                      label: "Address",
                      value: hostel?.completeaddress || hostel?.address,
                      icon: MapPin,
                    },
                    { label: "City", value: hostel?.city, icon: Home },
                    { label: "Phone", value: hostel?.phone, icon: Phone },
                    { label: "Email", value: hostel?.email, icon: Mail },
                  ]
                    .filter((i) => i.value)
                    .map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                          <item.icon className="h-3.5 w-3.5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-[9.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            {item.label}
                          </p>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  {hostel?.messavailable && (
                    <div className="flex items-center gap-2 mt-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                      <Coffee className="h-4 w-4 text-emerald-600" />
                      <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        Mess / Dining Active
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "roommates" && (
            <div className="space-y-6 animate-slide-up">
              <div className="bg-white dark:bg-card border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xs">
                <h3 className="text-[10.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">
                  Occupants Registered ({roommates.length + 1})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current User ID Badge Card */}
                  <div className="relative overflow-hidden bg-slate-50 dark:bg-slate-900/30 border border-indigo-200 dark:border-indigo-950/40 rounded-3xl p-6 shadow-2xs hover:shadow-md transition-all duration-300">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-indigo-600 border-2 border-indigo-200 flex items-center justify-center text-white font-extrabold text-lg shadow-inner">
                        U
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 dark:text-foreground truncate">
                            {user?.name || "You"}
                          </h4>
                          <span className="text-[8px] font-black uppercase text-indigo-700 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-950/30 px-2 py-0.5 rounded-md">
                            YOU
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-4" />
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <span>Seat: <strong className="text-slate-600 dark:text-slate-300">Bed Slot A</strong></span>
                      <span className="text-emerald-600">Active Stay</span>
                    </div>
                  </div>

                  {/* Roommates ID Badge Cards */}
                  {roommates.map((r, index) => {
                    const initials = r.name?.[0]?.toUpperCase() || "?";
                    const bedLetter = String.fromCharCode(66 + index); // Slot B, C, D...
                    return (
                      <div
                        key={r.id}
                        className="relative overflow-hidden bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-400 dark:bg-slate-700" />
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-extrabold text-lg shadow-xs">
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-black text-slate-900 dark:text-foreground truncate">
                                {r.name}
                              </h4>
                              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1 truncate">
                                {r.email}
                              </p>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedRoommate(r)}
                            className="h-8 w-8 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                          >
                            <ChevronRight className="h-4.5 w-4.5" />
                          </Button>
                        </div>
                        
                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            Seat: <strong className="text-slate-600 dark:text-slate-300">Bed Slot {bedLetter}</strong>
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {r.phone && (
                              <a
                                href={`tel:${r.phone}`}
                                className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 px-2.5 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/30 transition-colors"
                              >
                                <Phone className="h-3 w-3" />
                                <span>Call</span>
                              </a>
                            )}
                            <a
                              href={`mailto:${r.email}`}
                              className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 px-2.5 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/30 transition-colors"
                            >
                              <Mail className="h-3 w-3" />
                              <span>Email</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "swap" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
              {/* Proposal Form Section */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-card border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xs">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-foreground uppercase tracking-tight">
                        Request Room Swap
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Submit a request to switch rooms
                      </p>
                    </div>
                  </div>

                  {pendingSwap ? (
                    <div className="bg-amber-50/50 border border-amber-200/60 dark:bg-amber-950/10 dark:border-amber-900/30 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                        <div>
                          <h4 className="text-xs font-black text-amber-900 dark:text-amber-400 uppercase tracking-tight">
                            Proposal Pending Review
                          </h4>
                          <p className="text-[9.5px] font-extrabold text-amber-500 uppercase tracking-wider mt-0.5">
                            Logged on {format(new Date(pendingSwap.createdAt), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-amber-200/60 dark:border-amber-900/30 pt-3 text-xs space-y-1">
                        <p className="font-bold text-slate-700 dark:text-slate-300">
                          Target Room: Room {pendingSwap.ToRoom?.roomNumber || pendingSwap.toRoom?.roomNumber || pendingSwap.toRoom?.number}
                        </p>
                        <p className="text-slate-500 font-semibold italic">
                          "{pendingSwap.reason}"
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSwapSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          Select Target Room
                        </label>
                        {isRoomsLoading ? (
                          <div className="h-10 bg-slate-50 animate-pulse rounded-xl" />
                        ) : availableRooms.length === 0 ? (
                          <div className="p-3 bg-slate-50 border rounded-xl text-center text-xs font-semibold text-slate-500">
                            No eligible rooms with vacancies available.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {availableRooms.map((r) => {
                              const isSelected = selectedRoom === r.id;
                              return (
                                <button
                                  type="button"
                                  key={r.id}
                                  onClick={() => setSelectedRoom(r.id)}
                                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-300 ${
                                    isSelected
                                      ? "bg-indigo-50/50 border-indigo-600 text-indigo-600 dark:bg-indigo-950/20"
                                      : "bg-slate-50/50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400"
                                  }`}
                                >
                                  <span className="text-xs font-black">Room {r.roomNumber}</span>
                                  <span className="text-[9px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mt-1">
                                    Floor {r.floor}
                                  </span>
                                  <span className="text-[8.5px] font-black text-emerald-600 mt-2 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md">
                                    Vacant Space
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          Reason for Proposal
                        </label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Why do you wish to change rooms? (e.g. floor preference, allergen concerns)..."
                          rows={3}
                          className="w-full bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={isSubmitting || !selectedRoom || !reason.trim()}
                        className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition-all active:scale-95"
                      >
                        {isSubmitting
                          ? "Submitting Request..."
                          : "Submit Room Swap Request"}
                      </Button>
                    </form>
                  )}
                </div>
              </div>

              {/* Logs Timeline column */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-card border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xs">
                  <h3 className="text-[10.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                    Swap Request Logs
                  </h3>
                  <div className="space-y-3">
                    {swapRequests && swapRequests.length > 0 ? (
                      swapRequests.map((req) => {
                        const isApproved = req.status === "APPROVED";
                        const isRejected = req.status === "REJECTED";
                        
                        let badgeColor = "bg-amber-50 text-amber-700";
                        if (isApproved) badgeColor = "bg-emerald-50 text-emerald-700";
                        else if (isRejected) badgeColor = "bg-rose-50 text-rose-700";

                        const displayRoomNum = req.ToRoom?.roomNumber || req.toRoom?.roomNumber || "—";

                        return (
                          <div
                            key={req.id}
                            className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                                  Room {room.roomNumber} &rarr; Room {displayRoomNum}
                                </p>
                                <p className="text-[9.5px] font-bold text-slate-400 mt-0.5">
                                  Requested: {format(new Date(req.createdAt), "MMM dd, yyyy")}
                                </p>
                              </div>
                              <Badge className={`text-[8.5px] font-extrabold border-none px-2 py-0.5 rounded-md ${badgeColor}`}>
                                {req.status}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-slate-500 font-semibold mt-2 border-t border-slate-100 dark:border-slate-800 pt-2 italic">
                              "{req.reason}"
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-slate-400">
                        <p className="text-xs font-semibold">
                          No previous requests recorded.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Roommate Profile Side Drawer Modal */}
      {selectedRoommate && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="h-full w-full max-w-md bg-white dark:bg-card border-l p-8 shadow-2xl relative flex flex-col gap-6 animate-slide-left">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedRoommate(null)}
              className="absolute top-4 right-4 rounded-full h-8 w-8 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="flex flex-col items-center text-center mt-6">
              <div className="h-20 w-20 rounded-full bg-indigo-50 dark:bg-slate-800 border-2 border-indigo-100 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-2xl shadow-sm mb-4">
                {selectedRoommate.name?.[0]?.toUpperCase()}
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-foreground">
                {selectedRoommate.name}
              </h3>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">
                HMS Resident Roommate
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <h4 className="text-[9.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                Occupant Contact Info
              </h4>

              <a
                href={`mailto:${selectedRoommate.email}`}
                className="flex items-center gap-3 group"
              >
                <div className="h-8 w-8 rounded-xl bg-white dark:bg-slate-800 border flex items-center justify-center shrink-0">
                  <Mail className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    Email Address
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-300 mt-0.5 truncate group-hover:text-indigo-600">
                    {selectedRoommate.email}
                  </p>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>

              {selectedRoommate.phone && (
                <>
                  <div className="h-px bg-slate-200/60 dark:bg-slate-800" />
                  <a
                    href={`tel:${selectedRoommate.phone}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="h-8 w-8 rounded-xl bg-white dark:bg-slate-800 border flex items-center justify-center shrink-0">
                      <Phone className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        Phone Number
                      </p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-300 mt-0.5 group-hover:text-indigo-600">
                        {selectedRoommate.phone}
                      </p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </>
              )}
            </div>

            <div className="mt-auto flex gap-3">
              {selectedRoommate.phone && (
                <Button
                  onClick={() => window.open(`tel:${selectedRoommate.phone}`)}
                  className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition-all"
                >
                  Call Roommate
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setSelectedRoommate(null)}
                className="flex-1 h-11 border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-extrabold uppercase tracking-wider text-slate-700"
              >
                Close Drawer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestRoomPage;
