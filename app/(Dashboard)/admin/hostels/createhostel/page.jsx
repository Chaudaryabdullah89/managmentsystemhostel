"use client"
import React, { useEffect, useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Save,
    ArrowLeft,
    Building2,
    ShieldCheck,
    MapPin,
    Coins,
    Sparkle,
    Users,
    Check,
    X,
    Loader2,
    Utensils,
    Shirt
} from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CreateHostel } from '../../../../../hooks/usehostel'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Badge } from "@/components/ui/badge"

const CreateHostelPage = () => {
    const router = useRouter();
    const [wardenlist, setWardenList] = useState([]);
    const [asssignedwarden, setassignedwarden] = useState([])
    const [hostelname, setHostelName] = useState('');
    const [warden, setwarden] = useState([]);
    const [contact, setContact] = useState('');
    const [email, setEmail] = useState('');
    const [floors, setFloors] = useState('');
    const [mess, setMess] = useState('No');
    const [laundry, setLaundry] = useState('No');
    const [city, setCity] = useState('');
    const [state, setState] = useState('Pakistan');
    const [zip, setZip] = useState('');
    const [street, setStreet] = useState('');
    const [completeAddress, setCompleteAddress] = useState('');
    const [country, setCountry] = useState('Pakistan');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('ACTIVE');
    const [rooms, setRooms] = useState('');
    const [type, setType] = useState('BOYS');
    const [pricePerNight, setpricepernight] = useState('')
    const [montlypayment, setmontlypayment] = useState('')
    const [cleaningInterval, setCleaningInterval] = useState('24')
    const [laundryInterval, setLaundryInterval] = useState('48')
    const { mutate, isPending: createhostelloading } = CreateHostel();

    const handleCreateHostel = () => {
        if (!hostelname || !city) {
            toast.error("Hostel name and city are required.");
            return;
        }
        mutate({
            hostelname,
            contact,
            email,
            floors: parseInt(floors) || 0,
            mess,
            laundry,
            city,
            state,
            zip,
            pricePerNight: parseFloat(pricePerNight) || 0,
            montlypayment: parseFloat(montlypayment) || 0,
            street,
            completeAddress,
            country,
            description,
            status: status.toUpperCase(),
            rooms: parseInt(rooms) || 0,
            warden: asssignedwarden,
            type: type.toUpperCase(),
            cleaningInterval: parseInt(cleaningInterval) || 24,
            laundryInterval: parseInt(laundryInterval) || 48
        });
    };

    useEffect(() => {
        async function getwarden() {
            try {
                const response = await fetch("/api/users/warden")
                if (!response.ok) {
                    toast.error("Error Occurred While Loading Wardens")
                    throw new Error("Error Occurred While Loading Wardens");
                }
                const wardensRes = await response.json()
                if (wardensRes.success) {
                    setWardenList(wardensRes.data.map((w) => ({
                        name: w.name,
                        id: w.id,
                        canManageExpenses: w.canManageExpenses
                    })));
                }
            } catch (error) {
                console.error("Failed to fetch wardens:", error);
            }
        }
        getwarden();
    }, [])

    const toggleExpensePermission = async (wardenId, currentStatus, e) => {
        e.stopPropagation();
        try {
            const response = await fetch(`/api/users/profile/${wardenId}/update`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ canManageExpenses: !currentStatus }),
            });
            if (response.ok) {
                toast.success("Expense management permission updated");
                setWardenList(prev => prev.map(w =>
                    w.id === wardenId ? { ...w, canManageExpenses: !currentStatus } : w
                ));
                setwarden(prev => prev.map(w =>
                    w.id === wardenId ? { ...w, canManageExpenses: !currentStatus } : w
                ));
            } else {
                toast.error("Failed to update permission");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-background font-sans pb-24">
            {/* Sticky Header */}
            <div className="bg-white dark:bg-card border-b border-slate-200/80 dark:border-border sticky top-0 z-40 shadow-xs">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="rounded-xl hover:bg-slate-100 dark:hover:bg-muted/10 h-9 w-9 shrink-0 text-slate-600 dark:text-muted-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-5 w-px bg-slate-200 dark:bg-border hidden sm:block" />
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-foreground tracking-tight truncate">
                                Add New Hostel
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-muted-foreground truncate">
                                Property Management • Register new hostel branch in property registry
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-muted/10 hidden sm:flex"
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-5 rounded-xl text-xs font-semibold shadow-sm gap-2 transition-all active:scale-95"
                            onClick={handleCreateHostel}
                            disabled={createhostelloading}
                        >
                            {createhostelloading ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="h-3.5 w-3.5" />
                                    <span>Save Hostel</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Primary Left Columns */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Property Identity Card */}
                        <Card className="border border-slate-200/80 dark:border-border shadow-xs bg-white dark:bg-card rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-muted/10 px-6 py-4">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-foreground">
                                    <Building2 className="h-4 w-4 text-indigo-600" />
                                    Property Identity & Classification
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500">
                                    Hostel title, gender designation, and building dimensions.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Hostel Branch Name *</Label>
                                        <Input
                                            placeholder="e.g. Executive Boys Hostel"
                                            className="h-10 bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-600"
                                            value={hostelname}
                                            onChange={(e) => setHostelName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Gender Type *</Label>
                                        <Select value={type} onValueChange={setType}>
                                            <SelectTrigger className="h-10 w-full bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-600">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-200">
                                                <SelectItem value="BOYS">BOYS RESIDENCE</SelectItem>
                                                <SelectItem value="GIRLS">GIRLS RESIDENCE</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Operational Status *</Label>
                                        <Select value={status} onValueChange={setStatus}>
                                            <SelectTrigger className="h-10 w-full bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-600">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-200">
                                                <SelectItem value="ACTIVE">🟢 ACTIVE</SelectItem>
                                                <SelectItem value="INACTIVE">🔴 INACTIVE</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Total Floors</Label>
                                        <Input
                                            type="number"
                                            value={floors}
                                            onChange={(e) => setFloors(e.target.value)}
                                            placeholder="3"
                                            className="h-10 bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Room Count</Label>
                                        <Input
                                            type="number"
                                            value={rooms}
                                            onChange={(e) => setRooms(e.target.value)}
                                            placeholder="20"
                                            className="h-10 bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-600"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Staff & Wardens Selection */}
                        <Card className="border border-slate-200/80 dark:border-border shadow-xs bg-white dark:bg-card rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-muted/10 px-6 py-4">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-foreground">
                                    <Users className="h-4 w-4 text-indigo-600" />
                                    Assigned Property Wardens & Staff
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500">
                                    Grant hostel branch management authority to registered wardens.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                {warden.length > 0 && (
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-slate-500">Assigned Wardens</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {warden.map((w) => (
                                                <Badge
                                                    key={w.id}
                                                    className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-1 text-xs font-medium flex items-center gap-2"
                                                >
                                                    <span>{w.name}</span>
                                                    <X
                                                        className="h-3.5 w-3.5 cursor-pointer hover:text-indigo-900 transition-colors"
                                                        onClick={() => {
                                                            setwarden(prev => prev.filter(item => item.id !== w.id));
                                                            setassignedwarden(prev => prev.filter(id => id !== w.id));
                                                        }}
                                                    />
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 pt-2">
                                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Select Wardens to Assign</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
                                        {wardenlist.map((w) => {
                                            const isAssigned = warden.some(existing => existing.id === w.id);
                                            return (
                                                <div
                                                    key={w.id}
                                                    onClick={() => {
                                                        if (!isAssigned) {
                                                            setwarden(prev => [...prev, w]);
                                                            setassignedwarden(prev => [...prev, w.id]);
                                                        } else {
                                                            setwarden(prev => prev.filter(item => item.id !== w.id));
                                                            setassignedwarden(prev => prev.filter(id => id !== w.id));
                                                        }
                                                    }}
                                                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${isAssigned ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-800' : 'bg-slate-50/50 border-slate-200/80 text-slate-700 dark:bg-muted/10 dark:border-border hover:bg-slate-100'}`}
                                                >
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-semibold truncate">{w.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => toggleExpensePermission(w.id, w.canManageExpenses, e)}
                                                            className="text-[11px] text-slate-500 hover:text-indigo-600 text-left mt-0.5 font-medium underline"
                                                        >
                                                            Expense Mgmt: {w.canManageExpenses ? "Allowed" : "Restricted"}
                                                        </button>
                                                    </div>
                                                    <div className={`h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 ${isAssigned ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                                                        {isAssigned && <Check className="h-3 w-3" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Location Details */}
                        <Card className="border border-slate-200/80 dark:border-border shadow-xs bg-white dark:bg-card rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-muted/10 px-6 py-4">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-foreground">
                                    <MapPin className="h-4 w-4 text-emerald-600" />
                                    Contact & Location Details
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500">
                                    Public phone, email, street address, and city location.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Phone Contact</Label>
                                        <Input
                                            value={contact}
                                            onChange={(e) => setContact(e.target.value)}
                                            placeholder="+92 300 1234567"
                                            className="h-10 bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Property Email</Label>
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="contact@hostel.com"
                                            className="h-10 bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-600"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Street Address</Label>
                                        <Input
                                            value={street}
                                            onChange={(e) => setStreet(e.target.value)}
                                            placeholder="Street 4, Sector G-9"
                                            className="h-10 bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">City *</Label>
                                        <Input
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            placeholder="Islamabad"
                                            className="h-10 bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-600"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Complete Address</Label>
                                    <Textarea
                                        rows={3}
                                        value={completeAddress}
                                        onChange={(e) => setCompleteAddress(e.target.value)}
                                        placeholder="Full formatted address for invoices..."
                                        className="bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-600 resize-none"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Financials & Facilities */}
                    <div className="space-y-6">
                        <Card className="border border-slate-200/80 dark:border-border shadow-xs bg-white dark:bg-card rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-muted/10 px-6 py-4">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-foreground">
                                    <Coins className="h-4 w-4 text-emerald-600" />
                                    Commercial Pricing Base
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Monthly Rent Base (PKR/month)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">PKR</span>
                                        <Input
                                            type="number"
                                            placeholder="15000"
                                            value={montlypayment}
                                            onChange={(e) => setmontlypayment(e.target.value)}
                                            className="pl-12 h-10 bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-semibold focus-visible:ring-2 focus-visible:ring-indigo-600"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Per Night Rate (PKR/night)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">PKR</span>
                                        <Input
                                            type="number"
                                            placeholder="1200"
                                            value={pricePerNight}
                                            onChange={(e) => setpricepernight(e.target.value)}
                                            className="pl-12 h-10 bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-600"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200/80 dark:border-border shadow-xs bg-white dark:bg-card rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-muted/10 px-6 py-4">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-foreground">
                                    <Sparkle className="h-4 w-4 text-indigo-600" />
                                    Facilities & Services
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <Utensils className="h-3.5 w-3.5 text-amber-500" />
                                            Mess Service
                                        </Label>
                                        <Select value={mess} onValueChange={setMess}>
                                            <SelectTrigger className="h-10 w-full bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-600">
                                                <SelectValue placeholder="Mess" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-200">
                                                <SelectItem value="Yes">Yes (Available)</SelectItem>
                                                <SelectItem value="No">No (Not Provided)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <Shirt className="h-3.5 w-3.5 text-blue-500" />
                                            Laundry Service
                                        </Label>
                                        <Select value={laundry} onValueChange={setLaundry}>
                                            <SelectTrigger className="h-10 w-full bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-600">
                                                <SelectValue placeholder="Laundry" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-200">
                                                <SelectItem value="Yes">Yes (Available)</SelectItem>
                                                <SelectItem value="No">No (Not Provided)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200/80 dark:border-border shadow-xs bg-white dark:bg-card rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-muted/10 px-6 py-4">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-foreground">
                                    <ShieldCheck className="h-4 w-4 text-slate-600" />
                                    Internal Audit Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <Textarea
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Building description, rules, or internal notes..."
                                    className="bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-600 resize-none"
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateHostelPage;
