import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

export default function AdminSalaries() {
  const qc = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ staffId: '', amount: '', month: 'July 2026' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin_salaries'],
    queryFn: async () => {
      const res = await api.get('/api/salaries');
      return res.data;
    },
  });

  const { mutate: issueSalary, isPending } = useMutation({
    mutationFn: () => api.post('/api/salaries', { ...form, amount: Number(form.amount) }),
    onSuccess: () => {
      qc.invalidateQueries(['admin_salaries']);
      setModalVisible(false);
      setForm({ staffId: '', amount: '', month: 'July 2026' });
      Alert.alert('Success', 'Salary voucher generated successfully!');
    },
    onError: () => Alert.alert('Error', 'Failed to issue salary.'),
  });

  const { mutate: payout } = useMutation({
    mutationFn: (id) => api.patch(`/api/salaries/${id}/pay`),
    onSuccess: () => { qc.invalidateQueries(['admin_salaries']); Alert.alert('Done', 'Payout recorded!'); },
    onError: () => Alert.alert('Error', 'Failed to process payout.'),
  });

  const salaries = data?.salaries || data?.data || [];

  const { data: staffData } = useQuery({
    queryKey: ['admin_staff_list'],
    queryFn: async () => {
      const res = await api.get('/api/staff');
      return res.data;
    },
  });
  const staffMembers = staffData?.staff || staffData?.data || [];

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />} contentContainerStyle={{ padding: 16 }}>
        {salaries.length === 0 ? (
          <Text style={styles.emptyText}>No payroll transactions listed.</Text>
        ) : (
          salaries.map((s) => (
            <View key={s.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.name}>{s.staff?.name || 'Staff'}</Text>
                  <Text style={styles.role}>{s.staff?.role || 'Warden'}</Text>
                </View>
                <View style={[styles.badge, s.status === 'paid' ? styles.paidBadge : styles.pendingBadge]}>
                  <Text style={[styles.badgeText, s.status === 'paid' ? styles.paidText : styles.pendingText]}>
                    {s.status?.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.month}>📅 {s.month || 'Month Cycle'}</Text>
              <View style={styles.cardBottom}>
                <Text style={styles.amount}>PKR {(s.amount || 0).toLocaleString()}</Text>
                {s.status !== 'paid' && (
                  <TouchableOpacity style={styles.payBtn} onPress={() => payout(s.id)}>
                    <Text style={styles.payBtnText}>Release Cash</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Issue Salary Voucher</Text>
            <TextInput style={styles.input} placeholder="Amount (PKR)" placeholderTextColor="#9CA3AF" keyboardType="numeric" value={form.amount} onChangeText={(t) => setForm({ ...form, amount: t })} />
            <TextInput style={styles.input} placeholder="Month (e.g. July 2026)" placeholderTextColor="#9CA3AF" value={form.month} onChangeText={(t) => setForm({ ...form, month: t })} />
            <Text style={styles.label}>Select Staff / Warden</Text>
            <ScrollView horizontal style={{ marginBottom: 20 }}>
              {staffMembers.map((sm) => (
                <TouchableOpacity key={sm.id} style={[styles.selectBtn, form.staffId === sm.id && styles.selectBtnActive]} onPress={() => setForm({ ...form, staffId: sm.id })}>
                  <Text style={[styles.selectText, form.staffId === sm.id && styles.selectTextActive]}>{sm.name} ({sm.role})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, isPending && { opacity: 0.5 }]} onPress={issueSalary} disabled={isPending}><Text style={styles.submitText}>Issue Salary</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  card: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  name: { fontSize: 13, fontWeight: '900', color: '#111827' },
  role: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  paidBadge: { backgroundColor: '#DCFCE7' },
  pendingBadge: { backgroundColor: '#FEF9C3' },
  paidText: { color: '#166534' },
  pendingText: { color: '#854D0E' },
  month: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginBottom: 12 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 15, fontWeight: '900', color: '#4F46E5' },
  payBtn: { backgroundColor: '#4F46E5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  payBtnText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  fabText: { fontSize: 28, color: '#FFF', fontWeight: '300', marginTop: -2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 16 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: '#111827', marginBottom: 10, fontWeight: '600' },
  label: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 8 },
  selectBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8, backgroundColor: '#F3F4F6' },
  selectBtnActive: { backgroundColor: '#4F46E5' },
  selectText: { fontSize: 11, fontWeight: '800', color: '#6B7280' },
  selectTextActive: { color: '#FFF' },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: '#F3F4F6' },
  cancelText: { fontSize: 13, fontWeight: '800', color: '#6B7280' },
  submitBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: '#4F46E5' },
  submitText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, paddingVertical: 32 },
});
