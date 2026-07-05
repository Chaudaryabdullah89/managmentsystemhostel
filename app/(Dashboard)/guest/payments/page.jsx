"use client";

import React, { useState, useMemo } from "react";
import {
  CreditCard,
  ShieldCheck,
  Download,
  History,
  Wallet,
  FileText,
  AlertCircle,
  Undo2,
  Bell,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuthStore from "@/hooks/Authstate";
import { useAllPayments } from "@/hooks/usePayment";
import { useBookings } from "@/hooks/useBooking";
import { format } from "date-fns";
import PaymentNotificationModal from "../bookings/PaymentNotificationModal";
import UnifiedReceipt from "@/components/receipt/UnifiedReceipt";
import RefundRequestModal from "./RefundRequestModal";
import OneBillPaymentModal from "./OneBillPaymentModal";
import EmptyState from "@/components/ui/states/EmptyState";
import ErrorState from "@/components/ui/states/ErrorState";
import { ListPageSkeleton } from "@/components/ui/skeletons";

const PaymentStatusBadge = ({ status, hasReceipt }) => {
  const getStyle = (s) => {
    switch (s) {
      case "PAID":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      case "PENDING":
        return hasReceipt
          ? "bg-indigo-50 text-indigo-700 border-indigo-200/80"
          : "bg-amber-50 text-amber-700 border-amber-200/80";
      case "REFUNDED":
        return "bg-blue-50 text-blue-700 border-blue-200/80";
      case "REJECTED":
        return "bg-rose-50 text-rose-700 border-rose-200/80";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200/80";
    }
  };
  const getLabel = (s) => {
    if (s === "PAID") return "Verified ✓";
    if (s === "PENDING") return hasReceipt ? "Under Review ⚙️" : "Unpaid";
    if (s === "REFUNDED") return "Refunded";
    return s;
  };
  return (
    <Badge
      variant="outline"
      className={`${getStyle(status)} px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border rounded-lg flex items-center gap-1`}
    >
      {hasReceipt && status === "PENDING" && (
        <Bell className="h-3 w-3 text-indigo-600" />
      )}
      {getLabel(status)}
    </Badge>
  );
};

const GuestPayments = () => {
  const user = useAuthStore((state) => state.user);
  const [filter, setFilter] = useState("all");

  const {
    data: bookings = [],
    isLoading: isBookingsLoading,
    isError: isBookingsError,
    refetch: refetchBookings,
  } = useBookings({ userId: user?.id });
  const {
    data: paymentsData,
    isLoading: isPaymentsLoading,
    isError: isPaymentsError,
    refetch: refetchPayments,
  } = useAllPayments({ userId: user?.id, limit: 100 });

  const isCheckedOut =
    bookings.length > 0 &&
    bookings.some((b) => b.status === "CHECKED_OUT") &&
    !bookings.some((b) =>
      ["CONFIRMED", "CHECKED_IN", "Active"].includes(b.status),
    );

  const activeBooking =
    bookings?.find((b) =>
      ["CONFIRMED", "CHECKED_IN", "Active"].includes(b.status),
    ) || bookings?.[0];
  const payments = paymentsData?.payments || [];

  const bookingWithPayments = useMemo(() => {
    if (!activeBooking) return null;
    return { ...activeBooking, Payment: payments };
  }, [activeBooking, payments]);

  const stats = useMemo(() => {
    const voidedStatuses = ["REJECTED", "FAILED", "REFUNDED"];
    const activePayments = payments.filter(
      (p) => !voidedStatuses.includes(p.status) && p.type !== "SECURITY_REFUND",
    );
    const total = activePayments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );
    const paid = payments
      .filter((p) => p.status === "PAID" && p.type !== "SECURITY_REFUND")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const refunded = payments
      .filter((p) => p.status === "REFUNDED" || p.type === "SECURITY_REFUND")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pending = payments
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const balance = payments
      .filter(
        (p) =>
          p.status === "PENDING" ||
          p.status === "PARTIAL" ||
          p.status === "OVERDUE",
      )
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return { total, paid, refunded, balance, pending };
  }, [activeBooking, payments]);

  const filteredPayments = useMemo(() => {
    if (filter === "all") return payments;
    if (filter === "refunded")
      return payments.filter(
        (p) => p.status === "REFUNDED" || p.type === "SECURITY_REFUND",
      );
    return payments.filter(
      (p) => p.status.toLowerCase() === filter.toLowerCase(),
    );
  }, [payments, filter]);

  if (isPaymentsLoading || isBookingsLoading) return <ListPageSkeleton />;
  if (isPaymentsError || isBookingsError) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <ErrorState
          title="Unable to load payment ledger"
          description="Your booking or payment records could not be fetched right now."
          onRetry={() => {
            refetchPayments?.();
            refetchBookings?.();
          }}
          retryLabel="Retry"
        />
      </div>
    );
  }

  const canNotify = !!bookingWithPayments && !isCheckedOut;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background pb-20 font-sans tracking-tight print:hidden">
      {/* Top Glassmorphic Header */}
      <header className="bg-white/80 dark:bg-card/80 backdrop-blur-md border-b sticky top-0 z-40 h-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 dark:text-foreground tracking-tight uppercase">
                  {isCheckedOut
                    ? "Archived Financial History"
                    : "Payment Ledger & Dues"}
                </h1>
                <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-[9px] uppercase font-black tracking-wider px-2 py-0.5">
                  Live Ledger
                </Badge>
              </div>
              <p className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
                {isCheckedOut
                  ? "Residency Ended"
                  : "Rent Payments & Security Deposit Tracker"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canNotify && (
              <PaymentNotificationModal booking={bookingWithPayments}>
                <Button
                  size="sm"
                  className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95"
                >
                  <Bell className="h-4 w-4 mr-2" /> Notify Warden
                </Button>
              </PaymentNotificationModal>
            )}
            <UnifiedReceipt data={{ payments, user, ...stats }} type="payment">
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-4 rounded-xl border-slate-200 text-slate-700 dark:text-foreground font-extrabold text-xs uppercase tracking-wider hover:bg-slate-100 transition-all"
              >
                <Download className="h-4 w-4 mr-2" /> Download Statement
              </Button>
            </UnifiedReceipt>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 shadow-2xs border border-slate-200/80 bg-white dark:bg-card rounded-3xl overflow-hidden">
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Total Outstanding Balance
                  </p>
                  <h2 className="text-4xl font-black text-slate-900 dark:text-foreground tracking-tight">
                    PKR {stats.balance.toLocaleString()}
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Total Ledger Charges
                  </p>
                  <p className="text-lg font-black text-slate-600 dark:text-muted-foreground tracking-tight">
                    PKR {stats.total.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-100">
                  <p className="text-[9.5px] font-black text-emerald-700 uppercase tracking-wider">
                    Total Paid
                  </p>
                  <p className="text-sm font-black text-emerald-900 tracking-tight mt-0.5">
                    PKR {stats.paid.toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-100">
                  <p className="text-[9.5px] font-black text-blue-700 uppercase tracking-wider">
                    Refunded
                  </p>
                  <p className="text-sm font-black text-blue-900 tracking-tight mt-0.5">
                    PKR {stats.refunded.toLocaleString()}
                  </p>
                </div>
                <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-100">
                  <p className="text-[9.5px] font-black text-amber-700 uppercase tracking-wider">
                    Under Review
                  </p>
                  <p className="text-sm font-black text-amber-900 tracking-tight mt-0.5">
                    PKR {stats.pending.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 shadow-md border-none flex flex-col justify-between relative overflow-hidden group">
            <div className="relative z-10">
              <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-5">
                <ShieldCheck className="h-6 w-6 text-indigo-200" />
              </div>
              <h3 className="text-base font-black mb-2 tracking-wide uppercase">
                Payment Submission Protocol
              </h3>
              <p className="text-xs text-indigo-200 leading-relaxed font-medium">
                Once you transfer rent to the hostel bank account, tap{" "}
                <strong className="text-white">Notify Warden</strong> to upload
                your paid receipt voucher.
              </p>
            </div>
            <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                Warden Verification SLA: 24h
              </span>
            </div>
          </Card>
        </div>

        {/* Transaction History */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-slate-400" />
              <h2 className="text-xs font-black text-slate-900 dark:text-foreground uppercase tracking-widest">
                Transaction Records
              </h2>
            </div>
            <Tabs
              defaultValue="all"
              className="bg-white dark:bg-card border border-slate-200/80 p-1 rounded-2xl shadow-2xs"
              onValueChange={setFilter}
            >
              <TabsList className="bg-transparent h-9 gap-1">
                {["all", "pending", "paid", "refunded"].map((val) => (
                  <TabsTrigger
                    key={val}
                    value={val}
                    className="text-[10px] font-extrabold px-5 h-full uppercase tracking-wider rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
                  >
                    {val === "all"
                      ? "All"
                      : val === "pending"
                        ? "Pending"
                        : val === "paid"
                          ? "Verified"
                          : "Refunds"}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-3">
            {filteredPayments.length > 0 ? (
              filteredPayments.map((p) => {
                const hasReceipt = !!p.receiptUrl;
                const isNotified = p.status === "PENDING" && hasReceipt;
                const isUnpaid =
                  (p.status === "PENDING" && !hasReceipt) ||
                  p.status === "REJECTED";

                return (
                  <div
                    key={p.id}
                    className={`bg-white dark:bg-card border rounded-2xl p-5 hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-6 group relative overflow-hidden ${isNotified ? "border-indigo-200/80" : isUnpaid ? (p.status === "REJECTED" ? "border-rose-200" : "border-amber-200") : "border-slate-200/80"}`}
                  >
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        {isNotified ? (
                          <Bell className="h-5 w-5 text-indigo-600" />
                        ) : (
                          <CreditCard className="h-5 w-5 text-indigo-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-foreground tracking-tight">
                            {p.notes
                              ?.replace("[GUEST_NOTIFICATION]", "")
                              .trim() ||
                              (p.month
                                ? `${p.month} ${p.year || ""} Rent`
                                : "Room Rent")}
                          </h4>
                          <PaymentStatusBadge
                            status={p.status}
                            hasReceipt={hasReceipt}
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                            {p.method?.replace("_", " ") || "Direct Transfer"}
                          </p>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                            {format(new Date(p.date), "MMM dd, yyyy")}
                          </p>
                        </div>
                        {isUnpaid && p.oneBillInvoiceId && (
                          <div className="mt-2 flex items-center gap-2 bg-slate-50 dark:bg-muted/10 border border-slate-100 dark:border-border rounded-lg px-2 py-0.5 w-fit">
                            <span className="text-[8px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-wider">
                              1Bill Invoice:
                            </span>
                            <span className="text-[9.5px] font-bold text-slate-700 dark:text-foreground font-mono tracking-wider">
                              {p.oneBillInvoiceId}
                            </span>
                          </div>
                        )}
                        {isNotified && (
                          <p className="text-[9.5px] text-indigo-600 font-extrabold uppercase tracking-widest mt-1">
                            ✓ Receipt submitted — awaiting warden review
                          </p>
                        )}
                        {p.status === "REJECTED" && (
                          <p className="text-[9.5px] text-rose-600 font-extrabold uppercase tracking-widest mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Warden rejected
                            previous receipt
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-6">
                      <div className="text-right">
                        <p className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">
                          Amount
                        </p>
                        <p className="text-lg font-black text-slate-900 dark:text-foreground tracking-tight">
                          PKR {p.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isUnpaid && p.oneBillInvoiceId && (
                          <OneBillPaymentModal
                            payment={p}
                            user={user}
                            onSuccess={refetchPayments}
                          >
                            <Button
                              size="sm"
                              className="h-9 px-4 rounded-xl text-white font-extrabold text-[10px] uppercase tracking-wider bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 shadow-sm active:scale-95"
                            >
                              <CreditCard className="h-3.5 w-3.5" /> Pay Online
                            </Button>
                          </OneBillPaymentModal>
                        )}
                        {isUnpaid && canNotify && (
                          <PaymentNotificationModal
                            booking={bookingWithPayments}
                          >
                            <Button
                              size="sm"
                              className={`h-9 px-4 rounded-xl text-white font-extrabold text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1.5 ${p.status === "REJECTED" ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
                            >
                              <Bell className="h-3.5 w-3.5" />{" "}
                              {p.status === "REJECTED" ? "Resubmit" : "Notify"}
                            </Button>
                          </PaymentNotificationModal>
                        )}
                        {p.status === "PAID" && (
                          <RefundRequestModal payment={p}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl h-9 w-9 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            >
                              <Undo2 className="h-4 w-4" />
                            </Button>
                          </RefundRequestModal>
                        )}
                        <UnifiedReceipt data={p} type="payment">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl h-9 w-9 border border-slate-200 text-slate-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </UnifiedReceipt>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                icon={FileText}
                title="No matching logs"
                description="Try adjusting your filters"
                containerClassName="bg-white dark:bg-card border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center"
                iconWrapperClassName="bg-slate-50 border-slate-100"
                iconClassName="text-slate-300"
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default GuestPayments;
