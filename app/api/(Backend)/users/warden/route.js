import { checkRole } from '@/lib/checkRole';
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const auth = await checkRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

  try {
    const wardens = await prisma.user.findMany({
      where: {
        role: "WARDEN"
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        city: true,
        address: true,
        hostelId: true,
        basicSalary: true,
        allowances: true
      }
    });

    return NextResponse.json({
      success: true,
      data: wardens, // For backward compatibility with existing components
      users: wardens // For consistency with newer logic
    });
  } catch (error) {
    console.error("[API] GET /api/users/warden - Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch wardens" },
      { status: 500 }
    );
  }
}
