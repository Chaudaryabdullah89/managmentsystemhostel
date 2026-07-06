"use client";

import React, { useState } from "react";
import {
  LifeBuoy,
  Plus,
  Clock,
  AlertTriangle,
  ChevronRight,
  Search,
  Send,
  CheckCircle2,
  Zap,
  Wind,
  ShieldCheck,
  Wrench,
  MessageSquare,
  ClipboardList,
  PhoneCall,
  MessageCircle,
  Droplets,
  Wifi,
  Sparkles,
  Utensils,
  Layers,
  Filter,
  X,
  Activity,
  FileText,
  Calendar,
  Tag,
  Info,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import useAuthStore from "@/hooks/Authstate";
import { useUserDetailedProfile } from "@/hooks/useusers";
import {
  useComplaints,
  useCreateComplaint,
  useAddComplaintComment,
} from "@/hooks/usecomplaints";
import { format } from "date-fns";

/* ─────────── Status & Priority Badge components ─────────── */
const StatusBadge = ({ status }) => {
  const s = status?.toUpperCase();
  if (["RESOLVED", "COMPLETED", "FIXED"].includes(s))
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[9.5px] font-black uppercase tracking-wider">
        <CheckCircle2 className="h-3 w-3" /> Resolved
      </span>
    );
  if (["IN_PROGRESS", "PROGRESS", "PROCESSING"].includes(s))
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/70 text-[9.5px] font-black uppercase tracking-wider animate-pulse">
        <Activity className="h-3 w-3" /> In Progress
      </span>
    );
  if (["REJECTED"].includes(s))
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200/70 text-[9.5px] font-black uppercase tracking-wider">
        <X className="h-3 w-3" /> Rejected
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/70 text-[9.5px] font-black uppercase tracking-wider">
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
};

const PriorityDot = ({ priority }) => {
  const p = priority?.toUpperCase();
  const map = {
    URGENT: "bg-rose-500",
    HIGH: "bg-orange-500",
    MEDIUM: "bg-amber-400",
    LOW: "bg-slate-400",
  };
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${map[p] || "bg-slate-400"}`}
      title={priority}
    />
  );
};

/* Category config */
const CATEGORIES = [
  { value: "MAINTENANCE", label: "Room Maintenance", icon: Wrench, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "ELECTRICAL", label: "Electrical / Power", icon: Zap, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  { value: "PLUMBING", label: "Plumbing / Water", icon: Droplets, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "INTERNET", label: "WiFi & Internet", icon: Wifi, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { value: "CLEANLINESS", label: "Housekeeping", icon: Sparkles, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { value: "SECURITY", label: "Security & Keys", icon: ShieldCheck, color: "text-rose-600 bg-rose-50 border-rose-200" },
  { value: "NOISE", label: "Noise Issue", icon: MessageCircle, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { value: "OTHER", label: "Other Support", icon: LifeBuoy, color: "text-slate-600 bg-slate-50 border-slate-200" },
];

const getCategoryConfig = (value) =>
  CATEGORIES.find((c) => c.value === value) || CATEGORIES[7];

/* ─────────── Main Page ─────────── */
const GuestSupportPage = () => {
  const user = useAuthStore((state) => state.user);
  const { data: userData, isLoading: profileLoading } = useUserDetailedProfile(user?.id);

  /* Use the dedicated complaints hook for fresh data including comments */
  const { data: complaintsRaw, isLoading: complaintsLoading, refetch } = useComplaints(
    user?.id ? { userId: user.id } : {}
  );
  const complaints = Array.isArray(complaintsRaw) ? complaintsRaw : [];

  const createComplaintMutation = useCreateComplaint();
  const addCommentMutation = useAddComplaintComment();

  /* ─── form state ─── */
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "MAINTENANCE",
    priority: "MEDIUM",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  /* ─── detail state ─── */
  const [selectedId, setSelectedId] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  /* ─── derived ─── */
  const bookings = userData?.bookings || [];
  const activeBooking = bookings.find(
    (b) => b.status === "CONFIRMED" || b.status === "CHECKED_IN"
  );
  const isCheckedOut = bookings.length > 0 && !activeBooking;

  const filteredComplaints = complaints.filter((c) => {
    const matchSearch =
      !searchQuery ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat =
      categoryFilter === "ALL" || c.category?.toUpperCase() === categoryFilter;
    return matchSearch && matchCat;
  });

  const activeComplaint = selectedId
    ? complaints.find((c) => c.id === selectedId) || null
    : null;

  /* stats */
  const pendingCount = complaints.filter((c) =>
    ["PENDING", "SENT"].includes(c.status?.toUpperCase())
  ).length;
  const inProgressCount = complaints.filter((c) =>
    ["IN_PROGRESS", "PROCESSING"].includes(c.status?.toUpperCase())
  ).length;
  const resolvedCount = complaints.filter((c) =>
    ["RESOLVED", "COMPLETED"].includes(c.status?.toUpperCase())
  ).length;

  /* ─── handlers ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isCheckedOut) {
      toast.error("Restricted", { description: "Checked-out residents cannot submit new requests." });
      return;
    }
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setFormSubmitting(true);
    try {
      await createComplaintMutation.mutateAsync({
        ...formData,
        userId: user?.id,
        hostelId: activeBooking?.Room?.hostelId || activeBooking?.hostelId,
        status: "PENDING",
      });
      setFormData({ title: "", description: "", category: "MAINTENANCE", priority: "MEDIUM" });
      refetch();
      toast.success("Support ticket submitted!", {
        description: "Our warden team will review your request shortly.",
      });
    } catch (err) {
      toast.error("Submission failed", { description: err?.message || "Something went wrong." });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !activeComplaint) return;
    try {
      await addCommentMutation.mutateAsync({
        complaintId: activeComplaint.id,
        userId: user?.id,
        message: newComment.trim(),
      });
      setNewComment("");
      refetch();
    } catch (err) {
      toast.error("Failed to send message.");
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Activity className="h-7 w-7 text-indigo-600 animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Loading Support Center...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-background pb-20">
      {/* ── Page title row (no sticky — global layout header handles nav) */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-foreground tracking-tight uppercase flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-indigo-600" />
            Support & Complaints Center
          </h1>
          <p className="text-[10.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
            File issues · Track status · Communicate with warden
          </p>
        </div>

        {/* Stats summary chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: "Pending", count: pendingCount, color: "bg-amber-50 text-amber-700 border-amber-200" },
            { label: "In Progress", count: inProgressCount, color: "bg-blue-50 text-blue-700 border-blue-200" },
            { label: "Resolved", count: resolvedCount, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
          ].map((s) => (
            <span
              key={s.label}
              className={`text-[9.5px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border ${s.color}`}
            >
              {s.count} {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Main split layout ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* ══════════════════════════════
            LEFT: File New Complaint Form
            ══════════════════════════════ */}
        <div className="lg:col-span-2 space-y-5">
          {/* Form card */}
          <div className="bg-white dark:bg-card border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            {/* Form header */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-indigo-200" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-tight">
                    File a New Complaint
                  </h2>
                  <p className="text-[9.5px] text-indigo-200 font-bold uppercase tracking-widest mt-0.5">
                    Describe your issue — we'll handle it fast
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Category selector grid */}
              <div className="space-y-2">
                <Label className="text-[9.5px] font-black uppercase tracking-widest text-slate-500">
                  Issue Category
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = formData.category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, category: cat.value }))}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all duration-200 ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 shadow-xs"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`h-7 w-7 rounded-lg flex items-center justify-center border shrink-0 ${
                            isSelected ? "bg-indigo-600 border-indigo-600 text-white" : cat.color + " border"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span
                          className={`text-[9.5px] font-black uppercase tracking-wide ${
                            isSelected
                              ? "text-indigo-700 dark:text-indigo-400"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label className="text-[9.5px] font-black uppercase tracking-widest text-slate-500">
                  Urgency Level
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: "LOW", label: "Low", dot: "bg-slate-400" },
                    { value: "MEDIUM", label: "Medium", dot: "bg-amber-400" },
                    { value: "HIGH", label: "High", dot: "bg-orange-500" },
                    { value: "URGENT", label: "🚨 Urgent", dot: "bg-rose-600" },
                  ].map((p) => {
                    const isSelected = formData.priority === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, priority: p.value }))}
                        className={`flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${isSelected ? "bg-white" : p.dot}`} />
                        <span className="text-[8.5px] font-black uppercase tracking-wide leading-none">
                          {p.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label className="text-[9.5px] font-black uppercase tracking-widest text-slate-500">
                  Issue Title / Subject
                </Label>
                <Input
                  className="h-11 rounded-xl border-slate-200 dark:border-slate-700 font-semibold text-xs bg-slate-50/60 dark:bg-slate-900/20"
                  placeholder="e.g., Ceiling fan making loud noise"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-[9.5px] font-black uppercase tracking-widest text-slate-500">
                  Detailed Description
                </Label>
                <Textarea
                  className="rounded-xl border-slate-200 dark:border-slate-700 font-semibold text-xs min-h-[110px] bg-slate-50/60 dark:bg-slate-900/20 resize-none"
                  placeholder="Describe the problem clearly so the warden can resolve it quickly..."
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <Button
                type="submit"
                disabled={formSubmitting || isCheckedOut}
                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {formSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Activity className="h-4 w-4 animate-spin" /> Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" /> Submit Complaint Ticket
                  </span>
                )}
              </Button>

              {isCheckedOut && (
                <p className="text-[9.5px] font-bold text-rose-500 text-center uppercase tracking-wide">
                  ⚠ Submission disabled — residency concluded
                </p>
              )}
            </form>
          </div>

          {/* Emergency contact card */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-5 text-white border border-indigo-900/40 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300 mb-2">
              Emergency Assistance
            </p>
            <h3 className="text-sm font-black uppercase tracking-tight mb-3">
              Need Immediate Help?
            </h3>
            <div className="flex gap-2">
              <a
                href="tel:+923001234567"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[9.5px] font-bold uppercase tracking-wider transition-all"
              >
                <PhoneCall className="h-3.5 w-3.5" /> Call Warden
              </a>
              <a
                href="https://wa.me/923001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-[9.5px] font-bold uppercase tracking-wider transition-all"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════
            RIGHT: Complaints List + Detail
            ══════════════════════════════ */}
        <div className="lg:col-span-3 space-y-5">
          {/* List header with search & filter */}
          <div className="bg-white dark:bg-card border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 dark:text-foreground uppercase tracking-tight">
                My Complaint Tickets ({filteredComplaints.length})
              </h2>
              <button
                onClick={() => refetch()}
                className="text-[9.5px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Refresh
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search by title or description..."
                className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-700 text-xs font-semibold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setCategoryFilter("ALL")}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9.5px] font-black uppercase tracking-wider transition-all ${
                  categoryFilter === "ALL"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                }`}
              >
                <Layers className="h-3 w-3" /> All
              </button>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = categoryFilter === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setCategoryFilter(cat.value)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9.5px] font-black uppercase tracking-wider transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {cat.label.split(" ")[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Complaint List ── */}
          {complaintsLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Activity className="h-6 w-6 animate-spin mr-2" />
              <span className="text-xs font-bold uppercase tracking-wider">Loading tickets...</span>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="bg-white dark:bg-card border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-14 text-center">
              <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="h-7 w-7 text-slate-300" />
              </div>
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase mb-1">
                No Tickets Found
              </h3>
              <p className="text-[10.5px] text-slate-400 font-medium max-w-xs mx-auto">
                {searchQuery || categoryFilter !== "ALL"
                  ? "No complaints match your current filters."
                  : "You haven't filed any complaints yet. Use the form on the left to get started."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredComplaints.map((complaint) => {
                const catConfig = getCategoryConfig(complaint.category);
                const CatIcon = catConfig.icon;
                const isSelected = selectedId === complaint.id;
                return (
                  <div
                    key={complaint.id}
                    className={`bg-white dark:bg-card border rounded-2xl overflow-hidden shadow-2xs transition-all duration-300 cursor-pointer hover:shadow-md ${
                      isSelected
                        ? "border-indigo-500 ring-1 ring-indigo-500/20"
                        : "border-slate-200/80 dark:border-slate-800 hover:-translate-y-0.5"
                    }`}
                    onClick={() => setSelectedId(isSelected ? null : complaint.id)}
                  >
                    {/* Ticket row */}
                    <div className="flex items-start gap-4 p-5">
                      {/* Category icon */}
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${catConfig.color}`}
                      >
                        <CatIcon className="h-4.5 w-4.5" />
                      </div>

                      {/* Body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            #{complaint.uid || complaint.id.slice(-6).toUpperCase()}
                          </span>
                          <span className="h-2.5 w-px bg-slate-200 dark:bg-slate-700" />
                          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                            {complaint.category?.replace("_", " ")}
                          </span>
                        </div>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-foreground tracking-tight truncate">
                          {complaint.title}
                        </h3>
                        <p className="text-[10.5px] text-slate-500 font-medium mt-0.5 line-clamp-1">
                          {complaint.description}
                        </p>
                      </div>

                      {/* Right side meta */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <StatusBadge status={complaint.status} />
                        <div className="flex items-center gap-1.5">
                          <PriorityDot priority={complaint.priority} />
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                            {complaint.priority}
                          </span>
                        </div>
                        <span className="text-[8.5px] font-bold text-slate-400">
                          {format(new Date(complaint.createdAt), "MMM dd, yyyy")}
                        </span>
                      </div>

                      <ChevronDown
                        className={`h-4 w-4 text-slate-300 shrink-0 mt-1 transition-transform duration-300 ${isSelected ? "rotate-180 text-indigo-500" : ""}`}
                      />
                    </div>

                    {/* ── Expandable Detail Panel ── */}
                    {isSelected && (
                      <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/20 animate-in slide-in-from-top-2 duration-200">
                        {/* Metadata row */}
                        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
                          {[
                            {
                              label: "Filed On",
                              value: format(new Date(complaint.createdAt), "MMM dd, yyyy"),
                              icon: Calendar,
                            },
                            {
                              label: "Priority",
                              value: complaint.priority,
                              icon: Tag,
                            },
                            {
                              label: "Assigned To",
                              value:
                                complaint.User_Complaint_assignedToIdToUser?.name ||
                                "Hostel Staff",
                              icon: Info,
                            },
                          ].map((meta) => (
                            <div key={meta.label} className="px-5 py-3">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <meta.icon className="h-3 w-3 text-slate-400" />
                                <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">
                                  {meta.label}
                                </span>
                              </div>
                              <p className="text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300">
                                {meta.value}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Full description */}
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                          <p className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                            Full Description
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                            {complaint.description}
                          </p>
                        </div>

                        {/* Resolution note if resolved */}
                        {complaint.resolutionNotes && (
                          <div className="mx-5 my-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 rounded-2xl">
                            <p className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">
                              Resolution Notes
                            </p>
                            <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
                              {complaint.resolutionNotes}
                            </p>
                          </div>
                        )}

                        {/* ── Comments Thread ── */}
                        <div className="px-5 pb-4">
                          <p className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest mb-3 mt-2">
                            Conversation Thread ({complaint.comments?.length || 0})
                          </p>

                          {complaint.comments && complaint.comments.length > 0 ? (
                            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                              {complaint.comments.map((comment) => {
                                const isOwn =
                                  comment.User?.id === user?.id;
                                return (
                                  <div
                                    key={comment.id}
                                    className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : ""}`}
                                  >
                                    <div
                                      className={`h-7 w-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-black border ${
                                        isOwn
                                          ? "bg-indigo-600 text-white border-indigo-600"
                                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600"
                                      }`}
                                    >
                                      {comment.User?.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div
                                      className={`px-3.5 py-2.5 rounded-2xl max-w-[80%] text-xs ${
                                        isOwn
                                          ? "bg-indigo-600 text-white rounded-tr-none"
                                          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 mb-1 text-[8.5px] font-bold uppercase tracking-wider opacity-75">
                                        <span>{isOwn ? "You" : comment.User?.name}</span>
                                        <span>·</span>
                                        <span>
                                          {comment.createdAt
                                            ? new Date(comment.createdAt).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })
                                            : ""}
                                        </span>
                                      </div>
                                      <p className="font-medium leading-relaxed">{comment.message}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-5 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                              <ClipboardList className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
                              <p className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider">
                                No messages yet — reply below
                              </p>
                            </div>
                          )}

                          {/* Reply Input */}
                          <div className="flex items-center gap-2 mt-3">
                            <Input
                              placeholder="Write a reply to the warden..."
                              className="flex-1 h-10 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendComment();
                                }
                              }}
                            />
                            <Button
                              onClick={handleSendComment}
                              disabled={
                                !newComment.trim() || addCommentMutation.isPending
                              }
                              className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 shrink-0"
                            >
                              {addCommentMutation.isPending ? (
                                <Activity className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Send className="h-3.5 w-3.5 mr-1" /> Send
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestSupportPage;
