import { checkRole } from '@/lib/checkRole';
const { prisma } = require("@/lib/prisma");
const { NextResponse } = require("next/server");

export async function GET(request, { params }) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });


    try {
        const { id } = await params
        const warden = await prisma.user.findUnique({ where: { id: id } })
        return NextResponse.json({ success: true, data: warden })
    } catch (error) {
        console.log(error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

}