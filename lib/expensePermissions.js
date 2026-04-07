const CATEGORY_PERMISSION_MAP = {
    MESS: "canManageMess",
    GENERAL: "canManageGeneral",
    UTILITY_BILL: "canManageUtilities",
    MAINTENANCE: "canManageMaintenance",
    SALARY: "canManageSalaries",
};

export function getAllowedExpenseCategories(user = {}) {
    if (!user || user.canManageExpenses) return undefined;

    const allowed = Object.entries(CATEGORY_PERMISSION_MAP)
        .filter(([, key]) => Boolean(user[key]))
        .map(([category]) => category);

    return allowed;
}

export function canAccessExpenseCategory(user = {}, category) {
    if (!category) return false;
    if (user?.canManageExpenses) return true;
    const key = CATEGORY_PERMISSION_MAP[category];
    return Boolean(key && user?.[key]);
}

export { CATEGORY_PERMISSION_MAP };
