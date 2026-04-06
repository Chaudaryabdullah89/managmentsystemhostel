import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/checkRole';
import { hasPermission } from '@/lib/permissions';
import HostelServices from "../../../../lib/services/hostelservices/hostelservices";
const hostelServices = new HostelServices()
import { prisma } from "@/lib/prisma";

export async function GET(request) {
    const auth = await checkRole(['ADMIN', 'WARDEN']);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const skip = (page - 1) * limit

    // Security: Wardens can ONLY see their assigned hostel
    if (auth.user.role === 'WARDEN') {
        let wardenHostelId = auth.user.hostelId;
        if (!wardenHostelId) {
            const profile = await prisma.user.findUnique({
                where: { id: auth.user.userId || auth.user.id },
                select: { hostelId: true }
            });
            wardenHostelId = profile?.hostelId;
        }

        if (!wardenHostelId) {
             return NextResponse.json({ success: true, data: [], pagination: { total: 0 } });
        }

        const res = await hostelServices.gethostelById(wardenHostelId);
        const data = await res.json();
        // Wrap single hostel in array for consistency with plural GET
        return NextResponse.json({ 
            ...data, 
            data: data.data ? [data.data] : [],
            pagination: { total: data.data ? 1 : 0, page: 1, limit: 10 } 
        });
    }

    // Admins see all
    return hostelServices.gethostels(skip, limit)
}
