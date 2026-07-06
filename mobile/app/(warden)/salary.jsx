import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

export default function WardenSalary() {
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['warden_salary'],
    queryFn: async () => {
      // Get warden's hostelId to filter staff salaries
      const meRes = await api.get('/api/auth/me');
      const hostelId = meRes.data?.user?.hostelId;
      const res = await api.get(`/api/salaries?hostelId=${hostelId}`);
      return res.data;
    },
  });

  const { mutate: markPaid } = useMutation({
    mutationFn: (id) => api.patch(`/api/salaries/${id}`, { status: 'PAID', paymentDate: new Date(), paymentMethod: 'BANK_TRANSFER' }),
    onSuccess: () => { qc.invalidateQueries(['warden_salary']); Alert.alert('Done', 'Salary marked as paid!'); },
    onError: () => Alert.alert('Error', 'Could not process.'),
  });

  const rawSalaries = data?.salaries || [];
  const records = rawSalaries.map(r => ({
    id: r.id,
    amount: r.amount,
    deductions: r.deductions || 0,
    status: r.status?.toLowerCase() || 'pending',
    staff: {
      name: r.StaffProfile?.User?.name || 'Staff Member',
      role: r.StaffProfile?.designation || 'Staff',
    }
  }));

  const totalPayroll = records.reduce((acc, r) => acc + (r.amount || 0), 0);
  const paidCount = records.filter(r => r.status === 'paid').length;
  const pendingCount = records.filter(r => r.status !== 'paid').length;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNum}>PKR {totalPayroll.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Total Payroll</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: '#10B981' }]}>{paidCount}</Text>
          <Text style={styles.summaryLabel}>Paid</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: '#F59E0B' }]}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>STAFF SALARY RECORDS</Text>
      {records.length === 0 ? (
        <Text style={styles.emptyText}>No salary records this month.</Text>
      ) : (
        records.map((r) => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.staffInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(r.staff?.name || 'S')[0].toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.staffName}>{r.staff?.name || '—'}</Text>
                  <Text style={styles.staffRole}>{r.staff?.role || '—'}</Text>
                </View>
              </View>
              <View style={[styles.badge, r.status === 'paid' ? styles.paidBadge : styles.pendingBadge]}>
                <Text style={[styles.badgeText, r.status === 'paid' ? styles.paidText : styles.pendingText]}>
                  {r.status?.toUpperCase() || 'PENDING'}
                </Text>
              </View>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Gross Salary</Text>
              <Text style={styles.amount}>PKR {(r.amount || 0).toLocaleString()}</Text>
            </View>
            {r.deductions > 0 && (
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Deductions</Text>
                <Text style={[styles.amount, { color: '#EF4444' }]}>- PKR {r.deductions.toLocaleString()}</Text>
              </View>
            )}
            <View style={[styles.amountRow, styles.netRow]}>
              <Text style={styles.netLabel}>Net Pay</Text>
              <Text style={styles.netAmount}>PKR {((r.amount || 0) - (r.deductions || 0)).toLocaleString()}</Text>
            </View>
            {r.status !== 'paid' && (
              <TouchableOpacity style={styles.payBtn} onPress={() => Alert.alert('Confirm', `Mark salary for ${r.staff?.name} as paid?`, [
                { text: 'Cancel' }, { text: 'Confirm', onPress: () => markPaid(r.id) }
              ])}>
                <Text style={styles.payBtnText}>Mark as Paid</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  summaryCard: { backgroundColor: '#4F46E5', borderRadius: 20, padding: 22, flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  summaryItem: { alignItems: 'center' },
  summaryNum: { fontSize: 22, fontWeight: '900', color: '#FFF' },
  summaryLabel: { fontSize: 10, color: '#C7D2FE', fontWeight: '700', marginTop: 2 },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  staffInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '900', color: '#4F46E5' },
  staffName: { fontSize: 13, fontWeight: '800', color: '#111827' },
  staffRole: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  paidBadge: { backgroundColor: '#DCFCE7' },
  pendingBadge: { backgroundColor: '#FEF9C3' },
  badgeText: { fontSize: 9, fontWeight: '800' },
  paidText: { color: '#166534' },
  pendingText: { color: '#854D0E' },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  amountLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  amount: { fontSize: 12, fontWeight: '800', color: '#374151' },
  netRow: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10, marginBottom: 10 },
  netLabel: { fontSize: 13, fontWeight: '900', color: '#111827' },
  netAmount: { fontSize: 15, fontWeight: '900', color: '#4F46E5' },
  payBtn: { backgroundColor: '#4F46E5', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  payBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, paddingVertical: 32 },
});
