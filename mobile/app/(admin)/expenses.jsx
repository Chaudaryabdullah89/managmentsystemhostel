import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

export default function AdminExpenses() {
  const qc = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'utilities', description: '' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin_expenses'],
    queryFn: async () => {
      const res = await api.get('/api/expenses');
      return res.data;
    },
  });

  const { mutate: logExpense, isPending } = useMutation({
    mutationFn: () => api.post('/api/expenses', { ...form, amount: Number(form.amount) }),
    onSuccess: () => {
      qc.invalidateQueries(['admin_expenses']);
      setModalVisible(false);
      setForm({ title: '', amount: '', category: 'utilities', description: '' });
      Alert.alert('Success', 'Expense transaction logged!');
    },
    onError: () => Alert.alert('Error', 'Failed to log expense.'),
  });

  const expenses = data?.expenses || data?.data || [];
  const categories = ['utilities', 'maintenance', 'rent', 'mess', 'salaries', 'other'];

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />} contentContainerStyle={{ padding: 16 }}>
        {expenses.length === 0 ? (
          <Text style={styles.emptyText}>No expenses logged.</Text>
        ) : (
          expenses.map((e) => (
            <View key={e.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.title}>{e.title}</Text>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{(e.category || 'other').toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.desc}>{e.description || 'No description provided'}</Text>
              <View style={styles.cardBottom}>
                <Text style={styles.amount}>PKR {(e.amount || 0).toLocaleString()}</Text>
                <Text style={styles.date}>{e.createdAt ? new Date(e.createdAt).toDateString() : '—'}</Text>
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
            <Text style={styles.modalTitle}>Log Expense</Text>
            <TextInput style={styles.input} placeholder="Title (e.g. Electric Bill)" placeholderTextColor="#9CA3AF" value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} />
            <TextInput style={styles.input} placeholder="Amount (PKR)" placeholderTextColor="#9CA3AF" keyboardType="numeric" value={form.amount} onChangeText={(t) => setForm({ ...form, amount: t })} />
            <TextInput style={styles.input} placeholder="Description" placeholderTextColor="#9CA3AF" value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} />
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal style={{ marginBottom: 20 }}>
              {categories.map((c) => (
                <TouchableOpacity key={c} style={[styles.selectBtn, form.category === c && styles.selectBtnActive]} onPress={() => setForm({ ...form, category: c })}>
                  <Text style={[styles.selectText, form.category === c && styles.selectTextActive]}>{c.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, isPending && { opacity: 0.5 }]} onPress={logExpense} disabled={isPending}><Text style={styles.submitText}>Save Expense</Text></TouchableOpacity>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 13, fontWeight: '900', color: '#111827', flex: 1, marginRight: 8 },
  tag: { backgroundColor: '#FEE2E2', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 9, fontWeight: '800', color: '#991B1B' },
  desc: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginBottom: 12 },
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
