"use client"
import React, { useEffect, useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ChevronDown, Save, ArrowLeft, LayoutGrid, Coins, Sparkle, ShieldCheck, Clock, Image as ImageIcon, Loader2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from 'sonner'
import { useRouter, useParams } from 'next/navigation'
import { Badge } from "@/components/ui/badge"
import { useSingleRoomByHostelId } from "@/hooks/useRoom"
import Loader from "@/components/ui/Loader"

const EditRoomPage = () => {
    const router = useRouter();
    const params = useParams();
    const { hostelId: hostelName, roomId } = params;

    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const hostelId = searchParams.get('hostelId');

    const { data: roomResponse, isLoading: isFetching } = useSingleRoomByHostelId(hostelId, roomId);
    const room = roomResponse?.data;

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
        if (room) {
            setRoomNumber(room.roomNumber || '');
            setFloor(room.floor?.toString() || '');
            setType(room.type || 'SINGLE');
            setCapacity(room.capacity?.toString() || '1');
            setStatus(room.status || 'AVAILABLE');
            setPrice(room.price?.toString() || '');
            setPricepernight(room.pricepernight?.toString() || '');
            setMonthlyrent(room.monthlyrent?.toString() || '');
            setDescription(room.description || '');
            setAmenities(room.amenities?.join(', ') || '');
            setImageUrl(room.images?.[0] || '');
            setCleaningInterval(room.cleaningInterval?.toString() || '24');
            setLaundryInterval(room.laundryInterval?.toString() || '48');
        }
    }, [room]);

    const handleUpdateRoom = async () => {
        if (!roomNumber || !floor || !price || !monthlyrent || !pricepernight) {
            toast.error("Please fill in all required fields.");
            return;
        }
        setIsSubmitting(true);

        try {
            const roomPayload = {
                id: roomId,
                hostelId: hostelId,
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

            const response = await fetch('/api/rooms/editroom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roomPayload)
            });

            const data = await response.json();
            if (data.success) {
                toast.success("Unit modifications synced.");
                router.push(`/admin/hostels/${hostelName}/room-details/room/${roomId}?hostelId=${hostelId}`);
            } else {
                toast.error(data.error || "Failed to update unit.");
            }
        } catch (error) {
            console.error("Error updating room:", error);
            toast.error("An internal error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isFetching) return <Loader label="Syncing Unit Config" subLabel={`Retrieving artifact manifest for Unit ${roomNumber || '...'}`} icon={LayoutGrid} />;

    return (
        <div className="min-h-screen bg-gray-50/30 pb-20">
            <header className="bg-white border-b sticky top-0 z-40 py-2 md:h-16">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl hover:bg-gray-100 h-9 w-9 shrink-0">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="h-6 w-px bg-gray-100 hidden md:block" />
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm md:text-lg font-black text-gray-900 tracking-tight leading-none truncate uppercase">Modify Unit Config</h1>
                            <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 truncate">
                                Unit {roomNumber} • <span className="text-purple-500">Registry System</span>
                            </p>
                        </div>
                    </div>

                    <Button
                        className="h-9 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 gap-2"
                        onClick={handleUpdateRoom}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Syncing..." : "Sync Changes"}
                        {!isSubmitting && <Save className="h-3.5 w-3.5" />}
                    </Button>
                </div>
            </header>

            <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Primary Form Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Unit Identity */}
                        <Card className="border border-gray-100 rounded-[2rem] shadow-sm bg-white overflow-hidden">
                            <CardHeader className="p-6 md:p-8 border-b border-gray-50 bg-gray-50/30">
                                <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-[0.2em] text-gray-400">
                                    <LayoutGrid className="h-4 w-4 text-purple-500" />
                                    Unit Specification Profile
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Room Identifier *</Label>
                                        <Input
                                            placeholder="e.g. B-102"
                                            className="h-12 bg-gray-50/50 border-gray-100 rounded-xl font-black text-xs md:text-sm text-gray-900 focus:bg-white transition-all shadow-inner"
                                            value={roomNumber}
                                            onChange={(e) => setRoomNumber(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Floor Vector *</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            className="h-12 bg-gray-50/50 border-gray-100 rounded-xl font-black text-xs md:text-sm text-gray-900 focus:bg-white transition-all shadow-inner"
                                            value={floor}
                                            onChange={(e) => setFloor(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Classification *</Label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full h-12 justify-between rounded-xl border-gray-100 bg-gray-50/50 font-black text-[10px] md:text-xs text-gray-900 transition-all hover:bg-white uppercase tracking-widest shadow-inner">
                                                    <span>{type} Suite</span>
                                                    <ChevronDown className="h-4 w-4 opacity-40" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[300px] rounded-2xl border-gray-100 shadow-2xl p-2 bg-white/95 backdrop-blur-xl">
                                                {['SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY'].map(t => (
                                                    <DropdownMenuItem key={t} onClick={() => setType(t)} className="p-3 font-black text-[10px] uppercase tracking-widest rounded-xl cursor-pointer hover:bg-gray-50 focus:bg-indigo-50 focus:text-indigo-600 transition-all">{t} SUITE</DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Capacity Node *</Label>
                                        <Input
                                            type="number"
                                            className="h-12 bg-gray-50/50 border-gray-100 rounded-xl font-black text-xs md:text-sm text-gray-900 focus:bg-white transition-all shadow-inner"
                                            value={capacity}
                                            onChange={(e) => setCapacity(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status Management */}
                        <Card className="border border-gray-100 rounded-[2rem] shadow-sm bg-white overflow-hidden">
                            <CardHeader className="p-6 md:p-8 border-b border-gray-50 bg-gray-50/30">
                                <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-[0.2em] text-gray-400">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                    Operational Lifecycle Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Vector *</Label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full h-12 justify-between rounded-xl border-gray-100 bg-gray-50/50 font-black text-[10px] md:text-xs text-gray-900 transition-all hover:bg-white uppercase tracking-widest shadow-inner">
                                                <span className="flex items-center gap-2">
                                                    <div className={`h-1.5 w-1.5 rounded-full ${status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                                                    {status} Mode
                                                </span>
                                                <ChevronDown className="h-4 w-4 opacity-40" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-[300px] rounded-2xl border-gray-100 shadow-2xl p-2 bg-white/95 backdrop-blur-xl">
                                            {['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLEANING'].map(s => (
                                                <DropdownMenuItem key={s} onClick={() => setStatus(s)} className="p-3 font-black text-[10px] uppercase tracking-widest rounded-xl cursor-pointer hover:bg-gray-50 transition-all">{s} MODE</DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Service Schedule */}
                        <Card className="border border-gray-100 rounded-[2rem] shadow-sm bg-white overflow-hidden">
                            <CardHeader className="p-6 md:p-8 border-b border-gray-50 bg-gray-50/30">
                                <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-[0.2em] text-gray-400">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    Service Schedule (Auto-Log)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cleaning Frequency (H)</Label>
                                        <Input
                                            type="number"
                                            placeholder="24"
                                            className="h-12 bg-gray-50/50 border-gray-100 rounded-xl font-black text-xs md:text-sm text-gray-900 focus:bg-white transition-all shadow-inner"
                                            value={cleaningInterval}
                                            onChange={(e) => setCleaningInterval(e.target.value)}
                                        />
                                        <p className="text-[8px] text-indigo-500 font-black uppercase tracking-widest mt-1 italic ml-1 opacity-60">Auto-log entry every {cleaningInterval} hours</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Logistics Frequency (H)</Label>
                                        <Input
                                            type="number"
                                            placeholder="48"
                                            className="h-12 bg-gray-50/50 border-gray-100 rounded-xl font-black text-xs md:text-sm text-gray-900 focus:bg-white transition-all shadow-inner"
                                            value={laundryInterval}
                                            onChange={(e) => setLaundryInterval(e.target.value)}
                                        />
                                        <p className="text-[8px] text-blue-500 font-black uppercase tracking-widest mt-1 italic ml-1 opacity-60">Auto-log entry every {laundryInterval} hours</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Configuration */}
                    <div className="space-y-6">
                        {/* Financial Ledger */}
                        <Card className="border border-gray-100 rounded-[2rem] shadow-sm bg-white overflow-hidden">
                            <CardHeader className="bg-gray-950 border-b border-white/5 px-6 py-5 text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-5"><Coins className="h-12 w-12 text-white" /></div>
                                <CardTitle className="text-[10px] font-black text-white tracking-[0.3em] uppercase relative z-10">Asset Commercials</CardTitle>
                            </CardHeader>
                            <div className="p-6 space-y-5">
                                <div className="space-y-2 flex flex-col">
                                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Reference Value *</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-300">PKR</span>
                                        <Input type="number" className="pl-14 h-12 bg-gray-50/50 border-gray-100 rounded-2xl font-black text-lg text-center focus:bg-white transition-all shadow-inner italic" value={price} onChange={(e) => setPrice(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2 flex flex-col">
                                    <Label className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest text-center">Monthly Yield *</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-300">PKR</span>
                                        <Input type="number" className="pl-14 h-12 bg-emerald-50/30 border-emerald-100/30 rounded-2xl font-black text-lg text-center text-emerald-700 focus:bg-white transition-all shadow-inner italic" value={monthlyrent} onChange={(e) => setMonthlyrent(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2 flex flex-col">
                                    <Label className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest text-center">Nocturnal Tariff *</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-blue-300">PKR</span>
                                        <Input type="number" className="pl-14 h-12 bg-blue-50/30 border-blue-100/30 rounded-2xl font-black text-lg text-center text-blue-700 focus:bg-white transition-all shadow-inner italic" value={pricepernight} onChange={(e) => setPricepernight(e.target.value)} />
                                    </div>
                                </div>
                                <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest text-center leading-relaxed">Financial parameters are synced with invoice agents across the network.</p>
                            </div>
                        </Card>

                        {/* Audit Details */}
                        <Card className="border border-gray-100 bg-gray-950 rounded-[2rem] shadow-2xl overflow-hidden p-6 md:p-8 relative">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <ShieldCheck className="h-20 w-20 text-indigo-500" />
                            </div>
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-8 border-b border-white/5 pb-4 italic">Artifact Registry</h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-between">
                                        Registry Notes
                                        <Sparkle className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                                    </Label>
                                    <Textarea
                                        className="bg-white/5 border-white/10 text-white text-xs font-black min-h-[140px] rounded-2xl focus:border-indigo-500/50 transition-all resize-none shadow-inner"
                                        placeholder="Internal property metadata..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Amenities Manifest (CSV)</Label>
                                    <Input
                                        className="bg-white/5 border-white/10 text-white text-[10px] font-black h-11 rounded-xl focus:border-indigo-500/50 uppercase tracking-tight shadow-inner"
                                        placeholder="WiFi, AC, Attached Bath..."
                                        value={amenities}
                                        onChange={(e) => setAmenities(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Media Anchor Point</Label>
                                    <div className="relative">
                                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600" />
                                        <Input
                                            className="bg-white/5 border-white/10 text-white text-[10px] font-black h-11 pl-11 rounded-xl focus:border-indigo-500/50 shadow-inner"
                                            placeholder="Image URL..."
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Architecture Bar */}
            <div className="fixed bottom-0 w-full z-40 px-4 md:px-6 pb-4 pointer-events-none left-0">
                <div className="max-w-[1200px] mx-auto bg-gray-950/90 backdrop-blur-xl border border-white/5 text-white h-12 rounded-2xl shadow-2xl flex items-center justify-between px-6 pointer-events-auto">
                    <div className="flex items-center gap-4 md:gap-8">
                        <div className="flex items-center gap-2.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[9px] font-black tracking-[0.2em] uppercase text-indigo-400 shrink-0 italic">Core Registry</span>
                        </div>
                        <div className="h-4 w-px bg-white/10 hidden md:block"></div>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Sync active</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-[9px] font-black tracking-widest uppercase text-gray-500">
                        <span className="hidden sm:block">NodeID: {roomId?.slice(-8).toUpperCase()}</span>
                        <div className="h-1.5 w-1.5 rounded-full bg-white/10 animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditRoomPage;
