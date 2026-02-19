'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldX, LogIn } from 'lucide-react';

export default function UnauthorizedPage() {
    const router = useRouter();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push('/auth/login');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-sm shadow-lg">
                <CardHeader className="text-center pb-3">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-3 mx-auto">
                        <ShieldX className="w-8 h-8 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl text-red-600">Access Denied</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <p className="text-sm text-gray-600">
                        You don't have permission to view this page.
                    </p>

                    <div className="p-3 bg-gray-100 rounded-lg">
                        <p className="text-xs text-gray-700">
                            Redirecting in <span className="font-bold text-red-600">{countdown}</span>s
                        </p>
                    </div>

                    <Button
                        onClick={() => router.push('/auth/login')}
                        className="w-full"
                    >
                        <LogIn className="w-4 h-4 mr-2" />
                        Go to Login
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
