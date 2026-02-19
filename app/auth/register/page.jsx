"use client"
import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-2">
            <div className="w-full max-w-sm">

                {/* Logo */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-white border border-gray-100 rounded-xl shadow-md mb-3">
                        <Home className="w-6 h-6 text-indigo-600" />
                    </div>

                    <h1 className="text-lg font-bold text-gray-900 uppercase tracking-tight">
                        Hostel Management
                    </h1>

                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mt-1">
                        Security Protocol Active
                    </p>
                </div>

                <Card className="rounded-2xl border border-gray-100 shadow-lg overflow-hidden bg-white">

                    <div className="h-1 bg-indigo-600 w-full" />

                    <CardHeader className="p-6 pb-3 text-center">
                        <div className="h-12 w-12 bg-rose-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <ShieldAlert
                                className="w-6 h-6"
                                fill="currentColor"
                                style={{ color: "rgb(225 29 72)" }}
                            />
                        </div>

                        <CardTitle className="text-lg font-semibold text-gray-900 uppercase">
                            Registration Locked
                        </CardTitle>

                        <CardDescription className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mt-1">
                            External Access Restricted
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6 pt-0 text-center space-y-4">
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Self-registration has been deactivated by the system administrator.
                            Accounts can only be created by{" "}
                            <span className="text-indigo-600 font-semibold">Wardens</span> or{" "}
                            <span className="text-indigo-600 font-semibold">Administrators</span>.
                        </p>

                        <div className="space-y-2">
                            <Link href="/auth/login" className="block w-full">
                                <Button className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold uppercase tracking-wide">
                                    Return to Login
                                </Button>
                            </Link>

                            <Button
                                variant="ghost"
                                className="w-full h-10 rounded-lg text-gray-400 text-[10px] font-semibold uppercase tracking-wide hover:bg-gray-50"
                                onClick={() => router.back()}
                            >
                                <ArrowLeft className="w-3 h-3 mr-1" /> Go Back
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-[9px] font-semibold text-gray-300 uppercase tracking-widest mt-6">
                    © 2024 Hostel Management
                </p>
            </div>
        </div>
    );
}
