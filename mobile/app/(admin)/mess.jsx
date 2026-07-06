import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

export default function AdminMess() {
  const qc = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ meal: 'breakfast', items: '', hostelId: '' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin_mess'],
    queryFn: async () => {
      const res = await api.get('/api/mess');
      return res.data;
    },
  });

  const { mutate: updateMenu, isPending } = useMutation({
    mutationFn: () => api.post('/api/mess', form),
    onSuccess: () => {
      qc.invalidateQueries(['admin_mess']);
      setModalVisible(false);
      setForm({ meal: 'breakfast', items: '', hostelId: '' });
      Alert.alert('Updated', 'Mess menu saved!');
    },
    onError: () => Alert.alert('Error', 'Failed to update mess menu.'),
  });

  const menus = data?.menus || data?.data || [];

  const { data: hostelsData } = useQuery({
    queryKey: ['admin_hostels_list'],
    queryFn: async () => {
      const res = await api.get('/api/hostels');
      return res.data;
    },
  });
  const hostels = hostelsData?.hostels || hostelsData?.data || [];

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        contentContainerStyle={{ padding: 16 }}
      >
        {menus.length === 0 ? (
          <Text style={styles.emptyText}>No mess menus configured. Configure one!</Text>
        ) : (
          menus.map((m, idx) => (
            <View key={idx} style={styles.card}>
              <Text style={styles.hostelName}>🏢 {m.hostel?.name || 'Global Menu'}</Text>
              {['breakfast', 'lunch', 'dinner'].map((meal) => (
                <View key={meal} style={styles.mealBlock}>
                  <Text style={styles.mealLabel}>{meal.toUpperCase()}</Text>
                  <Text style={styles.mealItems}>{(m[meal] || []).join(' · ') || 'Not Configured'}</Text>
                </View>
              ))}
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
            <Text style={styles.modalTitle}>Set Mess Menu</Text>
            <TextInput style={styles.input} placeholder="Items separated by commas (e.g. Rice, Dal)" placeholderTextColor="#9CA3AF" value={form.items} onChangeText={(t) => setForm({ ...form, items: t })} />
            <Text style={styles.label}>Meal Type</Text>
            <View style={styles.row}>
              {['breakfast', 'lunch', 'dinner'].map((m) => (
                <TouchableOpacity key={m} style={[styles.selectBtn, form.meal === m && styles.selectBtnActive]} onPress={() => setForm({ ...form, meal: m })}>
                  <Text style={[styles.selectText, form.meal === m && styles.selectTextActive]}>{m.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Select Hostel</Text>
            <ScrollView horizontal style={{ marginBottom: 20 }}>
              {hostels.map((h) => (
                <TouchableOpacity key={h.id} style={[styles.selectBtn, form.hostelId === h.id && styles.selectBtnActive]} onPress={() => setForm({ ...form, hostelId: h.id })}>
                  <Text style={[styles.selectText, form.hostelId === h.id && styles.selectTextActive]}>{h.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, isPending && { opacity: 0.5 }]} onPress={updateMenu} disabled={isPending}><Text style={styles.submitText}>Save Menu</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  card: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 12 },
  hostelName: { fontSize: 14, fontWeight: '900', color: '#111827', marginBottom: 12 },
  mealBlock: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, marginBottom: 8 },
  mealLabel: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', marginBottom: 4 },
  mealItems: { fontSize: 12, color: '#374151', fontWeight: '600' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  fabText: { fontSize: 28, color: '#FFF', fontWeight: '300', marginTop: -2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 16 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: '#111827', marginBottom: 12, fontWeight: '600' },
  label: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
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
