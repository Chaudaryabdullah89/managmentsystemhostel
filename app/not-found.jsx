"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full text-center space-y-8 animate-in zoom-in-95 duration-700 fade-in">
                <div className="relative">
                    <div className="text-[150px] font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-100 to-indigo-50 leading-none select-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-24 w-24 bg-white rounded-full shadow-2xl flex items-center justify-center animate-bounce duration-1000">
                            <AlertTriangle className="h-10 w-10 text-indigo-600" />
                        </div>
                    </div>
                </div>

                <div className="space-y-3 relative z-10 -mt-8">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Page Not Found</h1>
                    <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto">
                        The link you followed may be broken, or the page may have been removed. We couldn't find what you were looking for.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto rounded-xl h-12 px-8 border-gray-200 text-gray-600 font-bold tracking-widest uppercase text-xs hover:bg-gray-100"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                    </Button>
                    <Link href="/" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto rounded-xl h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold tracking-widest uppercase text-xs shadow-xl shadow-indigo-600/20">
                            <Home className="mr-2 h-4 w-4" /> Home
                        </Button>
                    </Link>
                </div>

                <div className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] pt-8">
                    GreenView Hostels System
                </div>
            </div>
        </div>
    );
}
