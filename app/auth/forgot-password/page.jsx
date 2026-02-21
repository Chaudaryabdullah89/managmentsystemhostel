"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Home, Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email) {
            setError('Email is required');
            return;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Email is invalid');
            return;
        }

        const response = await fetch(`/api/mails/forget-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        setIsLoading(true);

        const data = await response.json();
        if (data.message === "Email sent successfully") {
            setIsSubmitted(true);
            toast.success("Reset link sent!");
        } else {
            toast.error("Something went wrong. Please try again.");
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex bg-white font-sans antialiased text-slate-900 relative overflow-hidden">

            {/* Subtle Grid Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-40 pointer-events-none" />

            {/* LEFT SIDE — Structured Visual */}
            <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden">

                {/* Soft lighting */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-3xl rounded-full" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 blur-3xl rounded-full" />

                {/* Floating Panels */}
                <div className="relative w-[420px] h-[420px]">

                    <div className="absolute top-0 left-0 w-64 h-40 bg-white/70 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl" />

                    <div className="absolute bottom-10 right-0 w-72 h-44 bg-white/70 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl" />

                    <div className="absolute top-32 left-24 w-80 h-52 bg-slate-900 rounded-3xl shadow-2xl flex items-center justify-center">
                        <Home className="h-10 w-10 text-white opacity-90" />
                    </div>

                </div>

            </div>

            {/* RIGHT SIDE — FORM */}
            <div className="flex w-full lg:w-1/2 items-center justify-center p-6 lg:p-16 relative z-10">

                <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-10 shadow-[0_30px_80px_rgba(0,0,0,0.04)]">

                    {/* Brand */}
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                            <Home className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">
                                GreenView Hostels
                            </h1>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400">
                                Management System
                            </p>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold">Forgot Password</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {isSubmitted
                                ? "Check your email for reset instructions"
                                : "Enter your email to receive a reset link"}
                        </p>
                    </div>

                    {isSubmitted ? (
                        <div className="text-center space-y-6">

                            <div className="flex justify-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm text-slate-600">
                                    A reset link has been sent to
                                </p>
                                <a
                                    href="https://mail.google.com/mail/u/0/#inbox"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-slate-900 hover:underline"
                                >
                                    {email}
                                </a>
                                <p className="text-xs text-slate-500">
                                    If you don’t see it, check your spam folder.
                                </p>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setIsSubmitted(false)}
                            >
                                Try another email
                            </Button>

                            <Link
                                href="/auth/login"
                                className="text-sm text-primary font-medium hover:underline flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Email */}
                            <div>
                                <Label htmlFor="email" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Email Address
                                </Label>

                                <div className="relative mt-2">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@greenview.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`pl-12 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-primary ${error ? "border-red-500" : ""
                                            }`}
                                    />
                                </div>

                                {error && (
                                    <p className="text-xs text-red-500 mt-1">{error}</p>
                                )}
                            </div>

                            {/* Submit */}
                            <Button
                                type="submit"
                                className="w-full h-12 rounded-xl"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    "Sending..."
                                ) : (
                                    <>
                                        Send Reset Link
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>

                            <Link
                                href="/auth/login"
                                className="text-sm text-slate-600 hover:text-slate-900 flex items-center justify-center gap-2 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Login
                            </Link>

                        </form>
                    )}

                </div>
            </div>
        </div>
    );
}
