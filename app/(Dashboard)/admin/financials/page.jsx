"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHostel } from "@/hooks/usehostel";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Activity,
  Calendar,
  Building2,
  RefreshCw,
  BarChart3,
  PieChart as PieIcon,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListPageSkeleton } from "@/components/ui/skeletons";
import useAuthStore from "@/hooks/Authstate";
import dynamic from "next/dynamic";
import { toast } from "sonner";

// Dynamically import Recharts to avoid SSR hydration issues
const RechartsResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false },
);
const RechartsXAxis = dynamic(
  () => import("recharts").then((mod) => mod.XAxis),
  { ssr: false },
);
const RechartsYAxis = dynamic(
  () => import("recharts").then((mod) => mod.YAxis),
  { ssr: false },
);
const RechartsCartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false },
);
const RechartsTooltip = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip),
  { ssr: false },
);
const RechartsAreaChart = dynamic(
  () => import("recharts").then((mod) => mod.AreaChart),
  { ssr: false },
);
const RechartsArea = dynamic(() => import("recharts").then((mod) => mod.Area), {
  ssr: false,
});
const RechartsPieChart = dynamic(
  () => import("recharts").then((mod) => mod.PieChart),
  { ssr: false },
);
const RechartsPie = dynamic(() => import("recharts").then((mod) => mod.Pie), {
  ssr: false,
});
const RechartsCell = dynamic(() => import("recharts").then((mod) => mod.Cell), {
  ssr: false,
});
const RechartsBarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  { ssr: false },
);
const RechartsBar = dynamic(() => import("recharts").then((mod) => mod.Bar), {
  ssr: false,
});
const RechartsLegend = dynamic(
  () => import("recharts").then((mod) => mod.Legend),
  { ssr: false },
);

const COLORS = {
  indigo: "#6366f1",
  emerald: "#10b981",
  rose: "#f43f5e",
  amber: "#f59e0b",
  blue: "#3b82f6",
  purple: "#a855f7",
  slate: "#64748b",
};

const PIE_COLORS = [
  COLORS.indigo,
  COLORS.emerald,
  COLORS.blue,
  COLORS.purple,
  COLORS.amber,
  COLORS.rose,
];

export default function AdminFinancialsPage() {
  const { user } = useAuthStore();
  const [selectedHostel, setSelectedHostel] = useState("all");

  // Fetch lists of hostels
  const { data: hostelsData } = useHostel();
  const hostels = hostelsData?.hostels || [];

  // Fetch financial analytics
  const {
    data: financialsData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["adminFinancials", selectedHostel],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/financials?hostelId=${selectedHostel}`,
      );
      if (!res.ok) throw new Error("Failed to fetch financials data");
      return res.json();
    },
  });

  const handleSync = async () => {
    const promise = refetch();
    toast.promise(promise, {
      loading: "Syncing ledger records...",
      success: "Financial data refreshed",
      error: "Failed to sync financials",
    });
  };

  if (isLoading) return <ListPageSkeleton />;

  const summary = financialsData?.summary || {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
  };
  const timeline = financialsData?.timeline || [];
  const collectionsBreakdown = financialsData?.collectionsBreakdown || {
    RENT: 0,
    SECURITY_DEPOSIT: 0,
    OTHER: 0,
  };
  const expensesBreakdown = financialsData?.expensesBreakdown || {
    MESS: 0,
    GENERAL: 0,
    UTILITY_BILL: 0,
    MAINTENANCE: 0,
    SALARY: 0,
  };

  // Format data for Recharts Pie charts
  const collectionsChartData = Object.keys(collectionsBreakdown)
    .map((key) => ({
      name: key.replace("_", " "),
      value: collectionsBreakdown[key],
    }))
    .filter((item) => item.value > 0);

  const expensesChartData = Object.keys(expensesBreakdown)
    .map((key) => ({
      name: key.replace("_", " "),
      value: expensesBreakdown[key],
    }))
    .filter((item) => item.value > 0);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-20 font-sans tracking-tight text-gray-900 dark:text-foreground">
      {/* Header */}
      <div className="bg-white dark:bg-card border-b dark:border-border sticky top-0 z-50 h-16 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="h-8 w-1 bg-indigo-600 rounded-full shrink-0" />
            <div className="flex flex-col">
              <h1 className="text-sm md:text-base font-bold text-gray-900 dark:text-foreground tracking-tight uppercase">
                Financial analytics
              </h1>
              <p className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                Unified P&L Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              className="h-9 px-3 rounded-xl border border-gray-100 dark:border-border text-[10px] uppercase font-bold text-gray-600 dark:text-muted-foreground bg-gray-50 dark:bg-muted/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              value={selectedHostel}
              onChange={(e) => setSelectedHostel(e.target.value)}
            >
              <option value="all">All Hostel Branches</option>
              {hostels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={handleSync}
              disabled={isRefetching}
              className="h-9 px-4 rounded-xl border-gray-200 dark:border-border font-bold text-[10px] uppercase tracking-wider text-gray-600 dark:text-muted-foreground hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-gray-400 ${isRefetching ? "animate-spin" : ""}`}
              />{" "}
              Sync
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Revenue",
              value: `PKR ${summary.totalRevenue.toLocaleString()}`,
              icon: Wallet,
              color: "text-indigo-600",
              bg: "bg-indigo-50",
            },
            {
              label: "Total Expenses",
              value: `PKR ${summary.totalExpenses.toLocaleString()}`,
              icon: TrendingDown,
              color: "text-rose-600",
              bg: "bg-rose-50",
            },
            {
              label: "Net Profit",
              value: `PKR ${summary.netProfit.toLocaleString()}`,
              icon: TrendingUp,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Profit Margin",
              value: `${summary.profitMargin.toFixed(1)}%`,
              icon: Activity,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-full bg-gray-50/50 dark:bg-muted/10 skew-x-12 translate-x-10 group-hover:translate-x-8 transition-transform" />
              <div className="flex flex-col gap-4 relative z-10">
                <div
                  className={`h-11 w-11 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner shrink-0`}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                    {stat.label}
                  </span>
                  <span className="text-xl font-black text-gray-900 dark:text-foreground tracking-tight">
                    {stat.value}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Chart & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timeline Chart */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3 px-1">
              <div className="h-5 w-1 bg-indigo-600 rounded-full" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-foreground">
                Profit & Loss Timeline
              </h3>
            </div>
            <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-[2.5rem] p-8 shadow-sm">
              {timeline.length > 0 ? (
                <div className="w-full h-[320px]">
                  <RechartsResponsiveContainer width="100%" height="100%">
                    <RechartsAreaChart
                      data={timeline}
                      margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={COLORS.blue}
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor={COLORS.blue}
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorExpenses"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={COLORS.rose}
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor={COLORS.rose}
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorNet"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={COLORS.emerald}
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor={COLORS.emerald}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <RechartsCartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f1f5f9"
                        vertical={false}
                      />
                      <RechartsXAxis
                        dataKey="name"
                        tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsYAxis
                        tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`}
                      />
                      <RechartsTooltip
                        formatter={(v) => `PKR ${v.toLocaleString()}`}
                      />
                      <RechartsLegend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                      />
                      <RechartsArea
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke={COLORS.blue}
                        strokeWidth={2.5}
                        fill="url(#colorRevenue)"
                        dot={{ r: 3 }}
                      />
                      <RechartsArea
                        type="monotone"
                        dataKey="expenses"
                        name="Expenses"
                        stroke={COLORS.rose}
                        strokeWidth={2.5}
                        fill="url(#colorExpenses)"
                        dot={{ r: 3 }}
                      />
                      <RechartsArea
                        type="monotone"
                        dataKey="net"
                        name="Net Profit"
                        stroke={COLORS.emerald}
                        strokeWidth={2.5}
                        fill="url(#colorNet)"
                        dot={{ r: 3 }}
                      />
                    </RechartsAreaChart>
                  </RechartsResponsiveContainer>
                </div>
              ) : (
                <div className="h-[320px] flex items-center justify-center text-gray-300">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    No historical records available
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Breakdown lists */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-3 px-1">
              <div className="h-5 w-1 bg-indigo-600 rounded-full" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-foreground">
                Revenue Categories
              </h3>
            </div>

            <Card className="rounded-[2rem] border-gray-100 dark:border-border shadow-sm p-6 space-y-4">
              {collectionsChartData.length > 0 ? (
                <div className="space-y-4">
                  <div className="h-[180px] w-full">
                    <RechartsResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <RechartsPie
                          data={collectionsChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {collectionsChartData.map((entry, index) => (
                            <RechartsCell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </RechartsPie>
                        <RechartsTooltip
                          formatter={(v) => `PKR ${v.toLocaleString()}`}
                        />
                      </RechartsPieChart>
                    </RechartsResponsiveContainer>
                  </div>
                  <div className="divide-y divide-gray-50 text-xs">
                    {collectionsChartData.map((item, idx) => (
                      <div
                        key={item.name}
                        className="py-2.5 flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor:
                                PIE_COLORS[idx % PIE_COLORS.length],
                            }}
                          />
                          <span className="font-bold text-gray-600 uppercase tracking-wide">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-black text-gray-900">
                          PKR {item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-300">
                  <PieIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-[9px] font-bold uppercase tracking-widest">
                    No collections logged
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Expense Categories Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Expense Breakdown List */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-3 px-1">
              <div className="h-5 w-1 bg-rose-600 rounded-full" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-foreground">
                Expense Categories
              </h3>
            </div>

            <Card className="rounded-[2rem] border-gray-100 dark:border-border shadow-sm p-6 space-y-4">
              {expensesChartData.length > 0 ? (
                <div className="space-y-4">
                  <div className="h-[180px] w-full">
                    <RechartsResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <RechartsPie
                          data={expensesChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {expensesChartData.map((entry, index) => (
                            <RechartsCell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]}
                            />
                          ))}
                        </RechartsPie>
                        <RechartsTooltip
                          formatter={(v) => `PKR ${v.toLocaleString()}`}
                        />
                      </RechartsPieChart>
                    </RechartsResponsiveContainer>
                  </div>
                  <div className="divide-y divide-gray-50 text-xs">
                    {expensesChartData.map((item, idx) => (
                      <div
                        key={item.name}
                        className="py-2.5 flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor:
                                PIE_COLORS[(idx + 2) % PIE_COLORS.length],
                            }}
                          />
                          <span className="font-bold text-gray-600 uppercase tracking-wide">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-black text-gray-900">
                          PKR {item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-300">
                  <PieIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-[9px] font-bold uppercase tracking-widest">
                    No expenses logged
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Detailed Historical Ledger Table */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3 px-1">
              <div className="h-5 w-1 bg-indigo-600 rounded-full" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-foreground">
                Monthly P&L Ledger
              </h3>
            </div>
            <Card className="rounded-[2.5rem] border-gray-100 dark:border-border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead className="bg-gray-50/50 dark:bg-muted/10">
                    <tr>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
                        Month
                      </th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
                        Collections
                      </th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
                        Expenses
                      </th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 text-right">
                        Net Income
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {timeline.length > 0 ? (
                      timeline
                        .slice()
                        .reverse()
                        .map((item) => (
                          <tr
                            key={item.name}
                            className="hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="px-6 py-4 font-bold text-gray-900 uppercase tracking-wide">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 text-emerald-600 font-bold">
                              PKR {item.revenue.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-rose-600 font-bold">
                              PKR {item.expenses.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span
                                className={`font-black ${item.net >= 0 ? "text-emerald-700" : "text-rose-700"}`}
                              >
                                PKR {item.net.toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-8 text-center text-gray-400"
                        >
                          No financial records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
