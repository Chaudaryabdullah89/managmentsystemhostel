const PAYMENT_STATUS_ALIASES = {
    APPROVED: "PAID",
    COMPLETED: "PAID",
};

const PAYMENT_TRANSITIONS = {
    PENDING: ["PAID", "OVERDUE", "PARTIAL", "FAILED", "REJECTED"],
    PARTIAL: ["PAID", "OVERDUE", "FAILED", "REJECTED"],
    OVERDUE: ["PAID", "PARTIAL", "FAILED", "REJECTED"],
    FAILED: ["PENDING", "PAID", "REJECTED"],
    PAID: ["REFUNDED"],
    REFUNDED: [],
    REJECTED: ["PENDING"],
};

const EXPENSE_TRANSITIONS = {
    PENDING: ["APPROVED", "REJECTED"],
    APPROVED: ["PAID"],
    REJECTED: ["PENDING"],
    PAID: [],
};

export function normalizePaymentStatusInput(inputStatus) {
    if (!inputStatus) return inputStatus;
    return PAYMENT_STATUS_ALIASES[inputStatus] || inputStatus;
}

export function isValidPaymentTransition(fromStatus, toStatus) {
    if (!fromStatus || !toStatus || fromStatus === toStatus) return true;
    const allowed = PAYMENT_TRANSITIONS[fromStatus] || [];
    return allowed.includes(toStatus);
}

export function isValidExpenseTransition(fromStatus, toStatus) {
    if (!fromStatus || !toStatus || fromStatus === toStatus) return true;
    const allowed = EXPENSE_TRANSITIONS[fromStatus] || [];
    return allowed.includes(toStatus);
}
