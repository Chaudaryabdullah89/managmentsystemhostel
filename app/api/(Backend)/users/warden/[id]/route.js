const { prisma } = require("@/lib/prisma");
const { NextResponse } = require("next/server");

export async function GET(request, { params }) {

    try {
        const { id } = await params
        const warden = await prisma.user.findUnique({ where: { id: id } })
        return NextResponse.json({ success: true, data: warden })
    } catch (error) {
        console.log(error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

}