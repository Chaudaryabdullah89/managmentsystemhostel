"use client"
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Save,
    X,
    User,
    Home,
    Calendar,
    DollarSign,
    ChevronRight,
    Upload,
    FileText,
    CreditCard,
    CheckCircle2,
    AlertCircle,
    Search,
    Building2,
    BedDouble,
    ChevronLeft,
    ShieldCheck,
    UserPlus,
    UserCheck,
    Briefcase,
    MapPin,
    Phone,
    Mail,
    Plus,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useCreateBooking } from "@/hooks/useBooking";
import { useHostel } from "@/hooks/usehostel";
import { useRoomByHostelId } from "@/hooks/useRoom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const CreateBookingPage = () => {
    const router = useRouter();
    const createBooking = useCreateBooking();
    const { data: hostelsResponse, isLoading: hostelsLoading } = useHostel();

    const [step, setStep] = useState(1);
    const [existingGuestQuery, setExistingGuestQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState(null);

    const [formData, setFormData] = useState({
        // Guest Info
        userId: "",
        guestName: "",
        guestEmail: "",
        guestPhone: "",
        cnic: "",
        guardianName: "",
        guardianPhone: "",
        emergencyContact: "",
        address: "",
        city: "",

        // Property Info
        hostelId: "",
        roomId: "",

        // Booking Terms
        checkIn: "",
        checkOut: "",
        status: "PENDING",
        totalAmount: 0,
        securityDeposit: 0,
        advanceMonths: 1
    });

    const { data: roomsResponse, isLoading: roomsLoading } = useRoomByHostelId(formData.hostelId);
    const hostels = hostelsResponse?.data || [];
    const rooms = roomsResponse?.data || [];
    const selectedRoom = rooms.find(r => r.id === formData.roomId);

    // Guest Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (existingGuestQuery.length > 2) {
                setIsSearching(true);
                try {
                    const res = await fetch(`/api/users?query=${existingGuestQuery}&role=GUEST`);
                    const data = await res.json();
                    setSearchResults(data.data || []);
                } catch (error) {
                    console.error("Search failed:", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [existingGuestQuery]);

    const handleSelectGuest = (user) => {
        setSelectedGuest(user);
        setFormData(prev => ({
            ...prev,
            userId: user.id,
            guestName: user.name,
            guestEmail: user.email,
            guestPhone: user.phone || "",
            cnic: user.cnic || "",
            address: user.address || "",
            guardianName: user.ResidentProfile?.guardianName || "",
            guardianPhone: user.ResidentProfile?.guardianPhone || "",
            emergencyContact: user.ResidentProfile?.emergencyContact || "",
        }));
        setExistingGuestQuery("");
        setSearchResults([]);
        toast.success(`Guest profile identified: ${user.name}`);
    };

    const resetGuest = () => {
        setSelectedGuest(null);
        setFormData(prev => ({
            ...prev,
            userId: "",
            guestName: "",
            guestEmail: "",
            guestPhone: "",
            cnic: ""
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const calculateTotals = () => {
        if (!selectedRoom) return;
        const rent = selectedRoom.monthlyrent || 0;
        const deposit = selectedRoom.monthlyrent * 1; // Default 1 month deposit
        const total = deposit + (rent * (parseInt(formData.advanceMonths) || 1));

        setFormData(prev => ({
            ...prev,
            securityDeposit: deposit,
            totalAmount: total
        }));
    };

    useEffect(() => {
        calculateTotals();
    }, [selectedRoom, formData.advanceMonths]);

    const handleNext = () => {
        if (step === 1 && !formData.guestName) return toast.error("Guest profile required");
        if (step === 2 && (!formData.hostelId || !formData.roomId)) return toast.error("Hostel & Room assignment required");
        setStep(prev => prev + 1);
    };

    const handleBack = () => setStep(prev => prev - 1);

    const handleSubmit = async () => {
        if (!formData.checkIn) return toast.error("Check-in date required");

        try {
            await createBooking.mutateAsync(formData);
            router.push('/admin/bookings');
        } catch (error) {
            // Error handled by hook
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/30 pb-20">
            {/* Slim Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9" onClick={() => router.back()}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-none">Create Booking</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">New Booking Entry</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center -space-x-2">
                            {[1, 2, 3, 4].map(s => (
                                <div key={s} className={`h-7 w-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold transition-all ${step >= s ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                                    {s}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1000px] mx-auto px-6 py-8">
                <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl shadow-black/5 overflow-hidden">
                    {/* Progress Bar */}
                    <div className="h-1 bg-gray-100 w-full">
                        <div className="h-full bg-indigo-600 transition-all duration-700 ease-out" style={{ width: `${(step / 4) * 100}%` }} />
                    </div>

                    <div className="p-12">
                        {/* Step 1: Guest Information */}
                        {step === 1 && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-3xl font-bold tracking-tight">Guest Profile</h2>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Enter guest details</p>
                                </div>

                                <div className="space-y-8">
                                    {!selectedGuest ? (
                                        <div className="relative">
                                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <Input
                                                placeholder="Search by Name, Email, or CNIC..."
                                                className="h-16 pl-14 pr-6 rounded-2xl border-gray-100 bg-gray-50/50 font-bold focus:bg-white focus:border-indigo-600 transition-all"
                                                value={existingGuestQuery}
                                                onChange={(e) => setExistingGuestQuery(e.target.value)}
                                            />
                                            {isSearching && <div className="absolute right-6 top-1/2 -translate-y-1/2"><Clock className="h-4 w-4 animate-spin text-gray-400" /></div>}

                                            {searchResults.length > 0 && (
                                                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 z-50">
                                                    {searchResults.map(user => (
                                                        <div
                                                            key={user.id}
                                                            className="p-4 hover:bg-gray-50 rounded-xl cursor-pointer flex items-center justify-between group transition-colors"
                                                            onClick={() => handleSelectGuest(user)}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                                    <User className="h-5 w-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-sm">{user.name}</p>
                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{user.email} • {user.cnic || 'NO-CNIC'}</p>
                                                                </div>
                                                            </div>
                                                            <UserCheck className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 mr-4" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-8 flex items-center justify-between group">
                                            <div className="flex items-center gap-6">
                                                <div className="h-16 w-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20">
                                                    <UserCheck className="h-8 w-8" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-emerald-900 leading-none">{selectedGuest.name}</h3>
                                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mt-2">Verified Guest</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="rounded-xl text-emerald-600 hover:bg-emerald-100" onClick={resetGuest}>
                                                <X className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    )}

                                    {!selectedGuest && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2.5">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Legal Name</Label>
                                                <Input name="guestName" value={formData.guestName} onChange={handleInputChange} className="h-14 rounded-xl border-gray-100 font-bold" placeholder="First & Last Name" />
                                            </div>
                                            <div className="space-y-2.5">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Email Address</Label>
                                                <Input name="guestEmail" value={formData.guestEmail} onChange={handleInputChange} className="h-14 rounded-xl border-gray-100 font-bold" placeholder="address@domain.com" />
                                            </div>
                                            <div className="space-y-2.5">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Phone Number</Label>
                                                <Input name="guestPhone" value={formData.guestPhone} onChange={handleInputChange} className="h-14 rounded-xl border-gray-100 font-bold" placeholder="03XX-XXXXXXX" />
                                            </div>
                                            <div className="space-y-2.5">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">CNIC Number</Label>
                                                <Input name="cnic" value={formData.cnic} onChange={handleInputChange} className="h-14 rounded-xl border-gray-100 font-bold" placeholder="XXXXX-XXXXXXX-X" />
                                            </div>

                                            {/* Expanded Profile Fields */}
                                            <div className="space-y-2.5">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Guardian Name</Label>
                                                <Input name="guardianName" value={formData.guardianName} onChange={handleInputChange} className="h-14 rounded-xl border-gray-100 font-bold" placeholder="Parent/Guardian Name" />
                                            </div>
                                            <div className="space-y-2.5">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Guardian Phone</Label>
                                                <Input name="guardianPhone" value={formData.guardianPhone} onChange={handleInputChange} className="h-14 rounded-xl border-gray-100 font-bold" placeholder="03XX-XXXXXXX" />
                                            </div>
                                            <div className="space-y-2.5">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Emergency Number</Label>
                                                <Input name="emergencyContact" value={formData.emergencyContact} onChange={handleInputChange} className="h-14 rounded-xl border-gray-100 font-bold" placeholder="Emergency Contact #" />
                                            </div>
                                            <div className="space-y-2.5">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">City</Label>
                                                <Input name="city" value={formData.city} onChange={handleInputChange} className="h-14 rounded-xl border-gray-100 font-bold" placeholder="City of Residence" />
                                            </div>
                                            <div className="space-y-2.5 md:col-span-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Residential Address</Label>
                                                <Textarea name="address" value={formData.address} onChange={handleInputChange} className="min-h-[100px] rounded-xl border-gray-100 font-bold resize-none pt-4" placeholder="Full permanent address..." />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Assign Room */}
                        {step === 2 && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-3xl font-bold tracking-tight">Assign Room</h2>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Select hostel and room</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Hostel</Label>
                                        <Select value={formData.hostelId} onValueChange={(v) => { setFormData(p => ({ ...p, hostelId: v, roomId: "" })); }}>
                                            <SelectTrigger className="h-14 rounded-xl border-gray-100 font-bold">
                                                <SelectValue placeholder="Select Hostel" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-gray-100 shadow-2xl p-2 pb-4">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 p-4">Hostels</div>
                                                <div className="h-px bg-gray-50 mb-2 mx-2" />
                                                {hostelsLoading ? (
                                                    <div className="p-4 space-y-2">
                                                        <Skeleton className="h-4 w-full" />
                                                        <Skeleton className="h-4 w-3/4" />
                                                    </div>
                                                ) : hostels.length > 0 ? (
                                                    hostels.map(h => (
                                                        <SelectItem key={h.id} value={h.id} className="p-3 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">
                                                            {h.name}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">No Hostels Found</div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Room</Label>
                                        <Select value={formData.roomId} onValueChange={(v) => setFormData(p => ({ ...p, roomId: v }))} disabled={!formData.hostelId}>
                                            <SelectTrigger className="h-14 rounded-xl border-gray-100 font-bold">
                                                <SelectValue placeholder={formData.hostelId ? "Select Room" : "Choose a hostel first..."} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-gray-100 shadow-2xl p-2 pb-4">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 p-4">Rooms</div>
                                                <div className="h-px bg-gray-50 mb-2 mx-2" />
                                                {roomsLoading ? (
                                                    <div className="p-4 space-y-2">
                                                        <Skeleton className="h-4 w-full" />
                                                        <Skeleton className="h-4 w-3/4" />
                                                    </div>
                                                ) : rooms.length > 0 ? (
                                                    rooms.map(r => (
                                                        <SelectItem key={r.id} value={r.id} disabled={r.status === 'OCCUPIED'} className="p-3 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">
                                                            Room {r.roomNumber} ({r.type}) • PKR {r.monthlyrent}/mo {r.status === 'OCCUPIED' && '• [FULL]'}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">No Rooms Available</div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {selectedRoom && (
                                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-[2rem] p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                                        <div>
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Room Type</p>
                                            <p className="font-bold text-gray-900">{selectedRoom.type}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Capacity</p>
                                            <p className="font-bold text-gray-900">{selectedRoom.capacity} Beds</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Floor</p>
                                            <p className="font-bold text-gray-900">Level {selectedRoom.floor}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Rent</p>
                                            <p className="font-bold text-gray-900">PKR {selectedRoom.monthlyrent}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Payment Details */}
                        {step === 3 && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-3xl font-bold tracking-tight">Payment Details</h2>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Set payment and dates</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-8">
                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Check-in Date</Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input type="date" name="checkIn" value={formData.checkIn} onChange={handleInputChange} className="h-14 pl-12 rounded-xl border-gray-100 font-bold" />
                                            </div>
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Check-out Date (Optional)</Label>
                                            <div className="relative">
                                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input type="date" name="checkOut" value={formData.checkOut} onChange={handleInputChange} className="h-14 pl-12 rounded-xl border-gray-100 font-bold" />
                                            </div>
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Advance Rent (Months)</Label>
                                            <Select value={formData.advanceMonths.toString()} onValueChange={(v) => setFormData(p => ({ ...p, advanceMonths: parseInt(v) }))}>
                                                <SelectTrigger className="h-14 rounded-xl border-gray-100 font-bold">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-gray-100">
                                                    {[1, 2, 3, 6, 12].map(m => <SelectItem key={m} value={m.toString()}>{m} Month{m > 1 ? 's' : ''}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="bg-indigo-600 text-white rounded-[2.5rem] p-10 space-y-8 shadow-2xl shadow-indigo-600/20">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                                            </div>
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest">Summary</h4>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-gray-400">
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Rent</span>
                                                <span className="font-bold text-white">PKR {selectedRoom?.monthlyrent || 0}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-gray-400">
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Security Deposit</span>
                                                <span className="font-bold text-white">PKR {formData.securityDeposit}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-gray-400">
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Advance ({formData.advanceMonths}m)</span>
                                                <span className="font-bold text-white">PKR {(selectedRoom?.monthlyrent || 0) * formData.advanceMonths}</span>
                                            </div>
                                            <div className="h-px bg-white/10 my-4" />
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] mb-1">Total Amount</p>
                                                    <h3 className="text-3xl font-bold tracking-tighter">PKR {formData.totalAmount}</h3>
                                                </div>
                                                <DollarSign className="h-8 w-8 text-white/10 mb-1" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Final Review */}
                        {step === 4 && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-3xl font-bold tracking-tight">Review Booking</h2>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Check all details before saving</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100 flex items-start gap-6">
                                        <div className="h-12 w-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                            <User className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Guest</p>
                                            <h4 className="text-lg font-bold text-gray-900">{formData.guestName}</h4>
                                            <p className="text-xs font-bold text-gray-500 mt-1">{formData.guestEmail}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100 flex items-start gap-6">
                                        <div className="h-12 w-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                            <Building2 className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Room</p>
                                            <h4 className="text-lg font-bold text-gray-900">Room {selectedRoom?.roomNumber}</h4>
                                            <p className="text-xs font-bold text-gray-500 mt-1">{hostels.find(h => h.id === formData.hostelId)?.name}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100 flex items-start gap-6">
                                        <div className="h-12 w-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                            <Calendar className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Timeline</p>
                                            <h4 className="text-lg font-bold text-gray-900">Starts {formData.checkIn}</h4>
                                            <p className="text-xs font-bold text-gray-500 mt-1">{formData.checkOut ? `Ends ${formData.checkOut}` : 'Continuous Stay'}</p>
                                        </div>
                                    </div>

                                    <div className="bg-emerald-500 text-white rounded-3xl p-8 flex items-start justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Amount</p>
                                            <h4 className="text-2xl font-bold">PKR {formData.totalAmount}</h4>
                                            <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mt-2">{formData.advanceMonths} Month Advance + Security</p>
                                        </div>
                                        <ShieldCheck className="h-10 w-10 text-white/30" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                                    <AlertCircle className="h-5 w-5 text-amber-500" />
                                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest leading-loose">
                                        BY PROCEEDING, YOU CONFIRM THAT THE ABOVE DATA IS CORRECT. CONFIRMATION EMAILS WILL BE SENT AUTOMATICALLY.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-gray-50/50 border-t p-8 flex items-center justify-between">
                        <Button
                            variant="outline"
                            className="h-14 px-10 rounded-2xl border-gray-200 bg-white font-bold text-xs uppercase tracking-widest hover:bg-gray-100 disabled:opacity-30"
                            onClick={handleBack}
                            disabled={step === 1}
                        >
                            Back
                        </Button>

                        {step < 4 ? (
                            <Button
                                className="h-14 px-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/10 group animate-in slide-in-from-right-4"
                                onClick={handleNext}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        ) : (
                            <Button
                                className="h-14 px-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 group scale-100 active:scale-95 transition-all"
                                onClick={handleSubmit}
                                disabled={createBooking.isPending}
                            >
                                {createBooking.isPending ? 'Saving...' : 'Confirm Booking'}
                                <ShieldCheck className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Footer Status */}
                <div className="fixed bottom-0 w-full z-40 px-6 pb-4 pointer-events-none left-0">
                    <div className="max-w-[1000px] mx-auto bg-indigo-600/90 backdrop-blur-xl text-white h-12 rounded-2xl shadow-2xl flex items-center justify-between px-6 pointer-events-auto">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                                <span className="text-[10px] font-bold tracking-widest uppercase text-white">Secure System</span>
                            </div>
                            <div className="h-3 w-px bg-white/20"></div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                                <span className="text-[10px] font-bold uppercase text-gray-100 tracking-widest">Saving Data</span>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-gray-300">Create Booking Page</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateBookingPage;
