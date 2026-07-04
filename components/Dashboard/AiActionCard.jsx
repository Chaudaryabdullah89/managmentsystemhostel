"use client";

import React, { useState } from "react";
import {
  Utensils,
  CreditCard,
  AlertCircle,
  Bed,
  TrendingUp,
  Clock,
  ArrowRight,
  PhoneCall,
  MessageCircle,
  UserCheck,
  ThumbsUp,
  Wrench,
  Wifi,
  Zap,
  Droplets,
  Sparkles,
  Send,
  Download,
  FileText,
  Grid,
  CheckCircle2,
  Wind,
  ShieldCheck,
  Calendar,
  Layers,
  Phone,
  BellRing,
  Sun,
  Moon,
  Coffee,
  Users
} from "lucide-react";
import Link from "next/link";

export default function AiActionCard({ cardType, cardData, onAction }) {
  const [customCategory, setCustomCategory] = useState("ELECTRICAL");
  const [customUrgency, setCustomUrgency] = useState("NORMAL");
  const [customText, setCustomText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!cardType || !cardData) return null;

  switch (cardType) {
    case "HELP_HUB_CARD": {
      const hubCategories = [
        {
          category: "Financial & Room Essentials",
          items: [
            {
              title: "Mess Menu",
              desc: "Meals & Timings",
              icon: Utensils,
              action: "Today's Mess Menu",
            },
            {
              title: "Last Receipt",
              desc: "Download Voucher",
              icon: Download,
              action: "Download last receipt",
            },
            {
              title: "Rent Balance",
              desc: "Dues & Payments",
              icon: CreditCard,
              action: "Check Rent Balance",
            },
            {
              title: "My Room",
              desc: "Beds & Roommates",
              icon: Bed,
              action: "My room info",
            },
          ]
        },
        {
          category: "Support & Housekeeping",
          items: [
            {
              title: "File Ticket",
              desc: "Log Complaint",
              icon: AlertCircle,
              action: "File a complaint",
            },
            {
              title: "Manager Contact",
              desc: "Phone & WhatsApp",
              icon: PhoneCall,
              action: "Manager contact",
            },
            {
              title: "Housekeeping",
              desc: "Room Cleaning",
              icon: Sparkles,
              action: "Check cleaning log",
            },
            {
              title: "Laundry Log",
              desc: "Wash Cycle Status",
              icon: Wind,
              action: "Check laundry status",
            },
          ]
        },
        {
          category: "Passes & Quick Tools",
          items: [
            {
              title: "Gate Pass / Leave",
              desc: "Apply Leave",
              icon: Calendar,
              action: "How to apply leave",
            },
            {
              title: "Room Swap",
              desc: "Switch Room",
              icon: ArrowRight,
              action: "How to swap room",
            },
            {
              title: "Announcements",
              desc: "Hostel Notices",
              icon: BellRing,
              action: "Show hostel notices",
            },
            {
              title: "Emergency Alert",
              desc: "Urgent Call Desk",
              icon: ShieldCheck,
              action: "Emergency help",
            },
          ]
        }
      ];

      return (
        <div className="mt-3 p-4 bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 rounded-2xl border border-indigo-100 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Grid className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[12px] font-black uppercase tracking-wider text-indigo-950">
                  Quick Services Hub
                </h4>
                <span className="text-[9.5px] font-semibold text-indigo-600">
                  Select any service to execute instantly:
                </span>
              </div>
            </div>
            <span className="text-[9px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md uppercase">
              12 Services
            </span>
          </div>

          <div className="space-y-3">
            {hubCategories.map((catGroup, idx) => (
              <div key={idx} className="space-y-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">
                  {catGroup.category}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {catGroup.items.map((opt, iIdx) => {
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={iIdx}
                        type="button"
                        onClick={() => onAction && onAction(opt.action)}
                        className="p-2.5 bg-white hover:bg-indigo-50/80 rounded-xl border border-slate-200/80 hover:border-indigo-300 transition-all text-left flex items-start gap-2.5 group cursor-pointer shadow-2xs"
                      >
                        <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <div className="overflow-hidden">
                          <h5 className="text-[11px] font-bold text-slate-900 leading-tight group-hover:text-indigo-900">
                            {opt.title}
                          </h5>
                          <span className="text-[9px] font-medium text-slate-500 truncate block mt-0.5">
                            {opt.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "MESS_CARD": {
      const menuList = cardData?.menu || [];
      const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
      const todayMenu = menuList.find(m => m.dayOfWeek?.toUpperCase() === todayName) || menuList[0];

      return (
        <div className="mt-3 p-4 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-slate-50 rounded-2xl border border-amber-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Utensils className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-[12px] font-black uppercase tracking-wider text-slate-900">
                  Hostel Mess Menu Schedule
                </h4>
                <span className="text-[9.5px] font-semibold text-amber-700">
                  Today's Meals ({todayMenu?.dayOfWeek || "Today"})
                </span>
              </div>
            </div>
            <Link
              href="/guest/mess"
              className="px-2.5 py-1 text-[9px] font-extrabold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-2xs uppercase tracking-wider transition-all"
            >
              Full Menu
            </Link>
          </div>

          {todayMenu ? (
            <div className="space-y-2">
              <div className="bg-white p-3 rounded-xl border border-amber-100 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-[10px] font-black text-slate-900 uppercase">Breakfast</span>
                  </div>
                  <span className="text-[8.5px] font-bold text-slate-400">{todayMenu.breakfastTime}</span>
                </div>
                <p className="text-[11px] font-semibold text-slate-800 bg-amber-50/60 p-2 rounded-lg border border-amber-100/60">
                  {todayMenu.breakfast}
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-100 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[10px] font-black text-slate-900 uppercase">Lunch</span>
                  </div>
                  <span className="text-[8.5px] font-bold text-slate-400">{todayMenu.lunchTime}</span>
                </div>
                <p className="text-[11px] font-semibold text-slate-800 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100/60">
                  {todayMenu.lunch}
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-100 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-[10px] font-black text-slate-900 uppercase">Dinner</span>
                  </div>
                  <span className="text-[8.5px] font-bold text-slate-400">{todayMenu.dinnerTime}</span>
                </div>
                <p className="text-[11px] font-semibold text-slate-800 bg-indigo-50/60 p-2 rounded-lg border border-indigo-100/60">
                  {todayMenu.dinner}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              No mess menu defined for today
            </div>
          )}
        </div>
      );
    }

    case "ROOM_CARD": {
      const room = cardData;
      if (!room) return null;

      return (
        <div className="mt-3 p-4 bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 rounded-2xl border border-indigo-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Bed className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-[12px] font-black uppercase tracking-wider text-slate-900">
                  Assigned Room Details
                </h4>
                <span className="text-[9.5px] font-semibold text-indigo-600">
                  {room.hostelName || "Hostel Room"}
                </span>
              </div>
            </div>
            <Link
              href="/guest/my-room"
              className="px-2.5 py-1 text-[9px] font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs uppercase tracking-wider transition-all"
            >
              Manage Room
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Room Number</span>
              <span className="text-sm font-black text-slate-900">{room.roomNumber || "N/A"}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Floor</span>
              <span className="text-xs font-bold text-slate-800">Floor {room.floor || "1"}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Room Type</span>
              <span className="text-xs font-bold text-slate-800">{room.type || "Double"}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Bed Number</span>
              <span className="text-xs font-bold text-slate-800">Bed #{room.bedNumber || "1"}</span>
            </div>
          </div>

          {room.roommates?.length > 0 && (
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[10px] font-black text-slate-900 uppercase">Roommates</span>
              </div>
              <div className="space-y-1">
                {room.roommates.map((rm, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px] font-semibold text-slate-700 border-b border-slate-100 last:border-0 pb-1">
                    <span>{rm.name}</span>
                    <span className="text-[9.5px] font-bold text-slate-400">{rm.phone || "No contact"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    case "PAYMENT_CARD": {
      const { totalPending, pendingCount, pendingList } = cardData;
      return (
        <div className="mt-3 p-4 bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-slate-50 rounded-2xl border border-emerald-200/70 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-[12px] font-black uppercase tracking-wider text-emerald-950">
                  Rent & Dues Overview
                </h4>
                <span className="text-[9.5px] font-semibold text-emerald-700">
                  {pendingCount > 0 ? `${pendingCount} Unpaid Bill(s)` : "Account Up To Date"}
                </span>
              </div>
            </div>
            <Link
              href="/guest/payments"
              className="px-2.5 py-1 text-[9px] font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs uppercase tracking-wider transition-all"
            >
              Pay Dues
            </Link>
          </div>

          <div className="bg-white p-3 rounded-xl border border-emerald-100 flex justify-between items-center">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Outstanding Balance</span>
              <span className="text-base font-black text-emerald-700">PKR {totalPending?.toLocaleString() || 0}</span>
            </div>
            <span className={`px-2 py-1 text-[9px] font-extrabold rounded-md uppercase border ${
              pendingCount > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}>
              {pendingCount > 0 ? "Pending Dues" : "Paid"}
            </span>
          </div>

          {pendingList?.length > 0 && (
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar">
              {pendingList.map((p, idx) => (
                <div key={p.id || idx} className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-extrabold text-slate-900 block">{p.month ? `${p.month} Rent` : "Hostel Fee"}</span>
                    <span className="text-[9px] text-slate-400 font-semibold">Due: {p.dueDate ? new Date(p.dueDate).toLocaleDateString() : 'End of Month'}</span>
                  </div>
                  <span className="font-black text-slate-900">PKR {p.amount?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    case "RECEIPT_CARD": {
      const { receipt, hasReceipt, message } = cardData;
      if (!receipt) return null;

      return (
        <div className="mt-3 p-4 bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-slate-50 rounded-2xl border border-emerald-200/70 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[12px] font-black uppercase tracking-wider text-emerald-950">
                  {hasReceipt ? "Payment Receipt Voucher" : "Latest Payment Record"}
                </h4>
                <span className="text-[9.5px] font-semibold text-emerald-700">
                  #{receipt.uid || receipt.id?.slice(-6).toUpperCase()}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[8.5px] font-extrabold bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200 uppercase">
              {receipt.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-emerald-100 text-xs">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Amount</span>
              <span className="text-sm font-black text-emerald-700">PKR {receipt.amount?.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Method</span>
              <span className="text-xs font-bold text-slate-800">{receipt.method?.replace('_', ' ') || 'Direct Transfer'}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Date</span>
              <span className="text-xs font-bold text-slate-800">{receipt.date ? new Date(receipt.date).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Payment Type</span>
              <span className="text-xs font-bold text-slate-800">{receipt.month ? `${receipt.month} Rent` : 'Room Fee'}</span>
            </div>
          </div>

          {receipt.id && (
            <a
              href={`/api/payments/${receipt.id}/receipt`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Download className="w-4 h-4" /> Download PDF Receipt Voucher
            </a>
          )}
        </div>
      );
    }

    case "COMPLAINT_BUILDER": {
      return (
        <div className="mt-3 p-4 bg-gradient-to-br from-indigo-50/90 via-slate-50 to-rose-50/40 rounded-2xl border border-indigo-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
            <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[12px] font-black uppercase tracking-wider text-slate-900">
                Log Maintenance Ticket
              </h4>
              <span className="text-[9.5px] font-semibold text-slate-500">
                Select category and describe the problem:
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "ELECTRICAL", label: "Electrical" },
                { id: "PLUMBING", label: "Plumbing" },
                { id: "INTERNET", label: "WiFi / Net" },
                { id: "CLEANLINESS", label: "Housekeeping" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCustomCategory(cat.id)}
                  className={`py-1.5 px-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                    customCategory === cat.id
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Describe what needs repair..."
              className="w-full min-h-[60px] p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
            />

            <button
              type="button"
              disabled={isSubmitting || !customText.trim()}
              onClick={() => {
                if (onAction) {
                  onAction(`File complaint for ${customCategory}: ${customText}`);
                  setCustomText("");
                }
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Submit Ticket Now
            </button>
          </div>
        </div>
      );
    }

    case "COMPLAINT_CARD": {
      const cmp = cardData;
      if (!cmp) return null;
      return (
        <div className="mt-3 p-4 bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 rounded-2xl border border-indigo-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[12px] font-black uppercase tracking-wider text-slate-900">
                  Ticket Created #{cmp.uid || cmp.id?.slice(-6).toUpperCase()}
                </h4>
                <span className="text-[9.5px] font-semibold text-indigo-600">
                  Category: {cmp.category || "General"}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[8.5px] font-extrabold bg-indigo-100 text-indigo-800 rounded-md border border-indigo-200 uppercase">
              {cmp.status || "PENDING"}
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Description</span>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">{cmp.description}</p>
          </div>
        </div>
      );
    }

    case "COMPLAINT_LIST_CARD": {
      const complaints = cardData?.complaints || [];
      return (
        <div className="mt-3 p-4 bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 rounded-2xl border border-indigo-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-[12px] font-black uppercase tracking-wider text-slate-900">
                  Your Maintenance Tickets
                </h4>
                <span className="text-[9.5px] font-semibold text-indigo-600">
                  Active & past complaints status:
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[8.5px] font-extrabold bg-indigo-100 text-indigo-800 rounded-md border border-indigo-200 uppercase">
              {complaints.length} Ticket{complaints.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
            {complaints.length > 0 ? (
              complaints.map((c, idx) => {
                let statusStyle = "bg-indigo-50 text-indigo-700 border-indigo-200";
                if (c.status === "RESOLVED" || c.status === "CLOSED") {
                  statusStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
                } else if (c.status === "IN_PROGRESS") {
                  statusStyle = "bg-amber-50 text-amber-700 border-amber-200";
                }

                return (
                  <div key={c.id || idx} className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-slate-900">
                          #{c.uid || (c.id ? c.id.slice(-6).toUpperCase() : `CMP-${idx+1}`)}
                        </span>
                        <span className="px-1.5 py-0.5 text-[8.5px] font-extrabold bg-slate-100 text-slate-700 rounded uppercase">
                          {c.category || "General"}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 text-[8.5px] font-black rounded border uppercase ${statusStyle}`}>
                        {c.status || "PENDING"}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-700 font-semibold leading-relaxed">
                      {c.description || c.title}
                    </p>
                    <span className="text-[8.5px] font-medium text-slate-400 block text-right">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recently'}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                No active maintenance tickets found
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onAction && onAction("File a complaint")}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Wrench className="w-3.5 h-3.5" /> Log New Ticket
          </button>
        </div>
      );
    }

    case "NOTICE_CARD": {
      const notices = cardData?.notices || [];
      return (
        <div className="mt-3 p-4 bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 rounded-2xl border border-indigo-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <BellRing className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-[12px] font-black uppercase tracking-wider text-slate-900">
                  Hostel Bulletins & Announcements
                </h4>
                <span className="text-[9.5px] font-semibold text-indigo-600">
                  Latest updates posted by management:
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[8.5px] font-extrabold bg-indigo-100 text-indigo-800 rounded-md border border-indigo-200 uppercase">
              {notices.length} Notice{notices.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
            {notices.length > 0 ? (
              notices.map((n, idx) => (
                <div key={n.id || idx} className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[8.5px] font-black bg-indigo-50 text-indigo-700 rounded border border-indigo-200/60 uppercase">
                      {n.category || "General Announcement"}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400">
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today'}
                    </span>
                  </div>
                  <h5 className="text-[11.5px] font-black text-slate-900 leading-snug">
                    {n.title}
                  </h5>
                  <p className="text-[10.5px] text-slate-600 font-medium leading-relaxed">
                    {n.content || n.description || n.message}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                No active announcements at the moment
              </div>
            )}
          </div>
        </div>
      );
    }

    case "MANAGEMENT_CARD": {
      const manager = cardData?.manager || {};
      const hostelName = cardData?.hostelName || "Hostel Office Desk";
      return (
        <div className="mt-3 p-4 bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 rounded-2xl border border-indigo-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <PhoneCall className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-[12px] font-black uppercase tracking-wider text-slate-900">
                  Manager & Office Contact
                </h4>
                <span className="text-[9.5px] font-semibold text-indigo-600">
                  {hostelName}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[8.5px] font-extrabold bg-indigo-100 text-indigo-800 rounded-md border border-indigo-200 uppercase">
              {manager.role || "WARDEN"}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Manager Name</span>
              <span className="text-xs font-extrabold text-slate-900">{manager.name || "Hostel Admin"}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Phone / Helpline</span>
              <span className="text-xs font-extrabold text-indigo-600">{manager.phone || "+92 300 1234567"}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Office Hours</span>
              <span className="text-[11px] font-bold text-slate-700">{manager.officeHours || "8:00 AM - 10:00 PM"}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${manager.phone || "+923001234567"}`}
              className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" /> Call Office
            </a>
            <a
              href={manager.whatsappUrl || `https://wa.me/${(manager.phone || "923001234567").replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
          </div>
        </div>
      );
    }

    default:
      return null;
  }

  // =========================================================================
  // TICKET_UPDATE_CARD — Phase 5: Follow-Up Ticket Status Timeline
  // =========================================================================
  if (cardType === "TICKET_UPDATE_CARD") {
    const { complaint, statusEmoji, statusLabel } = cardData || {};
    if (!complaint) return null;

    const statusSteps = ["PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    const currentIdx = statusSteps.indexOf(complaint.status);
    const stepColors = {
      PENDING: "bg-amber-500",
      IN_PROGRESS: "bg-blue-500",
      RESOLVED: "bg-emerald-500",
      CLOSED: "bg-gray-400"
    };

    return (
      <div className="mt-3 rounded-2xl border border-indigo-50 bg-gradient-to-br from-slate-50 to-indigo-50/30 overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-white" />
          <span className="text-xs font-black text-white uppercase tracking-wider">Ticket Status Tracker</span>
        </div>
        <div className="p-4 space-y-3">
          {/* Ticket info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Ticket ID</p>
              <p className="text-xs font-black text-indigo-700">#{complaint.uid || complaint.id?.slice(-6).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Category</p>
              <p className="text-xs font-bold text-slate-700">{complaint.category}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Priority</p>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                complaint.priority === "HIGH" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
              }`}>{complaint.priority}</span>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="relative">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-3 left-0 right-0 h-0.5 bg-slate-200 -z-0" />
              {statusSteps.map((step, idx) => (
                <div key={step} className="flex flex-col items-center gap-1 z-10">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white text-[8px] font-black border-2 ${
                    idx <= currentIdx ? `${stepColors[step] || "bg-indigo-500"} border-white shadow` : "bg-white border-slate-200 text-slate-300"
                  }`}>
                    {idx < currentIdx ? "✓" : idx === currentIdx ? "●" : "○"}
                  </div>
                  <span className={`text-[8px] font-bold ${idx <= currentIdx ? "text-slate-700" : "text-slate-300"}`}>
                    {step === "IN_PROGRESS" ? "IN PROG" : step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {complaint.resolutionNotes && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <p className="text-[10px] font-black text-emerald-700 uppercase mb-1">Resolution Notes</p>
              <p className="text-[11px] text-emerald-800">{complaint.resolutionNotes}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => onAction?.("Check all my complaints")}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase rounded-xl transition-all"
            >
              All Tickets
            </button>
            <button
              onClick={() => onAction?.("File new complaint")}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase rounded-xl transition-all"
            >
              New Ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ANALYTICS_CARD — Phase 9: Admin Analytics Dashboard Card
  // =========================================================================
  if (cardType === "ANALYTICS_CARD") {
    const d = cardData || {};
    return (
      <div className="mt-3 rounded-2xl border border-indigo-50 bg-gradient-to-br from-slate-50 to-blue-50/30 overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-white" />
          <span className="text-xs font-black text-white uppercase tracking-wider">Executive Analytics</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white border border-indigo-100 rounded-xl p-3 text-center">
              <p className="text-[9px] font-bold text-slate-500 uppercase">Occupancy</p>
              <p className="text-xl font-black text-indigo-700">{d.occupancyRate || 0}%</p>
              <p className="text-[9px] text-slate-400">{d.occupiedRooms}/{d.totalRooms} rooms</p>
            </div>
            <div className="bg-white border border-emerald-100 rounded-xl p-3 text-center">
              <p className="text-[9px] font-bold text-slate-500 uppercase">Revenue</p>
              <p className="text-sm font-black text-emerald-700">PKR {(d.totalRevenuePaid || 0).toLocaleString()}</p>
              <p className="text-[9px] text-slate-400">All time collected</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white border border-amber-100 rounded-xl p-3 text-center">
              <p className="text-[9px] font-bold text-slate-500 uppercase">Active Tickets</p>
              <p className="text-xl font-black text-amber-700">{d.activeComplaints || 0}</p>
              <p className="text-[9px] text-slate-400">Pending + In Progress</p>
            </div>
            <div className="bg-white border border-rose-100 rounded-xl p-3 text-center">
              <p className="text-[9px] font-bold text-slate-500 uppercase">Pending Exp.</p>
              <p className="text-xl font-black text-rose-700">{d.pendingExpenses || 0}</p>
              <p className="text-[9px] text-slate-400">Awaiting approval</p>
            </div>
          </div>
          {d.complaintsByCategory && d.complaintsByCategory.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-xl p-3">
              <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">Top Complaint Categories</p>
              {d.complaintsByCategory.map((cat, i) => (
                <div key={i} className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-600">{cat.category}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 bg-indigo-200 rounded-full w-16 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${Math.min(100, (cat.count / (d.complaintsByCategory[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-indigo-700">{cat.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => onAction?.("Show detailed analytics report")}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" /> Full Analytics Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
}
