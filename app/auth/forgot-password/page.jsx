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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 hover:opacity-90 transition-opacity">
                        <Home className="w-8 h-8 text-white" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">GreenView Hostels</h1>
                    <p className="text-gray-600 mt-2">Management System</p>
                </div>

                {/* Main Card */}
                <Card className="shadow-xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
                        <CardDescription>
                            {isSubmitted
                                ? "Check your email for instructions"
                                : "Enter your email to receive a reset link"
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isSubmitted ? (
                            <div className="text-center space-y-6">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    </div>
                                </div>
                                <div className="space-y-2">

                                    <p className="text-sm text-gray-600">
                                        We have sent a password reset link to <span className="font-semibold text-gray-900"><a href={`https://mail.google.com/mail/u/0/#inbox`} target="_blank" rel="noopener noreferrer">{email}</a></span>
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Don't see it? Check your spam folder.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full cursor-pointer"
                                    onClick={() => setIsSubmitted(false)}
                                >
                                    Try another email
                                </Button>
                                <div className="pt-2">
                                    <Link href="/auth/login" className="text-sm text-primary font-medium hover:underline flex items-center justify-center gap-2">
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to Login
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Email Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="admin@greenview.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={`pl-10 ${error ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    {error && (
                                        <p className="text-xs text-red-500">{error}</p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="w-full cursor-pointer"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <span>Sending...</span>
                                    ) : (
                                        <>
                                            Send Reset Link
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </Button>

                                {/* Back Link */}
                                <div className="text-center mt-4">
                                    <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2 transition-colors">
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to Login
                                    </Link>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-xs text-gray-500 mt-6">
                    © 2024 GreenView Hostels. All rights reserved.
                </p>
            </div>
        </div>
    );
}
