"use client"
import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Clock, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useUserById } from "@/hooks/useusers";

const WardenProfilePage = () => {
    const params = useParams();
    const { data: user, isLoading, error } = useUserById(params.id);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
                <p className="text-red-500 font-medium">Failed to load warden profile</p>
                <Link href="/admin/hostels">
                    <Button variant="outline">Go Back</Button>
                </Link>
            </div>
        );
    }

    const getRoleColor = (role) => {
        switch (role) {
            case "Admin": return "bg-red-100 text-red-700 border-red-200";
            case "Warden": return "bg-blue-100 text-blue-700 border-blue-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    return (
        <div className="container mx-auto py-10 px-4 max-w-5xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/hostels">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Warden Profile</h1>
                    <p className="text-muted-foreground">View details for {user.name}</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Profile Header Card */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row items-start gap-6">
                            {/* Profile Image */}
                            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                {user.image ? (
                                    <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-12 h-12 text-gray-400" />
                                )}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h2 className="text-2xl font-bold">{user.name}</h2>
                                    <Badge className={`${getRoleColor(user.role)} border`}>
                                        {user.role}
                                    </Badge>
                                    <Badge className={`border ${user.isActive ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}`}>
                                        {user.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                <p className="text-gray-600">{user.designation || "Warden"}</p>
                                <p className="text-sm text-gray-500 font-mono">ID: {user.id}</p>

                                <div className="flex flex-wrap gap-4 pt-2 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <User className="w-5 h-5 text-gray-500" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-xs text-gray-500 uppercase tracking-wider">Email Address</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <p className="text-sm font-medium">{user.email}</p>
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs text-gray-500 uppercase tracking-wider">Phone Number</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <p className="text-sm font-medium">{user.phone || "N/A"}</p>
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs text-gray-500 uppercase tracking-wider">CNIC Number</Label>
                                <p className="text-sm font-medium mt-1">{user.cnic || "N/A"}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address Information */}
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <MapPin className="w-5 h-5 text-gray-500" />
                                Address Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-xs text-gray-500 uppercase tracking-wider">Address</Label>
                                <p className="text-sm font-medium mt-1 whitespace-pre-wrap">{user.address || "N/A"}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-gray-500 uppercase tracking-wider">City</Label>
                                    <p className="text-sm font-medium mt-1">{user.city || "N/A"}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500 uppercase tracking-wider">Country</Label>
                                    <p className="text-sm font-medium mt-1">Pakistan</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default WardenProfilePage;
