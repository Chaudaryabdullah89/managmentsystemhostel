import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetNotices = vi.fn();
const mockIsServiceEnabled = vi.fn();
const mockRequireAuth = vi.fn();
const mockRequireRoles = vi.fn();
const mockHasPermission = vi.fn();

vi.mock("@/lib/services/noticeservices/noticeservices", () => ({
    default: class {
        getNotices = mockGetNotices;
        getNoticeStats = vi.fn();
        createNotice = vi.fn();
        updateNotice = vi.fn();
        deleteNotice = vi.fn();
    },
}));

vi.mock("@/lib/permissions", () => ({
    isServiceEnabled: mockIsServiceEnabled,
    hasPermission: mockHasPermission,
}));

vi.mock("@/lib/apiAuth", () => ({
    requireAuth: mockRequireAuth,
    requireRoles: mockRequireRoles,
}));

vi.mock("@/lib/prisma", () => ({
    prisma: {
        expense: {
            findUnique: vi.fn(),
        },
    },
}));

vi.mock("@/lib/services/paymentservices/paymentservices", () => ({
    default: class {
        getPaymentById = vi.fn();
        updatePayment = vi.fn();
        deletePayment = vi.fn();
    },
}));

vi.mock("@/lib/utils/sendmail", () => ({
    sendEmail: vi.fn(),
}));

vi.mock("@/lib/utils/emailTemplates", () => ({
    paymentApprovedEmail: vi.fn(() => "ok"),
    buildEmailTemplate: vi.fn(() => "ok"),
}));

describe("RBAC regression coverage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("filters notices by authenticated viewer role", async () => {
        mockIsServiceEnabled.mockResolvedValue(true);
        mockRequireAuth.mockResolvedValue({ ok: true, user: { id: "u-1", role: "WARDEN" } });
        mockGetNotices.mockResolvedValue([{ id: "n-1", title: "Notice" }]);

        const { GET } = await import("@/app/api/(Backend)/notices/route");
        const request = new Request("http://localhost/api/notices?hostelId=h-1");

        const response = await GET(request);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(mockGetNotices).toHaveBeenCalledTimes(1);
        const filterArg = mockGetNotices.mock.calls[0][0];
        expect(filterArg).toEqual({
            AND: [
                {
                    OR: [{ hostelId: "h-1" }, { hostelId: null }],
                },
                {
                    OR: [
                        { targetRoles: { isEmpty: true } },
                        { targetRoles: { has: "WARDEN" } },
                    ],
                },
            ],
        });
    });

    it("returns guard response for unauthorized payment status updates", async () => {
        mockRequireRoles.mockResolvedValue({
            ok: false,
            response: new Response(JSON.stringify({ success: false, message: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            }),
        });

        const { PATCH } = await import("@/app/api/(Backend)/payments/[paymentId]/route");
        const request = new Request("http://localhost/api/payments/p-1", {
            method: "PATCH",
            body: JSON.stringify({ status: "APPROVED" }),
            headers: { "Content-Type": "application/json" },
        });

        const response = await PATCH(request, { params: Promise.resolve({ paymentId: "p-1" }) });
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.success).toBe(false);
        expect(mockRequireRoles).toHaveBeenCalledWith(["ADMIN", "WARDEN"]);
    });

    it("blocks non-admin expense status mutations", async () => {
        mockRequireRoles.mockResolvedValue({
            ok: true,
            user: { id: "w-1", role: "WARDEN" },
        });

        const { PATCH } = await import("@/app/api/(Backend)/expenses/route");
        const request = new Request("http://localhost/api/expenses", {
            method: "PATCH",
            body: JSON.stringify({ id: "e-1", status: "APPROVED" }),
            headers: { "Content-Type": "application/json" },
        });

        const response = await PATCH(request);
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body.success).toBe(false);
        expect(body.message).toBe("Only admin can change expense status.");
    });

    it("enforces manage_notices permission on notice creation", async () => {
        mockIsServiceEnabled.mockResolvedValue(true);
        mockRequireAuth.mockResolvedValue({ ok: true, user: { id: "u-2", role: "WARDEN" } });
        mockHasPermission.mockResolvedValue(false);

        const { POST } = await import("@/app/api/(Backend)/notices/route");
        const request = new Request("http://localhost/api/notices", {
            method: "POST",
            body: JSON.stringify({
                title: "Test",
                content: "Test content",
                authorId: "u-2",
            }),
            headers: { "Content-Type": "application/json" },
        });

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body.success).toBe(false);
        expect(body.message).toContain("Forbidden");
    });
});
