"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Send,
  Smartphone,
  History,
  Users,
  Building2,
  Search,
  X,
  Loader2,
  Calendar,
  CheckCircle,
  Globe,
  Clock,
  User,
  Filter,
  FileText,
  CreditCard,
  AlertCircle,
  Sparkles,
  Link2,
  Trash2,
  ArrowRight,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useHostel, useHostelById } from "@/hooks/usehostel";
import { useAllUsers } from "@/hooks/useUsers";
import useAuthStore from "@/hooks/Authstate";
import { format, formatDistanceToNow } from "date-fns";

const QUICK_TEMPLATES = [
  {
    label: "📢 General",
    title: "General Announcement",
    body: "Please check the notice board for important updates regarding hostel operations."
  },
  {
    label: "💧 Water Outage",
    title: "⚠️ Water Supply Interruption",
    body: "Water supply will be suspended on [Date] from [Start] to [End] for maintenance."
  },
  {
    label: "🔌 Power Outage",
    title: "⚡ Power Outage Alert",
    body: "Power supply will be suspended on [Date] from [Start] to [End] for grid maintenance."
  },
  {
    label: "⏰ Mess Timing",
    title: "🍽️ Mess Timings Update",
    body: "Hostel mess timings have been revised. Please check details on the mess page."
  },
  {
    label: "🗣️ Warden Meeting",
    title: "👥 Warden Meeting",
    body: "A house meeting with the Warden is scheduled today at [Time] in the main hall."
  }
];

export default function MobileNotifications() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const isWarden = user?.role === "WARDEN";

  // Composer Form States
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState("all"); // "all", "hostel", "role", "hostel_role", "specific_users"
  const [selectedHostelId, setSelectedHostelId] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]); // List of user objects
  const [searchUserQuery, setSearchUserQuery] = useState("");
  
  // Context Linker States
  const [referenceType, setReferenceType] = useState("none"); // "none", "payment", "complaint"
  const [paymentsList, setPaymentsList] = useState([]);
  const [complaintsList, setComplaintsList] = useState([]);
  const [loadingReferences, setLoadingReferences] = useState(false);
  const [selectedReferenceId, setSelectedReferenceId] = useState("");

  // History logs states
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Log filtering states
  const [searchLogQuery, setSearchLogQuery] = useState("");
  const [filterLogType, setFilterLogType] = useState("all");

  // Queries
  const { data: hostelsData } = useHostel();
  const { data: wardenHostelData } = useHostelById(isWarden ? user?.hostelId : null);

  // Active hostel context
  const activeHostelId = useMemo(() => {
    if (isWarden) return user?.hostelId || "";
    return selectedHostelId;
  }, [isWarden, user?.hostelId, selectedHostelId]);

  // Fetch users for composer target search
  const userFilters = useMemo(() => {
    const filters = {};
    if (isWarden) {
      filters.hostelId = user?.hostelId;
    } else if (selectedHostelId && selectedHostelId !== "all") {
      filters.hostelId = selectedHostelId;
    }
    if (searchUserQuery.trim()) {
      filters.query = searchUserQuery;
    }
    return filters;
  }, [isWarden, user?.hostelId, selectedHostelId, searchUserQuery]);

  const { data: usersData, isLoading: usersLoading } = useAllUsers(userFilters);

  // Fetch History
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/mobile-notifications?page=${page}&limit=10`);
      const resData = await response.json();
      if (resData.success) {
        setHistory(resData.data || []);
        setTotalPages(resData.pagination?.totalPages || 1);
      } else {
        toast.error("Failed to load broadcast logs.");
      }
    } catch (err) {
      toast.error("Error loading broadcast logs.");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page]);

  // Fetch linked resources (payments or complaints)
  useEffect(() => {
    if (referenceType === "none") {
      setSelectedReferenceId("");
      return;
    }
    setLoadingReferences(true);
    setSelectedReferenceId("");
    
    const endpoint = referenceType === "payment" 
      ? `/api/payments?status=PENDING&limit=50` 
      : `/api/complaints`;

    fetch(endpoint)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success || resData.data || resData.payments) {
          if (referenceType === "payment") {
            setPaymentsList(resData.payments || resData.data || []);
          } else {
            const list = resData.data || [];
            setComplaintsList(list.filter(c => c.status !== "RESOLVED"));
          }
        }
      })
      .catch(() => {
        toast.error(`Failed to load linked ${referenceType} options.`);
      })
      .finally(() => setLoadingReferences(false));
  }, [referenceType]);

  // Handle template insertion
  const applyTemplate = (tpl) => {
    setTitle(tpl.title);
    setBody(tpl.body);
    toast.success("Template inserted!");
  };

  // Handle resource mapping
  const handleSelectReference = (refId) => {
    setSelectedReferenceId(refId);
    if (!refId) return;

    if (referenceType === "payment") {
      const p = paymentsList.find((item) => item.id === refId);
      if (!p) return;

      const resident = p.User ? {
        ...p.User,
        id: p.userId
      } : null;
      const month = p.month || "Current Month";
      const amount = p.amount ? p.amount.toLocaleString() : "0";
      const uidInfo = p.uid ? ` (Ref: ${p.uid})` : "";

      setTitle(`⚠️ Payment Due: ${month}`);
      setBody(`Pending invoice${uidInfo} for ${month} of PKR ${amount} is outstanding. Please clear your dues.`);
      
      // Auto-target user
      if (resident) {
        setTargetType("specific_users");
        setSelectedUsers([resident]);
        toast.success(`Context Linked: Recipient auto-targeted: ${resident.name}`);
      }
    } else if (referenceType === "complaint") {
      const c = complaintsList.find((item) => item.id === refId);
      if (!c) return;

      const resident = c.User_Complaint_userIdToUser ? {
        ...c.User_Complaint_userIdToUser,
        id: c.userId || c.User_Complaint_userIdToUser.id
      } : null;
      const cat = c.category || "General";
      const cTitle = c.title || "Complaint Ticket";

      setTitle(`🔧 Complaint Update`);
      setBody(`Update on your complaint [${cat} - "${cTitle}"]: Status is now ${c.status || "PENDING"}.`);

      // Auto-target user
      if (resident) {
        setTargetType("specific_users");
        setSelectedUsers([resident]);
        toast.success(`Context Linked: Recipient auto-targeted: ${resident.name}`);
      }
    }
  };

  // Handle log deletion
  const handleDeleteLog = async (logId) => {
    setDeletingId(logId);
    try {
      const response = await fetch(`/api/mobile-notifications?id=${logId}`, {
        method: "DELETE"
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        toast.success("Broadcast log removed successfully.");
        // If current page list becomes empty and we aren't on page 1, go back a page
        if (history.length === 1 && page > 1) {
          setPage(p => p - 1);
        } else {
          fetchHistory();
        }
      } else {
        toast.error(resData.message || "Failed to remove broadcast log.");
      }
    } catch (err) {
      toast.error("Network error. Could not delete log.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered users for specific user selector
  const availableUsers = useMemo(() => {
    if (!usersData) return [];
    return usersData.filter(
      (u) => !selectedUsers.some((su) => su.id === u.id)
    );
  }, [usersData, selectedUsers]);

  // Estimate targeted recipient device count
  const estimatedDeviceCount = useMemo(() => {
    if (!usersData) return 0;
    
    if (targetType === "specific_users") {
      return selectedUsers.filter((u) => u.pushToken).length;
    }

    let filtered = [...usersData];

    if (targetType === "hostel" || targetType === "hostel_role") {
      if (activeHostelId && activeHostelId !== "all") {
        filtered = filtered.filter(
          (u) => u.hostelId === activeHostelId || u.ResidentProfile?.currentHostelId === activeHostelId
        );
      }
    }

    if (targetType === "role" || targetType === "hostel_role") {
      if (selectedRole && selectedRole !== "all") {
        filtered = filtered.filter((u) => u.role === selectedRole);
      }
    }

    return filtered.filter((u) => u.pushToken || u.id).length;
  }, [usersData, targetType, selectedUsers, selectedRole, activeHostelId]);

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Compose title and body message details first.");
      return;
    }

    if (targetType === "specific_users" && selectedUsers.length === 0) {
      toast.error("Please select at least one recipient user.");
      return;
    }

    setIsSending(true);
    const payload = {
      title,
      body,
      targetType,
      targetHostelId: activeHostelId,
      targetRole: selectedRole,
      userIds: selectedUsers.map((u) => u.id),
    };

    try {
      const response = await fetch("/api/mobile-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        toast.success(resData.message || "Notification sent successfully!");
        setTitle("");
        setBody("");
        setSelectedUsers([]);
        setSearchUserQuery("");
        setReferenceType("none");
        setSelectedReferenceId("");
        setPage(1);
        fetchHistory();
      } else {
        toast.error(resData.message || "Failed to dispatch notification.");
      }
    } catch (err) {
      toast.error("Network error. Could not dispatch notifications.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectUser = (userObj) => {
    setSelectedUsers((prev) => [...prev, userObj]);
    setSearchUserQuery("");
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const getTargetDescription = (item) => {
    const hostelLabel = item.hostel ? item.hostel.name : "All Hostels";
    const roleLabel = item.targetRole ? item.targetRole.replace("_", " ") : "All Roles";

    switch (item.targetType) {
      case "all":
        return isWarden ? `All residents in ${hostelLabel}` : "Global Broadcast";
      case "hostel":
        return `Hostel: ${hostelLabel}`;
      case "role":
        return `Role: ${roleLabel}s`;
      case "hostel_role":
        return `Residents of ${hostelLabel} (${roleLabel}s)`;
      case "specific_users":
        return "Direct Message";
      default:
        return "Custom Filter";
    }
  };

  // Local filtering for history logs
  const filteredHistory = useMemo(() => {
    return history.filter(log => {
      const matchesSearch = 
        log.title?.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
        log.body?.toLowerCase().includes(searchLogQuery.toLowerCase());
      
      const matchesType = filterLogType === "all" || log.targetType === filterLogType;
      
      return matchesSearch && matchesType;
    });
  }, [history, searchLogQuery, filterLogType]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background pb-20 font-sans tracking-tight">
      {/* Sticky Header */}
      <div className="bg-white dark:bg-card border-b sticky top-0 z-50 py-2 md:h-[72px]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="h-9 w-9 md:h-10 md:w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm md:text-lg font-bold text-gray-900 dark:text-foreground tracking-tight uppercase">
                Mobile Push
              </h1>
              <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground">
                Console & Logs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-muted-foreground">
            <span>Logged in as: </span>
            <Badge className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 text-[9px] font-bold uppercase tracking-wider border-none rounded">
              {user?.name} ({user?.role})
            </Badge>
          </div>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Unified Smart Composer */}
          <div className="lg:col-span-5 space-y-6">
            
            <Card className="border border-slate-100 dark:border-border rounded-2xl shadow-sm bg-white dark:bg-card">
              <CardHeader className="py-4 px-6 border-b border-slate-100 dark:border-border/30 flex flex-row items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
                <div className="flex flex-col">
                  <CardTitle className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-foreground">
                    Smart Composer
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Draft, Link, and Dispatch Notifications
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                
                {/* 1. Quick Templates Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-indigo-500" />
                      1. Quick Templates
                    </Label>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50/50 dark:bg-muted/10 border border-slate-100 dark:border-border/30">
                    {QUICK_TEMPLATES.map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applyTemplate(tpl)}
                        className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-lg text-slate-600 dark:text-foreground hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-150 transition-colors"
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Context Linker Selection */}
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                    <Link2 className="h-3 w-3 text-indigo-500" />
                    2. Link Live Context (Optional)
                  </Label>
                  <div className="grid grid-cols-1 gap-2.5">
                    <Select value={referenceType} onValueChange={(val) => {
                      setReferenceType(val);
                      setPaymentsList([]);
                      setComplaintsList([]);
                    }}>
                      <SelectTrigger className="rounded-xl h-10 border-gray-200 dark:border-border text-xs focus:ring-1 focus:ring-indigo-600 font-medium">
                        <SelectValue placeholder="No record linked" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="none" className="text-[11px] font-medium uppercase">No Linked Context</SelectItem>
                        <SelectItem value="payment" className="text-[11px] font-medium uppercase">Pending Payment Invoice</SelectItem>
                        <SelectItem value="complaint" className="text-[11px] font-medium uppercase">Active Resident Complaint</SelectItem>
                      </SelectContent>
                    </Select>

                    {loadingReferences && (
                      <div className="flex items-center gap-2 p-2.5 justify-center border border-dashed border-slate-200 dark:border-border rounded-xl text-xs text-slate-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-650" /> Loading options...
                      </div>
                    )}

                    {referenceType === "payment" && !loadingReferences && (
                      <Select value={selectedReferenceId} onValueChange={handleSelectReference}>
                        <SelectTrigger className="rounded-xl h-10 border-indigo-100 dark:border-border text-xs focus:ring-1 focus:ring-indigo-600 font-medium bg-indigo-50/20">
                          <SelectValue placeholder="Select outstanding invoice to notify" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl max-h-56">
                          {paymentsList.length === 0 ? (
                            <SelectItem value="empty" disabled className="text-[11px] font-medium uppercase">No pending payments found</SelectItem>
                          ) : (
                            paymentsList.map((p) => (
                              <SelectItem key={p.id} value={p.id} className="text-[11px] font-medium">
                                {p.User?.name || "Resident"} - {p.month} ({p.uid || p.id.slice(0,6)}) - PKR {p.amount?.toLocaleString()}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}

                    {referenceType === "complaint" && !loadingReferences && (
                      <Select value={selectedReferenceId} onValueChange={handleSelectReference}>
                        <SelectTrigger className="rounded-xl h-10 border-indigo-100 dark:border-border text-xs focus:ring-1 focus:ring-indigo-600 font-medium bg-indigo-50/20">
                          <SelectValue placeholder="Select ticket to notify updates" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl max-h-56">
                          {complaintsList.length === 0 ? (
                            <SelectItem value="empty" disabled className="text-[11px] font-medium uppercase">No active complaints found</SelectItem>
                          ) : (
                            complaintsList.map((c) => (
                              <SelectItem key={c.id} value={c.id} className="text-[11px] font-medium">
                                {c.User_Complaint_userIdToUser?.name || "Resident"} - [{c.category}] {c.title}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <Separator className="bg-slate-100 dark:bg-border/40" />

                {/* 3. Composer Form */}
                <form onSubmit={handleSendNotification} className="space-y-4">
                  
                  {/* Target Audience */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-indigo-500" />
                      3. Target Audience
                    </Label>
                    <Select value={targetType} onValueChange={(val) => {
                      setTargetType(val);
                      setSelectedUsers([]);
                    }}>
                      <SelectTrigger className="rounded-xl border-gray-200 dark:border-border h-10 font-medium text-xs text-slate-800 dark:text-foreground focus:ring-1 focus:ring-indigo-600">
                        <SelectValue placeholder="Select target filter" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all" className="text-[11px] font-medium uppercase tracking-wider">Broadcast to All Users</SelectItem>
                        {isAdmin && <SelectItem value="hostel" className="text-[11px] font-medium uppercase tracking-wider">Filter by Hostel</SelectItem>}
                        <SelectItem value="role" className="text-[11px] font-medium uppercase tracking-wider">Filter by Role</SelectItem>
                        {isAdmin && <SelectItem value="hostel_role" className="text-[11px] font-medium uppercase tracking-wider">Filter by Hostel & Role</SelectItem>}
                        <SelectItem value="specific_users" className="text-[11px] font-medium uppercase tracking-wider">Select Specific User(s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Hostel Selector (Admin only) */}
                  {isAdmin && (targetType === "hostel" || targetType === "hostel_role") && (
                    <div className="space-y-1.5 animate-fadeIn">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Select Hostel</Label>
                      <Select value={selectedHostelId} onValueChange={setSelectedHostelId}>
                        <SelectTrigger className="rounded-xl h-10 border-gray-200 dark:border-border text-xs focus:ring-1 focus:ring-indigo-600 font-medium text-slate-850">
                          <SelectValue placeholder="Select Hostel" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="all" className="text-[11px] font-medium uppercase">All Hostels</SelectItem>
                          {hostelsData?.data?.map((hostel) => (
                            <SelectItem key={hostel.id} value={hostel.id} className="text-[11px] font-medium uppercase">
                              {hostel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Warden Locked Hostel View */}
                  {isWarden && (targetType === "hostel" || targetType === "hostel_role" || targetType === "all") && (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/35 text-xs">
                      <Building2 className="h-4 w-4 text-indigo-650" />
                      <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Locked Hostel:</span>
                      <span className="font-bold text-indigo-700 dark:text-indigo-400">{wardenHostelData?.data?.name || "Your Assigned Hostel"}</span>
                    </div>
                  )}

                  {/* Role Selector */}
                  {(targetType === "role" || targetType === "hostel_role") && (
                    <div className="space-y-1.5 animate-fadeIn">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Select User Role</Label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="rounded-xl h-10 border-gray-200 dark:border-border text-xs focus:ring-1 focus:ring-indigo-600 font-medium">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="all" className="text-[11px] font-medium uppercase">All Roles</SelectItem>
                          <SelectItem value="RESIDENT" className="text-[11px] font-medium uppercase">Residents</SelectItem>
                          <SelectItem value="WARDEN" className="text-[11px] font-medium uppercase">Wardens</SelectItem>
                          <SelectItem value="STAFF" className="text-[11px] font-medium uppercase">Staff Members</SelectItem>
                          <SelectItem value="ADMIN" className="text-[11px] font-medium uppercase">Admins</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Specific User Multi Selector */}
                  {targetType === "specific_users" && (
                    <div className="space-y-3 animate-fadeIn">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Search & Select Users</Label>
                      <div className="relative">
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Type name, email..."
                          value={searchUserQuery}
                          onChange={(e) => setSearchUserQuery(e.target.value)}
                          className="pl-10 rounded-xl h-10 border-gray-200 dark:border-border text-xs focus:ring-1 focus:ring-indigo-600"
                        />
                      </div>

                      {searchUserQuery.trim() && (
                        <div className="border border-slate-100 dark:border-border rounded-xl bg-white dark:bg-card shadow-lg max-h-40 overflow-y-auto z-20 relative p-1 divide-y divide-slate-50 dark:divide-border/40">
                          {usersLoading ? (
                            <div className="p-3 text-xs text-slate-400 flex items-center justify-center gap-2">
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" /> Querying...
                            </div>
                          ) : availableUsers.length === 0 ? (
                            <div className="p-3 text-xs text-slate-450 text-center">No matching records.</div>
                          ) : (
                            availableUsers.map((userObj) => (
                              <button
                                key={userObj.id}
                                type="button"
                                onClick={() => handleSelectUser(userObj)}
                                className="w-full text-left p-2.5 hover:bg-slate-50 dark:hover:bg-muted/50 rounded-lg flex items-center justify-between text-xs transition-colors"
                              >
                                <div>
                                  <span className="font-semibold text-slate-800 dark:text-foreground">{userObj.name}</span>
                                  <span className="text-slate-400 dark:text-muted-foreground ml-2">({userObj.email})</span>
                                </div>
                                <Badge className="bg-slate-100 dark:bg-muted text-slate-650 dark:text-foreground text-[9px] px-1.5 py-0.5 border-none font-bold uppercase tracking-wider">{userObj.role}</Badge>
                              </button>
                            ))
                          )}
                        </div>
                      )}

                      {selectedUsers.length > 0 && (
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Recipients Selection ({selectedUsers.length})</Label>
                          <div className="flex flex-wrap gap-2 p-3 bg-slate-50/50 dark:bg-muted/20 border border-slate-100 dark:border-border/30 rounded-xl max-h-24 overflow-y-auto">
                            {selectedUsers.map((u) => (
                              <Badge
                                key={u.id}
                                className="bg-white dark:bg-card border border-slate-200 dark:border-border text-slate-700 dark:text-foreground hover:bg-slate-50 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                              >
                                <span>{u.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveUser(u.id)}
                                  className="text-slate-400 hover:text-indigo-650 rounded p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Title & Body */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-slate-500">4. Message Details</Label>
                      <Input
                        id="title"
                        type="text"
                        placeholder="Alert Title"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="rounded-xl h-10 border-gray-200 dark:border-border text-xs focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Textarea
                        id="body"
                        rows={4}
                        placeholder="Notification Content"
                        required
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="rounded-xl border-gray-200 dark:border-border text-xs py-2 px-3 focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 leading-relaxed font-medium"
                      />
                    </div>
                  </div>

                  {/* Estimated recipients check */}
                  <div className="p-3 bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/40 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500 uppercase tracking-widest text-[9px]">Targeted Recipients:</span>
                    <span className="font-extrabold text-indigo-700 dark:text-indigo-400">{estimatedDeviceCount} user(s)</span>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSending}
                    className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 cursor-pointer animate-pulse-subtle"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 mr-1" /> Dispatch Notification
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Filterable Scrollable Broadcast Logs */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Header controls pane */}
            <Card className="border border-slate-100 dark:border-border rounded-2xl shadow-sm bg-white dark:bg-card p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-indigo-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-foreground">
                    Broadcast logs ledger
                  </h2>
                </div>
                
                {/* Internal log search and category filters */}
                <div className="flex items-center gap-2 flex-1 md:justify-end">
                  <div className="relative max-w-44 flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search logs..."
                      value={searchLogQuery}
                      onChange={(e) => setSearchLogQuery(e.target.value)}
                      className="pl-8 rounded-lg h-8 border-gray-200 dark:border-border text-[11px]"
                    />
                  </div>
                  <Select value={filterLogType} onValueChange={setFilterLogType}>
                    <SelectTrigger className="rounded-lg border-gray-200 dark:border-border h-8 font-medium text-[11px] max-w-32">
                      <SelectValue placeholder="All Targets" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="all" className="text-[11px] font-medium uppercase">All Targets</SelectItem>
                      <SelectItem value="all" className="text-[11px] font-medium uppercase">Broadcasts</SelectItem>
                      <SelectItem value="role" className="text-[11px] font-medium uppercase">Role Specific</SelectItem>
                      {isAdmin && <SelectItem value="hostel" className="text-[11px] font-medium uppercase">Hostel Specific</SelectItem>}
                      <SelectItem value="specific_users" className="text-[11px] font-medium uppercase">Direct Messages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {historyLoading ? (
              <div className="flex flex-col items-center justify-center py-28 gap-3 bg-white dark:bg-card border border-slate-100 dark:border-border rounded-2xl shadow-sm">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading history logs...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="bg-white dark:bg-card border border-dashed border-slate-200 dark:border-border rounded-2xl p-24 text-center shadow-sm">
                <Smartphone className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-foreground uppercase">
                  No notifications match criteria
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Alert logs dispatched through the console will be listed here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* SCROLLABLE INNER BOX REQUESTED BY THE USER */}
                <div className="max-h-[640px] overflow-y-auto pr-1 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  {filteredHistory.map((log) => (
                    <div
                      key={log.id}
                      className="group relative bg-white dark:bg-card border border-slate-100 dark:border-border rounded-2xl p-5 hover:shadow-md transition-all duration-300 hover:border-slate-200 flex items-start gap-4"
                    >
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0 text-indigo-650 dark:text-indigo-400">
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        
                        {/* Upper Badges */}
                        <div className="flex items-center flex-wrap gap-2 mb-1.5">
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
                            {getTargetDescription(log)}
                          </span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {log.targetType}
                          </span>
                        </div>

                        {/* Title & Body */}
                        <h3 className="text-sm font-bold text-slate-900 dark:text-foreground tracking-tight leading-snug">
                          {log.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-muted-foreground mt-1.5 leading-relaxed">
                          {log.body}
                        </p>

                        {/* Footer details */}
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-3.5 text-[10px] text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            By: <strong className="text-slate-650 dark:text-slate-400">{log.sentBy?.name || "System"} ({log.sentBy?.role})</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-indigo-650">
                            <Users className="h-3 w-3" />
                            Delivered: {log.recipientCount} device(s)
                          </span>
                        </div>

                      </div>

                      {/* TRASH CAN DELETE BUTTON REQUESTED BY THE USER */}
                      <div className="absolute top-4 right-4">
                        {deletingId === log.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteLog(log.id)}
                            className="text-slate-300 hover:text-red-650 transition-colors p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer"
                            title="Delete Broadcast Log"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-border/30 text-xs">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="rounded-xl text-[10px] uppercase font-bold tracking-wider h-9 px-3 border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer"
                    >
                      Previous
                    </Button>
                    <span className="text-slate-450 font-bold uppercase tracking-widest text-[10px]">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-xl text-[10px] uppercase font-bold tracking-wider h-9 px-3 border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
