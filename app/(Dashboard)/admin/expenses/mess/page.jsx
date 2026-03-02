import CategoryExpensePage from "@/components/expenses/CategoryExpensePage";

const CAT = {
    key: 'MESS', label: 'Mess', slug: 'mess', icon: '🍽️',
    description: 'Daily meals, groceries & kitchen supplies',
    color: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700',
    border: 'border-orange-200', gradient: 'from-orange-500 to-orange-600',
};

export default function MessExpensePage() {
    return <CategoryExpensePage category={CAT} backHref="/admin/expenses" isAdmin={true} />;
}
