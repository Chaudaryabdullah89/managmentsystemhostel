import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;


        if (token) {

            await prisma.session.updateMany({
                where: {
                    token: token
                },
                data: {
                    isActive: false
                }
            });
        } else {
            // console.log(`[API] POST /api/auth/logout - No token found in cookies`);
        }


        const response = NextResponse.json(
            { success: true, message: 'Logged out successfully' },
            { status: 200 }
        );
        response.cookies.set({
            name: 'token',
            value: '',
            maxAge: 0,
            path: '/',
            expires: new Date(0),
            sameSite: 'strict',
            secure: process.env.NODE_ENV === "production"
        });
        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { success: false, message: 'Logout failed' },
            { status: 500 }
        );
    }
}
