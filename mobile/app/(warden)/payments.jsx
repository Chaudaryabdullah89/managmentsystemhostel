import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

export default function WardenPayments() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('payments');
  const [expModal, setExpModal] = useState(false);
  const [expForm, setExpForm] = useState({ title: '', amount: '', category: 'utilities' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['warden_payments', tab],
    queryFn: async () => {
      const res = await api.get(tab === 'payments' ? '/api/warden/payments' : '/api/warden/expenses');
      return res.data;
    },
  });

  const { mutate: addExpense, isPending } = useMutation({
    mutationFn: () => api.post('/api/warden/expenses', { ...expForm, amount: Number(expForm.amount) }),
    onSuccess: () => { qc.invalidateQueries(['warden_payments']); setExpModal(false); setExpForm({ title: '', amount: '', category: 'utilities' }); Alert.alert('Added', 'Expense recorded!'); },
    onError: () => Alert.alert('Error', 'Failed to add expense.'),
  });

  const records = tab === 'payments' ? (data?.payments || data?.data || []) : (data?.expenses || data?.data || []);
  const STATUS_COLOR = { paid: '#DCFCE7', pending: '#FEF9C3', failed: '#FEE2E2', overdue: '#FEE2E2' };
  const STATUS_TEXT = { paid: '#166534', pending: '#854D0E', failed: '#991B1B', overdue: '#991B1B' };
  const categories = ['utilities', 'maintenance', 'salary', 'supplies', 'other'];

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {['payments', 'expenses'].map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'payments' ? '💰 Payments' : '🧾 Expenses'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNum}>PKR {(data?.totalCollected || 0).toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Collected</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNum, { color: '#EF4444' }]}>PKR {(data?.totalPending || 0).toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />} contentContainerStyle={{ padding: 16 }}>
        {records.length === 0 ? (
          <Text style={styles.emptyText}>No records found.</Text>
        ) : (
          records.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardTitle}>{tab === 'payments' ? (r.resident?.name || 'Resident') : (r.title || 'Expense')}</Text>
                {tab === 'payments' && (
                  <View style={[styles.badge, { backgroundColor: STATUS_COLOR[r.status] || '#F3F4F6' }]}>
                    <Text style={[styles.badgeText, { color: STATUS_TEXT[r.status] || '#374151' }]}>{r.status?.toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardSub}>{tab === 'payments' ? r.type : r.category}</Text>
              <View style={styles.cardBottom}>
                <Text style={styles.amount}>PKR {(r.amount || 0).toLocaleString()}</Text>
                <Text style={styles.date}>{r.createdAt ? new Date(r.createdAt).toDateString() : '—'}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {tab === 'expenses' && (
        <TouchableOpacity style={styles.fab} onPress={() => setExpModal(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      <Modal visible={expModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Expense</Text>
            <TextInput style={styles.input} placeholder="Title" placeholderTextColor="#9CA3AF" value={expForm.title} onChangeText={(t) => setExpForm({ ...expForm, title: t })} />
            <TextInput style={styles.input} placeholder="Amount (PKR)" placeholderTextColor="#9CA3AF" keyboardType="numeric" value={expForm.amount} onChangeText={(t) => setExpForm({ ...expForm, amount: t })} />
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {categories.map((c) => (
                <TouchableOpacity key={c} style={[styles.catBtn, expForm.category === c && styles.catBtnActive]} onPress={() => setExpForm({ ...expForm, category: c })}>
                  <Text style={[styles.catText, expForm.category === c && styles.catTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setExpModal(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, isPending && { opacity: 0.5 }]} onPress={addExpense} disabled={isPending}><Text style={styles.submitText}>Add Expense</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#4F46E5' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  tabTextActive: { color: '#4F46E5', fontWeight: '900' },
  summaryRow: { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  summaryCard: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, alignItems: 'center' },
  summaryNum: { fontSize: 16, fontWeight: '900', color: '#10B981' },
  summaryLabel: { fontSize: 10, color: '#6B7280', fontWeight: '700', marginTop: 2 },
  card: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, marginBottom: 8 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 13, fontWeight: '900', color: '#111827', flex: 1, marginRight: 8 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  cardSub: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginBottom: 8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 15, fontWeight: '900', color: '#4F46E5' },
  date: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  fabText: { fontSize: 28, color: '#FFF', fontWeight: '300', marginTop: -2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 16 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: '#111827', marginBottom: 12, fontWeight: '600' },
  label: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 8 },
  catBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8, backgroundColor: '#F3F4F6' },
  catBtnActive: { backgroundColor: '#4F46E5' },
  catText: { fontSize: 11, fontWeight: '800', color: '#6B7280' },
  catTextActive: { color: '#FFF' },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: '#F3F4F6' },
  cancelText: { fontSize: 13, fontWeight: '800', color: '#6B7280' },
  submitBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: '#4F46E5' },
  submitText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, paddingVertical: 32 },
});
