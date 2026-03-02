import CategoryExpensePage from "@/components/expenses/CategoryExpensePage";

const CAT = {
    key: 'GENERAL', label: 'General', slug: 'general', icon: '📋',
    description: 'Miscellaneous operational expenses',
    color: 'bg-slate-500', light: 'bg-slate-50', text: 'text-slate-700',
    border: 'border-slate-200', gradient: 'from-slate-500 to-slate-600',
};

export default function GeneralExpensePage() {
    return <CategoryExpensePage category={CAT} backHref="/admin/expenses" isAdmin={true} />;
}
