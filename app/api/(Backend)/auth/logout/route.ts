import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('token')?.value;


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
        response.cookies.delete('token');
        // console.log(`[API] POST /api/auth/logout - Logout successful, cookie deleted`);
        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { success: false, message: 'Logout failed' },
            { status: 500 }
        );
    }
}
