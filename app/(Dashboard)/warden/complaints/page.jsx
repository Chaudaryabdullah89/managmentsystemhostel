"use client";
import React, { useState } from "react";
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  MessageSquare,
  Download,
  Filter,
  ShieldCheck,
  Calendar,
  Send,
  Building2,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useComplaints,
  useUpdateComplaint,
  useAddComplaintComment,
} from "@/hooks/usecomplaints";
import { useStaffList } from "@/hooks/useSalaries";
import { format } from "date-fns";
import { toast } from "sonner";
import useAuthStore from "@/hooks/Authstate";
import { ListPageSkeleton } from "@/components/ui/skeletons";
import PageHeader from "@/components/Dashboard/PageHeader";
import EmptyState from "@/components/ui/states/EmptyState";
import ErrorState from "@/components/ui/states/ErrorState";

const getStatusBadge = (status) => {
  switch (status) {
    case "RESOLVED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300";
    case "REJECTED":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300";
    case "IN_PROGRESS":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300";
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-muted/20 dark:border-border";
  }
};

const getPriorityBadge = (priority) => {
  switch (priority) {
    case "URGENT":
      return "bg-rose-600 text-white font-semibold";
    case "HIGH":
      return "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300";
    case "MEDIUM":
      return "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300";
    case "LOW":
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-muted/20 dark:border-border";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-muted/20 dark:border-border";
  }
};

const ComplaintDetailDialog = ({
  complaint,
  staffMembers,
  updateMutation,
  addCommentMutation,
  user,
}) => {
  const [notes, setNotes] = useState(complaint.resolutionNotes ?? "");
  const [newComment, setNewComment] = useState("");

  const handleUpdate = (status) => {
    updateMutation.mutate(
      {
        id: complaint.id,
        status,
        resolutionNotes: notes,
      },
      { onSuccess: () => toast.success(`Complaint marked as ${status}`) },
    );
  };

  const handleSendComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(
      { complaintId: complaint.id, userId: user?.id, message: newComment },
      { onSuccess: () => setNewComment("") },
    );
  };

  const age = Math.floor(
    (Date.now() - new Date(complaint.createdAt)) / 86400000,
  );

  return (
    <DialogContent className="max-w-2xl p-0 overflow-hidden border-slate-200 dark:border-border rounded-2xl shadow-xl bg-white dark:bg-card flex flex-col max-h-[85vh]">
      <DialogTitle className="sr-only">{complaint.title}</DialogTitle>
      <DialogDescription className="sr-only">
        Details for complaint ticket #{complaint.uid || complaint.id.slice(-6)}
      </DialogDescription>

      <div className="flex flex-col flex-1 overflow-hidden font-sans">
        <div className="p-6 border-b border-slate-100 dark:border-border flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-muted/10 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-slate-400">
                #{complaint.uid || complaint.id.slice(-8).toUpperCase()}
              </span>
              <Badge variant="outline" className={`${getStatusBadge(complaint.status)} text-[11px] font-medium px-2 py-0.5 rounded-md`}>
                {complaint.status}
              </Badge>
              <Badge variant="outline" className={`${getPriorityBadge(complaint.priority)} text-[11px] font-medium px-2 py-0.5 rounded-md`}>
                {complaint.priority}
              </Badge>
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-foreground mt-1 truncate">
              {complaint.title}
            </h3>
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Resident", value: complaint.User_Complaint_userIdToUser?.name || "N/A" },
              { label: "Filed Date", value: format(new Date(complaint.createdAt), "MMM dd, yyyy") },
              { label: "Hostel", value: complaint.Hostel?.name || "N/A" },
              { label: "Ticket Age", value: age === 0 ? "Today" : `${age}d ago` },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 bg-slate-50/70 dark:bg-muted/10 rounded-xl border border-slate-200/60 dark:border-border">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">{label}</span>
                <span className="text-xs font-semibold text-slate-900 dark:text-foreground truncate block mt-0.5">{value}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50/70 dark:bg-muted/10 rounded-xl border border-slate-200/60 dark:border-border space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Resident Statement</span>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-normal leading-relaxed">
              "{complaint.description}"
            </p>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50/70 dark:bg-muted/10 rounded-xl border border-slate-200/60 dark:border-border">
            <div className="flex items-center gap-2.5 min-w-0">
              <UserCheck className="h-4 w-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Assigned Staff</span>
                <span className="text-xs font-semibold text-slate-900 dark:text-foreground truncate block">
                  {complaint.User_Complaint_assignedToIdToUser?.name || "Unassigned"}
                </span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg border-slate-200 font-medium">
                  Assign Staff
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl">
                <DropdownMenuLabel className="text-xs font-medium text-slate-400">Select Staff</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {staffMembers.map(staff => (
                  <DropdownMenuItem
                    key={staff.id}
                    onClick={() => {
                      updateMutation.mutate(
                        { id: complaint.id, assignedToId: staff.id },
                        { onSuccess: () => toast.success(`Assigned to ${staff.name}`) }
                      );
                    }}
                    className="text-xs font-medium cursor-pointer"
                  >
                    {staff.name} ({staff.role})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {(complaint.status === "PENDING" || complaint.status === "IN_PROGRESS") && (
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-border">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Resolution & Audit Notes</Label>
              <Textarea
                placeholder="Type resolution findings or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] text-xs font-normal rounded-xl border-slate-200 dark:border-border bg-slate-50/60 focus:bg-white resize-none p-3"
              />
              <div className="flex gap-2">
                {complaint.status === "PENDING" && (
                  <Button
                    onClick={() => handleUpdate("IN_PROGRESS")}
                    disabled={updateMutation.isPending}
                    className="flex-1 h-9 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-medium"
                  >
                    Start Processing
                  </Button>
                )}
                {complaint.status === "IN_PROGRESS" && (
                  <Button
                    onClick={() => handleUpdate("RESOLVED")}
                    disabled={updateMutation.isPending || !notes.trim()}
                    className="flex-1 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium disabled:opacity-50"
                  >
                    Mark Resolved
                  </Button>
                )}
                <Button
                  onClick={() => handleUpdate("REJECTED")}
                  disabled={updateMutation.isPending}
                  variant="outline"
                  className="h-9 rounded-xl border-slate-200 text-rose-600 hover:bg-rose-50 text-xs font-medium"
                >
                  Reject Ticket
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-border">
            <span className="text-xs font-semibold text-slate-900 dark:text-foreground block">Discussion Feed</span>
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {complaint.comments?.length > 0 ? (
                complaint.comments.map((c) => {
                  const isStaffMember = ["ADMIN", "WARDEN", "STAFF"].includes(c.User.role);
                  return (
                    <div
                      key={c.id}
                      className={`flex gap-2 ${isStaffMember ? "flex-row-reverse" : ""}`}
                    >
                      <div className={`p-3 rounded-xl max-w-[85%] text-xs font-normal ${isStaffMember ? "bg-slate-900 text-white rounded-tr-none" : "bg-slate-100 dark:bg-muted/20 text-slate-800 dark:text-slate-200 rounded-tl-none"}`}>
                        <div className={`flex items-center gap-2 mb-1 text-[10px] ${isStaffMember ? "text-slate-400" : "text-slate-400"}`}>
                          <span className="font-semibold">{c.User.name}</span>
                          <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p>{c.message}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs font-medium text-slate-400 text-center py-4">No comments logged yet.</p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Input
                placeholder="Add a reply..."
                className="h-9 rounded-xl border-slate-200 text-xs font-normal"
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
                size="icon"
                onClick={handleSendComment}
                disabled={addCommentMutation.isPending || !newComment.trim()}
                className="h-9 w-9 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  );
};

const WardenComplaintsPage = () => {
  const user = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const {
    data: complaintsData,
    isLoading: isComplaintsLoading,
    isError: isComplaintsError,
    refetch: refetchComplaints,
  } = useComplaints({
    hostelId: user?.hostelId || undefined
  });

  const {
    data: statsData,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useComplaints({
    stats: "true",
    hostelId: user?.hostelId || undefined
  });

  const { data: staffData } = useStaffList();
  const updateMutation = useUpdateComplaint();
  const addCommentMutation = useAddComplaintComment();

  const complaints = complaintsData || [];
  const stats = statsData || { total: 0, pending: 0, inProgress: 0, resolved: 0, urgent: 0, resolutionRate: 0 };
  const staffMembers = staffData || [];

  const filteredComplaints = complaints.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      c.title?.toLowerCase().includes(q) ||
      c.User_Complaint_userIdToUser?.name?.toLowerCase().includes(q) ||
      c.id?.toLowerCase().includes(q) ||
      c.uid?.toLowerCase().includes(q);
    return (
      matchSearch &&
      (statusFilter === "All" || c.status === statusFilter) &&
      (priorityFilter === "All" || c.priority === priorityFilter)
    );
  });

  const handleExport = () => {
    const headers = ["Ticket ID", "Resident", "Category", "Priority", "Status", "Filed Date"];
    const rows = filteredComplaints.map((c) => [
      c.uid || `GRV-${c.id.slice(-8).toUpperCase()}`,
      c.User_Complaint_userIdToUser?.name || "N/A",
      c.category,
      c.priority,
      c.status,
      format(new Date(c.createdAt), "yyyy-MM-dd HH:mm"),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = `Warden_Complaints_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Complaints exported successfully");
  };

  if (isComplaintsLoading || isStatsLoading) return <ListPageSkeleton accentColor="bg-slate-900" />;
  if (isComplaintsError) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ErrorState
          title="Unable to load complaints"
          description="There was an issue retrieving complaint records."
          onRetry={() => {
            refetchComplaints?.();
            refetchStats?.();
          }}
          retryLabel="Retry"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background font-sans text-slate-900 dark:text-slate-100 pb-24">
      <PageHeader
        title="Hostel Complaints"
        subtitleStart="Grievance Tickets"
        subtitleEnd="Warden Desk"
        maxWidthClass="max-w-6xl"
        accentColorClass="bg-slate-900"
        dotColorClass="bg-emerald-500"
        rightSlot={
          <Button
            variant="outline"
            onClick={handleExport}
            className="h-8 px-3.5 rounded-lg border-slate-200 dark:border-border bg-white dark:bg-card font-medium text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            <span>Export CSV</span>
          </Button>
        }
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Complaints", value: stats.total, icon: MessageSquare },
            { label: "Pending Resolution", value: stats.pending, icon: Clock },
            { label: "Urgent Priority", value: stats.urgent, icon: AlertTriangle },
            { label: "Resolution Rate", value: `${stats.resolutionRate}%`, icon: CheckCircle2 },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-card border border-slate-200/70 dark:border-border rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">{stat.label}</span>
                <span className="text-xl font-semibold text-slate-900 dark:text-foreground mt-0.5 block">{stat.value}</span>
              </div>
              <stat.icon className="h-5 w-5 text-slate-400 shrink-0" />
            </div>
          ))}
        </div>

        {/* Search and Quick Filters */}
        <div className="bg-white dark:bg-card border border-slate-200/70 dark:border-border rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search complaint, resident, or ID..."
              className="pl-9 h-9 bg-slate-50/60 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-xs font-normal focus:bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36 bg-slate-50/60 dark:bg-muted/10 border-slate-200 text-xs font-medium rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200">
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-9 w-36 bg-slate-50/60 dark:bg-muted/10 border-slate-200 text-xs font-medium rounded-xl">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200">
                <SelectItem value="All">All Priorities</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Complaint Cards */}
        <div className="space-y-3">
          {filteredComplaints.length > 0 ? (
            filteredComplaints.map((complaint) => (
              <Dialog key={complaint.id}>
                <div className="bg-white dark:bg-card border border-slate-200/70 dark:border-border rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-muted/20 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare className="h-4 w-4 text-slate-500" />
                    </div>

                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-foreground truncate">
                          {complaint.title}
                        </h4>
                        <Badge variant="outline" className={`${getStatusBadge(complaint.status)} text-[10px] font-medium px-2 py-0.5 rounded-md`}>
                          {complaint.status}
                        </Badge>
                        <Badge variant="outline" className={`${getPriorityBadge(complaint.priority)} text-[10px] font-medium px-2 py-0.5 rounded-md`}>
                          {complaint.priority}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-1 font-normal">
                        {complaint.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-medium pt-0.5">
                        <span>Resident: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{complaint.User_Complaint_userIdToUser?.name || "Resident"}</strong></span>
                        <span>•</span>
                        <span>{format(new Date(complaint.createdAt), "MMM dd, yyyy")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-none border-slate-100 w-full sm:w-auto justify-between sm:justify-end">
                    <Select
                      value={complaint.status}
                      onValueChange={(val) => {
                        updateMutation.mutate(
                          { id: complaint.id, status: val },
                          { onSuccess: () => toast.success(`Status updated to ${val}`) }
                        );
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs font-medium bg-slate-50 border-slate-200 rounded-lg w-28">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 text-xs">
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>

                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 text-xs font-medium rounded-lg border-slate-200 gap-1">
                        <span>Details</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                  </div>
                </div>

                <ComplaintDetailDialog
                  complaint={complaint}
                  staffMembers={staffMembers}
                  updateMutation={updateMutation}
                  addCommentMutation={addCommentMutation}
                  user={user}
                />
              </Dialog>
            ))
          ) : (
            <EmptyState
              icon={Search}
              title="No Complaints Found"
              description="No grievance tickets match your query."
              containerClassName="bg-white dark:bg-card border border-slate-200/70 dark:border-border rounded-2xl p-12 text-center shadow-xs"
              iconWrapperClassName="bg-slate-50 dark:bg-muted/10 border-slate-200 dark:border-border"
              iconClassName="text-slate-400"
              actionSlot={
                <Button
                  variant="outline"
                  className="rounded-xl h-9 px-4 font-medium text-xs border-slate-200 hover:bg-slate-100"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("All");
                    setPriorityFilter("All");
                  }}
                >
                  Reset Filters
                </Button>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default WardenComplaintsPage;
