"use client"
import React, { useState, useEffect, Suspense } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Plus, Edit, Save, X, ArrowLeft, Building2, MapPin, Sparkle, ShieldCheck, Coins, RefreshCw } from "lucide-react"
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { useMutation } from '@tanstack/react-query'
import { UpdateHostel } from '../../../../../../hooks/usehostel'
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

const EditHostelForm = () => {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const hostelId = searchParams.get('hostelId') || params.hostelId;

    const [hostelname, setHostelName] = useState('');
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zip, setZip] = useState('');
    const [country, setCountry] = useState('');
    const [contact, setContact] = useState('');
    const [floors, setFloors] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('');
    const [type, setType] = useState('');

    const [wardenlist, setWardenList] = useState([]);
    const [wardens, setWardens] = useState([]);
    const [selectedWardens, setSelectedWardens] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [email, setEmail] = useState('');
    const [mess, setMess] = useState('');
    const [laundry, setLaundry] = useState('');
    const [pricePerNight, setPricePerNight] = useState('');
    const [montlypayment, setMontlypayment] = useState('');
    const [completeAddress, setCompleteAddress] = useState('');
    const [rooms, setRooms] = useState('');
    const [cleaningInterval, setCleaningInterval] = useState('24');
    const [laundryInterval, setLaundryInterval] = useState('48');

    const { mutate, isPending: editingpending, error: editError } = UpdateHostel()

    const handleSave = () => {
        if (!hostelname || !status) {
            toast.error("Required fields missing");
            return;
        }
        const data = {
            id: hostelId,
            name: hostelname,
            phone: contact,
            email: email,
            floors: parseInt(floors) || 0,
            totalRooms: parseInt(rooms) || 0,
            montlyrent: parseFloat(montlypayment) || 0,
            pernightrent: parseFloat(pricePerNight) || 0,
            messavailable: mess === 'Yes',
            laundaryavailable: laundry === 'Yes',
            address: street,
            city,
            state,
            zip,
            country,
            completeaddress: completeAddress,
            description,
            status: status ? status.toUpperCase() : "ACTIVE",
            wardens: selectedWardens.map((warden) => warden.id),
            type: type ? type.toUpperCase() : "BOYS",
            cleaningInterval: parseInt(cleaningInterval) || 24,
            laundryInterval: parseInt(laundryInterval) || 48
        };
        mutate(data);
    }

    useEffect(() => {
        async function getwarden() {
            try {
                const response = await fetch("/api/users/warden")
                if (response.ok) {
                    const res = await response.json()
                    if (res.success) {
                        setWardenList(res.data.map((w) => ({ name: w.name, id: w.id, canManageExpenses: w.canManageExpenses })));
                    }
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
                // Update selected wardens
                setSelectedWardens(prev => prev.map(w =>
                    w.id === wardenId ? { ...w, canManageExpenses: !currentStatus } : w
                ));
            } else {
                toast.error("Failed to update permission");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    useEffect(() => {
        if (wardenlist.length > 0 && wardens.length > 0) {
            const selected = wardenlist.filter(w => wardens.includes(w.id));
            setSelectedWardens(selected);
        } else if (wardens.length === 0) {
            setSelectedWardens([]);
        }
    }, [wardenlist, wardens]);

    useEffect(() => {
        const fetchHostelData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/hostels/${hostelId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch hostel data');
                }
                const responseData = await response.json();
                const data = responseData.hostel;

                if (data) {
                    setHostelName(data.name || '');
                    setStreet(data.address || '');
                    setCity(data.city || '');
                    setState(data.state || '');
                    setZip(data.zip || '');
                    setCountry(data.country || '');
                    setCompleteAddress(data.completeaddress || '');
                    setContact(data.phone || '');
                    setEmail(data.email || '');
                    setFloors(data.floors ? data.floors.toString() : '');
                    setRooms(data.totalRooms ? data.totalRooms.toString() : '');
                    setMontlypayment(data.montlyrent ? data.montlyrent.toString() : '');
                    setPricePerNight(data.pernightrent ? data.pernightrent.toString() : '');
                    setDescription(data.description || '');
                    setStatus(data.status || '');
                    setType(data.type || '');
                    setMess(data.messavailable ? 'Yes' : 'No');
                    setLaundry(data.laundaryavailable ? 'Yes' : 'No');
                    setWardens(data.wardens || []);
                    setCleaningInterval(data.cleaningInterval?.toString() || '24');
                    setLaundryInterval(data.laundryInterval?.toString() || '48');
                }
            } catch (error) {
                console.error("Error fetching hostel:", error);
                setError(error.message);
                toast.error("Failed to load hostel data");
            } finally {
                setIsLoading(false);
            }
        };

        if (hostelId) {
            fetchHostelData();
        }
    }, [hostelId]);

    if (isLoading && !hostelname) return (
        <div className="flex h-screen items-center justify-center bg-white dark:bg-card">
            <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background">
            {/* Slim Header */}
            <div className="bg-white dark:bg-card border-b sticky top-0 z-40 h-16">
                <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-gray-100">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-200" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 dark:text-foreground tracking-tight flex items-center gap-2 uppercase">
                                <Edit className="h-4 w-4 text-blue-600" />
                                Modify Property Registry
                            </h1>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">{hostelname || 'Loading...'}</p>
                        </div>
                    </div>
                    <Button
                        className="bg-black hover:bg-gray-800 text-white h-9 px-6 rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-sm gap-2"
                        onClick={handleSave}
                        disabled={editingpending}
                    >
                        {editingpending ? "Updating..." : "Commit Changes"}
                        {!editingpending && <Save className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Primary Ledger Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Core Property Card */}
                        <Card className="border border-gray-100 dark:border-border shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] bg-white dark:bg-card overflow-hidden">
                            <CardHeader className="px-8 pt-8 pb-4 flex flex-row items-center justify-between border-b border-gray-50/50">
                                <CardTitle className="text-[11px] font-black flex items-center gap-2 uppercase tracking-[0.15em] text-gray-400 dark:text-muted-foreground">
                                    <Building2 className="h-4 w-4 text-blue-500" />
                                    Property  Identity
                                </CardTitle>
                                <Badge variant="outline" className={`${status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-100 text-gray-500 dark:text-muted-foreground border-gray-200 dark:border-border'} text-[9px] font-black px-2 py-0.5 rounded-md`}>
                                    {status?.toUpperCase() || 'UNIT_STANDBY'}
                                </Badge>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-black text-gray-500 dark:text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                            Hostel Name
                                            <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            value={hostelname}
                                            onChange={(e) => setHostelName(e.target.value)}
                                            placeholder="e.g. City Center Hostel"
                                            className="h-12 bg-white dark:bg-card border-gray-100 dark:border-border rounded-xl font-bold text-gray-900 dark:text-foreground focus:ring-1 focus:ring-black placeholder:text-gray-200"
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-black text-gray-500 dark:text-muted-foreground uppercase tracking-widest">Asset Class</Label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full h-12 justify-between rounded-xl border-gray-100 dark:border-border bg-white dark:bg-card font-bold text-gray-900 dark:text-foreground hover:bg-gray-50 dark:hover:bg-muted/5 dark:bg-muted/10">
                                                    <span>{type || 'Select Asset Class'}</span>
                                                    <ChevronDown className="h-4 w-4 opacity-30" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[280px] rounded-2xl border-gray-100 dark:border-border shadow-2xl p-2">
                                                <DropdownMenuItem onClick={() => setType('BOYS')} className="p-3 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">BOYS RESIDENCE</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setType('GIRLS')} className="p-3 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">GIRLS RESIDENCE</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-50">
                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-black text-gray-500 dark:text-muted-foreground uppercase tracking-widest">Personnel Authority</Label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full h-12 justify-between rounded-xl border-gray-100 dark:border-border bg-white dark:bg-card font-bold text-gray-900 dark:text-foreground hover:bg-gray-50 dark:hover:bg-muted/5 dark:bg-muted/10">
                                                    <span className="truncate">{selectedWardens.length > 0 ? `${selectedWardens.length} Wardens Authorized` : "Assign Property Wardens"}</span>
                                                    <ChevronDown className="h-4 w-4 opacity-30" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[350px] rounded-2xl border-gray-100 dark:border-border shadow-2xl p-2">
                                                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground p-3">Registry Personnel</DropdownMenuLabel>
                                                <DropdownMenuSeparator className="bg-gray-50 dark:bg-muted/10" />
                                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                                    {wardenlist.map((w, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center justify-between p-3.5 hover:bg-gray-50 dark:hover:bg-muted/5 dark:bg-muted/10 rounded-xl cursor-pointer transition-colors group"
                                                            onClick={() => {
                                                                const isChecked = wardens.includes(w.id);
                                                                if (!isChecked) {
                                                                    setWardens(prev => [...prev, w.id]);
                                                                    setSelectedWardens(prev => [...prev, w]);
                                                                } else {
                                                                    setWardens(prev => prev.filter(id => id !== w.id));
                                                                    setSelectedWardens(prev => prev.filter(item => item.id !== w.id));
                                                                }
                                                            }}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-gray-700 dark:text-foreground">{w.name}</span>
                                                                <div className="flex items-center mt-1">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-600 mr-2 cursor-pointer"
                                                                        checked={w.canManageExpenses || false}
                                                                        onChange={(e) => toggleExpensePermission(w.id, w.canManageExpenses, e)}
                                                                    />
                                                                    <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                                                                        Expenses: {w.canManageExpenses ? "Allowed" : "Restricted"}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-tighter">Warden #ID-{w.id.slice(-4)}</span>
                                                            </div>
                                                            <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${wardens.includes(w.id) ? 'bg-black border-black shadow-sm' : 'bg-white dark:bg-card border-gray-200 dark:border-border'}`}>
                                                                {wardens.includes(w.id) && <X className="h-3 w-3 text-white" />}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {selectedWardens.map((w, index) => (
                                                <Badge key={index} className="bg-gray-50 dark:bg-muted/10 text-gray-900 dark:text-foreground border border-gray-100 dark:border-border hover:bg-gray-100 rounded-lg py-1.5 px-3 gap-2 font-black text-[9px] uppercase tracking-tighter shadow-sm">
                                                    {w.name}
                                                    <X size={12} className="cursor-pointer text-gray-400 dark:text-muted-foreground hover:text-black transition-colors" onClick={() => {
                                                        setWardens(prev => prev.filter(id => id !== w.id))
                                                        setSelectedWardens(prev => prev.filter(item => item.id !== w.id))
                                                    }} />
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-black text-gray-500 dark:text-muted-foreground uppercase tracking-widest">Hostel Status</Label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full h-12 justify-between rounded-xl border-gray-100 dark:border-border bg-white dark:bg-card font-bold text-gray-900 dark:text-foreground hover:bg-gray-50 dark:hover:bg-muted/5 dark:bg-muted/10">
                                                    <span className="flex items-center gap-2">
                                                        <div className={`h-1.5 w-1.5 rounded-full ${status === 'Active' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                                        {status?.toUpperCase() || 'UNSET STATUS'}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 opacity-30" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[280px] rounded-2xl border-gray-100 dark:border-border shadow-2xl p-2">
                                                <DropdownMenuItem onClick={() => setStatus('Active')} className="p-3 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">ACTIVE FLEET</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setStatus('Inactive')} className="p-3 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">MAINTENANCE / INACTIVE</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Communications Ledger */}
                        <Card className="border border-gray-100 dark:border-border shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] bg-white dark:bg-card">
                            <CardHeader className="px-8 pt-8 pb-4 border-b border-gray-50/50">
                                <CardTitle className="text-[11px] font-black flex items-center gap-2 uppercase tracking-[0.15em] text-gray-400 dark:text-muted-foreground">
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-600 h-5 w-5 p-0 flex items-center justify-center rounded-md font-black">@</Badge>
                                    Communications Ledger
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-black text-gray-500 dark:text-muted-foreground uppercase tracking-widest">Contact Number </Label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300">
                                            <ShieldCheck className="h-4 w-4" />
                                        </div>
                                        <Input
                                            value={contact}
                                            onChange={(e) => setContact(e.target.value)}
                                            placeholder="+92 XXX XXXXXXX"
                                            className="h-12 pl-11 bg-white dark:bg-card border-gray-100 dark:border-border rounded-xl font-bold text-gray-900 dark:text-foreground focus:ring-1 focus:ring-black placeholder:text-gray-200"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-black text-gray-500 dark:text-muted-foreground uppercase tracking-widest"> Email</Label>
                                    <Input
                                        value={email}
                                        type="email"
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="property@hostel.com"
                                        className="h-12 bg-white dark:bg-card border-gray-100 dark:border-border rounded-xl font-bold text-gray-900 dark:text-foreground focus:ring-1 focus:ring-black placeholder:text-gray-200"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Geo-Coordinates Card */}
                        <Card className="border border-gray-100 dark:border-border shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] bg-white dark:bg-card">
                            <CardHeader className="px-8 pt-8 pb-4 border-b border-gray-50/50">
                                <CardTitle className="text-[11px] font-black flex items-center gap-2 uppercase tracking-[0.15em] text-gray-400 dark:text-muted-foreground">
                                    <MapPin className="h-4 w-4 text-emerald-500" />
                                    Geo-Coordinates Registry
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-black text-gray-500 dark:text-muted-foreground uppercase tracking-widest">Street Address</Label>
                                        <Input value={street} onChange={(e) => setStreet(e.target.value)} className="h-12 bg-white dark:bg-card border-gray-100 dark:border-border rounded-xl font-bold text-gray-900 dark:text-foreground focus:ring-1 focus:ring-black" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-black text-gray-500 dark:text-muted-foreground uppercase tracking-widest">City</Label>
                                        <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-12 bg-white dark:bg-card border-gray-100 dark:border-border rounded-xl font-bold text-gray-900 dark:text-foreground focus:ring-1 focus:ring-black" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-black text-gray-500 dark:text-muted-foreground uppercase tracking-widest">State / Province</Label>
                                        <Input value={state} onChange={(e) => setState(e.target.value)} className="h-12 bg-white dark:bg-card border-gray-100 dark:border-border rounded-xl font-bold text-gray-900 dark:text-foreground focus:ring-1 focus:ring-black" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-black text-gray-500 dark:text-muted-foreground uppercase tracking-widest">Postal Code</Label>
                                        <Input value={zip} onChange={(e) => setZip(e.target.value)} className="h-12 bg-white dark:bg-card border-gray-100 dark:border-border rounded-xl font-bold text-gray-900 dark:text-foreground focus:ring-1 focus:ring-black" />
                                    </div>
                                </div>
                                <div className="space-y-2.5 pt-4 border-t border-gray-50">
                                    <Label className="text-[10px] font-black text-gray-500 dark:text-muted-foreground uppercase tracking-widest">Complete Formatted Address</Label>
                                    <Textarea
                                        value={completeAddress}
                                        onChange={(e) => setCompleteAddress(e.target.value)}
                                        className="min-h-[100px] bg-white dark:bg-card border-gray-100 dark:border-border rounded-xl font-bold text-gray-900 dark:text-foreground focus:ring-1 focus:ring-black p-4"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Secondary Metrics Area */}
                    <div className="space-y-8">
                        {/* Financial Ledger */}
                        <Card className="border border-gray-100 dark:border-border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] bg-white dark:bg-card overflow-hidden">
                            <CardHeader className="bg-gray-50 dark:bg-background border-b border-gray-100 dark:border-border px-8 py-6 text-center">
                                <CardTitle className="text-[10px] font-black text-gray-900 dark:text-foreground tracking-[0.2em] uppercase">Asset Commercials</CardTitle>
                            </CardHeader>
                            <div className="p-8 space-y-6">
                                <div className="space-y-2 flex flex-col">
                                    <Label className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest text-center">Price Per Month  (p/mo)</Label>
                                    <div className="relative">
                                        <Badge className="absolute left-4 top-1/2 -translate-y-1/2 bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-black p-1">PKR</Badge>
                                        <Input type="number" className="pl-16 h-14 bg-gray-50 dark:bg-muted/10 border-transparent rounded-2xl font-black text-xl text-center focus:bg-white dark:bg-card focus:border-gray-100 dark:border-border transition-all" value={montlypayment} onChange={(e) => setMontlypayment(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2 flex flex-col">
                                    <Label className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest text-center">Overnight Rate (p/night)</Label>
                                    <div className="relative">
                                        <Badge className="absolute left-4 top-1/2 -translate-y-1/2 bg-blue-50 text-blue-600 border-blue-100 text-[9px] font-black p-1">PKR</Badge>
                                        <Input type="number" className="pl-16 h-14 bg-gray-50 dark:bg-muted/10 border-transparent rounded-2xl font-black text-xl text-center focus:bg-white dark:bg-card focus:border-gray-100 dark:border-border transition-all" value={pricePerNight} onChange={(e) => setPricePerNight(e.target.value)} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 flex flex-col">
                                        <Label className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest text-center">Floors</Label>
                                        <Input type="number" className="h-12 bg-gray-50 dark:bg-muted/10 border-transparent rounded-xl font-black text-lg text-center" value={floors} onChange={(e) => setFloors(e.target.value)} />
                                    </div>
                                    <div className="space-y-2 flex flex-col">
                                        <Label className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest text-center">Unit Count</Label>
                                        <Input type="number" className="h-12 bg-gray-50 dark:bg-muted/10 border-transparent rounded-xl font-black text-lg text-center" value={rooms} onChange={(e) => setRooms(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Hostel audit & details (same style as create hostel) */}
                        <Card className="border border-gray-200 dark:border-border bg-white dark:bg-card shadow-sm overflow-hidden">
                            <CardHeader className="px-6 pt-6 pb-3 border-b border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10/60 flex items-center justify-between">
                                <CardTitle className="text-[10px] font-bold text-gray-600 dark:text-muted-foreground uppercase tracking-[0.18em] flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-indigo-500" />
                                    Hostel audit & details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                                        Description
                                        <span className="text-[9px] font-medium text-gray-400 dark:text-muted-foreground normal-case tracking-normal">
                                            Optional notes for internal use
                                        </span>
                                    </Label>
                                    <Textarea
                                        className="bg-gray-50 dark:bg-muted/10 border-gray-200 dark:border-border text-xs font-medium min-h-[140px] rounded-xl focus:border-indigo-400 focus:ring-indigo-400/40"
                                        placeholder="Add details about the hostel, building condition, nearby landmarks, or any special notes."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-100 dark:border-border">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-widest">Cleaning (hrs)</Label>
                                        <Input
                                            type="number"
                                            className="bg-gray-50 dark:bg-muted/10 border-gray-200 dark:border-border h-10 rounded-xl text-xs font-medium focus:border-indigo-400 focus:ring-indigo-400/40"
                                            value={cleaningInterval}
                                            onChange={(e) => setCleaningInterval(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-widest">Laundry (hrs)</Label>
                                        <Input
                                            type="number"
                                            className="bg-gray-50 dark:bg-muted/10 border-gray-200 dark:border-border h-10 rounded-xl text-xs font-medium focus:border-indigo-400 focus:ring-indigo-400/40"
                                            value={laundryInterval}
                                            onChange={(e) => setLaundryInterval(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                    <span className="text-[10px] font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-widest">
                                        Basic security checks in place
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function EditHostelPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-white dark:bg-card">
                <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
        }>
            <EditHostelForm />
        </Suspense>
    );
}