import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/apiAuth", () => ({
    requireAuth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
    prisma: {
        payment: {
            findMany: vi.fn(),
        },
        expense: {
            findMany: vi.fn(),
        },
    },
}));

import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/(Backend)/admin/financials/route";

describe("GET /api/admin/financials calculations", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("correctly parses Prisma Decimal amounts as numbers to prevent string concatenation", async () => {
        requireAuth.mockResolvedValue({
            ok: true,
            user: { role: "ADMIN" }
        });

        // Mock payments returning Decimal objects (simulated as decimal.js objects / strings / custom decimals)
        prisma.payment.findMany.mockResolvedValue([
            { amount: "20000.00", date: new Date("2026-06-01"), type: "RENT", createdAt: new Date() },
            { amount: "2000.00", date: new Date("2026-06-15"), type: "RENT", createdAt: new Date() },
        ]);

        // Mock expenses
        prisma.expense.findMany.mockResolvedValue([
            { amount: "25000.00", date: new Date("2026-06-10"), category: "GENERAL", createdAt: new Date() },
        ]);

        const request = {
            url: "http://localhost:3000/api/admin/financials?hostelId=all"
        };

        const response = await GET(request);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);

        // Verify summary values are proper numbers and not concatenated strings
        expect(body.summary.totalRevenue).toBe(22000);
        expect(body.summary.totalExpenses).toBe(25000);
        expect(body.summary.netProfit).toBe(-3000);
        expect(body.summary.profitMargin).toBeCloseTo(-13.636, 3);

        // Verify breakdown lists have numeric values
        expect(body.collectionsBreakdown.RENT).toBe(22000);
        expect(body.collectionsBreakdown.SECURITY_DEPOSIT).toBe(0);
        
        // Verify timeline contains parsed numeric values
        const juneTimeline = body.timeline.find(t => t.name === "Jun 2026");
        expect(juneTimeline).toBeDefined();
        expect(juneTimeline.revenue).toBe(22000);
        expect(juneTimeline.expenses).toBe(25000);
        expect(juneTimeline.net).toBe(-3000);
    });
});
