import { describe, expect, it } from "vitest";
import {
    isValidExpenseTransition,
    isValidPaymentTransition,
    normalizePaymentStatusInput,
} from "@/lib/statusTransitions";

describe("status transition policy", () => {
    it("normalizes payment aliases from clients", () => {
        expect(normalizePaymentStatusInput("APPROVED")).toBe("PAID");
        expect(normalizePaymentStatusInput("COMPLETED")).toBe("PAID");
        expect(normalizePaymentStatusInput("REJECTED")).toBe("REJECTED");
    });

    it("allows only valid payment status transitions", () => {
        expect(isValidPaymentTransition("PENDING", "PAID")).toBe(true);
        expect(isValidPaymentTransition("PAID", "REFUNDED")).toBe(true);
        expect(isValidPaymentTransition("REFUNDED", "PAID")).toBe(false);
        expect(isValidPaymentTransition("REJECTED", "PENDING")).toBe(true);
    });

    it("allows only valid expense status transitions", () => {
        expect(isValidExpenseTransition("PENDING", "APPROVED")).toBe(true);
        expect(isValidExpenseTransition("APPROVED", "PAID")).toBe(true);
        expect(isValidExpenseTransition("PAID", "PENDING")).toBe(false);
        expect(isValidExpenseTransition("REJECTED", "PENDING")).toBe(true);
    });
});
