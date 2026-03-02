import CategoryExpensePage from "@/components/expenses/CategoryExpensePage";

const CAT = {
    key: 'SALARY', label: 'Salary', slug: 'salary', icon: '💼',
    description: 'Staff wages, bonuses & disbursements',
    color: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-700',
    border: 'border-purple-200', gradient: 'from-purple-500 to-purple-600',
    perm: 'canManageSalaries'
};

export default function SalaryExpensePage() {
    return <CategoryExpensePage category={CAT} backHref="/warden/expenses" isAdmin={false} />;
}
