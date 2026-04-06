import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";

export async function GET(req) {
  try {
    const auth = await checkRole(["ADMIN"]);
    if (!auth.success) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const permissions = await prisma.rolePermission.findMany();
    return NextResponse.json({ success: true, permissions });
  } catch (error) {
    console.error("GET /api/permissions error:", error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const auth = await checkRole(["ADMIN"]);
    if (!auth.success) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const { role, permissions } = await req.json();

    if (!role || !permissions) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const updated = await prisma.rolePermission.upsert({
      where: { role: role },
      update: { permissions },
      create: { role: role, permissions },
    });

    return NextResponse.json({ success: true, rolePermission: updated });
  } catch (error) {
    console.error("PUT /api/permissions error:", error);
    return NextResponse.json({ success: false, message: "Server Error", error: String(error) }, { status: 500 });
  }
}
