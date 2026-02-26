import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/checkRole';
import HostelServices from "../../../../lib/services/hostelservices/hostelservices";
const hostelServices = new HostelServices()

export async function GET(request) {
    const auth = await checkRole(['ADMIN', 'SUPER_ADMIN']);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 5
    return hostelServices.gethostels(page, limit)
}
