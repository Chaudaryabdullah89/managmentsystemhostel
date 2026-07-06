import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export default function StaffSalary() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['staff_salary'],
    queryFn: async () => {
      const res = await api.get('/api/staff/salary');
      return res.data;
    },
  });

  const records = data?.records || [];
  const totalEarned = records.filter(r => r.status === 'paid').reduce((sum, r) => sum + (r.amount - (r.deductions || 0)), 0);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}>
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Total Earned (Paid)</Text>
        <Text style={styles.heroAmount}>PKR {totalEarned.toLocaleString()}</Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatNum}>{records.filter(r => r.status === 'paid').length}</Text>
            <Text style={styles.heroStatLabel}>Paid</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatNum}>{records.filter(r => r.status !== 'paid').length}</Text>
            <Text style={styles.heroStatLabel}>Pending</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatNum}>{records.length}</Text>
            <Text style={styles.heroStatLabel}>Total</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>SALARY HISTORY</Text>
      {records.length === 0 ? (
        <Text style={styles.emptyText}>No salary records found.</Text>
      ) : (
        records.map((r, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.month}>{r.month || `Month ${i + 1}`}</Text>
              <View style={[styles.badge, r.status === 'paid' ? styles.paidBadge : styles.pendingBadge]}>
                <Text style={r.status === 'paid' ? styles.paidText : styles.pendingText}>{r.status?.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Gross Salary</Text>
              <Text style={styles.rowVal}>PKR {(r.amount || 0).toLocaleString()}</Text>
            </View>
            {r.deductions > 0 && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Deductions</Text>
                <Text style={[styles.rowVal, { color: '#EF4444' }]}>-PKR {r.deductions.toLocaleString()}</Text>
              </View>
            )}
            <View style={[styles.row, styles.netRow]}>
              <Text style={styles.netLabel}>Net Pay</Text>
              <Text style={styles.netVal}>PKR {((r.amount || 0) - (r.deductions || 0)).toLocaleString()}</Text>
            </View>
            {r.paidAt && <Text style={styles.paidDate}>Paid on {new Date(r.paidAt).toDateString()}</Text>}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  heroCard: { backgroundColor: '#4F46E5', borderRadius: 24, padding: 24, marginBottom: 20 },
  heroLabel: { fontSize: 12, color: '#C7D2FE', fontWeight: '700', marginBottom: 4 },
  heroAmount: { fontSize: 30, fontWeight: '900', color: '#FFF', marginBottom: 18 },
  heroStats: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 14 },
  heroStat: { alignItems: 'center' },
  heroStatNum: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  heroStatLabel: { fontSize: 10, color: '#C7D2FE', fontWeight: '700' },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  month: { fontSize: 14, fontWeight: '900', color: '#111827' },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  paidBadge: { backgroundColor: '#DCFCE7' },
  pendingBadge: { backgroundColor: '#FEF9C3' },
  paidText: { fontSize: 9, fontWeight: '800', color: '#166534' },
  pendingText: { fontSize: 9, fontWeight: '800', color: '#854D0E' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rowLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  rowVal: { fontSize: 12, fontWeight: '800', color: '#374151' },
  netRow: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10, marginBottom: 6 },
  netLabel: { fontSize: 13, fontWeight: '900', color: '#111827' },
  netVal: { fontSize: 15, fontWeight: '900', color: '#4F46E5' },
  paidDate: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, paddingVertical: 32 },
});
