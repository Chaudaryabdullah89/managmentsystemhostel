"use client"
import React, { useEffect, useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ChevronDown, X, Save, ArrowLeft, Building2, ShieldCheck, MapPin, Info, Sparkle } from "lucide-react"
import Link from 'next/link'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { CreateHostel } from '../../../../../hooks/usehostel'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const CreateHostelPage = () => {
    const router = useRouter();
    const [wardenlist, setWardenList] = useState([]);
    const [asssignedwarden, setassignedwarden] = useState([])
    const [hostelname, setHostelName] = useState('');
    const [warden, setwarden] = useState([]);
    const [contact, setContact] = useState('');
    const [email, setEmail] = useState('');
    const [floors, setFloors] = useState('');
    const [mess, setMess] = useState('');
    const [laundry, setLaundry] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('Pakistan');
    const [zip, setZip] = useState('');
    const [street, setStreet] = useState('');
    const [completeAddress, setCompleteAddress] = useState('');
    const [country, setCountry] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('');
    const [rooms, setRooms] = useState('');
    const [type, setType] = useState('');
    const [pricePerNight, setpricepernight] = useState('')
    const [montlypayment, setmontlypayment] = useState('')
    const [cleaningInterval, setCleaningInterval] = useState('24')
    const [laundryInterval, setLaundryInterval] = useState('48')
    const { mutate, isPending: createhostelloading, error: createhostelerror } = CreateHostel();

    const handleCreateHostel = () => {
        if (!hostelname || !status || !type) {
            toast.error("Please fill in all required fields.");
            return;
        }
        mutate({
            hostelname,
            contact,
            email,
            floors,
            mess,
            laundry,
            city,
            state,
            zip,
            pricePerNight,
            montlypayment,
            street,
            completeAddress,
            country,
            description,
            status: status.toUpperCase(),
            rooms: rooms || 0,
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
                        id: w.id
                    })));
                }
            } catch (error) {
                console.error("Failed to fetch wardens:", error);
            }
        }
        getwarden();
    }, [])

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Slim Premium Header */}
            <div className="bg-white border-b sticky top-0 z-40 h-16">
                <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-gray-100">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-200" />
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold tracking-tight text-primary">Add New Hostel</h1>
                            <p className="text-sm text-muted-foreground">Fill in the details below</p>
                        </div>
                    </div>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-6 rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-sm gap-2"
                        onClick={handleCreateHostel}
                        disabled={createhostelloading}
                    >
                        {createhostelloading ? "Processing..." : "Save Hostel"}
                        {!createhostelloading && <Save className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Primary Form Area */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white">
                            <CardHeader className="px-8 pt-8 pb-4">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-gray-400">
                                    <Building2 className="h-4 w-4 text-blue-500" />
                                    Hostel Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Hostel Name *</Label>
                                        <Input
                                            placeholder="e.g. Paramount Manor"
                                            className="h-11 bg-white border-gray-100 rounded-xl font-bold text-gray-900 placeholder:text-gray-300 focus:ring-1 focus:ring-black"
                                            value={hostelname}
                                            onChange={(e) => setHostelName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Hostel Type *</Label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full h-11 justify-between rounded-xl border-gray-100 bg-white font-bold text-gray-900">
                                                    <span>{type || 'Select Type'}</span>
                                                    <ChevronDown className="h-4 w-4 opacity-40" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[300px] rounded-2xl border-gray-100 shadow-xl">
                                                <DropdownMenuItem onClick={() => setType('BOYS')} className="p-3 font-bold text-xs uppercase tracking-wider rounded-xl">BOYS HOSTEL</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setType('GIRLS')} className="p-3 font-bold text-xs uppercase tracking-wider rounded-xl">GIRLS HOSTEL</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Assigned Wardens *</Label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full h-11 justify-between rounded-xl border-gray-100 bg-white font-bold text-gray-900">
                                                    <span className="truncate">{warden.length > 0 ? `${warden.length} Selected` : "Select Wardens"}</span>
                                                    <ChevronDown className="h-4 w-4 opacity-40" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[350px] rounded-2xl border-gray-100 shadow-xl p-2">
                                                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Available Wardens</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {wardenlist.map((w, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl cursor-pointer"
                                                        onClick={(e) => {
                                                            const isChecked = warden.some(existing => existing.id === w.id);
                                                            if (!isChecked) {
                                                                setwarden(prev => [...prev, w]);
                                                                setassignedwarden(prev => [...prev, w.id]);
                                                            } else {
                                                                setwarden(prev => prev.filter(existing => existing.id !== w.id));
                                                                setassignedwarden(prev => prev.filter(id => id !== w.id));
                                                            }
                                                        }}
                                                    >
                                                        <span className="text-xs font-bold text-gray-700">{w.name}</span>
                                                        <div className={`h-5 w-5 rounded-md border border-gray-200 flex items-center justify-center ${warden.some(existing => existing.id === w.id) ? 'bg-black border-black' : 'bg-white'}`}>
                                                            {warden.some(existing => existing.id === w.id) && <X className="h-3 w-3 text-white" />}
                                                        </div>
                                                    </div>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {warden.map((w, index) => (
                                                <Badge key={index} className="bg-gray-50 text-gray-900 border border-gray-100 hover:bg-gray-100 rounded-lg py-1 px-3 gap-2 font-bold text-[10px]">
                                                    {w.name}
                                                    <X className="h-3 w-3 cursor-pointer text-gray-400 hover:text-black" onClick={() => {
                                                        setwarden(prev => prev.filter(item => item.id !== w.id))
                                                        setassignedwarden(prev => prev.filter(id => id !== w.id))
                                                    }} />
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status *</Label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full h-11 justify-between rounded-xl border-gray-100 bg-white font-bold text-gray-900">
                                                    <span>{status || 'Select Status'}</span>
                                                    <ChevronDown className="h-4 w-4 opacity-40" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[300px] rounded-2xl border-gray-100 shadow-xl">
                                                <DropdownMenuItem onClick={() => setStatus('Active')} className="p-3 font-bold text-xs uppercase tracking-wider rounded-xl">ACTIVE</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setStatus('Inactive')} className="p-3 font-bold text-xs uppercase tracking-wider rounded-xl">INACTIVE</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white">
                            <CardHeader className="px-8 pt-8 pb-4">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-gray-400">
                                    <MapPin className="h-4 w-4 text-emerald-500" />
                                    Location Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Street / Sector</Label>
                                        <Input placeholder="e.g. Sector H-12, Street 4" className="h-11 bg-white border-gray-100 rounded-xl font-bold text-gray-900" value={street} onChange={(e) => setStreet(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">City</Label>
                                        <Input placeholder="Islamabad" className="h-11 bg-white border-gray-100 rounded-xl font-bold text-gray-900" value={city} onChange={(e) => setCity(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">State / Region</Label>
                                        <Input className="h-11 bg-white border-gray-100 rounded-xl font-bold text-gray-900" value={state} onChange={(e) => setState(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Postal Code</Label>
                                        <Input placeholder="44000" className="h-11 bg-white border-gray-100 rounded-xl font-bold text-gray-900" value={zip} onChange={(e) => setZip(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Complete Formatted Address</Label>
                                    <Input placeholder="Full identifiable location..." className="h-11 bg-white border-gray-100 rounded-xl font-bold text-gray-900" value={completeAddress} onChange={(e) => setCompleteAddress(e.target.value)} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar: Financials & Capacity */}
                    <div className="space-y-6">
                        <Card className="border border-gray-100 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] bg-white overflow-hidden">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-100 px-6 py-5 text-center">
                                <CardTitle className="text-xs font-black text-gray-900 tracking-widest uppercase">Pricing & Details</CardTitle>
                            </CardHeader>
                            <div className="p-6 space-y-5">
                                <div className="space-y-1.5 flex flex-col">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Monthly Rent (PKR)</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">PKR</span>
                                        <Input type="number" className="pl-14 h-12 bg-gray-50 border-gray-100 rounded-2xl font-black text-lg text-center" value={montlypayment} onChange={(e) => setmontlypayment(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-1.5 flex flex-col">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Price Per Night (PKR)</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">PKR</span>
                                        <Input type="number" className="pl-14 h-12 bg-gray-50 border-gray-100 rounded-2xl font-black text-lg text-center" value={pricePerNight} onChange={(e) => setpricepernight(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-1.5 flex flex-col">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Number of Floors</Label>
                                    <Input type="number" className="h-12 bg-gray-50 border-gray-100 rounded-2xl font-black text-lg text-center" value={floors} onChange={(e) => setFloors(e.target.value)} />
                                </div>
                            </div>
                        </Card>

                        {/* Audit & extra details */}
                        <Card className="border border-gray-200 bg-white shadow-sm overflow-hidden">
                            <CardHeader className="px-6 pt-6 pb-3 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
                                <CardTitle className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.18em] flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-indigo-500" />
                                    Hostel audit & details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
                                        Description
                                        <span className="text-[9px] font-medium text-gray-400 normal-case tracking-normal">
                                            Optional notes for internal use
                                        </span>
                                    </Label>
                                    <Textarea
                                        className="bg-gray-50 border-gray-200 text-xs font-medium min-h-[140px] rounded-xl focus:border-indigo-400 focus:ring-indigo-400/40"
                                        placeholder="Add details about the hostel, building condition, nearby landmarks, or any special notes."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-100">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Cleaning (hrs)</Label>
                                        <Input
                                            type="number"
                                            className="bg-gray-50 border-gray-200 h-10 rounded-xl text-xs font-medium focus:border-indigo-400 focus:ring-indigo-400/40"
                                            value={cleaningInterval}
                                            onChange={(e) => setCleaningInterval(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Laundry (hrs)</Label>
                                        <Input
                                            type="number"
                                            className="bg-gray-50 border-gray-200 h-10 rounded-xl text-xs font-medium focus:border-indigo-400 focus:ring-indigo-400/40"
                                            value={laundryInterval}
                                            onChange={(e) => setLaundryInterval(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">
                                        Basic security checks in place
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CreateHostelPage
