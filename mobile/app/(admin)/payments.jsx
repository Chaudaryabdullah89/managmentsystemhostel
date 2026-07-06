import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

const STATUS_COLOR = { paid: '#DCFCE7', pending: '#FEF9C3', failed: '#FEE2E2', overdue: '#FEE2E2' };
const STATUS_TEXT = { paid: '#166534', pending: '#854D0E', failed: '#991B1B', overdue: '#991B1B' };

export default function AdminPayments() {
  const qc = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', residentId: '', type: 'fee' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin_payments'],
    queryFn: async () => {
      const res = await api.get('/api/payments');
      return res.data;
    },
  });

  const { mutate: createInvoice, isPending } = useMutation({
    mutationFn: () => api.post('/api/payments', { ...form, amount: Number(form.amount) }),
    onSuccess: () => {
      qc.invalidateQueries(['admin_payments']);
      setModalVisible(false);
      setForm({ title: '', amount: '', residentId: '', type: 'fee' });
      Alert.alert('Success', 'Invoice generated successfully!');
    },
    onError: () => Alert.alert('Error', 'Failed to generate invoice.'),
  });

  const payments = data?.payments || data?.data || [];

  const { data: residentsData } = useQuery({
    queryKey: ['admin_residents_list'],
    queryFn: async () => {
      const res = await api.get('/api/users?role=GUEST');
      return res.data;
    },
  });
  const residents = residentsData?.users || residentsData?.data || [];

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />} contentContainerStyle={{ padding: 16 }}>
        {payments.length === 0 ? (
          <Text style={styles.emptyText}>No invoices logged.</Text>
        ) : (
          payments.map((p) => (
            <View key={p.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.name}>{p.resident?.name || 'Resident'}</Text>
                  <Text style={styles.title}>{p.title || 'Accommodation Fee'}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: STATUS_COLOR[p.status] || '#F3F4F6' }]}>
                  <Text style={[styles.badgeText, { color: STATUS_TEXT[p.status] || '#374151' }]}>{p.status?.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.cardBottom}>
                <Text style={styles.amount}>PKR {(p.amount || 0).toLocaleString()}</Text>
                <Text style={styles.date}>{p.createdAt ? new Date(p.createdAt).toDateString() : '—'}</Text>
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
            <Text style={styles.modalTitle}>Generate Invoice</Text>
            <TextInput style={styles.input} placeholder="Invoice Title (e.g. July Rent)" placeholderTextColor="#9CA3AF" value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} />
            <TextInput style={styles.input} placeholder="Amount (PKR)" placeholderTextColor="#9CA3AF" keyboardType="numeric" value={form.amount} onChangeText={(t) => setForm({ ...form, amount: t })} />
            <Text style={styles.label}>Select Resident</Text>
            <ScrollView horizontal style={{ marginBottom: 20 }}>
              {residents.map((r) => (
                <TouchableOpacity key={r.id} style={[styles.selectBtn, form.residentId === r.id && styles.selectBtnActive]} onPress={() => setForm({ ...form, residentId: r.id })}>
                  <Text style={[styles.selectText, form.residentId === r.id && styles.selectTextActive]}>{r.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, isPending && { opacity: 0.5 }]} onPress={createInvoice} disabled={isPending}><Text style={styles.submitText}>Create Invoice</Text></TouchableOpacity>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  name: { fontSize: 13, fontWeight: '900', color: '#111827' },
  title: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 15, fontWeight: '900', color: '#4F46E5' },
  date: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
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
