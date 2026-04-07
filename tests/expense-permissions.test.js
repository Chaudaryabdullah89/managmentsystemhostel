import { describe, it, expect } from "vitest";
import { canAccessExpenseCategory, getAllowedExpenseCategories } from "@/lib/expensePermissions";

describe("expense permission matrix", () => {
    it("allows all categories when master permission is enabled", () => {
        const user = { canManageExpenses: true };
        expect(getAllowedExpenseCategories(user)).toBeUndefined();
        expect(canAccessExpenseCategory(user, "MESS")).toBe(true);
        expect(canAccessExpenseCategory(user, "SALARY")).toBe(true);
    });

    it("returns only granular categories for granular warden", () => {
        const user = {
            canManageExpenses: false,
            canManageMess: true,
            canManageGeneral: false,
            canManageUtilities: true,
            canManageMaintenance: false,
            canManageSalaries: false,
        };
        expect(getAllowedExpenseCategories(user)).toEqual(["MESS", "UTILITY_BILL"]);
        expect(canAccessExpenseCategory(user, "MESS")).toBe(true);
        expect(canAccessExpenseCategory(user, "GENERAL")).toBe(false);
        expect(canAccessExpenseCategory(user, "UTILITY_BILL")).toBe(true);
    });

    it("denies all categories when no permissions exist", () => {
        const user = { canManageExpenses: false };
        expect(getAllowedExpenseCategories(user)).toEqual([]);
        expect(canAccessExpenseCategory(user, "MAINTENANCE")).toBe(false);
    });
});
