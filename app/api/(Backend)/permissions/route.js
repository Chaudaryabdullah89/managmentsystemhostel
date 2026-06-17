import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";
import { DEFAULT_ROLE_PERMISSIONS, buildDefaultPermissionsPayload, ALL_PERMISSION_KEYS } from "@/lib/permissions";
import { revalidateTag } from "next/cache";

// ─── GET /api/permissions ─────────────────────────────────────────────────────
// Returns all role permission rows from DB, merged with defaults so callers
// always get a complete permissions map even if the DB row is missing.
export async function GET() {
  try {
    const auth = await checkRole(["ADMIN"]);
    if (!auth.success) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const rows = await prisma.rolePermission.findMany();

    // Build enriched result: merge DB row with defaults so every key is present
    const roles = ["ADMIN", "WARDEN", "STAFF", "RESIDENT", "GUEST"];
    const enriched = roles.map((role) => {
      const row = rows.find((r) => r.role === role);
      const storedPerms = row?.permissions
        ? typeof row.permissions === "object"
          ? row.permissions
          : JSON.parse(row.permissions)
        : {};
      return {
        role,
        permissions: { ...(DEFAULT_ROLE_PERMISSIONS[role] || {}), ...storedPerms },
        updatedAt: row?.updatedAt ?? null,
        source: row ? "database" : "defaults",
      };
    });

    return NextResponse.json({ success: true, permissions: enriched });
  } catch (error) {
    console.error("GET /api/permissions error:", error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}

// ─── PUT /api/permissions ─────────────────────────────────────────────────────
// Upserts granular permissions for a role.
// Body: { role: string, permissions: Record<string, boolean> }
export async function PUT(req) {
  try {
    const auth = await checkRole(["ADMIN"]);
    if (!auth.success) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { role, permissions } = body;

    if (!role || typeof permissions !== "object" || Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, message: "Missing or invalid fields: role (string) and permissions (object) are required" },
        { status: 400 }
      );
    }

    const validRoles = ["WARDEN", "STAFF", "RESIDENT", "GUEST"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, message: `Invalid role. Allowed: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // Whitelist only known permission keys to prevent injection
    const sanitized = {};
    for (const key of ALL_PERMISSION_KEYS) {
      if (key in permissions) {
        sanitized[key] = Boolean(permissions[key]);
      }
    }

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid permission keys found. Check ALL_PERMISSION_KEYS." },
        { status: 400 }
      );
    }

    const updated = await prisma.rolePermission.upsert({
      where: { role },
      update: { permissions: sanitized },
      create: { role, permissions: sanitized },
    });

    console.log(`[Permissions] Role '${role}' permissions updated by admin '${auth.user?.email}'`);

    revalidateTag("permissions");

    return NextResponse.json({ success: true, rolePermission: updated });
  } catch (error) {
    console.error("PUT /api/permissions error:", error);
    return NextResponse.json({ success: false, message: "Server Error", error: String(error) }, { status: 500 });
  }
}

// ─── POST /api/permissions ────────────────────────────────────────────────────
// Body: { role: string, action: "reset" }
// Resets the specified role's permissions back to hardcoded defaults.
export async function POST(req) {
  try {
    const auth = await checkRole(["ADMIN"]);
    if (!auth.success) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { role, action } = body;

    if (!role || action !== "reset") {
      return NextResponse.json(
        { success: false, message: "Body must include: { role, action: 'reset' }" },
        { status: 400 }
      );
    }

    const validRoles = ["WARDEN", "STAFF", "RESIDENT", "GUEST"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, message: `Invalid role. Allowed: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    const defaults = buildDefaultPermissionsPayload(role);
    if (!defaults) {
      return NextResponse.json({ success: false, message: "No defaults found for that role." }, { status: 404 });
    }

    const reset = await prisma.rolePermission.upsert({
      where: { role },
      update: { permissions: defaults },
      create: { role, permissions: defaults },
    });

    console.log(`[Permissions] Role '${role}' reset to defaults by admin '${auth.user?.email}'`);

    revalidateTag("permissions");

    return NextResponse.json({ success: true, message: `'${role}' permissions reset to defaults.`, rolePermission: reset });
  } catch (error) {
    console.error("POST /api/permissions error:", error);
    return NextResponse.json({ success: false, message: "Server Error", error: String(error) }, { status: 500 });
  }
}
