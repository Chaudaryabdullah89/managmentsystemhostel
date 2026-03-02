import CategoryExpensePage from "@/components/expenses/CategoryExpensePage";

const CAT = {
    key: 'MAINTENANCE', label: 'Maintenance', slug: 'maintenance', icon: '🔧',
    description: 'Repairs, upkeep & infrastructure work',
    color: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700',
    border: 'border-amber-200', gradient: 'from-amber-500 to-amber-600',
    perm: 'canManageMaintenance'
};

export default function MaintenanceExpensePage() {
    return <CategoryExpensePage category={CAT} backHref="/warden/expenses" isAdmin={false} />;
}
