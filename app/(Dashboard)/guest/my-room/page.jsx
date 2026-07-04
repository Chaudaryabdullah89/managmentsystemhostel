"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bed,
  Calendar,
  Building2,
  ChevronLeft,
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

const amenityIcons = {
  WiFi: Wifi,
  Internet: Wifi,
  AC: Wind,
  "Air Conditioning": Wind,
  Mess: Coffee,
  Food: Coffee,
  Laundry: Wind,
  Security: ShieldCheck,
  Electricity: Zap,
  Power: Zap,
};

const parseReason = (reason) => {
  if (reason?.startsWith("[DIRECT_TRANSFER]")) {
    const cleaned = reason.replace("[DIRECT_TRANSFER]", "").trim();
    return {
      isDirect: true,
      displayReason: cleaned || "Direct room transfer by warden",
    };
  }
  return {
    isDirect: false,
    displayReason: reason || "No reason specified",
  };
};

const GuestRoomPage = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
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

  const { data: roomsData } = useRoomByHostelId(hostel?.id);
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

  const [selectedRoom, setSelectedRoom] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableRooms =
    roomsData?.success && Array.isArray(roomsData.data) && room
      ? roomsData.data.filter((r) => r.id !== room.id)
      : [];

  const handleSwapSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom || !reason.trim()) {
      toast.error("Please choose a room and write a reason.");
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
    (p) => p.status === "PAID" && p.type !== "SECURITY_REFUND",
  );
  const pendingPayments = payments.filter((p) =>
    ["PENDING", "OVERDUE", "PARTIAL"].includes(p.status),
  );
  const totalPaid = paidPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalPending = pendingPayments.reduce(
    (s, p) => s + Number(p.amount || 0),
    0,
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
        <div className="h-16 w-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600">
          <Bed className="h-8 w-8" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-slate-900 dark:text-foreground uppercase tracking-tight">
            No Active Room Assigned
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            You do not have an active room assignment at the moment.
          </p>
        </div>
        <Link href="/guest/bookings">
          <Button className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm">
            View My Bookings
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background pb-20 font-sans tracking-tight">
      {/* Top Header */}
      <header className="bg-white/80 dark:bg-card/80 backdrop-blur-md border-b sticky top-0 z-40 h-20 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-xl h-9 w-9 hover:bg-slate-100"
            >
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </Button>
            <div className="h-5 w-px bg-slate-200" />
            <div>
              <h1 className="text-base font-black text-slate-900 dark:text-foreground tracking-tight uppercase">
                My Room Details
              </h1>
              <p className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider">
                Room #{room.roomNumber} • Floor {room.floor}
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-black uppercase px-3 py-1 rounded-lg">
            Active Resident
          </Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Hero Room Banner */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 md:p-10 relative overflow-hidden shadow-lg">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">
              {hostel?.name || "Hostel Property"}
            </p>
            <div className="flex items-end gap-3 mb-4">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight">
                Room {room.roomNumber}
              </h2>
              <div className="mb-2">
                <span className="inline-block h-3 w-3 rounded-full bg-emerald-400 animate-pulse shadow-sm" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-indigo-200 font-semibold">
                <Building2 className="h-4 w-4" />
                <span>Floor {room.floor}</span>
              </div>
              <div className="flex items-center gap-1.5 text-indigo-200 font-semibold">
                <Users className="h-4 w-4" />
                <span>
                  {room.type} Room ({room.capacity} Beds)
                </span>
              </div>
              {hostel?.city && (
                <div className="flex items-center gap-1.5 text-indigo-200 font-semibold">
                  <MapPin className="h-4 w-4" />
                  <span>{hostel.city}</span>
                </div>
              )}
            </div>
          </div>

          {/* Booking Stats Strip */}
          <div className="relative z-10 grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
            <div className="flex flex-col">
              <span className="text-[9.5px] font-black text-indigo-300 uppercase tracking-widest mb-0.5">
                Check-In Date
              </span>
              <span className="text-xs md:text-sm font-black text-white">
                {checkInDate ? format(checkInDate, "MMM dd, yyyy") : "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9.5px] font-black text-indigo-300 uppercase tracking-widest mb-0.5">
                Days Stayed
              </span>
              <span className="text-xs md:text-sm font-black text-emerald-400">
                {daysStayed} Days
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9.5px] font-black text-indigo-300 uppercase tracking-widest mb-0.5">
                Monthly Rent
              </span>
              <span className="text-xs md:text-sm font-black text-white">
                PKR {(room.monthlyRent || room.price || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Rent Paid",
              value: `PKR ${totalPaid.toLocaleString()}`,
              icon: CheckCircle,
              color: "text-emerald-600 bg-emerald-50 border-emerald-100",
            },
            {
              label: "Unpaid Dues",
              value: `PKR ${totalPending.toLocaleString()}`,
              icon: AlertCircle,
              color: "text-amber-600 bg-amber-50 border-amber-100",
            },
            {
              label: "Booking Code",
              value:
                currentBooking.uid ||
                "#" + currentBooking.id?.slice(-6).toUpperCase(),
              icon: FileText,
              color: "text-indigo-600 bg-indigo-50 border-indigo-100",
            },
            {
              label: "Security Deposit",
              value: `PKR ${(currentBooking.securityDeposit || 0).toLocaleString()}`,
              icon: ShieldCheck,
              color: "text-blue-600 bg-blue-50 border-blue-100",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white dark:bg-card border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col gap-2 hover:shadow-md transition-all"
            >
              <div
                className={`h-9 w-9 rounded-xl ${item.color} border flex items-center justify-center`}
              >
                <item.icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest">
                  {item.label}
                </p>
                <p className="text-xs md:text-sm font-black text-slate-900 dark:text-foreground mt-0.5 truncate">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Room Facilities & Hostel Contact */}
          <div className="lg:col-span-1 space-y-6">
            {/* Room Facilities */}
            <div className="bg-white dark:bg-card border border-slate-200/80 rounded-3xl p-6 shadow-2xs">
              <h3 className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">
                Room Facilities
              </h3>
              <div className="flex flex-wrap gap-2">
                {(room.amenities || []).length > 0 ? (
                  room.amenities.map((amenity, i) => {
                    const Icon = amenityIcons[amenity] || Star;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2"
                      >
                        <Icon className="h-3.5 w-3.5 text-indigo-600" />
                        <span className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider">
                          {amenity}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[10.5px] font-bold text-slate-400 uppercase italic">
                    Standard room facilities
                  </p>
                )}
              </div>
            </div>

            {/* Hostel Contact */}
            <div className="bg-white dark:bg-card border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
              <h3 className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-widest">
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
                    <div className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      <item.icon className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest">
                        {item.label}
                      </p>
                      <p className="text-xs font-bold text-slate-800 dark:text-foreground mt-0.5">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              {hostel?.messavailable && (
                <div className="flex items-center gap-2 mt-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <Coffee className="h-4 w-4 text-emerald-600" />
                  <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">
                    Mess / Dining Available
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Payment Logs & Room Change Request */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payments Overview */}
            <div className="bg-white dark:bg-card border border-slate-200/80 rounded-3xl p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-widest">
                  Recent Payments
                </h3>
                <Link href="/guest/payments">
                  <Button
                    variant="ghost"
                    className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:bg-indigo-50"
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
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${payment.status === "PAID" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}
                        >
                          <Receipt className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 dark:text-foreground">
                            {payment.notes || payment.type || "Monthly Rent"}
                          </p>
                          <p className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
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

            {/* Room Change Request Card */}
            <div className="bg-white dark:bg-card border border-slate-200/80 rounded-3xl p-6 shadow-2xs">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-foreground uppercase tracking-tight">
                    Request Room Change
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Apply to switch to a different room
                  </p>
                </div>
              </div>

              <form onSubmit={handleSwapSubmit} className="space-y-4 mb-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                    Select Target Room
                  </label>
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="">-- Select Available Room --</option>
                    {availableRooms.map((r) => {
                      const taken = r.Booking?.length || 0;
                      const left = r.capacity - taken;
                      const isFull = left <= 0;
                      return (
                        <option key={r.id} value={r.id} disabled={isFull}>
                          Room {r.roomNumber} - Floor {r.floor} ({r.type} Room,{" "}
                          {isFull ? "Full" : `${left} bed left`})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                    Reason for Room Change
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain why you want to change room (e.g. want lower floor, quiet environment)..."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition-all active:scale-95"
                >
                  {isSubmitting
                    ? "Submitting Request..."
                    : "Submit Room Change Request"}
                </Button>
              </form>

              {/* Request History */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
                  Room Change History
                </h4>
                {swapRequests && swapRequests.length > 0 ? (
                  swapRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black text-slate-800">
                            Room {req.FromRoom?.roomNumber || "N/A"} &rarr; Room{" "}
                            {req.ToRoom?.roomNumber || "N/A"}
                          </p>
                          <p className="text-[9.5px] font-bold text-slate-400 mt-0.5">
                            Requested:{" "}
                            {new Date(req.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          className={`text-[8.5px] font-extrabold border-none px-2 py-0.5 rounded-md ${
                            req.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700"
                              : req.status === "REJECTED"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {req.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400">
                    <p className="text-xs font-semibold">
                      No room change requests submitted yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GuestRoomPage;
