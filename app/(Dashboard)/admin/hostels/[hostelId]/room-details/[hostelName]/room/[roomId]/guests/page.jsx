"use client"
import React, { useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
    DollarSign,
    CreditCard,
    ChevronRight,
    Eye,
    Edit,
    UserPlus,
    Download,
    Filter,
    Search,
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    FileText
} from "lucide-react";
import { Card, CardHeader, CardAction, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const RoomGuestsContent = () => {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { hostelName, roomId } = params;
    const hostelId = searchParams.get('hostelId');

    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    // Mock room and guests data - replace with actual API call
    const roomInfo = {
        id: roomId,
        name: `Room ${roomId}`,
        hostelName: decodeURIComponent(hostelName),
        hostelId: hostelId,
        type: "Double",
        floor: "23",
        capacity: 2,
        currentOccupancy: 2,
        rentPerMonth: 35000,
        status: "Occupied"
    };

    const guests = [
        {
            id: "G001",
            fullName: "Ahmed Khan",
            fatherName: "Hassan Khan",
            cnic: "12345-1234567-1",
            email: "ahmed.khan@email.com",
            phone: "0321-1234567",
            dateOfBirth: "1998-05-15",
            occupation: "Student",
            address: "123 Street, Model Town, Karachi",
            city: "Karachi",
            province: "Sindh",
            emergencyContact: {
                name: "Hassan Khan",
                relation: "Father",
                phone: "0322-7654321"
            },
            checkInDate: "2025-01-10",
            rentPerMonth: 35000,
            securityDeposit: 35000,
            paymentStatus: "Paid",
            lastPaymentDate: "2025-01-08",
            nextPaymentDue: "2025-02-10",
            status: "Active",
            bookingId: "BK001"
        },
        {
            id: "G002",
            fullName: "Ali Raza",
            fatherName: "Raza Ahmed",
            cnic: "54321-7654321-2",
            email: "ali.raza@email.com",
            phone: "0333-9876543",
            dateOfBirth: "1997-08-22",
            occupation: "Professional",
            address: "Garden Town, Islamabad",
            city: "Islamabad",
            province: "Punjab",
            emergencyContact: {
                name: "Raza Ahmed",
                relation: "Father",
                phone: "0344-1111111"
            },
            checkInDate: "2025-01-15",
            rentPerMonth: 35000,
            securityDeposit: 35000,
            paymentStatus: "Pending",
            lastPaymentDate: "2025-01-15",
            nextPaymentDue: "2025-02-15",
            status: "Active",
            bookingId: "BK002"
        }
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case "Active":
                return "bg-green-100 text-green-700 border-green-200";
            case "Inactive":
                return "bg-gray-100 text-gray-700 border-gray-200";
            case "Left":
                return "bg-red-100 text-red-700 border-red-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case "Paid":
                return "bg-green-100 text-green-700 border-green-200";
            case "Pending":
                return "bg-orange-100 text-orange-700 border-orange-200";
            case "Overdue":
                return "bg-red-100 text-red-700 border-red-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "Paid":
            case "Active":
                return <CheckCircle className="w-4 h-4" />;
            case "Pending":
                return <AlertCircle className="w-4 h-4" />;
            case "Overdue":
            case "Left":
                return <XCircle className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    const filteredGuests = guests.filter(guest => {
        const matchesSearch =
            guest.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            guest.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            guest.phone.includes(searchQuery) ||
            guest.cnic.includes(searchQuery);

        const matchesStatus = filterStatus === "all" || guest.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-4 pt-4 gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="cursor-pointer"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Room Guests</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Link href={`/admin/dashboard`} className="text-sm text-muted-foreground hover:text-primary">
                                Dashboard
                            </Link>
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                            <Link href={`/admin/hostels`} className="text-sm text-muted-foreground hover:text-primary">
                                Hostels
                            </Link>
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                            <Link href={`/admin/hostels/${hostelId}`} className="text-sm text-muted-foreground hover:text-primary">
                                {roomInfo.hostelName}
                            </Link>
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                            <Link href={`/admin/hostels/${hostelId}/room-details/room/${roomId}`} className="text-sm text-muted-foreground hover:text-primary">
                                {roomInfo.name}
                            </Link>
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Guests</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="cursor-pointer">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Link href={`/admin/hostels/${hostelId}/room-details/room/${roomId}/add-guest`}>
                        <Button className="cursor-pointer">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Guest
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Room Info Card */}
            <div className="p-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Room Number</p>
                                <p className="font-semibold text-lg">{roomInfo.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Type</p>
                                <p className="font-semibold">{roomInfo.type}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Floor</p>
                                <p className="font-semibold">Floor {roomInfo.floor}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Capacity</p>
                                <p className="font-semibold">{roomInfo.capacity} persons</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Current Occupancy</p>
                                <p className="font-semibold">{roomInfo.currentOccupancy}/{roomInfo.capacity}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Rent/Month</p>
                                <p className="font-semibold">PKR {roomInfo.rentPerMonth.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="px-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <div className="md:col-span-2 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search by name, email, phone, or CNIC..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                    <SelectItem value="Left">Left</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Guests List */}
            <div className="p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>All Guests ({filteredGuests.length})</CardTitle>
                        <CardDescription>
                            Showing {filteredGuests.length} of {guests.length} guests in {roomInfo.name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {filteredGuests.map((guest) => (
                                <div key={guest.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    {/* Guest Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {guest.fullName}
                                                </h3>
                                                <Badge className={`${getStatusColor(guest.status)} border flex items-center gap-1`}>
                                                    {getStatusIcon(guest.status)}
                                                    {guest.status}
                                                </Badge>
                                                <Badge className={`${getPaymentStatusColor(guest.paymentStatus)} border flex items-center gap-1`}>
                                                    {getStatusIcon(guest.paymentStatus)}
                                                    {guest.paymentStatus}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                Check-in: {guest.checkInDate} • Booking ID: {guest.bookingId}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Link href={`/admin/hostels/${hostelId}/residents/${guest.id}`}>
                                                <Button variant="outline" size="sm" className="cursor-pointer">
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View Profile
                                                </Button>
                                            </Link>
                                            <Link href={`/admin/bookings/${guest.bookingId}`}>
                                                <Button variant="outline" size="sm" className="cursor-pointer">
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    Booking
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Guest Details Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        {/* Contact */}
                                        <div className="flex items-start gap-2">
                                            <Phone className="w-4 h-4 text-gray-400 mt-1" />
                                            <div>
                                                <p className="text-xs text-gray-500">Phone</p>
                                                <p className="text-sm font-medium">{guest.phone}</p>
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div className="flex items-start gap-2">
                                            <Mail className="w-4 h-4 text-gray-400 mt-1" />
                                            <div>
                                                <p className="text-xs text-gray-500">Email</p>
                                                <p className="text-sm font-medium truncate" title={guest.email}>
                                                    {guest.email}
                                                </p>
                                            </div>
                                        </div>

                                        {/* CNIC */}
                                        <div className="flex items-start gap-2">
                                            <User className="w-4 h-4 text-gray-400 mt-1" />
                                            <div>
                                                <p className="text-xs text-gray-500">CNIC</p>
                                                <p className="text-sm font-medium">{guest.cnic}</p>
                                            </div>
                                        </div>

                                        {/* Rent */}
                                        <div className="flex items-start gap-2">
                                            <DollarSign className="w-4 h-4 text-gray-400 mt-1" />
                                            <div>
                                                <p className="text-xs text-gray-500">Monthly Rent</p>
                                                <p className="text-sm font-medium text-green-600">
                                                    PKR {guest.rentPerMonth.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Next Payment */}
                                        <div className="flex items-start gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                                            <div>
                                                <p className="text-xs text-gray-500">Next Payment Due</p>
                                                <p className="text-sm font-medium">{guest.nextPaymentDue}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Emergency Contact */}
                                    <div className="mt-4 pt-4 border-t">
                                        <div className="flex items-center gap-6">
                                            <div>
                                                <p className="text-xs text-gray-500">Emergency Contact</p>
                                                <p className="text-sm font-medium">
                                                    {guest.emergencyContact.name} ({guest.emergencyContact.relation})
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Emergency Phone</p>
                                                <p className="text-sm font-medium">{guest.emergencyContact.phone}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Occupation</p>
                                                <p className="text-sm font-medium">{guest.occupation}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">City</p>
                                                <p className="text-sm font-medium">{guest.city}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {filteredGuests.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                    <p className="text-lg font-medium">No guests found</p>
                                    <p className="text-sm">Try adjusting your search or filters</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default function RoomGuestsPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-white font-sans">
                <div className="flex flex-col items-center gap-6">
                    <div className="h-10 w-10 border-[3px] border-gray-200 border-t-black rounded-full animate-spin" />
                    <User className="h-8 w-8 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    <p className="text-lg font-bold text-gray-900 tracking-tight">Accessing Guest Registry...</p>
                </div>
            </div>
        }>
            <RoomGuestsContent />
        </Suspense>
    );
}
