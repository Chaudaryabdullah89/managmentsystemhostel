import { getSystemSettings, getPermissionsForRole } from "../lib/permissions";
import { prisma } from "../lib/prisma";
import { revalidateTag } from "next/cache";
import { describe, it, expect } from "vitest";

describe("Settings and Permissions Cache Revalidation", () => {
  it("should invalidate and reload system settings when revalidateTag('settings') is called", async () => {
    const s1 = await getSystemSettings();
    const targetVal = !s1.enableRefundRequests;

    await prisma.systemSettings.upsert({
      where: { id: "global" },
      update: { enableRefundRequests: targetVal },
      create: { id: "global", enableRefundRequests: targetVal },
    });

    revalidateTag("settings");

    const s2 = await getSystemSettings();
    expect(s2.enableRefundRequests).toBe(targetVal);
  });

  it("should invalidate and reload role permissions when revalidateTag('permissions') is called", async () => {
    const p1 = await getPermissionsForRole("WARDEN");
    const targetVal = !p1.manage_hostels;

    await prisma.rolePermission.upsert({
      where: { role: "WARDEN" },
      update: { permissions: { ...p1, manage_hostels: targetVal } },
      create: { role: "WARDEN", permissions: { ...p1, manage_hostels: targetVal } },
    });

    revalidateTag("permissions");

    const p2 = await getPermissionsForRole("WARDEN");
    expect(p2.manage_hostels).toBe(targetVal);
  });
});
