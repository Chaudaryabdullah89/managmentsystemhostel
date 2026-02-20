"use client";

import { useEffect } from 'react';
import { ShieldAlert, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Error({ error, reset }) {
    const router = useRouter();

    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Application Error Recorded:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-rose-50/30 flex items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-rose-900/5 text-center space-y-8 animate-in slide-in-from-bottom-8 duration-500 fade-in">
                <div className="mx-auto w-24 h-24 bg-rose-100 rounded-[2rem] flex items-center justify-center rotate-3 shadow-lg shadow-rose-200/50">
                    <ShieldAlert className="h-10 w-10 text-rose-600 -rotate-3" />
                </div>

                <div className="space-y-3">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Something went wrong</h1>
                    <p className="text-sm font-medium text-gray-500">
                        We encountered an unexpected error while processing your request. Our system has automatically logged this issue.
                    </p>
                </div>

                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-left overflow-hidden">
                    <p className="text-[10px] font-mono text-rose-600 font-bold truncate">ERR: {error?.message || "Unknown Application Exception"}</p>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                    <Button
                        onClick={() => reset()}
                        className="w-full rounded-2xl h-14 bg-rose-600 hover:bg-rose-700 text-white font-bold tracking-widest uppercase text-xs shadow-xl shadow-rose-600/20"
                    >
                        <RefreshCcw className="mr-2 h-4 w-4" /> Try Again
                    </Button>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                        <Button
                            onClick={() => router.back()}
                            variant="outline"
                            className="w-full rounded-2xl h-12 border-gray-200 text-gray-600 font-bold tracking-widest uppercase text-[10px] hover:bg-gray-50"
                        >
                            Go Back
                        </Button>
                        <Link href="/" className="w-full">
                            <Button
                                variant="outline"
                                className="w-full rounded-2xl h-12 border-gray-200 text-gray-600 font-bold tracking-widest uppercase text-[10px] hover:bg-gray-50"
                            >
                                <Home className="mr-2 h-3 w-3" /> Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
