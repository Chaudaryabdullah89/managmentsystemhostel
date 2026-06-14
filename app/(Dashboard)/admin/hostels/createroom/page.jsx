"use client"
import React, { useEffect, useState, Suspense } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ChevronDown, X, Save, ArrowLeft, Building2, Info, LayoutGrid, Coins, Sparkle, ShieldCheck, Image as ImageIcon } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from "@/components/ui/badge"

const CreateRoomForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preSelectedHostelId = searchParams.get('hostelId');

    const [hostels, setHostels] = useState([]);
    const [selectedHostel, setSelectedHostel] = useState(null);
    const [roomNumber, setRoomNumber] = useState('');
    const [floor, setFloor] = useState('');
    const [type, setType] = useState('SINGLE');
    const [capacity, setCapacity] = useState('1');
    const [status, setStatus] = useState('AVAILABLE');
    const [price, setPrice] = useState('');
    const [pricepernight, setPricepernight] = useState('');
    const [monthlyrent, setMonthlyrent] = useState('');
    const [description, setDescription] = useState('');
    const [amenities, setAmenities] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [cleaningInterval, setCleaningInterval] = useState('24');
    const [laundryInterval, setLaundryInterval] = useState('48');

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchHostels = async () => {
            try {
                const response = await fetch('/api/hostels');
                const data = await response.json();
                if (data.success && data.data) {
                    setHostels(data.data);
                    if (preSelectedHostelId) {
                        const hostel = data.data.find(h => h.id === preSelectedHostelId);
                        if (hostel) setSelectedHostel(hostel);
                    }
                }
            } catch (error) {
                console.error("Error fetching hostels:", error);
                toast.error("Error loading property registry");
            }
        };
        fetchHostels();
    }, [preSelectedHostelId]);

    const handleCreateRoom = async () => {
        if (!selectedHostel || !roomNumber || !floor || !price || !monthlyrent || !pricepernight) {
            toast.error("Please fill in all required fields.");
            return;
        }
        setIsSubmitting(true);

        try {
            const roomPayload = {
                hostelId: selectedHostel.id,
                roomNumber,
                floor: parseInt(floor),
                type,
                capacity: parseInt(capacity),
                status,
                price: parseFloat(price),
                pricepernight: parseFloat(pricepernight),
                monthlyrent: parseFloat(monthlyrent),
                cleaningInterval: parseInt(cleaningInterval),
                laundryInterval: parseInt(laundryInterval),
                description,
                amenities: amenities ? amenities.split(',').map(a => a.trim()).filter(a => a) : [],
                images: imageUrl ? [imageUrl] : []
            };

            const response = await fetch('/api/rooms/createroom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roomPayload)
            });

            const data = await response.json();
            if (data.success) {
                toast.success("Unit successfully registered.");
                router.push(`/admin/hostels/${selectedHostel.id}/rooms`);
            } else {
                toast.error(data.error || "Failed to register unit.");
            }
        } catch (error) {
            console.error("Error creating room:", error);
            toast.error("An internal error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background">
            {/* Synced Header */}
            <div className="bg-white dark:bg-card border-b sticky top-0 z-40 h-16">
                <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-gray-100">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-200" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 dark:text-foreground tracking-tight leading-none">Add New Room</h1>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest leading-none mt-1">Room Records</p>
                        </div>
                    </div>
                    <Button
                        className="bg-black hover:bg-gray-800 text-white h-9 px-6 rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-sm gap-2 transition-all"
                        onClick={handleCreateRoom}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Processing..." : "Save Room"}
                        {!isSubmitting && <Save className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Primary Form Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Parent Selection */}
                        <Card className="border border-gray-100 dark:border-border shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white dark:bg-card">
                            <CardHeader className="px-8 pt-8 pb-4">
                                <CardTitle className="text-[11px] font-bold flex items-center gap-2 uppercase tracking-widest text-gray-400 dark:text-muted-foreground">
                                    <Building2 className="h-4 w-4 text-blue-500" />
                                    Property Placement
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-8 pb-8">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider">Select Hostel *</Label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full h-11 justify-between rounded-xl border-gray-100 dark:border-border bg-white dark:bg-card font-bold text-gray-900 dark:text-foreground">
                                                <span>{selectedHostel ? selectedHostel.name : 'Choose Building'}</span>
                                                <ChevronDown className="h-4 w-4 opacity-40" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-[400px] rounded-2xl border-gray-100 dark:border-border shadow-xl p-2">
                                            {hostels.map((h) => (
                                                <DropdownMenuItem key={h.id} onClick={() => setSelectedHostel(h)} className="p-3 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">
                                                    {h.name} <span className="text-[9px] text-gray-400 dark:text-muted-foreground ml-2">— {h.city}</span>
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Unit Identity */}
                        <Card className="border border-gray-100 dark:border-border shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white dark:bg-card">
                            <CardHeader className="px-8 pt-8 pb-4">
                                <CardTitle className="text-[11px] font-bold flex items-center gap-2 uppercase tracking-widest text-gray-400 dark:text-muted-foreground">
                                    <LayoutGrid className="h-4 w-4 text-purple-500" />
                                    Room Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider">Room Number *</Label>
                                        <Input
                                            placeholder="e.g. B-102"
                                            className="h-11 bg-white dark:bg-card border-gray-100 dark:border-border rounded-xl font-bold text-gray-900 dark:text-foreground placeholder:text-gray-200 focus:ring-1 focus:ring-black"
                                            value={roomNumber}
                                            onChange={(e) => setRoomNumber(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider">Floor Level *</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            className="h-11 bg-white dark:bg-card border-gray-100 dark:border-border rounded-xl font-bold text-gray-900 dark:text-foreground focus:ring-1 focus:ring-black"
                                            value={floor}
                                            onChange={(e) => setFloor(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider">Room Type *</Label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full h-11 justify-between rounded-xl border-gray-100 dark:border-border bg-white dark:bg-card font-bold text-gray-900 dark:text-foreground">
                                                    <span>{type}</span>
                                                    <ChevronDown className="h-4 w-4 opacity-40" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[300px] rounded-2xl border-gray-100 dark:border-border shadow-xl p-2">
                                                {['SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY'].map(t => (
                                                    <DropdownMenuItem key={t} onClick={() => setType(t)} className="p-3 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">{t}</DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider">Capacity (Beds) *</Label>
                                        <Input
                                            type="number"
                                            className="h-11 bg-white dark:bg-card border-gray-100 dark:border-border rounded-xl font-bold text-gray-900 dark:text-foreground focus:ring-1 focus:ring-black"
                                            value={capacity}
                                            onChange={(e) => setCapacity(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 pt-4 border-t border-gray-50">
                                    <Label className="text-[11px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider">Status *</Label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full h-11 justify-between rounded-xl border-gray-100 dark:border-border bg-white dark:bg-card font-bold text-gray-900 dark:text-foreground transition-colors hover:bg-gray-50 dark:hover:bg-muted/5 dark:bg-muted/10">
                                                <span className="flex items-center gap-2 uppercase tracking-wider">
                                                    <div className={`h-1.5 w-1.5 rounded-full ${status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                                    {status}
                                                </span>
                                                <ChevronDown className="h-4 w-4 opacity-40" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-[400px] rounded-2xl border-gray-100 dark:border-border shadow-xl p-2">
                                            {['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLEANING'].map(s => (
                                                <DropdownMenuItem key={s} onClick={() => setStatus(s)} className="p-3 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">{s}</DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Service Schedule */}
                        <Card className="border border-gray-100 dark:border-border shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white dark:bg-card font-sans">
                            <CardHeader className="px-8 pt-8 pb-4">
                                <CardTitle className="text-[11px] font-bold flex items-center gap-2 uppercase tracking-widest text-gray-400 dark:text-muted-foreground">
                                    <Sparkle className="h-4 w-4 text-emerald-500" />
                                    Cleaning & Laundry Plan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider">Cleaning Interval (Hours)</Label>
                                        <Input
                                            type="number"
                                            placeholder="24"
                                            className="h-11 bg-white dark:bg-card border-gray-100 dark:border-border rounded-xl font-bold text-gray-900 dark:text-foreground focus:ring-1 focus:ring-black"
                                            value={cleaningInterval}
                                            onChange={(e) => setCleaningInterval(e.target.value)}
                                        />
                                        <p className="text-[9px] text-gray-400 dark:text-muted-foreground font-medium italic">New log entry every {cleaningInterval} hours</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider">Laundry Interval (Hours)</Label>
                                        <Input
                                            type="number"
                                            placeholder="48"
                                            className="h-11 bg-white dark:bg-card border-gray-100 dark:border-border rounded-xl font-bold text-gray-900 dark:text-foreground focus:ring-1 focus:ring-black"
                                            value={laundryInterval}
                                            onChange={(e) => setLaundryInterval(e.target.value)}
                                        />
                                        <p className="text-[9px] text-gray-400 dark:text-muted-foreground font-medium italic">New log entry every {laundryInterval} hours</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Configuration */}
                    <div className="space-y-6">
                        {/* Financial Ledger */}
                        <Card className="border border-gray-100 dark:border-border shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] bg-white dark:bg-card overflow-hidden">
                            <CardHeader className="bg-gray-50 dark:bg-background border-b border-gray-100 dark:border-border px-6 py-5 text-center">
                                <CardTitle className="text-[10px] font-black text-gray-900 dark:text-foreground tracking-widest uppercase">Rent & Price</CardTitle>
                            </CardHeader>
                            <div className="p-6 space-y-5">
                                <div className="space-y-1.5 flex flex-col">
                                    <Label className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest text-center">Base Price *</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-300">PKR</span>
                                        <Input type="number" className="pl-14 h-11 bg-gray-50 dark:bg-background border-gray-100 dark:border-border rounded-2xl font-black text-lg text-center focus:bg-white dark:bg-card transition-all" value={price} onChange={(e) => setPrice(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-1.5 flex flex-col">
                                    <Label className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest text-center">Monthly Rent *</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-300">PKR</span>
                                        <Input type="number" className="pl-14 h-11 bg-emerald-50/30 border-emerald-100/30 rounded-2xl font-black text-lg text-center text-emerald-700 focus:bg-white dark:bg-card transition-all" value={monthlyrent} onChange={(e) => setMonthlyrent(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-1.5 flex flex-col">
                                    <Label className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest text-center">Price Per Night *</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-blue-300">PKR</span>
                                        <Input type="number" className="pl-14 h-11 bg-blue-50/30 border-blue-100/30 rounded-2xl font-black text-lg text-center text-blue-700 focus:bg-white dark:bg-card transition-all" value={pricepernight} onChange={(e) => setPricepernight(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Extended Details */}
                        <Card className="border border-gray-100 dark:border-border shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white dark:bg-card overflow-hidden rounded-[2rem]">
                            <CardHeader className="px-8 pt-8 pb-4">
                                <CardTitle className="text-[10px] font-bold flex items-center gap-2 uppercase tracking-[0.2em] text-gray-400 dark:text-muted-foreground">
                                    <Info className="h-4 w-4 text-indigo-500" />
                                    Extended details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 space-y-6">
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest ml-1">Internal Notes</Label>
                                    <Textarea
                                        className="bg-gray-50 dark:bg-background border-gray-100 dark:border-border text-gray-900 dark:text-foreground text-[11px] font-medium min-h-[120px] rounded-xl focus:bg-white dark:bg-card focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none pt-4 placeholder:text-gray-300"
                                        placeholder="Add any specific notes about this unit..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest ml-1">Amenities (Comma Separated)</Label>
                                    <Input
                                        className="h-11 bg-gray-50 dark:bg-background border-gray-100 dark:border-border rounded-xl font-bold text-gray-900 dark:text-foreground focus:bg-white dark:bg-card transition-all placeholder:text-gray-200"
                                        placeholder="WiFi, AC, Attached Bath..."
                                        value={amenities}
                                        onChange={(e) => setAmenities(e.target.value)}
                                    />
                                </div>

                                {/* <div className="space-y-2.5">
                                    <Label className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest ml-1">Image Link</Label>
                                    <div className="relative">
                                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                                        <Input
                                            className="h-11 pl-12 bg-gray-50 dark:bg-background border-gray-100 dark:border-border rounded-xl font-medium text-[11px] text-gray-600 dark:text-muted-foreground focus:bg-white dark:bg-card transition-all"
                                            placeholder="Paste image URL here..."
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                        />
                                    </div>
                                </div> */}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function CreateRoomPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 border-[3px] border-gray-200 dark:border-border border-t-black rounded-full animate-spin" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Loading Registry Protocol...</p>
                </div>
            </div>
        }>
            <CreateRoomForm />
        </Suspense>
    );
}
