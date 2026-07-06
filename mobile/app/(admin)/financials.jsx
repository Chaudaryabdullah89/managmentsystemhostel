import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export default function AdminFinancials() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin_financials'],
    queryFn: async () => {
      const res = await api.get('/api/admin/financials');
      return res.data;
    },
  });

  const fin = data || {
    revenue: 0,
    expenses: 0,
    payroll: 0,
    netProfit: 0,
    pendingPayments: 0,
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}>
      {/* Net profit balance banner */}
      <View style={styles.profitBanner}>
        <Text style={styles.profitLabel}>NET PROFIT / BALANCE</Text>
        <Text style={styles.profitVal}>PKR {(fin.netProfit || (fin.revenue - fin.expenses - fin.payroll)).toLocaleString()}</Text>
      </View>

      <Text style={styles.sectionTitle}>FINANCIAL STRUCTURE</Text>
      <View style={styles.card}>
        {[
          ['Total Revenue', `PKR ${(fin.revenue || 0).toLocaleString()}`, '#10B981'],
          ['Total Expenses', `- PKR ${(fin.expenses || 0).toLocaleString()}`, '#EF4444'],
          ['Staff Payroll', `- PKR ${(fin.payroll || 0).toLocaleString()}`, '#EF4444'],
          ['Pending Invoices', `PKR ${(fin.pendingPayments || 0).toLocaleString()}`, '#F59E0B'],
        ].map(([label, val, color]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={[styles.rowValue, { color }]}>{val}</Text>
          </View>
        ))}
      </View>

      {/* Breakdowns */}
      <Text style={styles.sectionTitle}>TRANSACTION SUMMARY</Text>
      <View style={styles.miniCard}>
        <Text style={styles.miniTitle}>Highest Expense Category</Text>
        <Text style={styles.miniVal}>{fin.topExpenseCategory || 'Utilities / Rent'}</Text>
      </View>
      <View style={styles.miniCard}>
        <Text style={styles.miniTitle}>Collected Ratio</Text>
        <Text style={styles.miniVal}>
          {fin.revenue && fin.pendingPayments ? `${Math.round((fin.revenue / (fin.revenue + fin.pendingPayments)) * 100)}%` : '100%'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  profitBanner: { backgroundColor: '#4F46E5', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20 },
  profitLabel: { fontSize: 10, fontWeight: '800', color: '#C7D2FE', letterSpacing: 1.5, marginBottom: 6 },
  profitVal: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 10 },
  card: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLabel: { fontSize: 13, color: '#4B5563', fontWeight: '700' },
  rowValue: { fontSize: 14, fontWeight: '900' },
  miniCard: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  miniTitle: { fontSize: 12, color: '#6B7280', fontWeight: '700' },
  miniVal: { fontSize: 13, fontWeight: '900', color: '#111827' },
});
