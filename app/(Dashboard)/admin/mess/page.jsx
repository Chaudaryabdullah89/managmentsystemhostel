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
import { useHostel } from "@/hooks/usehostel";
import { useMessMenu, useUpsertMessMenu } from "@/hooks/useMess";
import { toast } from "sonner";
import { format } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Loader from "@/components/ui/Loader";

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

const AdminMessMenu = () => {
    const { data: hostelsData, isLoading: isHostelsLoading } = useHostel();
    const hostels = hostelsData?.data || [];
    const [selectedHostel, setSelectedHostel] = useState("");

    const { data: messMenus, isLoading: isMenusLoading } = useMessMenu(selectedHostel);
    const upsertMessMenu = useUpsertMessMenu();

    const [editingDay, setEditingDay] = useState(null);
    const [formData, setFormData] = useState({
        breakfast: "", breakfastStart: "", breakfastEnd: "",
        lunch: "", lunchStart: "", lunchEnd: "",
        dinner: "", dinnerStart: "", dinnerEnd: ""
    });
    const [isExporting, setIsExporting] = useState(false);

    const handleEdit = (day) => {
        if (!selectedHostel) {
            toast.error("Please select a hostel first");
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
                hostelId: selectedHostel,
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
        if (!selectedHostel || !messMenus || messMenus.length === 0) {
            toast.error("No mess menu data to export for the selected hostel.");
            return;
        }

        setIsExporting(true);
        try {
            const doc = new jsPDF({ orientation: 'landscape' });
            const hostelName = hostels.find(h => h.id === selectedHostel)?.name || "Selected Hostel";
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
            doc.text(`${hostelName.toUpperCase()} BRANCH`, pageWidth / 2, 26, { align: "center" });

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

                // Breakfast
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

                // Lunch
                tableRows.push([
                    "",
                    "LUNCH",
                    menu?.lunch || "NO MENU DEFINED",
                    displayTimeRange(menu?.lunchTime)
                ]);

                // Dinner
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
                    textColor: [51, 65, 85], // slate-700
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
                        if (meal.includes('BREAKFAST')) data.cell.styles.textColor = [180, 83, 9]; // amber-700
                        if (meal.includes('LUNCH')) data.cell.styles.textColor = [21, 128, 61]; // emerald-700
                        if (meal.includes('DINNER')) data.cell.styles.textColor = [67, 56, 202]; // indigo-700
                    }
                }
            });

            // Footer
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184); // slate-400
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

    if (isHostelsLoading) return <Loader label="Accessing Mess Node" subLabel="Synchronizing nutritional records" icon={Utensils} />;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 py-2 md:h-[72px]">
                <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-9 w-9 md:h-10 md:w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                            <Utensils className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight uppercase">Mess Schedule</h1>
                            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400">Nutritional Registry & Timing</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                        <Button
                            variant="default"
                            onClick={handleExportPDF}
                            disabled={!selectedHostel || isExporting || isMenusLoading}
                            className="h-9 md:h-10 px-3 md:px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider shadow-sm flex-1 md:flex-none"
                        >
                            {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Download className="h-3.5 w-3.5 mr-2" />}
                            {isExporting ? 'Exporting...' : 'Export'}
                        </Button>
                        <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                            <SelectTrigger className="flex-1 md:w-[240px] h-9 md:h-10 rounded-xl font-bold text-[9px] md:text-[10px] uppercase tracking-wider bg-white border-gray-200 focus:ring-1 focus:ring-indigo-600">
                                <Building2 className="h-3.5 w-3.5 mr-1 md:mr-2 text-gray-400 shrink-0" />
                                <span className="truncate"><SelectValue placeholder="SELECT HOSTEL" /></span>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {hostels.map(h => (
                                    <SelectItem key={h.id} value={h.id} className="text-[10px] font-bold uppercase tracking-wider text-gray-700">
                                        {h.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-6 py-8">
                {!selectedHostel ? (
                    <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-16 text-center max-w-2xl mx-auto shadow-sm mt-12">
                        <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Utensils className="h-10 w-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 uppercase">Select Hostel Branch</h3>
                        <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">Please select a hostel branch from the top menu to view and manage its daily mess schedule.</p>
                    </div>
                ) : isMenusLoading ? (
                    <div className="flex items-center justify-center p-20">
                        <Loader fullScreen={false} label="Compiling Menu" subLabel="Formatting scheduling data" icon={Utensils} />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {DAYS.map((day) => {
                            const currentMenu = messMenus?.find(m => m.dayOfWeek === day);
                            const isEditing = editingDay === day;

                            return (
                                <Card key={day} className={`rounded-3xl border ${isEditing ? 'border-indigo-200 shadow-md ring-4 ring-indigo-50' : 'border-gray-100 shadow-sm'} overflow-hidden transition-all duration-300`}>
                                    <CardHeader className={`px-4 md:px-8 py-4 md:py-5 border-b ${isEditing ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-gray-50'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 md:h-12 md:w-12 flex items-center justify-center rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest shrink-0 ${isEditing ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-gray-100 text-gray-400'}`}>
                                                {day.substring(0, 3)}
                                            </div>
                                            <CardTitle className="text-lg md:text-xl font-bold text-gray-900 uppercase tracking-tight">{day}</CardTitle>
                                        </div>
                                        <div className="w-full sm:w-auto">
                                            {isEditing ? (
                                                <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => setEditingDay(null)}
                                                        className="h-9 px-3 md:px-4 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 flex-1 sm:flex-none"
                                                    >
                                                        Discard
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleSave(day)}
                                                        disabled={upsertMessMenu.isPending}
                                                        className="h-9 px-4 md:px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider shadow-sm flex-1 sm:flex-none"
                                                    >
                                                        {upsertMessMenu.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                                                        {upsertMessMenu.isPending ? 'Saving' : 'Save'}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => handleEdit(day)}
                                                    className="h-9 w-full sm:w-auto px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[9px] md:text-[10px] uppercase tracking-wider"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5 mr-2" /> Modify Schedule
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-0">
                                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">

                                            {/* Breakfast Section */}
                                            <div className="p-5 md:p-8 hover:bg-gray-50/50 transition-colors">
                                                <div className="flex items-center justify-between mb-4 md:mb-6">
                                                    <div className="flex items-center gap-2">
                                                        <Coffee className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
                                                        <h4 className="text-xs md:text-sm font-bold text-gray-900 uppercase tracking-widest">Breakfast</h4>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 md:space-y-5">
                                                    <div className="space-y-2">
                                                        <Label className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Food Menu</Label>
                                                        {isEditing ? (
                                                            <Input
                                                                value={formData.breakfast}
                                                                onChange={e => setFormData({ ...formData, breakfast: e.target.value })}
                                                                className="h-10 md:h-11 rounded-xl bg-white border-gray-200 text-xs md:text-sm font-medium focus:ring-1 focus:ring-indigo-600"
                                                                placeholder="e.g. Omelette, Tea"
                                                            />
                                                        ) : (
                                                            <p className="text-xs md:text-sm font-medium text-gray-800 min-h-[40px] md:min-h-[44px] flex items-center leading-relaxed">{currentMenu?.breakfast || <span className="text-gray-400 italic font-normal">Not defined</span>}</p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time Window</Label>
                                                        {isEditing ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="relative flex-1">
                                                                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                                                    <Input
                                                                        type="time"
                                                                        value={formData.breakfastStart}
                                                                        onChange={e => setFormData({ ...formData, breakfastStart: e.target.value })}
                                                                        className="h-10 md:h-11 rounded-xl bg-white border-gray-200 text-[10px] md:text-xs font-bold text-gray-700 focus:ring-1 focus:ring-indigo-600 pl-8 md:pl-9"
                                                                    />
                                                                </div>
                                                                <span className="text-gray-300 font-bold">-</span>
                                                                <div className="relative flex-1">
                                                                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                                                    <Input
                                                                        type="time"
                                                                        value={formData.breakfastEnd}
                                                                        onChange={e => setFormData({ ...formData, breakfastEnd: e.target.value })}
                                                                        className="h-10 md:h-11 rounded-xl bg-white border-gray-200 text-[10px] md:text-xs font-bold text-gray-700 focus:ring-1 focus:ring-indigo-600 pl-8 md:pl-9"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-[10px] md:text-xs font-bold border border-gray-200">
                                                                <Clock className="h-3 w-3 md:h-3.5 md:w-3.5 text-gray-500" />
                                                                {displayTimeRange(currentMenu?.breakfastTime)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Lunch Section */}
                                            <div className="p-5 md:p-8 hover:bg-gray-50/50 transition-colors">
                                                <div className="flex items-center justify-between mb-4 md:mb-6">
                                                    <div className="flex items-center gap-2">
                                                        <Utensils className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
                                                        <h4 className="text-xs md:text-sm font-bold text-gray-900 uppercase tracking-widest">Lunch</h4>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 md:space-y-5">
                                                    <div className="space-y-2">
                                                        <Label className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Food Menu</Label>
                                                        {isEditing ? (
                                                            <Input
                                                                value={formData.lunch}
                                                                onChange={e => setFormData({ ...formData, lunch: e.target.value })}
                                                                className="h-10 md:h-11 rounded-xl bg-white border-gray-200 text-xs md:text-sm font-medium focus:ring-1 focus:ring-emerald-600"
                                                                placeholder="e.g. Chicken Biryani"
                                                            />
                                                        ) : (
                                                            <p className="text-xs md:text-sm font-medium text-gray-800 min-h-[40px] md:min-h-[44px] flex items-center leading-relaxed">{currentMenu?.lunch || <span className="text-gray-400 italic font-normal">Not defined</span>}</p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time Window</Label>
                                                        {isEditing ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="relative flex-1">
                                                                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                                                    <Input
                                                                        type="time"
                                                                        value={formData.lunchStart}
                                                                        onChange={e => setFormData({ ...formData, lunchStart: e.target.value })}
                                                                        className="h-10 md:h-11 rounded-xl bg-white border-gray-200 text-[10px] md:text-xs font-bold text-gray-700 focus:ring-1 focus:ring-emerald-600 pl-8 md:pl-9"
                                                                    />
                                                                </div>
                                                                <span className="text-gray-300 font-bold">-</span>
                                                                <div className="relative flex-1">
                                                                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                                                    <Input
                                                                        type="time"
                                                                        value={formData.lunchEnd}
                                                                        onChange={e => setFormData({ ...formData, lunchEnd: e.target.value })}
                                                                        className="h-10 md:h-11 rounded-xl bg-white border-gray-200 text-[10px] md:text-xs font-bold text-gray-700 focus:ring-1 focus:ring-emerald-600 pl-8 md:pl-9"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-[10px] md:text-xs font-bold border border-gray-200">
                                                                <Clock className="h-3 w-3 md:h-3.5 md:w-3.5 text-gray-500" />
                                                                {displayTimeRange(currentMenu?.lunchTime)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dinner Section */}
                                            <div className="p-5 md:p-8 hover:bg-gray-50/50 transition-colors">
                                                <div className="flex items-center justify-between mb-4 md:mb-6">
                                                    <div className="flex items-center gap-2">
                                                        <Utensils className="h-4 w-4 md:h-5 md:w-5 text-indigo-500" />
                                                        <h4 className="text-xs md:text-sm font-bold text-gray-900 uppercase tracking-widest">Dinner</h4>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 md:space-y-5">
                                                    <div className="space-y-2">
                                                        <Label className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Food Menu</Label>
                                                        {isEditing ? (
                                                            <Input
                                                                value={formData.dinner}
                                                                onChange={e => setFormData({ ...formData, dinner: e.target.value })}
                                                                className="h-10 md:h-11 rounded-xl bg-white border-gray-200 text-xs md:text-sm font-medium focus:ring-1 focus:ring-indigo-600"
                                                                placeholder="e.g. Daal Mash, Roti"
                                                            />
                                                        ) : (
                                                            <p className="text-xs md:text-sm font-medium text-gray-800 min-h-[40px] md:min-h-[44px] flex items-center leading-relaxed">{currentMenu?.dinner || <span className="text-gray-400 italic font-normal">Not defined</span>}</p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time Window</Label>
                                                        {isEditing ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="relative flex-1">
                                                                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                                                    <Input
                                                                        type="time"
                                                                        value={formData.dinnerStart}
                                                                        onChange={e => setFormData({ ...formData, dinnerStart: e.target.value })}
                                                                        className="h-10 md:h-11 rounded-xl bg-white border-gray-200 text-[10px] md:text-xs font-bold text-gray-700 focus:ring-1 focus:ring-indigo-600 pl-8 md:pl-9"
                                                                    />
                                                                </div>
                                                                <span className="text-gray-300 font-bold">-</span>
                                                                <div className="relative flex-1">
                                                                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                                                    <Input
                                                                        type="time"
                                                                        value={formData.dinnerEnd}
                                                                        onChange={e => setFormData({ ...formData, dinnerEnd: e.target.value })}
                                                                        className="h-10 md:h-11 rounded-xl bg-white border-gray-200 text-[10px] md:text-xs font-bold text-gray-700 focus:ring-1 focus:ring-indigo-600 pl-8 md:pl-9"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-[10px] md:text-xs font-bold border border-gray-200">
                                                                <Clock className="h-3 w-3 md:h-3.5 md:w-3.5 text-gray-500" />
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

export default AdminMessMenu;
