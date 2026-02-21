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
            doc.setFillColor(30, 58, 138); // blue-900
            doc.rect(0, 0, pageWidth, 35, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text("MESS SCHEDULE", pageWidth / 2, 18, { align: "center" });

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`${hostelName.toUpperCase()}`, pageWidth / 2, 26, { align: "center" });

            // Branding Sub-header
            doc.setTextColor(100, 116, 139); // slate-500
            doc.setFontSize(10);
            doc.text(`Generated On: ${format(new Date(), 'PPP p')}`, 14, 45);
            doc.text(`Official GreenView Management Document`, pageWidth - 14, 45, { align: "right" });

            // Horizontal Line
            doc.setDrawColor(226, 232, 240); // slate-200
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
                            fillColor: [248, 250, 252],
                            textColor: [30, 58, 138]
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
                    fillColor: [30, 58, 138],
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
                },
                didParseCell: function (data) {
                    if (data.section === 'body' && data.column.index === 1) {
                        const meal = String(data.cell.raw || data.cell.text[0]).toUpperCase();
                        if (meal.includes('BREAKFAST')) data.cell.styles.textColor = [180, 83, 9];
                        if (meal.includes('LUNCH')) data.cell.styles.textColor = [21, 128, 61];
                        if (meal.includes('DINNER')) data.cell.styles.textColor = [67, 56, 202];
                    }
                }
            });

            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text(`© GreenView Hostel Management System - Page ${i} of ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
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
            <div className="flex h-screen items-center justify-center bg-gray-50/50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            <div className="bg-white border-b sticky top-0 z-50 h-[72px]">
                <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
                            <Utensils className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">Mess Schedule</h1>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Hostel Branch: {user?.Hostel?.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="default"
                            onClick={handleExportPDF}
                            disabled={!hostelId || isExporting || isMenusLoading}
                            className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm"
                        >
                            {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Download className="h-3.5 w-3.5 mr-2" />}
                            {isExporting ? 'Exporting...' : 'Export Schedule'}
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-6 py-8">
                {!hostelId ? (
                    <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-16 text-center max-w-2xl mx-auto shadow-sm mt-12">
                        <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Utensils className="h-10 w-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 uppercase">Hostel Not Identified</h3>
                        <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">Your account is not associated with any hostel. Please contact admin to set your hostel branch.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {DAYS.map((day) => {
                            const currentMenu = messMenus?.find(m => m.dayOfWeek === day);
                            const isEditing = editingDay === day;

                            return (
                                <Card key={day} className={`rounded-3xl border ${isEditing ? 'border-indigo-200 shadow-md ring-4 ring-indigo-50' : 'border-gray-100 shadow-sm'} overflow-hidden transition-all duration-300`}>
                                    <CardHeader className={`px-8 py-5 border-b ${isEditing ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-gray-50'} flex flex-row items-center justify-between`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`h-12 w-12 flex items-center justify-center rounded-xl font-black text-xs uppercase tracking-widest ${isEditing ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-gray-100 text-gray-500'}`}>
                                                {day.substring(0, 3)}
                                            </div>
                                            <CardTitle className="text-xl font-bold text-gray-900 uppercase tracking-tight">{day}</CardTitle>
                                        </div>
                                        <div>
                                            {isEditing ? (
                                                <div className="flex gap-3">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => setEditingDay(null)}
                                                        className="h-9 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                                    >
                                                        Discard
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleSave(day)}
                                                        disabled={upsertMessMenu.isPending}
                                                        className="h-9 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm"
                                                    >
                                                        {upsertMessMenu.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                                                        {upsertMessMenu.isPending ? 'Saving' : 'Save Details'}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => handleEdit(day)}
                                                    className="h-9 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[10px] uppercase tracking-wider"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5 mr-2" /> Modify Schedule
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-0">
                                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                                            <div className="p-8 hover:bg-gray-50/50 transition-colors">
                                                <div className="flex items-center gap-2 mb-6">
                                                    <Coffee className="h-5 w-5 text-amber-500" />
                                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Breakfast</h4>
                                                </div>
                                                <div className="space-y-5">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Food Menu</Label>
                                                        {isEditing ? (
                                                            <Input
                                                                value={formData.breakfast}
                                                                onChange={e => setFormData({ ...formData, breakfast: e.target.value })}
                                                                className="h-11 rounded-xl bg-white border-gray-200 text-sm font-medium focus:ring-1 focus:ring-indigo-600"
                                                                placeholder="e.g. Omelette, Tea, Paratha"
                                                            />
                                                        ) : (
                                                            <p className="text-sm font-medium text-gray-800 min-h-[44px] flex items-center">{currentMenu?.breakfast || <span className="text-gray-400 italic font-normal">Not defined</span>}</p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time Window</Label>
                                                        {isEditing ? (
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    type="time"
                                                                    value={formData.breakfastStart}
                                                                    onChange={e => setFormData({ ...formData, breakfastStart: e.target.value })}
                                                                    className="h-11 rounded-xl bg-white border-gray-200 text-xs font-bold text-gray-700 focus:ring-1 focus:ring-indigo-600"
                                                                />
                                                                <span className="text-gray-400 font-bold">-</span>
                                                                <Input
                                                                    type="time"
                                                                    value={formData.breakfastEnd}
                                                                    onChange={e => setFormData({ ...formData, breakfastEnd: e.target.value })}
                                                                    className="h-11 rounded-xl bg-white border-gray-200 text-xs font-bold text-gray-700 focus:ring-1 focus:ring-indigo-600"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200">
                                                                <Clock className="h-3.5 w-3.5 text-gray-500" />
                                                                {displayTimeRange(currentMenu?.breakfastTime)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-8 hover:bg-gray-50/50 transition-colors">
                                                <div className="flex items-center gap-2 mb-6">
                                                    <Utensils className="h-5 w-5 text-emerald-500" />
                                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Lunch</h4>
                                                </div>
                                                <div className="space-y-5">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Food Menu</Label>
                                                        {isEditing ? (
                                                            <Input
                                                                value={formData.lunch}
                                                                onChange={e => setFormData({ ...formData, lunch: e.target.value })}
                                                                className="h-11 rounded-xl bg-white border-gray-200 text-sm font-medium focus:ring-1 focus:ring-emerald-600"
                                                                placeholder="e.g. Chicken Biryani, Raita"
                                                            />
                                                        ) : (
                                                            <p className="text-sm font-medium text-gray-800 min-h-[44px] flex items-center">{currentMenu?.lunch || <span className="text-gray-400 italic font-normal">Not defined</span>}</p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time Window</Label>
                                                        {isEditing ? (
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    type="time"
                                                                    value={formData.lunchStart}
                                                                    onChange={e => setFormData({ ...formData, lunchStart: e.target.value })}
                                                                    className="h-11 rounded-xl bg-white border-gray-200 text-xs font-bold text-gray-700 focus:ring-1 focus:ring-emerald-600"
                                                                />
                                                                <span className="text-gray-400 font-bold">-</span>
                                                                <Input
                                                                    type="time"
                                                                    value={formData.lunchEnd}
                                                                    onChange={e => setFormData({ ...formData, lunchEnd: e.target.value })}
                                                                    className="h-11 rounded-xl bg-white border-gray-200 text-xs font-bold text-gray-700 focus:ring-1 focus:ring-emerald-600"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200">
                                                                <Clock className="h-3.5 w-3.5 text-gray-500" />
                                                                {displayTimeRange(currentMenu?.lunchTime)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-8 hover:bg-gray-50/50 transition-colors">
                                                <div className="flex items-center gap-2 mb-6">
                                                    <Utensils className="h-5 w-5 text-indigo-500" />
                                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Dinner</h4>
                                                </div>
                                                <div className="space-y-5">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Food Menu</Label>
                                                        {isEditing ? (
                                                            <Input
                                                                value={formData.dinner}
                                                                onChange={e => setFormData({ ...formData, dinner: e.target.value })}
                                                                className="h-11 rounded-xl bg-white border-gray-200 text-sm font-medium focus:ring-1 focus:ring-indigo-600"
                                                                placeholder="e.g. Daal Mash, Roti"
                                                            />
                                                        ) : (
                                                            <p className="text-sm font-medium text-gray-800 min-h-[44px] flex items-center">{currentMenu?.dinner || <span className="text-gray-400 italic font-normal">Not defined</span>}</p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time Window</Label>
                                                        {isEditing ? (
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    type="time"
                                                                    value={formData.dinnerStart}
                                                                    onChange={e => setFormData({ ...formData, dinnerStart: e.target.value })}
                                                                    className="h-11 rounded-xl bg-white border-gray-200 text-xs font-bold text-gray-700 focus:ring-1 focus:ring-indigo-600"
                                                                />
                                                                <span className="text-gray-400 font-bold">-</span>
                                                                <Input
                                                                    type="time"
                                                                    value={formData.dinnerEnd}
                                                                    onChange={e => setFormData({ ...formData, dinnerEnd: e.target.value })}
                                                                    className="h-11 rounded-xl bg-white border-gray-200 text-xs font-bold text-gray-700 focus:ring-1 focus:ring-indigo-600"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200">
                                                                <Clock className="h-3.5 w-3.5 text-gray-500" />
                                                                {displayTimeRange(currentMenu?.dinnerTime)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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
