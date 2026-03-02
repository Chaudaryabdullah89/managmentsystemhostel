"use client"
import React, { useState } from 'react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Legend
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieIcon, Activity } from 'lucide-react';

// Custom tooltip for PKR formatting
const RevenueTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-950 border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[160px]">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
                {payload.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 text-[11px] font-black">
                        <span style={{ color: entry.color }}>{entry.name}</span>
                        <span className="text-white">PKR {(entry.value / 1000).toFixed(1)}k</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// Monthly Revenue vs Expenses Area Chart
export function RevenueExpenseChart({ data = [] }) {
    return (
        <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<RevenueTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#colorRevenue)" dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#colorExpenses)" dot={{ r: 3, fill: '#f43f5e', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2} fill="url(#colorProfit)" dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

// Hostel Performance Bar Chart
export function HostelPerformanceChart({ hostels = [] }) {
    const data = hostels.map(h => ({
        name: h.name.length > 10 ? h.name.slice(0, 10) + '...' : h.name,
        revenue: h.revenue,
        expenses: h.expenses,
        occupancy: h.occupancy
    }));

    return (
        <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barGap={2} barSize={12}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<RevenueTooltip />} />
                    <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// Occupancy Donut Chart
const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 10, fontWeight: 900 }}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export function OccupancyDonutChart({ occupancyRate = 0 }) {
    const data = [
        { name: 'Occupied', value: occupancyRate },
        { name: 'Vacant', value: 100 - occupancyRate }
    ];
    const COLORS = ['#3b82f6', '#f1f5f9'];

    return (
        <div className="w-full h-[180px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        labelLine={false}
                        label={renderCustomLabel}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

// Complaint Status Breakdown Chart
export function ComplaintStatusChart({ stats = {} }) {
    const data = [
        { name: 'Pending', value: stats.pending || 0, color: '#f59e0b' },
        { name: 'In Progress', value: stats.inProgress || 0, color: '#3b82f6' },
        { name: 'Resolved', value: stats.resolved || 0, color: '#10b981' },
        { name: 'Rejected', value: stats.rejected || 0, color: '#f43f5e' },
    ].filter(d => d.value > 0);

    if (!data.length) return <div className="h-[160px] flex items-center justify-center text-[11px] font-black text-gray-400 uppercase">No complaints yet</div>;

    return (
        <div className="w-full h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" outerRadius={65} dataKey="value" paddingAngle={3}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                    <Legend
                        iconType="circle"
                        iconSize={7}
                        formatter={(value) => <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
