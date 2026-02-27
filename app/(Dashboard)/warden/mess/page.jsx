"use client"
import React, { useState } from "react";
import {
    CalendarRange,
    Loader2,
    Utensils,
    Coffee,
    Clock,
    Building2,
    Save,
    Edit3,
    Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useMessMenu, useUpsertMessMenu } from "@/hooks/useMess";
import useAuthStore from "@/hooks/Authstate";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const formatTime12h = (time24) => {
    if (!time24) return "";
    const [h, m] = time24.split(':');
    if (!h || !m) return time24;
    let hours = parseInt(h, 10);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours.toString().padStart(2, '0')}:${m} ${suffix}`;
};

const displayTimeRange = (timeStr) => {
    if (!timeStr || !timeStr.includes('~')) return timeStr || "---";
    const [start, end] = timeStr.split('~');
    if (!start && !end) return "---";
    return `${formatTime12h(start)} - ${formatTime12h(end)}`;
};

const parseTimeRange = (timeStr) => {
    if (!timeStr || !timeStr.includes('~')) return { start: "", end: "" };
    const [start, end] = timeStr.split('~');
    return { start: start || "", end: end || "" };
};

const WardenMessMenu = () => {
    const { user } = useAuthStore();
    const hostelId = user?.hostelId;

    const { data: messMenus, isLoading: isMenusLoading } = useMessMenu(hostelId);
    const upsertMessMenu = useUpsertMessMenu();

    const [editingDay, setEditingDay] = useState(null);
    const [formData, setFormData] = useState({
        breakfast: "", breakfastStart: "", breakfastEnd: "",
        lunch: "", lunchStart: "", lunchEnd: "",
        dinner: "", dinnerStart: "", dinnerEnd: ""
    });
    const [isExporting, setIsExporting] = useState(false);

    const handleEdit = (day) => {
        if (!hostelId) {
            toast.error("Hostel branch registration required");
            return;
        }

        const menuForDay = messMenus?.find(m => m.dayOfWeek === day);
        const bTime = parseTimeRange(menuForDay?.breakfastTime);
        const lTime = parseTimeRange(menuForDay?.lunchTime);
        const dTime = parseTimeRange(menuForDay?.dinnerTime);

        setFormData({
            breakfast: menuForDay?.breakfast || "",
            breakfastStart: bTime.start,
            breakfastEnd: bTime.end,
            lunch: menuForDay?.lunch || "",
            lunchStart: lTime.start,
            lunchEnd: lTime.end,
            dinner: menuForDay?.dinner || "",
            dinnerStart: dTime.start,
            dinnerEnd: dTime.end
        });
        setEditingDay(day);
    };

    const handleSave = async (day) => {
        try {
            await upsertMessMenu.mutateAsync({
                hostelId: hostelId,
                dayOfWeek: day,
                breakfast: formData.breakfast,
                breakfastTime: `${formData.breakfastStart}~${formData.breakfastEnd}`,
                lunch: formData.lunch,
                lunchTime: `${formData.lunchStart}~${formData.lunchEnd}`,
                dinner: formData.dinner,
                dinnerTime: `${formData.dinnerStart}~${formData.dinnerEnd}`
            });
            toast.success(`${day} menu updated successfully!`);
            setEditingDay(null);
        } catch (error) {
            toast.error("Failed to update menu");
        }
    };

    const handleExportPDF = async () => {
        if (!hostelId || !messMenus || messMenus.length === 0) {
            toast.error("No mess menu data to export.");
            return;
        }

        setIsExporting(true);
        try {
            const doc = new jsPDF({ orientation: 'landscape' });
            const hostelName = user?.Hostel?.name || "Your Hostel Branch";
            const pageWidth = doc.internal.pageSize.getWidth();

            // Header Section
            doc.setFillColor(0, 0, 0);
            doc.rect(0, 0, pageWidth, 35, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text("MESS SCHEDULE", pageWidth / 2, 18, { align: "center" });

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`${hostelName.toUpperCase()}`, pageWidth / 2, 26, { align: "center" });

            // Branding Sub-header
            doc.setTextColor(100, 116, 139);
            doc.setFontSize(10);
            doc.text(`Generated On: ${format(new Date(), 'PPP p')}`, 14, 45);
            doc.text(`Official Property Management Document`, pageWidth - 14, 45, { align: "right" });

            // Horizontal Line
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.line(14, 49, pageWidth - 14, 49);

            const tableColumn = ["DAY", "MEAL", "FOOD ITEMS", "SERVED AT"];
            const tableRows = [];

            DAYS.forEach(day => {
                const menu = messMenus.find(m => m.dayOfWeek === day);

                tableRows.push([
                    {
                        content: day.toUpperCase(),
                        rowSpan: 3,
                        styles: {
                            valign: 'middle',
                            halign: 'center',
                            fontStyle: 'bold',
                            fillColor: [250, 250, 250],
                            textColor: [0, 0, 0]
                        }
                    },
                    "BREAKFAST",
                    menu?.breakfast || "NO MENU DEFINED",
                    displayTimeRange(menu?.breakfastTime)
                ]);

                tableRows.push([
                    "",
                    "LUNCH",
                    menu?.lunch || "NO MENU DEFINED",
                    displayTimeRange(menu?.lunchTime)
                ]);

                tableRows.push([
                    "",
                    "DINNER",
                    menu?.dinner || "NO MENU DEFINED",
                    displayTimeRange(menu?.dinnerTime)
                ]);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 55,
                theme: 'grid',
                headStyles: {
                    fillColor: [0, 0, 0],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 10,
                    halign: 'center',
                    valign: 'middle',
                    cellPadding: 4
                },
                bodyStyles: {
                    fontSize: 10,
                    textColor: [51, 65, 85],
                    valign: 'middle',
                    cellPadding: 5
                },
                columnStyles: {
                    0: { cellWidth: 35 },
                    1: { cellWidth: 35, fontStyle: 'bold' },
                    2: { cellWidth: 'auto' },
                    3: { cellWidth: 60, halign: 'center' }
                }
            });

            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text(`© Central Management System - Page ${i} of ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
            }

            doc.save(`${hostelName.replace(/\s+/g, '_')}_Mess_Schedule.pdf`);
            toast.success("Mess schedule exported successfully!");
        } catch (error) {
            console.error("Error exporting PDF:", error);
            toast.error("Failed to export mess schedule.");
        } finally {
            setIsExporting(false);
        }
    };

    if (isMenusLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white font-sans">
                <div className="flex flex-col items-center gap-6">
                    <div className="h-10 w-10 border-[3px] border-gray-100 border-t-black rounded-full animate-spin" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 italic">Loading</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans tracking-tight text-gray-900">

            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 py-2 md:h-16 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <div className="h-9 w-9 md:h-10 md:w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                            <Utensils className="h-4 w-4 md:h-5 md:w-5 text-indigo-600" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm md:text-lg font-semibold text-gray-800 tracking-tight uppercase truncate">Mess Menu</h1>
                            <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                                <span className="text-[9px] md:text-[10px] font-medium uppercase tracking-wide text-gray-500 truncate">{user?.Hostel?.name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="default"
                            onClick={handleExportPDF}
                            disabled={!hostelId || isExporting || isMenusLoading}
                            className="h-10 md:h-11 px-4 md:px-6 rounded-xl md:rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[9px] md:text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95"
                        >
                            {isExporting ? <Loader2 className="h-3 w-3 md:h-3.5 md:w-3.5 animate-spin mr-2" /> : <Download className="h-3 w-3 md:h-3.5 md:w-3.5 mr-2" />}
                            <span className="hidden sm:inline">{isExporting ? 'Exporting' : 'Save PDF'}</span>
                            <span className="sm:hidden">{isExporting ? '...' : 'PDF'}</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-4">

                {!hostelId ? (
                    <div className="py-16 md:py-28 bg-white border border-dashed border-gray-200 rounded-2xl md:rounded-3xl text-center px-6 max-w-2xl mx-auto shadow-sm">
                        <Utensils className="h-12 w-12 md:h-20 md:w-20 text-gray-200 mx-auto mb-6" />
                        <h3 className="text-xl md:text-2xl font-semibold text-gray-800 uppercase tracking-wide">No Hostel</h3>
                        <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">Your account does not have an active hostel linked.</p>
                        <Button variant="outline" className="mt-8 rounded-xl border-gray-200 uppercase tracking-wide text-[9px] font-medium h-11 px-10 hover:bg-gray-50 transition-all text-gray-500">
                            Reconnect
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 md:space-y-6">
                        {DAYS.map((day) => {
                            const currentMenu = messMenus?.find(m => m.dayOfWeek === day);
                            const isEditing = editingDay === day;

                            return (
                                <Card key={day} className={`rounded-2xl md:rounded-3xl border shadow-sm overflow-hidden transition-all duration-500 ${isEditing ? 'border-indigo-200 ring-2 ring-indigo-50 shadow-md scale-[1.01]' : 'border-gray-50 hover:border-gray-200 hover:shadow-sm'}`}>

                                    {/* Card Header */}
                                    <div className={`px-5 md:px-10 py-4 md:py-5 border-b flex items-center justify-between gap-4 ${isEditing ? 'bg-indigo-50 text-gray-700' : 'bg-white'}`}>
                                        <div className="flex items-center gap-4 md:gap-6 min-w-0">
                                            <div className={`h-11 w-11 md:h-14 md:w-14 shrink-0 flex items-center justify-center rounded-2xl md:rounded-3xl font-medium text-[10px] md:text-sm uppercase tracking-wide transition-all ${isEditing ? 'bg-white text-gray-800 shadow' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-700'}`}>
                                                {day.substring(0, 3)}
                                            </div>
                                            <div className="min-w-0">
                                                <h2 className={`text-base md:text-2xl font-semibold uppercase tracking-tight truncate ${isEditing ? 'text-gray-800' : 'text-gray-800'}`}>{day}</h2>
                                                <p className="text-[8px] md:text-[9px] font-medium uppercase tracking-wide mt-0.5">Daily Items</p>
                                            </div>
                                        </div>

                                        <div className="shrink-0">
                                            {isEditing ? (
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => setEditingDay(null)}
                                                        className="h-9 md:h-11 px-4 md:px-6 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-medium uppercase tracking-wide text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleSave(day)}
                                                        disabled={upsertMessMenu.isPending}
                                                        className="h-9 md:h-11 px-5 md:px-8 rounded-xl md:rounded-2xl bg-white text-gray-800 hover:bg-gray-100 font-medium text-[9px] md:text-[10px] uppercase tracking-wide shadow-sm transition-all active:scale-95"
                                                    >
                                                        {upsertMessMenu.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
                                                        {upsertMessMenu.isPending ? 'Saving' : 'Save'}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => handleEdit(day)}
                                                    className="h-9 md:h-11 w-9 md:w-auto sm:px-6 rounded-xl md:rounded-2xl bg-gray-50 group-hover:bg-gray-100 group-hover:text-gray-700 text-gray-500 font-medium text-[9px] md:text-[10px] uppercase tracking-wide transition-all hover:scale-105 active:scale-95"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5 sm:mr-2" />
                                                    <span className="hidden sm:inline">Edit</span>
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <CardContent className="p-0 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                                        {[
                                            { type: 'breakfast', label: 'Breakfast', icon: Coffee, color: 'text-amber-500', bg: 'bg-amber-50', field: 'breakfast', startField: 'breakfastStart', endField: 'breakfastEnd', timeLabel: 'breakfastTime' },
                                            { type: 'lunch', label: 'Lunch', icon: Utensils, color: 'text-emerald-500', bg: 'bg-emerald-50', field: 'lunch', startField: 'lunchStart', endField: 'lunchEnd', timeLabel: 'lunchTime' },
                                            { type: 'dinner', label: 'Dinner', icon: Utensils, color: 'text-indigo-500', bg: 'bg-indigo-50', field: 'dinner', startField: 'dinnerStart', endField: 'dinnerEnd', timeLabel: 'dinnerTime' }
                                        ].map((meal) => (
                                            <div key={meal.type} className={`p-5 md:p-6 transition-all duration-500 ${isEditing ? 'bg-gray-50/30' : 'hover:bg-gray-50/50'} rounded-xl`}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <meal.icon className={`h-4 w-4 md:h-5 md:w-5 ${meal.color}`} />
                                                    <h4 className="text-xs md:text-sm font-semibold text-gray-800 uppercase tracking-wide">{meal.label}</h4>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-[8px] md:text-[9px] font-medium text-gray-500 uppercase tracking-wide block">Menu</Label>
                                                    {isEditing ? (
                                                        <Input
                                                            value={formData[meal.field]}
                                                            onChange={e => setFormData({ ...formData, [meal.field]: e.target.value })}
                                                            className="h-10 md:h-11 rounded-xl bg-white border-gray-200 text-xs md:text-sm font-medium focus:ring-1 focus:ring-indigo-600 transition-all"
                                                            placeholder={`Enter ${meal.label}`}
                                                        />
                                                    ) : (
                                                        <p className="text-xs md:text-sm font-medium text-gray-700 min-h-[40px] flex items-center">{currentMenu?.[meal.field] || <span className="text-gray-400 font-normal">Not defined</span>}</p>
                                                    )}

                                                    <Label className="text-[8px] md:text-[9px] font-medium text-gray-500 uppercase tracking-wide block">Time</Label>
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-2">
                                                            <Input type="time" value={formData[meal.startField]} onChange={e => setFormData({ ...formData, [meal.startField]: e.target.value })} className="h-10 md:h-11 rounded-xl bg-white border-gray-200 text-[10px] md:text-xs font-medium px-2" />
                                                            <span className="text-gray-400 font-medium">-</span>
                                                            <Input type="time" value={formData[meal.endField]} onChange={e => setFormData({ ...formData, [meal.endField]: e.target.value })} className="h-10 md:h-11 rounded-xl bg-white border-gray-200 text-[10px] md:text-xs font-medium px-2" />
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 text-gray-700 text-[10px] md:text-xs font-medium border border-gray-200">
                                                            <Clock className="h-3 w-3 md:h-3.5 text-gray-400" /> {displayTimeRange(currentMenu?.[meal.timeLabel])}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>

                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default WardenMessMenu;
