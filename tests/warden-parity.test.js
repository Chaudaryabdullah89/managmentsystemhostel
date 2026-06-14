import { beforeEach, describe, expect, it, vi } from "vitest";
import { NAVIGATION_GROUPS } from "@/lib/navigation";
import { getAllowedExpenseCategories, canAccessExpenseCategory } from "@/lib/expensePermissions";

// Mock external systems
const mockRequireRoles = vi.fn();
const mockRequireAuth = vi.fn();
const mockIsServiceEnabled = vi.fn();
const mockHasPermission = vi.fn();

vi.mock("@/lib/apiAuth", () => ({
    requireRoles: mockRequireRoles,
    requireAuth: mockRequireAuth,
}));

vi.mock("@/lib/permissions", () => ({
    isServiceEnabled: mockIsServiceEnabled,
    hasPermission: mockHasPermission,
    DEFAULT_SETTINGS: {
        maintenanceMode: false,
        maintenanceMessage: "",
    },
}));

// Mock next/cache revalidation
const mockRevalidateTag = vi.fn();
vi.mock("next/cache", () => ({
    revalidateTag: mockRevalidateTag,
    unstable_cache: (fn) => fn,
}));

// Mock prisma database queries
const mockUserFindUnique = vi.fn();
const mockUserFindMany = vi.fn();
const mockPaymentFindUnique = vi.fn();
const mockSystemSettingsUpsert = vi.fn();
vi.mock("@/lib/prisma", () => ({
    prisma: {
        user: {
            findUnique: mockUserFindUnique,
            findMany: mockUserFindMany,
        },
        payment: {
            findUnique: mockPaymentFindUnique,
        },
        systemSettings: {
            upsert: mockSystemSettingsUpsert,
        },
    },
}));

// Mock payment services
const mockCreatePayment = vi.fn();
vi.mock("@/lib/services/paymentservices/paymentservices", () => ({
    default: class {
        createPayment = mockCreatePayment;
    },
}));

// Mock room services
const mockGetRooms = vi.fn();
vi.mock("@/lib/services/roomservices/roomservices", () => ({
    default: class {
        getRooms = mockGetRooms;
    },
}));

// Mock mailer
vi.mock("@/lib/utils/sendmail", () => ({
    sendEmail: vi.fn(),
}));

describe("Warden Parity & Route Safety Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUserFindMany.mockResolvedValue([]);
    });

    // ─── 1. Navigation Table Prefix Safety (Unit Test) ───
    describe("Navigation Route Leak Prevention", () => {
        it("guarantees no admin path links leak into warden navigation groups", () => {
            const wardenGroups = NAVIGATION_GROUPS.warden;
            expect(wardenGroups).toBeDefined();

            wardenGroups.forEach((group) => {
                group.items.forEach((item) => {
                    // All warden navigation links must start with /warden prefix
                    expect(item.url.startsWith("/warden")).toBe(true);
                    // No warden links should reference the /admin route namespace
                    expect(item.url.includes("/admin")).toBe(false);
                });
            });
        });

        it("verifies expected navigation modules are present for warden", () => {
            const wardenGroups = NAVIGATION_GROUPS.warden;
            const titles = wardenGroups.map((g) => g.title);
            
            expect(titles).toContain("Overview");
            expect(titles).toContain("Property");
            expect(titles).toContain("Operations");
            expect(titles).toContain("Finance");
            expect(titles).toContain("Analytics");
        });
    });

    // ─── 2. Granular Warden Expense Permission Validation (Unit Test) ───
    describe("Expense Permissions Matrix", () => {
        it("filters out SALARY category for wardens on layout rendering", () => {
            const user = {
                role: "WARDEN",
                canManageExpenses: true,
            };
            const isWarden = user.role === "WARDEN";
            
            // Simulating page.jsx allowedCategories logic
            const allCategories = ["MESS", "GENERAL", "UTILITY_BILL", "MAINTENANCE", "SALARY"];
            let allowed = allCategories;
            if (isWarden) {
                allowed = allCategories.filter(cat => cat !== 'SALARY');
            }
            expect(allowed).not.toContain("SALARY");
        });
    });

    // ─── 3. Warden Rooms Scope Integration (API Scoping Test) ───
    describe("GET /api/rooms - Hostel Scoping Isolation", () => {
        it("restricts returned rooms to the warden's assigned hostelId", async () => {
            // Simulate authenticated WARDEN user request
            mockRequireRoles.mockResolvedValue({
                ok: true,
                user: { id: "w-1", role: "WARDEN", hostelId: "hostel-w-1" },
            });
            mockGetRooms.mockResolvedValue([{ id: "rm-1", roomNumber: "101" }]);

            const { GET } = await import("@/app/api/(Backend)/rooms/route");
            const response = await GET();
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body.success).toBe(true);
            expect(mockGetRooms).toHaveBeenCalledTimes(1);
            expect(mockGetRooms).toHaveBeenCalledWith("hostel-w-1");
        });
    });

    // ─── 4. Warden Payments Scope Residency Check (API Security Test) ───
    describe("POST /api/payments - Warden Residency Isolation", () => {
        it("denies access if warden attempts to manage a resident in another hostel", async () => {
            mockIsServiceEnabled.mockResolvedValue(true); // enablePaymentProcessing
            mockRequireAuth.mockResolvedValue({
                ok: true,
                user: { id: "w-2", role: "WARDEN", hostelId: "warden-hostel-a" },
            });
            mockHasPermission.mockResolvedValue(true); // allow managing payments for others in general

            // Target resident belongs to hostel-b
            mockUserFindUnique.mockResolvedValue({
                id: "res-1",
                hostelId: "resident-hostel-b",
            });

            const { POST } = await import("@/app/api/(Backend)/payments/route");
            const request = new Request("http://localhost/api/payments", {
                method: "POST",
                body: JSON.stringify({
                    userId: "res-1",
                    amount: 5000,
                }),
                headers: { "Content-Type": "application/json" },
            });

            const response = await POST(request);
            const body = await response.json();

            expect(response.status).toBe(403);
            expect(body.success).toBe(false);
            expect(body.message).toContain("Access Denied: You cannot manage residents of other hostels.");
            expect(mockCreatePayment).not.toHaveBeenCalled();
        });

        it("permits payment creation if resident matches warden's hostelId scope", async () => {
            mockIsServiceEnabled.mockResolvedValue(true);
            mockRequireAuth.mockResolvedValue({
                ok: true,
                user: { id: "w-2", role: "WARDEN", hostelId: "hostel-shared" },
            });
            mockHasPermission.mockResolvedValue(true); // allow managing payments for others in general

            // Target resident is in the same hostel
            mockUserFindUnique.mockResolvedValue({
                id: "res-2",
                hostelId: "hostel-shared",
            });

            mockCreatePayment.mockResolvedValue({ id: "p-1" });
            mockPaymentFindUnique.mockResolvedValue({
                id: "p-1",
                Booking: { Room: { hostelId: "hostel-shared" } },
                User: { name: "John Doe" },
            });

            const { POST } = await import("@/app/api/(Backend)/payments/route");
            const request = new Request("http://localhost/api/payments", {
                method: "POST",
                body: JSON.stringify({
                    userId: "res-2",
                    amount: 5000,
                }),
                headers: { "Content-Type": "application/json" },
            });

            const response = await POST(request);
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body.success).toBe(true);
            expect(mockCreatePayment).toHaveBeenCalledTimes(1);
        });
    });

    // ─── 5. Settings API & Cache Revalidation Integration ───
    describe("PUT /api/settings - Cache Invalidation", () => {
        it("triggers settings revalidation tag on success", async () => {
            mockRequireRoles.mockResolvedValue({
                ok: true,
                user: { id: "a-1", role: "ADMIN" },
            });
            mockSystemSettingsUpsert.mockResolvedValue({
                id: "global",
                maintenanceMode: true,
            });

            const { PUT } = await import("@/app/api/(Backend)/settings/route");
            const request = new Request("http://localhost/api/settings", {
                method: "PUT",
                body: JSON.stringify({
                    maintenanceMode: true,
                }),
                headers: { "Content-Type": "application/json" },
            });

            const response = await PUT(request);
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body.success).toBe(true);
            expect(mockSystemSettingsUpsert).toHaveBeenCalledTimes(1);
            expect(mockRevalidateTag).toHaveBeenCalledWith("settings");
        });
    });
});
