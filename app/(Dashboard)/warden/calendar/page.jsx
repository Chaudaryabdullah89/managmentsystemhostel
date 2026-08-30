"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
  User,
  Phone,
  Mail,
  CreditCard,
  CheckCircle,
  LogIn,
  LogOut,
  Clock,
  Building2,
  Bed,
  RefreshCw,
  Info,
  Search,
  Filter,
  Plus,
  LayoutGrid,
  Calendar as CalendarIcon,
  Layers,
  ArrowUpRight,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Copy,
  Check,
  Zap,
  DollarSign,
  UserCheck,
  Loader2,
  Printer,
  Settings2,
  History,
  FileText,
  Download,
  AlertTriangle
} from "lucide-react";
import {
  addDays,
  format,
  startOfDay,
  differenceInDays,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useAuthStore from "@/hooks/Authstate";
import { useCalendarData, useUpdateBookingStatus } from "@/hooks/useCalendar";
import { useHostel } from "@/hooks/usehostel";
import PageHeader from "@/components/Dashboard/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ─── Constants & Soft Light Color Palette ─────────────────────────────────────

const ROOM_COL_WIDTH = 220; // px for room label column
const HEADER_HEIGHT = 64; // px for date header row

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    barBg: "bg-amber-400 text-amber-950 border-amber-300 shadow-amber-200/50",
    badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50",
    dot: "bg-amber-400",
  },
  CONFIRMED: {
    label: "Confirmed",
    barBg: "bg-indigo-500 text-white border-indigo-400 shadow-indigo-200/50",
    badge: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/50",
    dot: "bg-indigo-500",
  },
  CHECKED_IN: {
    label: "Checked In",
    barBg: "bg-emerald-500 text-white border-emerald-400 shadow-emerald-200/50",
    badge: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50",
    dot: "bg-emerald-500",
  },
  CHECKED_OUT: {
    label: "Checked Out",
    barBg: "bg-slate-300 text-slate-800 border-slate-400 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600",
    badge: "bg-slate-100 dark:bg-muted text-slate-700 dark:text-slate-300 border-slate-300 dark:border-border",
    dot: "bg-slate-500",
  },
  COMPLETED: {
    label: "Completed",
    barBg: "bg-slate-300 text-slate-800 border-slate-400 dark:bg-slate-700 dark:text-slate-100",
    badge: "bg-slate-100 dark:bg-muted text-slate-700 dark:text-slate-300 border-slate-300",
    dot: "bg-slate-500",
  },
  CANCELLED: {
    label: "Cancelled",
    barBg: "bg-rose-400 text-white border-rose-300",
    badge: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50",
    dot: "bg-rose-400",
  },
  REJECTED: {
    label: "Rejected",
    barBg: "bg-gray-400 text-white border-gray-300",
    badge: "bg-gray-100 dark:bg-muted text-gray-500 border-gray-200",
    dot: "bg-gray-400",
  },
};

const ROOM_TYPE_ORDER = ["SINGLE", "DOUBLE", "TRIPLE", "DORMITORY"];
const ROOM_TYPE_LABELS = {
  SINGLE: "Single Room",
  DOUBLE: "Double Room",
  TRIPLE: "Triple Room",
  DORMITORY: "Dormitory",
};

// ─── Sub-Lane Stacking Algorithm for Multi-Occupant Rooms ─────────────────────

function computeBookingLanes(bookings) {
  if (!bookings || bookings.length === 0) return { assignedBookings: [], totalLanes: 1 };

  const sorted = [...bookings].sort(
    (a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
  );
  const laneEndDates = [];

  const assignedBookings = sorted.map((booking) => {
    const start = new Date(booking.checkIn).getTime();
    const end = booking.checkOut
      ? new Date(booking.checkOut).getTime()
      : new Date("2099-12-31").getTime();

    let assignedLane = -1;
    for (let i = 0; i < laneEndDates.length; i++) {
      if (laneEndDates[i] <= start) {
        assignedLane = i;
        laneEndDates[i] = end;
        break;
      }
    }

    if (assignedLane === -1) {
      assignedLane = laneEndDates.length;
      laneEndDates.push(end);
    }

    return { ...booking, laneIndex: assignedLane };
  });

  return { assignedBookings, totalLanes: Math.max(1, laneEndDates.length) };
}

const CopyBadge = ({ text, label = "" }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label || "ID"} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-muted hover:bg-gray-200 dark:hover:bg-muted/80 text-gray-600 dark:text-muted-foreground text-[10px] font-mono font-medium transition-all"
      title={`Click to copy ${label}`}
    >
      <span>{text}</span>
      {copied ? (
        <Check className="h-3 w-3 text-emerald-600 shrink-0" />
      ) : (
        <Copy className="h-3 w-3 text-gray-400 shrink-0 opacity-70 hover:opacity-100" />
      )}
    </button>
  );
};

function getBookingBarStyle(booking, daysShown, startDate, colWidth) {
  const checkIn = startOfDay(parseISO(booking.checkIn));
  const checkOut = booking.checkOut
    ? startOfDay(parseISO(booking.checkOut))
    : addDays(startDate, daysShown);
  const rangeStart = startOfDay(startDate);
  const rangeEnd = addDays(rangeStart, daysShown);

  const clampedStart = checkIn < rangeStart ? rangeStart : checkIn;
  const clampedEnd = checkOut > rangeEnd ? rangeEnd : checkOut;

  const left = Math.max(0, differenceInDays(clampedStart, rangeStart));
  const width = Math.max(1, differenceInDays(clampedEnd, clampedStart));

  return { left: left * colWidth + 4, width: width * colWidth - 8 };
}

function StatusBadge({ status, className = "" }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${cfg.badge} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function BookingBar({ booking, startDate, daysShown, colWidth, onClick }) {
  const { left, width } = getBookingBarStyle(booking, daysShown, startDate, colWidth);
  const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
  const top = (booking.laneIndex || 0) * 38 + 8;
  const isCheckedOut = booking.status === "CHECKED_OUT" || booking.status === "COMPLETED";

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick(booking);
      }}
      className={`absolute rounded-xl cursor-pointer ${cfg.barBg} ${isCheckedOut ? "opacity-75 stroke-dasharray font-normal" : ""}
        flex items-center px-2.5 gap-2 border shadow-2xs overflow-hidden select-none
        hover:brightness-105 hover:shadow-md hover:scale-[1.01] transition-all duration-150 active:scale-[0.98]
        group z-10`}
      style={{
        left,
        width,
        top,
        height: 32,
        minWidth: 36,
      }}
      title={`${isCheckedOut ? "[CHECKED OUT] " : ""}Bed ${booking.laneIndex + 1}: ${booking.user?.name} — ${format(parseISO(booking.checkIn), "MMM d")} → ${booking.checkOut ? format(parseISO(booking.checkOut), "MMM d") : "Present"}`}
    >
      <span className="text-[9px] font-black opacity-85 bg-white/25 dark:bg-black/25 px-1.5 py-0.5 rounded-md shrink-0">
        Bed {booking.laneIndex + 1}
      </span>
      <span className="text-xs font-black truncate leading-none">
        {booking.user?.name ?? "Guest"}
        {isCheckedOut && " (Out)"}
      </span>
      {width > 140 && (
        <span className="text-[9px] font-bold opacity-85 truncate shrink-0 hidden sm:inline">
          · {booking.uid || `#${booking.id.slice(-6)}`}
        </span>
      )}
    </div>
  );
}

// ─── Booking Detail Side Panel ─────────────────────────────────────────────────

function BookingDetailPanel({ booking, onClose, onStatusUpdate, isUpdating, router }) {
  if (!booking) return null;

  const [showUnpaidWarning, setShowUnpaidWarning] = useState(false);
  const [pendingTargetStatus, setPendingTargetStatus] = useState(null);

  const isPaymentPaid = booking.paymentStatus === "PAID" || booking.latestPayment?.status === "PAID";
  const hasUnpaidDues = !isPaymentPaid;

  const handleActionClick = (targetStatus) => {
    if (targetStatus === "CHECKED_OUT" && hasUnpaidDues) {
      setPendingTargetStatus(targetStatus);
      setShowUnpaidWarning(true);
    } else {
      onStatusUpdate(booking.id, targetStatus);
    }
  };

  const confirmUnpaidCheckout = () => {
    if (pendingTargetStatus) {
      onStatusUpdate(booking.id, pendingTargetStatus);
      setShowUnpaidWarning(false);
      setPendingTargetStatus(null);
    }
  };

  const nextActions = {
    PENDING: [{ label: "Confirm Stay", status: "CONFIRMED", Icon: CheckCircle, color: "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900" }],
    CONFIRMED: [{ label: "Check In Resident", status: "CHECKED_IN", Icon: LogIn, color: "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900" }],
    CHECKED_IN: [{ label: "Check Out Resident", status: "CHECKED_OUT", Icon: LogOut, color: "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900" }],
  };
  const actions = nextActions[booking.status] || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] pointer-events-auto animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md h-full bg-white dark:bg-card shadow-2xl pointer-events-auto flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-100 dark:border-border">
        {/* Panel Header */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Booking Detail Drawer
            </span>
            <h3 className="text-xl font-black uppercase tracking-tight text-white truncate">
              {booking.user?.name}
            </h3>
            {booking.uid && (
              <div className="mt-1">
                <CopyBadge text={booking.uid} label="Booking UID" />
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0 text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 dark:border-border flex items-center justify-between bg-gray-50/50 dark:bg-muted/10">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Status
          </span>
          <StatusBadge status={booking.status} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Timeline Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 block mb-1">
                Check-In Date
              </span>
              <p className="text-xs font-black text-gray-900 dark:text-foreground">
                {format(parseISO(booking.checkIn), "MMMM dd, yyyy")}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-600 block mb-1">
                Check-Out Date
              </span>
              <p className="text-xs font-black text-gray-900 dark:text-foreground">
                {booking.checkOut
                  ? format(parseISO(booking.checkOut), "MMMM dd, yyyy")
                  : "Continuous Stay"}
              </p>
            </div>
          </div>

          {/* Guest Contact Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              Resident Identity & Contact
            </h4>
            <div className="space-y-2">
              {booking.user?.email && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/80 dark:bg-muted/20 border border-gray-100 dark:border-border/60">
                  <div className="flex items-center gap-2.5 truncate">
                    <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-xs font-bold text-gray-800 dark:text-foreground truncate">{booking.user.email}</span>
                  </div>
                  <a href={`mailto:${booking.user.email}`}>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-gray-200">
                      <Mail className="h-3.5 w-3.5 text-gray-600" />
                    </Button>
                  </a>
                </div>
              )}

              {booking.user?.phone && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/80 dark:bg-muted/20 border border-gray-100 dark:border-border/60">
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-xs font-bold text-gray-800 dark:text-foreground">{booking.user.phone}</span>
                  </div>
                  <a href={`tel:${booking.user.phone}`}>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-gray-200">
                      <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                    </Button>
                  </a>
                </div>
              )}

              {booking.user?.cnic && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/80 dark:bg-muted/20 border border-gray-100 dark:border-border/60">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">CNIC / Identity</span>
                  <CopyBadge text={booking.user.cnic} label="CNIC" />
                </div>
              )}
            </div>
          </div>

          {/* Financial Overview */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Financial Contract
            </h4>
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 block">
                  Total Contract Amount
                </span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                  PKR {Number(booking.totalAmount).toLocaleString()}
                </span>
              </div>
              {booking.latestPayment && (
                <StatusBadge status={booking.latestPayment.status} />
              )}
            </div>
            {hasUnpaidDues && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <p className="text-[10px] font-bold text-rose-800 uppercase leading-tight">
                  Notice: Uncleared dues remain on this contract (Status: UNPAID/PENDING).
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-100 dark:border-border space-y-2 bg-gray-50/50 dark:bg-muted/10">
          {actions.map(({ label, status, Icon, color }) => (
            <Button
              key={status}
              onClick={() => handleActionClick(status)}
              disabled={isUpdating}
              className={`w-full h-11 rounded-2xl font-black text-xs uppercase tracking-wider ${color} transition-all shadow-md`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {isUpdating ? "Updating..." : label}
            </Button>
          ))}
          {booking.user?.id && (
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                router.push(`/admin/users-records/${booking.user.id}`);
              }}
              className="w-full h-11 rounded-2xl font-bold text-xs uppercase tracking-wider border-gray-200 dark:border-border text-slate-800 dark:text-slate-200 bg-white dark:bg-card hover:bg-gray-100"
            >
              View Resident Record <ArrowUpRight className="h-4 w-4 ml-1.5" />
            </Button>
          )}
        </div>
      </div>

      {/* UNPAID DUES CHECKOUT CONFIRMATION DIALOG */}
      <Dialog open={showUnpaidWarning} onOpenChange={setShowUnpaidWarning}>
        <DialogContent className="rounded-3xl border-none p-6 max-w-md shadow-2xl bg-white dark:bg-card">
          <DialogHeader className="pb-3 border-b border-gray-100 dark:border-border">
            <DialogTitle className="text-base font-black uppercase tracking-tight text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              Uncleared Financial Dues Warning
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-gray-800 dark:text-foreground leading-relaxed">
              Resident <span className="font-black text-slate-900 dark:text-white">{booking.user?.name}</span> still has uncleared/pending payment dues on record!
            </p>
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-[11px] font-bold text-rose-800 dark:text-rose-300">
              Contract Amount: PKR {Number(booking.totalAmount).toLocaleString()}<br />
              Payment Status: {booking.paymentStatus || booking.latestPayment?.status || "UNPAID"}
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">
              Are you sure you still want to proceed with checking out this resident?
            </p>
          </div>

          <DialogFooter className="pt-4 border-t border-gray-100 dark:border-border mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowUnpaidWarning(false)}
              className="h-10 px-4 rounded-xl font-bold uppercase text-[10px] tracking-wider"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmUnpaidCheckout}
              className="h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-wider shadow-md"
            >
              Yes, Force Check Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Calendar Component ──────────────────────────────────────────────────

export default function CalendarPage({ showHostelSelector = false }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  // View Mode State: 'timeline' | 'operations'
  const [viewMode, setViewMode] = useState("timeline");

  // Days shown range slider: 14 or 30 days
  const [daysShown, setDaysShown] = useState(14);
  const colWidth = daysShown === 30 ? 65 : 110;

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRoomType, setFilterRoomType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Date State
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const endDate = useMemo(() => addDays(startDate, daysShown - 1), [startDate, daysShown]);
  const days = useMemo(
    () => Array.from({ length: daysShown }, (_, i) => addDays(startDate, i)),
    [startDate, daysShown]
  );

  // Instant Quick Room Booking Modal State
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);
  const [isSubmittingQuickBooking, setIsSubmittingQuickBooking] = useState(false);
  const [quickBookingForm, setQuickBookingForm] = useState({
    roomId: "",
    roomNumber: "",
    checkIn: "",
    checkOut: "",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    cnic: "",
    monthlyRent: 0,
    securityDeposit: 0,
    status: "CHECKED_IN",
    markPaid: true,
    userId: "",
  });

  // Quick Room Status & Settings Modal State
  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false);
  const [selectedRoomForSettings, setSelectedRoomForSettings] = useState(null);
  const [roomSettingsForm, setRoomSettingsForm] = useState({
    id: "",
    roomNumber: "",
    status: "AVAILABLE",
    price: 0,
  });

  // Directory search state inside quick booking modal
  const [directorySearchQuery, setDirectorySearchQuery] = useState("");
  const [directoryResults, setDirectoryResults] = useState([]);
  const [isSearchingDirectory, setIsSearchingDirectory] = useState(false);

  // Hostel State
  const [selectedHostelId, setSelectedHostelId] = useState(user?.hostelId ?? "");
  const { data: hostelsData } = useHostel();
  const hostels = hostelsData?.data ?? [];

  // Admins land on the calendar without a hostel bound to their account. Rather than
  // making them pick one every visit, default to the first hostel in the list once it loads.
  useEffect(() => {
    if (isAdmin && showHostelSelector && !selectedHostelId && hostels.length > 0) {
      setSelectedHostelId(hostels[0].id);
    }
  }, [isAdmin, showHostelSelector, selectedHostelId, hostels]);

  const hostelId = isAdmin && showHostelSelector
    ? selectedHostelId
    : user?.hostelId ?? selectedHostelId;

  const currentHostelName = hostels.find(h => h.id === hostelId)?.name || "Hostel Branch";

  // Calendar Query
  const { data, isLoading, isError, refetch, isFetching } = useCalendarData({
    hostelId,
    startDate,
    endDate,
    enabled: !!hostelId,
  });

  const [selectedBooking, setSelectedBooking] = useState(null);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateBookingStatus();

  // Search existing users inside quick booking modal
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (directorySearchQuery.length > 2) {
        setIsSearchingDirectory(true);
        try {
          const res = await fetch(`/api/users?query=${directorySearchQuery}&role=all`);
          const d = await res.json();
          setDirectoryResults(d.data || []);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearchingDirectory(false);
        }
      } else {
        setDirectoryResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [directorySearchQuery]);

  const handleSelectDirectoryUser = (u) => {
    setQuickBookingForm((prev) => ({
      ...prev,
      userId: u.id,
      guestName: u.name,
      guestEmail: u.email,
      guestPhone: u.phone || "",
      cnic: u.cnic || "",
    }));
    setDirectorySearchQuery("");
    setDirectoryResults([]);
    toast.success(`Selected user profile: ${u.name}`);
  };

  // Instant Booking Reserve Action (no redirection)
  const handleQuickBookingSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!quickBookingForm.guestName?.trim()) return toast.error("Guest name is required");
    if (!quickBookingForm.guestEmail?.trim()) return toast.error("Guest email is required");
    if (!quickBookingForm.guestPhone?.trim()) return toast.error("Guest phone is required");
    if (!quickBookingForm.checkIn) return toast.error("Check-in date is required");

    setIsSubmittingQuickBooking(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: quickBookingForm.userId || undefined,
          guestName: quickBookingForm.guestName,
          guestEmail: quickBookingForm.guestEmail,
          guestPhone: quickBookingForm.guestPhone,
          cnic: quickBookingForm.cnic,
          roomId: quickBookingForm.roomId,
          checkIn: quickBookingForm.checkIn,
          checkOut: quickBookingForm.checkOut || undefined,
          monthlyRent: Number(quickBookingForm.monthlyRent || 0),
          securityDeposit: Number(quickBookingForm.securityDeposit || 0),
          totalAmount: Number(quickBookingForm.monthlyRent || 0) + Number(quickBookingForm.securityDeposit || 0),
          status: quickBookingForm.status,
          paymentStatus: quickBookingForm.markPaid ? "PAID" : "PENDING",
          paymentMethod: quickBookingForm.markPaid ? "CASH" : undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || resData.error || "Failed to create reservation");
      }

      toast.success(`Room ${quickBookingForm.roomNumber} reserved successfully for ${quickBookingForm.guestName}`);
      setIsQuickBookingOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.message || "Failed to reserve room");
    } finally {
      setIsSubmittingQuickBooking(false);
    }
  };

  // Update Room Status (Maintenance / Cleaning / Available)
  const handleRoomSettingsSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsUpdatingRoom(true);
    try {
      const res = await fetch("/api/rooms/editroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: roomSettingsForm.id,
          status: roomSettingsForm.status,
          price: Number(roomSettingsForm.price),
        }),
      });
      const resData = await res.json();
      if (!res.ok || resData.success === false) {
        throw new Error(resData.error || "Failed to update room settings");
      }
      toast.success(`Room ${roomSettingsForm.roomNumber} status updated to ${roomSettingsForm.status}`);
      setIsRoomSettingsOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.message || "Failed to update room settings");
    } finally {
      setIsUpdatingRoom(false);
    }
  };

  // Process & Filter Rooms & Bookings
  const rooms = data?.data ?? [];

  const filteredRooms = useMemo(() => {
    return rooms.map((r) => {
      const matchingBookings = (r.bookings || []).filter((b) => {
        const matchesStatus = filterStatus === "ALL" || b.status === filterStatus;
        const matchesSearch =
          !searchQuery ||
          r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (b.uid && b.uid.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesStatus && matchesSearch;
      });

      return {
        ...r,
        bookings: matchingBookings,
      };
    }).filter((r) => {
      const matchesType = filterRoomType === "ALL" || r.type === filterRoomType;
      const matchesSearch =
        !searchQuery ||
        r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.bookings.length > 0;

      return matchesType && matchesSearch;
    });
  }, [rooms, filterRoomType, filterStatus, searchQuery]);

  const grouped = useMemo(() => {
    const map = {};
    ROOM_TYPE_ORDER.forEach((type) => { map[type] = []; });
    filteredRooms.forEach((r) => {
      if (!map[r.type]) map[r.type] = [];
      map[r.type].push(r);
    });
    return map;
  }, [filteredRooms]);

  // Live KPI Operational Metrics
  const kpiStats = useMemo(() => {
    let totalCapacity = 0;
    let occupiedBeds = 0;
    let checkInsToday = 0;
    let checkOutsToday = 0;
    let checkedOutTotal = 0;
    let pendingApprovals = 0;

    const todayStr = format(new Date(), "yyyy-MM-dd");

    rooms.forEach((r) => {
      totalCapacity += r.capacity || 0;
      r.bookings?.forEach((b) => {
        if (b.status === "CHECKED_IN") occupiedBeds += 1;
        if (b.status === "PENDING") pendingApprovals += 1;
        if (b.status === "CHECKED_OUT" || b.status === "COMPLETED") checkedOutTotal += 1;

        if (b.checkIn && format(parseISO(b.checkIn), "yyyy-MM-dd") === todayStr) {
          checkInsToday += 1;
        }
        if (b.checkOut && format(parseISO(b.checkOut), "yyyy-MM-dd") === todayStr) {
          checkOutsToday += 1;
        }
      });
    });

    const occupancyRate = totalCapacity > 0 ? Math.round((occupiedBeds / totalCapacity) * 100) : 0;

    return { totalCapacity, occupiedBeds, occupancyRate, checkInsToday, checkOutsToday, checkedOutTotal, pendingApprovals };
  }, [rooms]);

  // Dedicated Isolated Landscape PDF Print Handler
  const handlePrintScheduleLandscape = () => {
    const printWindow = window.open("", "_blank", "width=1250,height=850");
    if (!printWindow) return toast.error("Please allow popups to print landscape report");

    const tableRows = rooms.flatMap((r) =>
      (r.bookings || []).length > 0 ? (
        r.bookings.map((b) => `
          <tr>
            <td style="font-weight: 900;">Room ${r.roomNumber}</td>
            <td style="text-transform: uppercase; font-size: 9px; font-weight: 800;">${r.type}</td>
            <td style="font-weight: 900; color: #0f172a;">${b.user?.name || "Guest"}</td>
            <td>${b.user?.phone || b.user?.email || "N/A"}</td>
            <td style="font-mono">${b.user?.cnic || "N/A"}</td>
            <td style="font-weight: 700;">${format(parseISO(b.checkIn), "MMM dd, yyyy")}</td>
            <td style="font-weight: 700;">${b.checkOut ? format(parseISO(b.checkOut), "MMM dd, yyyy") : "Continuous"}</td>
            <td style="font-weight: 900; color: #059669;">PKR ${(b.monthlyRent || r.montlyrent || r.price || 0).toLocaleString()}</td>
            <td><span class="badge ${b.status === "CHECKED_IN" ? "badge-green" : b.status === "PENDING" ? "badge-amber" : "badge-slate"}">${b.status}</span></td>
          </tr>
        `).join("")
      ) : `
        <tr>
          <td style="font-weight: 900;">Room ${r.roomNumber}</td>
          <td style="text-transform: uppercase; font-size: 9px; font-weight: 800;">${r.type}</td>
          <td colspan="7" style="color: #94a3b8; font-style: italic;">No active or past bookings registered</td>
        </tr>
      `
    ).join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Occupancy Schedule Report - ${currentHostelName}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 16px;
              background: #ffffff;
            }
            .header-bar {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              border-bottom: 3px solid #0f172a;
              padding-bottom: 10px;
              margin-bottom: 14px;
            }
            h1 { font-size: 22px; text-transform: uppercase; margin: 0; font-weight: 900; letter-spacing: -0.02em; }
            p.sub { margin: 2px 0 0 0; font-size: 11px; color: #64748b; font-weight: 700; }
            .kpi-row {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 12px;
              border-radius: 12px;
              margin-bottom: 16px;
            }
            .kpi-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 800; display: block; }
            .kpi-val { font-size: 18px; font-weight: 900; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
            th { background: #0f172a; color: #ffffff; text-align: left; padding: 9px 12px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 900; }
            td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) td { background: #f8fafc; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 9px; font-weight: 900; text-transform: uppercase; border: 1px solid #cbd5e1; }
            .badge-green { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
            .badge-amber { background: #fffbeb; color: #b45309; border-color: #fde68a; }
            .badge-slate { background: #f1f5f9; color: #334155; border-color: #cbd5e1; }
            .footer-sign { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #64748b; font-weight: 700; }
            .sig-line { border-top: 2px solid #0f172a; width: 220px; text-align: center; padding-top: 6px; font-weight: 900; color: #0f172a; }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div>
              <h1>${currentHostelName}</h1>
              <p class="sub">Official Occupancy & Resident Schedule Report · Date: ${format(new Date(), "MMMM dd, yyyy — HH:mm")}</p>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 11px; font-weight: 900; color: #0f172a; text-transform: uppercase;">Hostel Management Portal</p>
            </div>
          </div>

          <div class="kpi-row">
            <div>
              <span class="kpi-label">Total Hostel Capacity</span>
              <span class="kpi-val">${kpiStats.totalCapacity} Beds</span>
            </div>
            <div>
              <span class="kpi-label">Active Occupied Beds</span>
              <span class="kpi-val" style="color: #059669;">${kpiStats.occupiedBeds} Beds</span>
            </div>
            <div>
              <span class="kpi-label">Occupancy Rate</span>
              <span class="kpi-val">${kpiStats.occupancyRate}%</span>
            </div>
            <div>
              <span class="kpi-label">Checked Out History</span>
              <span class="kpi-val">${kpiStats.checkedOutTotal} Residents</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Room #</th>
                <th>Type</th>
                <th>Resident Name</th>
                <th>Email / Phone</th>
                <th>CNIC Identity</th>
                <th>Check-In Date</th>
                <th>Check-Out Date</th>
                <th>Monthly Rent</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="footer-sign">
            <div>
              <p>Hostel Administration & Warden Office</p>
              <p style="font-size: 9px; color: #94a3b8;">System-Generated Authoritative Audit Document</p>
            </div>
            <div class="sig-line">
              Warden Authorized Signature
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 750);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // CSV Data Export Handler
  const handleExportCSV = () => {
    const headers = ["Room Number", "Room Type", "Resident Name", "Email", "Phone", "CNIC", "Check-In Date", "Check-Out Date", "Monthly Rent", "Status"];
    const rows = rooms.flatMap((r) =>
      (r.bookings || []).map((b) => [
        `"Room ${r.roomNumber}"`,
        `"${r.type}"`,
        `"${b.user?.name || "Guest"}"`,
        `"${b.user?.email || ""}"`,
        `"${b.user?.phone || ""}"`,
        `"${b.user?.cnic || ""}"`,
        `"${b.checkIn ? format(parseISO(b.checkIn), "yyyy-MM-dd") : ""}"`,
        `"${b.checkOut ? format(parseISO(b.checkOut), "yyyy-MM-dd") : ""}"`,
        `"${b.monthlyRent || r.montlyrent || r.price || 0}"`,
        `"${b.status}"`,
      ])
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Occupancy_Schedule_${currentHostelName.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Occupancy schedule data exported to CSV");
  };

  // Date Navigation Helpers
  const goBack = () => setStartDate((d) => addDays(d, -7));
  const goForward = () => setStartDate((d) => addDays(d, 7));
  const goToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setStartDate(d);
  };

  const scrollRef = useRef(null);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-background/95 pb-24 font-sans antialiased">
      {/* Page Header */}
      <PageHeader
        title="Hostel Occupancy & Calendar System"
        subtitleStart="Multi-Bed Occupancy"
        subtitleEnd="Grid View"
        maxWidthClass="max-w-[1800px]"
        accentColorClass="bg-slate-900"
        dotColorClass="bg-emerald-500"
        subtitleEndClass="text-emerald-600"
        rightSlot={
          <div className="flex items-center gap-2">
            {isAdmin && showHostelSelector && (
              <Select value={selectedHostelId} onValueChange={setSelectedHostelId}>
                <SelectTrigger className="h-9 px-3.5 rounded-xl border-gray-200 dark:border-border bg-white dark:bg-card text-[11px] font-bold uppercase tracking-wider shadow-2xs">
                  <Building2 className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                  <SelectValue placeholder="Select hostel..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {hostels.map((h) => (
                    <SelectItem key={h.id} value={h.id} className="text-xs font-bold uppercase tracking-wider">
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              variant="outline"
              onClick={() => setIsPrintModalOpen(true)}
              className="h-9 px-3.5 rounded-xl border-gray-200 dark:border-border text-[10px] font-bold uppercase tracking-wider gap-1.5 shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5 text-gray-500" /> Print / Export Schedule
            </Button>

            <Button
              onClick={() => router.push("/admin/bookings/create")}
              className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 text-[10px] font-black uppercase tracking-wider shadow-2xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Full Booking Wizard
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9 w-9 rounded-xl border-gray-200 dark:border-border shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-gray-500 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />

      <main className="max-w-[1800px] mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Live KPI Analytics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/30">
              <Zap className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Occupancy Rate</span>
              <span className="text-lg font-black text-gray-900 dark:text-foreground tracking-tight">{kpiStats.occupancyRate}%</span>
            </div>
          </div>

          <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30">
              <Bed className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Stays</span>
              <span className="text-lg font-black text-emerald-600 tracking-tight">{kpiStats.occupiedBeds} / {kpiStats.totalCapacity} Beds</span>
            </div>
          </div>

          <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/30">
              <LogIn className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Check-Ins Today</span>
              <span className="text-lg font-black text-gray-900 dark:text-foreground tracking-tight">{kpiStats.checkInsToday}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-muted text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-border">
              <History className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Checked Out History</span>
              <span className="text-lg font-black text-slate-800 dark:text-slate-200 tracking-tight">{kpiStats.checkedOutTotal} Residents</span>
            </div>
          </div>

          <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl p-4 flex items-center gap-3.5 shadow-2xs col-span-2 md:col-span-1">
            <div className="h-10 w-10 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/30">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pending Approval</span>
              <span className="text-lg font-black text-amber-600 tracking-tight">{kpiStats.pendingApprovals} Request{kpiStats.pendingApprovals !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        {/* Controls & Toolbar Row */}
        <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
          {/* Left: View Mode Switcher */}
          <div className="flex items-center gap-1 bg-gray-50/80 dark:bg-muted/30 p-1 rounded-2xl border border-gray-100 dark:border-border/60 w-full md:w-auto">
            <button
              onClick={() => setViewMode("timeline")}
              className={`flex-1 md:flex-none h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                viewMode === "timeline"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs"
                  : "text-gray-500 hover:text-gray-900 dark:text-muted-foreground"
              }`}
            >
              <Layers className="h-3.5 w-3.5" /> Multi-Bed Gantt
            </button>
            <button
              onClick={() => setViewMode("operations")}
              className={`flex-1 md:flex-none h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                viewMode === "operations"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs"
                  : "text-gray-500 hover:text-gray-900 dark:text-muted-foreground"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Daily Operations
            </button>
          </div>

          {/* Center: Search & Room Filters & Status Filters */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Search Guest, Room #, or UID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 rounded-xl border-gray-200 dark:border-border text-xs font-bold bg-gray-50/50 dark:bg-muted/20"
              />
            </div>

            <select
              className="h-9 px-3 rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card font-bold text-[10px] uppercase tracking-wider outline-none"
              value={filterRoomType}
              onChange={(e) => setFilterRoomType(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="SINGLE">Single</option>
              <option value="DOUBLE">Double</option>
              <option value="TRIPLE">Triple</option>
              <option value="DORMITORY">Dormitory</option>
            </select>

            <select
              className="h-9 px-3 rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card font-bold text-[10px] uppercase tracking-wider outline-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="CHECKED_IN">Active Checked-In</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="CHECKED_OUT">Checked Out (History)</option>
            </select>
          </div>

          {/* Right: Timeline Nav Controls */}
          {viewMode === "timeline" && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={goBack}
                className="h-9 w-9 rounded-xl border-gray-200 dark:border-border shadow-2xs"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={goToday}
                className="h-9 px-3.5 rounded-xl border-gray-200 dark:border-border font-bold text-[10px] uppercase tracking-wider shadow-2xs"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goForward}
                className="h-9 w-9 rounded-xl border-gray-200 dark:border-border shadow-2xs"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <button
                onClick={() => setDaysShown(daysShown === 14 ? 30 : 14)}
                className="h-9 px-3 rounded-xl bg-gray-100 dark:bg-muted font-bold text-[9px] uppercase tracking-wider text-gray-600 dark:text-muted-foreground hover:bg-gray-200"
              >
                {daysShown} Days
              </button>
            </div>
          )}
        </div>

        {/* ── VIEW MODE 1: MULTI-BED GANTT GRID VIEW ── */}
        {viewMode === "timeline" && (
          <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl shadow-2xs overflow-hidden">
            {!hostelId ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Building2 className="h-10 w-10 text-gray-300" />
                {isAdmin && showHostelSelector && hostels.length === 0 ? (
                  <>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      No hostels have been created yet
                    </p>
                    <Button
                      onClick={() => router.push("/admin/hostels/createhostel")}
                      className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" /> Create Your First Hostel
                    </Button>
                  </>
                ) : isAdmin && showHostelSelector ? (
                  <>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      Select a hostel branch to view its live calendar
                    </p>
                    <Select value={selectedHostelId} onValueChange={setSelectedHostelId}>
                      <SelectTrigger className="h-10 px-4 rounded-xl border-gray-200 dark:border-border bg-white dark:bg-card text-xs font-bold uppercase tracking-wider w-64">
                        <Building2 className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                        <SelectValue placeholder="Select hostel..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {hostels.map((h) => (
                          <SelectItem key={h.id} value={h.id} className="text-xs font-bold uppercase tracking-wider">
                            {h.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    No hostel assigned to your account
                  </p>
                )}
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-24 gap-3">
                <div className="h-6 w-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Loading room occupancy grid...</p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Failed to fetch occupancy timeline</p>
                <Button variant="outline" onClick={() => refetch()} className="rounded-xl h-9 text-[10px] font-bold uppercase tracking-wider">
                  Retry Load
                </Button>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Bed className="h-10 w-10 text-gray-300" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No matching rooms found</p>
              </div>
            ) : (
              <div className="overflow-x-auto" ref={scrollRef}>
                <div style={{ minWidth: ROOM_COL_WIDTH + daysShown * colWidth }}>
                  {/* Date Header Row */}
                  <div
                    className="flex border-b border-gray-100 dark:border-border sticky top-0 bg-white dark:bg-card z-20"
                    style={{ height: HEADER_HEIGHT }}
                  >
                    <div
                      className="shrink-0 flex items-center px-5 border-r border-gray-100 dark:border-border bg-gray-50/80 dark:bg-muted/20"
                      style={{ width: ROOM_COL_WIDTH }}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Room & Occupants
                      </span>
                    </div>

                    {days.map((day) => {
                      const today = isToday(day);
                      return (
                        <div
                          key={day.toISOString()}
                          className={`shrink-0 flex flex-col items-center justify-center border-r border-gray-100/60 dark:border-border/40 transition-colors ${
                            today ? "bg-indigo-50/70 dark:bg-indigo-950/30 border-x border-indigo-200 dark:border-indigo-900/50" : ""
                          }`}
                          style={{ width: colWidth }}
                        >
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${today ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"}`}>
                            {format(day, "EEE")}
                          </span>
                          <span className={`text-sm font-black mt-0.5 ${today ? "text-indigo-700 dark:text-indigo-300" : "text-gray-900 dark:text-foreground"}`}>
                            {format(day, "d")}
                          </span>
                          <span className={`text-[8px] font-bold ${today ? "text-indigo-500" : "text-gray-300"}`}>
                            {format(day, "MMM")}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Room Rows Grouped by Type */}
                  {ROOM_TYPE_ORDER.map((type) => {
                    const typeRooms = grouped[type] ?? [];
                    if (typeRooms.length === 0) return null;
                    return (
                      <div key={type}>
                        <div className="flex items-center border-b border-gray-100 dark:border-border bg-gray-50/70 dark:bg-muted/20 px-5 py-2 sticky left-0 z-10">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                            {ROOM_TYPE_LABELS[type] ?? type} ({typeRooms.length})
                          </span>
                        </div>

                        {typeRooms.map((room) => {
                          const isMaint = room.status === "MAINTENANCE" || room.status === "CLEANING";
                          const { assignedBookings, totalLanes } = computeBookingLanes(room.bookings);
                          const dynamicRowHeight = Math.max(56, totalLanes * 38 + 16);

                          return (
                            <div
                              key={room.id}
                              className="flex border-b border-gray-100/70 dark:border-border/40 hover:bg-gray-50/50 dark:hover:bg-muted/10 transition-colors group"
                              style={{ height: dynamicRowHeight }}
                            >
                              {/* Left Room Label Column */}
                              <div
                                onClick={() => {
                                  setSelectedRoomForSettings(room);
                                  setRoomSettingsForm({
                                    id: room.id,
                                    roomNumber: room.roomNumber,
                                    status: room.status || "AVAILABLE",
                                    price: room.monthlyrent || room.montlyrent || room.price || 0,
                                  });
                                  setIsRoomSettingsOpen(true);
                                }}
                                className="shrink-0 flex flex-col justify-center px-4 md:px-5 border-r border-gray-100 dark:border-border bg-white dark:bg-card group-hover:bg-gray-50/50 dark:group-hover:bg-muted/10 sticky left-0 z-10 transition-colors py-2 cursor-pointer"
                                style={{ width: ROOM_COL_WIDTH, height: dynamicRowHeight }}
                                title="Click to manage room status or rent"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${isMaint ? "bg-amber-100 text-amber-700" : "bg-slate-100 dark:bg-muted text-slate-800 dark:text-slate-200"}`}>
                                      {room.roomNumber}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-xs font-black text-gray-900 dark:text-foreground truncate flex items-center gap-1">
                                        Room {room.roomNumber}
                                        <Settings2 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </span>
                                      <span className="text-[9px] font-bold text-gray-400 uppercase truncate">
                                        {room.type} • {assignedBookings.filter(b => b.status === "CHECKED_IN").length}/{room.capacity} Occupied
                                      </span>
                                    </div>
                                  </div>
                                  {isMaint && (
                                    <Badge className="text-[8px] font-bold uppercase bg-amber-50 text-amber-700 border-amber-200 shrink-0">
                                      Maint
                                    </Badge>
                                  )}
                                </div>

                                {/* Resident Avatar Chips for Quick Inspection */}
                                {assignedBookings.length > 0 && (
                                  <div className="flex items-center gap-1 mt-2 flex-wrap max-h-12 overflow-hidden">
                                    {assignedBookings.map((b) => (
                                      <span
                                        key={b.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedBooking(b);
                                        }}
                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase hover:opacity-80 cursor-pointer transition-colors ${
                                          b.status === "CHECKED_OUT" || b.status === "COMPLETED"
                                            ? "bg-gray-100 text-gray-500 dark:bg-muted dark:text-muted-foreground line-through"
                                            : "bg-slate-100 dark:bg-muted text-slate-700 dark:text-slate-300"
                                        }`}
                                        title={`${b.user?.name} (${b.status})`}
                                      >
                                        <span className={`h-1.5 w-1.5 rounded-full ${b.status === "CHECKED_OUT" ? "bg-slate-400" : "bg-emerald-500"}`} />
                                        {b.user?.name?.split(" ")[0] || "Guest"}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Day Grid Cells & Stacked Multi-Bed Sub-Lanes */}
                              <div
                                className="relative flex flex-1"
                                style={{ width: daysShown * colWidth }}
                              >
                                {days.map((day, i) => {
                                  const today = isToday(day);
                                  return (
                                    <div
                                      key={i}
                                      onClick={() => {
                                        setQuickBookingForm({
                                          roomId: room.id,
                                          roomNumber: room.roomNumber,
                                          checkIn: format(day, "yyyy-MM-dd"),
                                          checkOut: "",
                                          guestName: "",
                                          guestEmail: "",
                                          guestPhone: "",
                                          cnic: "",
                                          monthlyRent: room.monthlyrent || room.montlyrent || room.price || 0,
                                          securityDeposit: 0,
                                          status: "CHECKED_IN",
                                          markPaid: true,
                                          userId: "",
                                        });
                                        setIsQuickBookingOpen(true);
                                      }}
                                      className={`shrink-0 h-full border-r border-gray-100/50 dark:border-border/20 cursor-pointer hover:bg-indigo-50/40 transition-colors ${
                                        today ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                                      } ${
                                        isMaint
                                          ? "bg-amber-50/30 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(251,191,36,0.08)_4px,rgba(251,191,36,0.08)_8px)]"
                                          : ""
                                      }`}
                                      style={{ width: colWidth }}
                                      title={`Click to reserve Room ${room.roomNumber} on ${format(day, "MMM dd")}`}
                                    />
                                  );
                                })}

                                {assignedBookings.map((booking) => (
                                  <BookingBar
                                    key={booking.id}
                                    booking={booking}
                                    startDate={startDate}
                                    daysShown={daysShown}
                                    colWidth={colWidth}
                                    onClick={setSelectedBooking}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── VIEW MODE 2: DAILY OPERATIONS & TURNOVERS QUEUE ── */}
        {viewMode === "operations" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Column 1: Check-Ins Today */}
            <div className="rounded-3xl bg-white dark:bg-card p-5 border border-gray-100 dark:border-border shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-border/60">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                    <LogIn className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground">
                      Check-Ins Today
                    </h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      Arriving Residents
                    </p>
                  </div>
                </div>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] font-bold">
                  {kpiStats.checkInsToday}
                </Badge>
              </div>

              <div className="space-y-3">
                {filteredRooms
                  .flatMap((r) =>
                    (r.bookings || []).map((b) => ({ ...b, roomNumber: r.roomNumber }))
                  )
                  .filter((b) => b.checkIn && format(parseISO(b.checkIn), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"))
                  .map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className="p-4 rounded-2xl bg-gray-50/70 dark:bg-muted/20 border border-gray-100 dark:border-border hover:bg-white dark:hover:bg-card hover:shadow-2xs transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-900 dark:text-foreground">
                          {b.user?.name}
                        </span>
                        <Badge variant="outline" className="text-[8px] font-bold uppercase">
                          Room {b.roomNumber}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-muted-foreground font-bold">
                        {b.user?.email} • {b.user?.phone || "No phone"}
                      </p>
                      <div className="pt-2 flex justify-between items-center border-t border-gray-200/60 dark:border-border/40">
                        <StatusBadge status={b.status} />
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-[9px] font-bold uppercase">
                          Details <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                {kpiStats.checkInsToday === 0 && (
                  <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                    <LogIn className="h-7 w-7 text-gray-300 mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      No check-ins today
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Check-Outs Today */}
            <div className="rounded-3xl bg-white dark:bg-card p-5 border border-gray-100 dark:border-border shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-border/60">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground">
                      Check-Outs Today
                    </h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      Departing Today
                    </p>
                  </div>
                </div>
                <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[9px] font-bold">
                  {kpiStats.checkOutsToday}
                </Badge>
              </div>

              <div className="space-y-3">
                {filteredRooms
                  .flatMap((r) =>
                    (r.bookings || []).map((b) => ({ ...b, roomNumber: r.roomNumber }))
                  )
                  .filter((b) => b.checkOut && format(parseISO(b.checkOut), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"))
                  .map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className="p-4 rounded-2xl bg-gray-50/70 dark:bg-muted/20 border border-gray-100 dark:border-border hover:bg-white dark:hover:bg-card hover:shadow-2xs transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-900 dark:text-foreground">
                          {b.user?.name}
                        </span>
                        <Badge variant="outline" className="text-[8px] font-bold uppercase">
                          Room {b.roomNumber}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-muted-foreground font-bold">
                        {b.user?.email} • {b.user?.phone || "No phone"}
                      </p>
                      <div className="pt-2 flex justify-between items-center border-t border-gray-200/60 dark:border-border/40">
                        <StatusBadge status={b.status} />
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-[9px] font-bold uppercase">
                          Details <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                {kpiStats.checkOutsToday === 0 && (
                  <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                    <LogOut className="h-7 w-7 text-gray-300 mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      No departures today
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Pending Approvals */}
            <div className="rounded-3xl bg-white dark:bg-card p-5 border border-gray-100 dark:border-border shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-border/60">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground">
                      Pending Approvals
                    </h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      Requests Pending
                    </p>
                  </div>
                </div>
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] font-bold">
                  {kpiStats.pendingApprovals}
                </Badge>
              </div>

              <div className="space-y-3">
                {filteredRooms
                  .flatMap((r) =>
                    (r.bookings || []).map((b) => ({ ...b, roomNumber: r.roomNumber }))
                  )
                  .filter((b) => b.status === "PENDING")
                  .map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 hover:bg-white dark:hover:bg-card hover:shadow-2xs transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-900 dark:text-foreground">
                          {b.user?.name}
                        </span>
                        <Badge variant="outline" className="text-[8px] font-bold uppercase border-amber-200">
                          Room {b.roomNumber}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-amber-800 dark:text-amber-300 font-bold">
                        Check-in: {format(parseISO(b.checkIn), "MMM dd, yyyy")}
                      </p>
                      <div className="pt-2 flex justify-between items-center border-t border-amber-200/60">
                        <StatusBadge status={b.status} />
                        <Button size="sm" className="h-7 px-3 bg-slate-900 text-white font-bold text-[9px] uppercase">
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                {kpiStats.pendingApprovals === 0 && (
                  <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                    <CheckCircle2 className="h-7 w-7 text-emerald-500 mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      All requests cleared!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 4: Checked-Out History Queue */}
            <div className="rounded-3xl bg-white dark:bg-card p-5 border border-gray-100 dark:border-border shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-border/60">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-muted text-slate-700 dark:text-slate-300 flex items-center justify-center">
                    <History className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground">
                      Checked-Out History
                    </h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      Past Resident Log
                    </p>
                  </div>
                </div>
                <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[9px] font-bold">
                  {kpiStats.checkedOutTotal}
                </Badge>
              </div>

              <div className="space-y-3">
                {filteredRooms
                  .flatMap((r) =>
                    (r.bookings || []).map((b) => ({ ...b, roomNumber: r.roomNumber }))
                  )
                  .filter((b) => b.status === "CHECKED_OUT" || b.status === "COMPLETED")
                  .map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className="p-4 rounded-2xl bg-gray-50/70 dark:bg-muted/20 border border-gray-100 dark:border-border hover:bg-white dark:hover:bg-card hover:shadow-2xs transition-all cursor-pointer space-y-2 opacity-85 hover:opacity-100"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-900 dark:text-foreground">
                          {b.user?.name}
                        </span>
                        <Badge variant="outline" className="text-[8px] font-bold uppercase">
                          Room {b.roomNumber}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-muted-foreground font-bold">
                        Out: {b.checkOut ? format(parseISO(b.checkOut), "MMM dd, yyyy") : "N/A"}
                      </p>
                      <div className="pt-2 flex justify-between items-center border-t border-gray-200/60 dark:border-border/40">
                        <StatusBadge status={b.status} />
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-[9px] font-bold uppercase">
                          Record <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                {kpiStats.checkedOutTotal === 0 && (
                  <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                    <History className="h-7 w-7 text-gray-300 mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      No checked-out history found
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* DEDICATED PRINTABLE SCHEDULE REPORT MODAL */}
      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="rounded-3xl border-none p-6 md:p-8 max-w-4xl shadow-2xl bg-white dark:bg-card max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-gray-100 dark:border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-gray-900 dark:text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-900 dark:text-slate-100" />
                Hostel Occupancy & Resident Schedule Report
              </DialogTitle>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                {currentHostelName} · Generated on {format(new Date(), "MMMM dd, yyyy — HH:mm")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleExportCSV}
                className="h-10 px-4 rounded-xl border-gray-200 font-bold text-xs uppercase tracking-wider gap-1.5"
              >
                <Download className="h-4 w-4 text-emerald-600" /> Export CSV
              </Button>
              <Button
                onClick={handlePrintScheduleLandscape}
                className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider shadow-md gap-2"
              >
                <Printer className="h-4 w-4" /> Print Document (Landscape PDF)
              </Button>
            </div>
          </DialogHeader>

          {/* Printable Document Body */}
          <div className="space-y-6 pt-4 text-black">
            {/* Summary KPI Cards */}
            <div className="grid grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase block">Total Capacity</span>
                <span className="text-base font-black text-gray-900">{kpiStats.totalCapacity} Beds</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase block">Active Residents</span>
                <span className="text-base font-black text-emerald-600">{kpiStats.occupiedBeds} Beds</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase block">Occupancy Rate</span>
                <span className="text-base font-black text-slate-900">{kpiStats.occupancyRate}%</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase block">Past Checked Out</span>
                <span className="text-base font-black text-slate-700">{kpiStats.checkedOutTotal} Residents</span>
              </div>
            </div>

            {/* Detailed Room & Resident Breakdown Table */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 font-black text-[10px] uppercase tracking-wider text-gray-700">
                    <th className="p-3">Room</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Resident Name</th>
                    <th className="p-3">Contact / CNIC</th>
                    <th className="p-3">Check-In</th>
                    <th className="p-3">Check-Out</th>
                    <th className="p-3">Rent / Mo</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium">
                  {rooms.flatMap((r) =>
                    (r.bookings || []).length > 0 ? (
                      r.bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-gray-50/50">
                          <td className="p-3 font-black">Room {r.roomNumber}</td>
                          <td className="p-3 font-bold uppercase text-[10px] text-gray-600">{r.type}</td>
                          <td className="p-3 font-black text-gray-900">{b.user?.name || "Guest"}</td>
                          <td className="p-3 text-[10px]">
                            <div>{b.user?.phone || b.user?.email}</div>
                            {b.user?.cnic && <div className="text-gray-400">CNIC: {b.user.cnic}</div>}
                          </td>
                          <td className="p-3 text-[11px] font-bold">{format(parseISO(b.checkIn), "MMM dd, yyyy")}</td>
                          <td className="p-3 text-[11px] font-bold">
                            {b.checkOut ? format(parseISO(b.checkOut), "MMM dd, yyyy") : "Ongoing"}
                          </td>
                          <td className="p-3 font-black text-emerald-700">
                            PKR {(b.monthlyRent || r.montlyrent || r.price || 0).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border bg-gray-100 text-gray-800">
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr key={r.id}>
                        <td className="p-3 font-black">Room {r.roomNumber}</td>
                        <td className="p-3 font-bold uppercase text-[10px] text-gray-600">{r.type}</td>
                        <td colSpan={6} className="p-3 text-gray-400 italic text-center">No active or past bookings registered for this room</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Signature Block */}
            <div className="pt-8 flex justify-between items-end text-xs font-bold text-gray-500">
              <div>
                <p>Hostel Administration Authority</p>
                <p className="text-[10px] text-gray-400 mt-1">Official Hostel Management System Record</p>
              </div>
              <div className="border-t border-gray-400 pt-1 text-center min-w-[180px]">
                Authorized Signature
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-gray-100 dark:border-border mt-4">
            <Button
              variant="outline"
              onClick={() => setIsPrintModalOpen(false)}
              className="h-10 px-5 rounded-xl font-bold uppercase text-[10px] tracking-wider"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* INSTANT IN-LINE QUICK ROOM RESERVATION MODAL */}
      <Dialog open={isQuickBookingOpen} onOpenChange={setIsQuickBookingOpen}>
        <DialogContent className="rounded-3xl border-none p-6 md:p-8 max-w-lg shadow-2xl bg-white dark:bg-card overflow-hidden">
          <DialogHeader className="pb-3 border-b border-gray-100 dark:border-border">
            <DialogTitle className="text-lg font-black uppercase tracking-tight text-gray-900 dark:text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-600" />
                Instant Room Reservation
              </span>
              <Badge className="bg-slate-100 text-slate-800 border-gray-200 text-[9px] font-bold uppercase">
                Room {quickBookingForm.roomNumber}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleQuickBookingSubmit} className="space-y-4 pt-3">
            {/* Quick Search Existing Directory User */}
            <div className="relative">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Search Existing User (Optional)
              </Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Search by name, email..."
                  value={directorySearchQuery}
                  onChange={(e) => setDirectorySearchQuery(e.target.value)}
                  className="h-10 pl-9 rounded-xl border-gray-200 dark:border-border text-xs font-bold bg-gray-50/50 dark:bg-muted/20"
                />
                {isSearchingDirectory && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                  </div>
                )}
              </div>

              {directoryResults.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl shadow-xl p-1.5 z-50 max-h-40 overflow-y-auto">
                  {directoryResults.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleSelectDirectoryUser(u)}
                      className="p-2.5 hover:bg-gray-50 dark:hover:bg-muted/30 rounded-lg cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-xs text-gray-900 dark:text-foreground">{u.name}</p>
                        <p className="text-[9px] text-gray-400 font-bold">{u.email}</p>
                      </div>
                      <UserCheck className="h-4 w-4 text-emerald-600" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Resident Name *
                </Label>
                <Input
                  required
                  value={quickBookingForm.guestName}
                  onChange={(e) => setQuickBookingForm((p) => ({ ...p, guestName: e.target.value }))}
                  placeholder="Full name"
                  className="h-10 rounded-xl border-gray-200 font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Email Address *
                </Label>
                <Input
                  required
                  type="email"
                  value={quickBookingForm.guestEmail}
                  onChange={(e) => setQuickBookingForm((p) => ({ ...p, guestEmail: e.target.value }))}
                  placeholder="email@domain.com"
                  className="h-10 rounded-xl border-gray-200 font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Phone Number *
                </Label>
                <Input
                  required
                  value={quickBookingForm.guestPhone}
                  onChange={(e) => setQuickBookingForm((p) => ({ ...p, guestPhone: e.target.value }))}
                  placeholder="03XX-XXXXXXX"
                  className="h-10 rounded-xl border-gray-200 font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  CNIC (Optional)
                </Label>
                <Input
                  value={quickBookingForm.cnic}
                  onChange={(e) => setQuickBookingForm((p) => ({ ...p, cnic: e.target.value }))}
                  placeholder="CNIC Number"
                  className="h-10 rounded-xl border-gray-200 font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Check-In Date *
                </Label>
                <Input
                  type="date"
                  required
                  value={quickBookingForm.checkIn}
                  onChange={(e) => setQuickBookingForm((p) => ({ ...p, checkIn: e.target.value }))}
                  className="h-10 rounded-xl border-gray-200 font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Check-Out Date (Optional)
                </Label>
                <Input
                  type="date"
                  value={quickBookingForm.checkOut}
                  onChange={(e) => setQuickBookingForm((p) => ({ ...p, checkOut: e.target.value }))}
                  className="h-10 rounded-xl border-gray-200 font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Monthly Rent (PKR)
                </Label>
                <Input
                  type="number"
                  value={quickBookingForm.monthlyRent}
                  onChange={(e) => setQuickBookingForm((p) => ({ ...p, monthlyRent: e.target.value }))}
                  className="h-10 rounded-xl border-gray-200 font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Security Deposit (PKR)
                </Label>
                <Input
                  type="number"
                  value={quickBookingForm.securityDeposit}
                  onChange={(e) => setQuickBookingForm((p) => ({ ...p, securityDeposit: e.target.value }))}
                  className="h-10 rounded-xl border-gray-200 font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Booking Status
                </Label>
                <Select
                  value={quickBookingForm.status}
                  onValueChange={(v) => setQuickBookingForm((p) => ({ ...p, status: v }))}
                >
                  <SelectTrigger className="h-10 rounded-xl border-gray-200 dark:border-border font-bold text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="PENDING" className="text-xs font-bold">Pending Approval</SelectItem>
                    <SelectItem value="CONFIRMED" className="text-xs font-bold">Confirmed (Not Arrived)</SelectItem>
                    <SelectItem value="CHECKED_IN" className="text-xs font-bold">Checked In Now</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 md:col-span-2 pt-1">
                <input
                  id="quick-booking-mark-paid"
                  type="checkbox"
                  checked={quickBookingForm.markPaid}
                  onChange={(e) => setQuickBookingForm((p) => ({ ...p, markPaid: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 accent-slate-900"
                />
                <Label htmlFor="quick-booking-mark-paid" className="text-[10px] font-bold uppercase tracking-wider text-gray-500 cursor-pointer">
                  Mark rent as collected now (Cash) — leave unchecked to record as pending payment
                </Label>
              </div>
            </div>

            <div className="pt-2 flex gap-3 justify-end border-t border-gray-100 dark:border-border mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsQuickBookingOpen(false)}
                className="h-10 px-5 rounded-xl font-bold uppercase text-[10px] tracking-wider"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingQuickBooking}
                className="h-10 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-wider shadow-md"
              >
                {isSubmittingQuickBooking ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Reserving...</>
                ) : (
                  <><Zap className="h-3.5 w-3.5 mr-1.5 text-emerald-400" /> Reserve Room Instantly</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* QUICK ROOM STATUS / MAINTENANCE SETTINGS MODAL */}
      <Dialog open={isRoomSettingsOpen} onOpenChange={setIsRoomSettingsOpen}>
        <DialogContent className="rounded-3xl border-none p-6 md:p-8 max-w-md shadow-2xl bg-white dark:bg-card">
          <DialogHeader className="pb-3 border-b border-gray-100 dark:border-border">
            <DialogTitle className="text-lg font-black uppercase tracking-tight text-gray-900 dark:text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                Manage Room Status & Rent
              </span>
              <Badge className="bg-slate-100 text-slate-800 border-gray-200 text-[9px] font-bold uppercase">
                Room {roomSettingsForm.roomNumber}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRoomSettingsSubmit} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Operational Status
              </Label>
              <select
                className="w-full h-11 rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 px-3 font-bold text-xs uppercase outline-none"
                value={roomSettingsForm.status}
                onChange={(e) => setRoomSettingsForm((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="MAINTENANCE">Under Maintenance</option>
                <option value="CLEANING">Cleaning In Progress</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Monthly Base Rent (PKR)
              </Label>
              <Input
                type="number"
                value={roomSettingsForm.price}
                onChange={(e) => setRoomSettingsForm((p) => ({ ...p, price: e.target.value }))}
                className="h-11 rounded-xl border-gray-200 font-bold text-xs"
              />
            </div>

            <div className="pt-3 flex gap-3 justify-end border-t border-gray-100 dark:border-border mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRoomSettingsOpen(false)}
                className="h-10 px-5 rounded-xl font-bold uppercase text-[10px] tracking-wider"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingRoom}
                className="h-10 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-wider shadow-md"
              >
                {isUpdatingRoom ? "Updating..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Booking Detail Side Panel */}
      {selectedBooking && (
        <BookingDetailPanel
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusUpdate={(id, status) =>
            updateStatus({ bookingId: id, status }, { onSuccess: () => setSelectedBooking(null) })
          }
          isUpdating={isUpdating}
          router={router}
        />
      )}
    </div>
  );
}
