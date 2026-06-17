"use client";
import React, { useState, useMemo } from "react";

const WhatsAppIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.277l-.582 2.128 2.185-.573c.963.524 1.887.834 3.146.834 3.18 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.766-5.768-5.766zm3.43 8.213c-.149.25-1.042.493-1.428.52-.387.027-.755.127-2.203-.453-1.85-.74-3.003-2.618-3.096-2.743-.092-.124-.805-.97-1.014-1.85-.21-.88.192-1.34.357-1.503.165-.162.357-.202.476-.202s.239.006.342.012c.11.006.257-.024.403.328.162.392.553 1.35.602 1.45.049.1.082.217.016.35-.067.132-.1.216-.2.333-.1.117-.21.262-.3.35-.1.1-.205.21-.088.41.118.2.524.863 1.127 1.4 1.83 1.63 2.19 1.693 2.372 1.745.182.053.29-.02.4-.148.11-.128.47-.547.595-.733.125-.187.25-.157.42-.093.17.063 1.08.51 1.265.603.184.093.308.139.354.219.046.08.046.463-.103.713zM12 .003C5.373.003 0 5.377 0 12c0 2.102.542 4.154 1.578 5.98L0 24l6.194-1.624c1.763.96 3.742 1.47 5.804 1.472 6.623 0 12-5.373 12-11.999 0-3.203-1.246-6.216-3.514-8.48A11.92 11.92 0 0 0 12 .003z"/>
  </svg>
);
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Clock,
  Pin,
  X,
  AlertTriangle,
  ChevronDown,
  Search,
  Filter,
  Globe,
  Building2,
  Users,
  Bell,
  Loader2,
  ShieldAlert,
  Info,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  useNotices,
  useCreateNotice,
  useUpdateNotice,
  useDeleteNotice,
} from "@/hooks/useNotices";
import useAuthStore from "@/hooks/Authstate";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES = ["GENERAL", "MAINTENANCE", "MESS", "SAFETY", "EVENTS", "RULES", "FEES"];
const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"];
const TARGET_ROLES = ["GUEST", "WARDEN", "STAFF", "ADMIN"];

const PRIORITY_CONFIG = {
  LOW: { label: "Low", color: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  NORMAL: { label: "Normal", color: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" },
  HIGH: { label: "High", color: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" },
  URGENT: { label: "Urgent", color: "bg-rose-50 text-rose-700 border-rose-100", dot: "bg-rose-500 animate-pulse" },
};

const CATEGORY_CONFIG = {
  GENERAL: { icon: Info, color: "bg-slate-50 text-slate-600" },
  MAINTENANCE: { icon: Zap, color: "bg-amber-50 text-amber-600" },
  MESS: { icon: Users, color: "bg-emerald-50 text-emerald-600" },
  SAFETY: { icon: ShieldAlert, color: "bg-rose-50 text-rose-600" },
  EVENTS: { icon: Bell, color: "bg-violet-50 text-violet-600" },
  RULES: { icon: AlertTriangle, color: "bg-orange-50 text-orange-600" },
  FEES: { icon: Filter, color: "bg-indigo-50 text-indigo-600" },
};

const EMPTY_FORM = {
  title: "",
  content: "",
  category: "GENERAL",
  priority: "NORMAL",
  hostelId: null,
  targetRoles: [],
  isPinned: false,
  expiresAt: "",
  sendEmail: true,
  broadcastWhatsApp: false,
};

// ─── Main Component ─────────────────────────────────────────────────────────

const NoticePage = () => {
  const authUser = useAuthStore((state) => state.user);

  const hostelId = authUser?.hostelId || null;

  const { data: notices = [], isLoading, isError } = useNotices({ hostelId: hostelId ?? "" });

  const createNotice = useCreateNotice();
  const updateNotice = useUpdateNotice();
  const deleteNotice = useDeleteNotice();

  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState("");
  const [broadcastNotice, setBroadcastNotice] = useState(null);
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");

  const isAdmin = authUser?.role === "ADMIN";

  // ── Derived filtered list ──────────────────────────────────────────────

  const filteredNotices = useMemo(() => {
    if (!Array.isArray(notices)) return [];
    return notices.filter((n) => {
      const matchesSearch =
        !searchQuery ||
        n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = filterPriority === "ALL" || n.priority === filterPriority;
      const matchesCategory = filterCategory === "ALL" || n.category === filterCategory;
      return matchesSearch && matchesPriority && matchesCategory;
    });
  }, [notices, searchQuery, filterPriority, filterCategory]);

  const pinnedNotices = filteredNotices.filter((n) => n.isPinned);
  const regularNotices = filteredNotices.filter((n) => !n.isPinned);

  const urgentCount = Array.isArray(notices)
    ? notices.filter((n) => n.priority === "URGENT").length
    : 0;

  // ── Handlers ────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingNotice(null);
    setFormData({
      ...EMPTY_FORM,
      hostelId: hostelId,
      sendEmail: true,
      broadcastWhatsApp: false,
    });
    setShowForm(true);
  };

  const openEdit = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title || "",
      content: notice.content || "",
      category: notice.category || "GENERAL",
      priority: notice.priority || "NORMAL",
      hostelId: notice.hostelId || hostelId,
      targetRoles: notice.targetRoles || [],
      isPinned: notice.isPinned || false,
      expiresAt: notice.expiresAt
        ? new Date(notice.expiresAt).toISOString().slice(0, 16)
        : "",
      sendEmail: false,
      broadcastWhatsApp: false,
    });
    setShowForm(true);
  };

  const getWhatsAppShareUrl = (notice) => {
    if (!notice) return "";
    const priorityLabel = notice.priority || "NORMAL";
    const categoryLabel = notice.category || "GENERAL";
    const dateStr = format(new Date(notice.createdAt || Date.now()), "PPP");
    const expiryStr = notice.expiresAt ? format(new Date(notice.expiresAt), "PPP") : "";

    const text = `📢 *Notice: ${notice.title}*\n\n${notice.content}\n\n━━━━━━━━━━━━━━━━━━━━\n📌 *Priority:* ${priorityLabel}\n🏷️ *Category:* ${categoryLabel}\n📅 *Date:* ${dateStr}${expiryStr ? `\n⏳ *Expires:* ${expiryStr}` : ""}\n🏢 *Scope:* ${notice.hostelId ? "Hostel-Specific" : "Global"}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  const handleCopyNoticeText = (notice) => {
    if (!notice) return;
    const priorityLabel = notice.priority || "NORMAL";
    const categoryLabel = notice.category || "GENERAL";
    const dateStr = format(new Date(notice.createdAt || Date.now()), "PPP");
    const expiryStr = notice.expiresAt ? format(new Date(notice.expiresAt), "PPP") : "";

    const text = `📢 *Notice: ${notice.title}*\n\n${notice.content}\n\n━━━━━━━━━━━━━━━━━━━━\n📌 *Priority:* ${priorityLabel}\n🏷️ *Category:* ${categoryLabel}\n📅 *Date:* ${dateStr}${expiryStr ? `\n⏳ *Expires:* ${expiryStr}` : ""}\n🏢 *Scope:* ${notice.hostelId ? "Hostel-Specific" : "Global"}`;
    navigator.clipboard.writeText(text);
    toast.success("Notice text copied in WhatsApp format!");
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return toast.error("Title is required");
    if (!formData.content.trim()) return toast.error("Content is required");

    const payload = {
      ...formData,
      authorId: authUser?.id,
      hostelId: formData.hostelId || null,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
    };

    try {
      if (editingNotice) {
        await updateNotice.mutateAsync({ id: editingNotice.id, ...payload });
      } else {
        const created = await createNotice.mutateAsync(payload);
        if (formData.broadcastWhatsApp) {
          setBroadcastNotice(created);
        }
      }
      setShowForm(false);
      setEditingNotice(null);
      setFormData(EMPTY_FORM);
    } catch (err) {
      toast.error(err.message || "Failed to save notice");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotice.mutateAsync(id);
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const toggleRole = (role) => {
    setFormData((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role],
    }));
  };

  const isSubmitting = createNotice.isPending || updateNotice.isPending;

  // ── Notice Card ──────────────────────────────────────────────────────────

  const NoticeCard = ({ notice }) => {
    const pConf = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.NORMAL;
    const catConf = CATEGORY_CONFIG[notice.category] || CATEGORY_CONFIG.GENERAL;
    const CatIcon = catConf.icon;

    return (
      <div className="group bg-white dark:bg-card border border-slate-100 dark:border-border rounded-2xl p-5 hover:shadow-md transition-all duration-300 hover:border-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${catConf.color}`}>
              <CatIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2 mb-1.5">
                {notice.isPinned && (
                  <span className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    <Pin className="h-3 w-3" /> Pinned
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${pConf.color}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${pConf.dot}`} />
                  {pConf.label}
                </span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {notice.category}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-foreground tracking-tight leading-snug line-clamp-1">
                {notice.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                {notice.content}
              </p>
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(notice.createdAt), { addSuffix: true })}
                </span>
                {notice.hostelId ? (
                  <span className="flex items-center gap-1 text-amber-600">
                    <Building2 className="h-3 w-3" /> Hostel-Specific
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Globe className="h-3 w-3" /> Global
                  </span>
                )}
                {Array.isArray(notice.targetRoles) && notice.targetRoles.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {notice.targetRoles.join(", ")}
                  </span>
                )}
                {notice.expiresAt && (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Expires {format(new Date(notice.expiresAt), "MMM dd, yyyy")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => window.open(getWhatsAppShareUrl(notice), "_blank")}
              title="Share on WhatsApp"
              className="h-8 w-8 rounded-xl hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => openEdit(notice)}
              className="h-8 w-8 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl max-w-sm">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-sm font-bold uppercase tracking-wider">
                    Delete Notice?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-xs">
                    This will permanently remove <strong>"{notice.title}"</strong> from the board.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl text-xs">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(notice.id)}
                    className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                  >
                    {deleteNotice.isPending ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background pb-20 font-sans tracking-tight">

      {/* ── Header ── */}
      <div className="bg-white dark:bg-card border-b border-slate-100 dark:border-border sticky top-0 z-40 h-16">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
              <Megaphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-foreground tracking-tight uppercase">
                Notice Board
              </h1>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-muted-foreground">
                {isLoading
                  ? "Loading..."
                  : `${Array.isArray(notices) ? notices.length : 0} Notice${notices.length !== 1 ? "s" : ""} Posted`}
              </p>
            </div>
          </div>
          <Button
            onClick={openCreate}
            className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm active:scale-95 flex items-center gap-2"
          >
            <Plus className="h-3.5 w-3.5" /> Post Notice
          </Button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* ── Metrics Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Notices",
              value: Array.isArray(notices) ? notices.length : 0,
              icon: Megaphone,
              color: "text-indigo-600 bg-indigo-50 border-indigo-100",
            },
            {
              label: "Urgent",
              value: urgentCount,
              icon: AlertTriangle,
              color: urgentCount > 0
                ? "text-rose-600 bg-rose-50 border-rose-100"
                : "text-slate-400 bg-slate-50 border-slate-100",
            },
            {
              label: "Pinned",
              value: Array.isArray(notices) ? notices.filter((n) => n.isPinned).length : 0,
              icon: Pin,
              color: "text-amber-600 bg-amber-50 border-amber-100",
            },
            {
              label: "Global Notices",
              value: Array.isArray(notices) ? notices.filter((n) => !n.hostelId).length : 0,
              icon: Globe,
              color: "text-blue-600 bg-blue-50 border-blue-100",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-card border border-slate-100 dark:border-border rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-all"
            >
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-foreground mt-0.5">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters Bar ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notices..."
              className="pl-10 h-10 rounded-xl border-slate-200 dark:border-border bg-white dark:bg-card text-sm"
            />
          </div>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-full sm:w-40 h-10 rounded-xl border-slate-200 dark:border-border bg-white dark:bg-card text-xs font-bold uppercase tracking-wider">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl border-slate-200 dark:border-border bg-white dark:bg-card text-xs font-bold uppercase tracking-wider">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-card border border-slate-100 dark:border-border rounded-2xl p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-3 bg-slate-100 rounded-full w-1/3" />
                    <div className="h-4 bg-slate-100 rounded-full w-2/3" />
                    <div className="h-3 bg-slate-100 rounded-full w-full" />
                    <div className="h-3 bg-slate-100 rounded-full w-4/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16 bg-white dark:bg-card border border-slate-100 rounded-2xl">
            <AlertTriangle className="h-10 w-10 text-rose-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-900 dark:text-foreground">Failed to load notices</p>
            <p className="text-xs text-slate-400 mt-1">Check your network and try again.</p>
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-card border border-dashed border-slate-200 dark:border-border rounded-2xl">
            <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <Pin className="h-8 w-8 text-slate-300 rotate-45" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-foreground uppercase tracking-wider">
              {searchQuery || filterPriority !== "ALL" || filterCategory !== "ALL"
                ? "No notices match your search"
                : "No notices posted yet"}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 mb-6">
              {searchQuery || filterPriority !== "ALL" || filterCategory !== "ALL"
                ? "Try adjusting your filters"
                : "Click \"Post Notice\" to publish the first announcement."}
            </p>
            {!searchQuery && filterPriority === "ALL" && filterCategory === "ALL" && (
              <Button
                onClick={openCreate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-wider"
              >
                <Plus className="h-4 w-4 mr-2" /> Post First Notice
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pinned Section */}
            {pinnedNotices.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-3 w-1 bg-amber-500 rounded-full" />
                  <h2 className="text-[10px] font-black text-slate-900 dark:text-foreground uppercase tracking-widest">
                    Pinned Announcements
                  </h2>
                </div>
                {pinnedNotices.map((notice) => (
                  <NoticeCard key={notice.id} notice={notice} />
                ))}
              </div>
            )}

            {/* Regular Notices */}
            {regularNotices.length > 0 && (
              <div className="space-y-3">
                {pinnedNotices.length > 0 && (
                  <div className="flex items-center gap-2.5">
                    <div className="h-3 w-1 bg-slate-300 rounded-full" />
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      All Notices
                    </h2>
                  </div>
                )}
                {regularNotices.map((notice) => (
                  <NoticeCard key={notice.id} notice={notice} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Create / Edit Dialog ── */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) { setEditingNotice(null); setFormData(EMPTY_FORM); }
        }}
      >
        <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-card">
          {/* Dialog Header */}
          <div className="bg-indigo-600 p-7 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5 skew-x-12 translate-x-20" />
            <div className="relative z-10">
              <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/10">
                <Megaphone className="h-6 w-6" />
              </div>
              <DialogTitle className="text-lg font-bold uppercase tracking-tight">
                {editingNotice ? "Edit Notice" : "Post Notice"}
              </DialogTitle>
              <DialogDescription className="text-indigo-200/80 text-[10px] uppercase tracking-widest mt-1">
                {editingNotice ? "Update the announcement details" : "Publish a new announcement to residents and staff"}
              </DialogDescription>
            </div>
          </div>

          <div className="p-7 space-y-5 overflow-y-auto max-h-[60vh]">
            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Title *
              </Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Notice title..."
                className="rounded-xl h-11 border-slate-200 dark:border-border text-sm font-medium"
              />
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Content *
              </Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Announcement details..."
                rows={4}
                className="rounded-xl border-slate-200 dark:border-border text-sm font-medium resize-none"
              />
            </div>

            {/* Category + Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 dark:border-border text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 dark:border-border text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Target Roles */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Visible To (leave empty for all)
              </Label>
              <div className="flex flex-wrap gap-2">
                {TARGET_ROLES.map((role) => {
                  const selected = formData.targetRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${selected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"
                        }`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expiry Date */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Expiry Date (optional)
              </Label>
              <Input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="rounded-xl h-11 border-slate-200 dark:border-border text-sm"
              />
            </div>

            {/* Broadcasting Options */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Broadcasting Channels
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-border hover:border-slate-200 cursor-pointer transition-all bg-slate-50/50">
                  <input
                    type="checkbox"
                    checked={formData.sendEmail}
                    onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 h-4 w-4"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-foreground flex items-center gap-1">
                      <Bell className="h-3 w-3 text-indigo-500" /> Email
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Alert residents.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-border hover:border-slate-200 cursor-pointer transition-all bg-slate-50/50">
                  <input
                    type="checkbox"
                    checked={formData.broadcastWhatsApp}
                    onChange={(e) => setFormData({ ...formData, broadcastWhatsApp: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 h-4 w-4"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-foreground flex items-center gap-1">
                      <WhatsAppIcon className="h-3 w-3 text-emerald-500" /> WhatsApp
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Share in group.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Pin toggle */}
            <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-border hover:border-slate-200 cursor-pointer transition-all bg-slate-50/50">
              <input
                type="checkbox"
                checked={formData.isPinned}
                onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
              />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-foreground flex items-center gap-1.5">
                  <Pin className="h-3.5 w-3.5 text-amber-500" /> Pin this notice
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Pinned notices appear at the top of the board.</p>
              </div>
            </label>
          </div>

          <div className="px-7 pb-7">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {editingNotice ? "Saving..." : "Publishing..."}
                </>
              ) : editingNotice ? "Save Changes" : "Publish Notice"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Broadcast Success Dialog ── */}
      <Dialog
        open={broadcastNotice !== null}
        onOpenChange={(open) => {
          if (!open) setBroadcastNotice(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-card text-slate-900 dark:text-foreground">
          {/* Header */}
          <div className="bg-emerald-600 p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5 skew-x-12 translate-x-20" />
            <div className="relative z-10 text-center flex flex-col items-center">
              <div className="h-14 w-14 bg-white/10 rounded-full flex items-center justify-center mb-3 backdrop-blur-md border border-white/10">
                <WhatsAppIcon className="h-7 w-7 text-white" />
              </div>
              <DialogTitle className="text-base font-bold uppercase tracking-tight">
                Broadcast to WhatsApp
              </DialogTitle>
              <DialogDescription className="text-emerald-100/80 text-[10px] uppercase tracking-widest mt-1">
                Share this announcement with your residents' WhatsApp Group
              </DialogDescription>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-slate-50 dark:bg-muted p-4 rounded-xl border border-slate-100 dark:border-border font-sans">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Message Preview</p>
              <div className="text-xs text-slate-700 dark:text-muted-foreground whitespace-pre-wrap font-mono bg-white dark:bg-card p-3 rounded-lg border border-slate-200/60 dark:border-border max-h-48 overflow-y-auto leading-relaxed">
                {broadcastNotice && (
                  <>
                    📢 *Notice: {broadcastNotice.title}*{"\n\n"}
                    {broadcastNotice.content}{"\n\n"}
                    ━━━━━━━━━━━━━━━━━━━━{"\n"}
                    📌 *Priority:* {broadcastNotice.priority || "NORMAL"}{"\n"}
                    🏷️ *Category:* {broadcastNotice.category || "GENERAL"}{"\n"}
                    📅 *Date:* {format(new Date(broadcastNotice.createdAt || Date.now()), "PPP")}
                    {broadcastNotice.expiresAt && `\n⏳ *Expires:* ${format(new Date(broadcastNotice.expiresAt), "PPP")}`}
                    {`\n🏢 *Scope:* ${broadcastNotice.hostelId ? "Hostel-Specific" : "Global"}`}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleCopyNoticeText(broadcastNotice)}
              className="flex-1 h-11 border-slate-200 dark:border-border text-slate-700 dark:text-muted-foreground rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all"
            >
              Copy Text
            </Button>
            <Button
              onClick={() => {
                window.open(getWhatsAppShareUrl(broadcastNotice), "_blank");
                setBroadcastNotice(null);
              }}
              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <WhatsAppIcon className="h-4 w-4" /> Open WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NoticePage;
