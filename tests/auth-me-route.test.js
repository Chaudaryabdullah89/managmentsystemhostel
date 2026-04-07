import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/checkRole", () => ({
    checkRole: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
    },
}));

vi.mock("@/lib/permissions", () => ({
    getPermissionsForRole: vi.fn(),
    getSystemSettings: vi.fn(),
}));

import { checkRole } from "@/lib/checkRole";
import { prisma } from "@/lib/prisma";
import { getPermissionsForRole, getSystemSettings } from "@/lib/permissions";
import { GET } from "@/app/api/(Backend)/auth/me/route";

describe("/api/auth/me smoke", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns unauthorized when no valid auth exists", async () => {
        checkRole.mockResolvedValue({ success: false, error: "Unauthorized", status: 401 });

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.success).toBe(false);
        expect(body.message).toBe("Unauthorized");
        expect(body.error).toBe("Unauthorized");
    });

    it("returns session user payload when authorized", async () => {
        checkRole.mockResolvedValue({ success: true, user: { id: "u-1", role: "WARDEN" } });
        prisma.user.findUnique.mockResolvedValue({
            id: "u-1",
            name: "Warden One",
            email: "warden@example.com",
            role: "WARDEN",
            hostelId: "h-1",
            lastLogin: null,
            canManageExpenses: false,
            canManageMess: true,
            canManageGeneral: false,
            canManageUtilities: true,
            canManageMaintenance: false,
            canManageSalaries: false,
        });
        getPermissionsForRole.mockResolvedValue({ view_expenses: true });
        getSystemSettings.mockResolvedValue({ enablePaymentProcessing: true });

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.user.id).toBe("u-1");
        expect(body.user.rolePermissions).toEqual({ view_expenses: true });
        expect(body.user.systemSettings).toEqual({ enablePaymentProcessing: true });
    });
});
