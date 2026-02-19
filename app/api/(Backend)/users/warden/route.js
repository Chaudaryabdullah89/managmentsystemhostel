import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
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
        address: true
      }
    });

    return NextResponse.json({
      success: true,
      data: wardens
    });
  } catch (error) {
    console.error("[API] GET /api/users/warden - Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch wardens" },
      { status: 500 }
    );
  }
}
