import CategoryExpensePage from "@/components/expenses/CategoryExpensePage";

const CAT = {
    key: 'UTILITY_BILL', label: 'Utility Bill', slug: 'utility-bill', icon: '⚡',
    description: 'Electricity, gas, water & internet bills',
    color: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700',
    border: 'border-blue-200', gradient: 'from-blue-500 to-blue-600',
};

export default function UtilityBillExpensePage() {
    return <CategoryExpensePage category={CAT} backHref="/admin/expenses" isAdmin={true} />;
}
