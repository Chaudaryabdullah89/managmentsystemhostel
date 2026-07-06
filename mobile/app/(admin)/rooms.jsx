import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

export default function AdminRooms() {
  const qc = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ number: '', floor: '', wing: '', capacity: '4', type: 'Standard', hostelId: '' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin_rooms'],
    queryFn: async () => {
      const res = await api.get('/api/rooms');
      return res.data;
    },
  });

  const { mutate: createRoom, isPending } = useMutation({
    mutationFn: () => api.post('/api/rooms', { ...form, capacity: Number(form.capacity) }),
    onSuccess: () => {
      qc.invalidateQueries(['admin_rooms']);
      setModalVisible(false);
      setForm({ number: '', floor: '', wing: '', capacity: '4', type: 'Standard', hostelId: '' });
      Alert.alert('Success', 'Room added successfully!');
    },
    onError: () => Alert.alert('Error', 'Could not add room.'),
  });

  const rooms = data?.rooms || data?.data || [];

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
      <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />} contentContainerStyle={{ padding: 16 }}>
        {rooms.length === 0 ? (
          <Text style={styles.emptyText}>No rooms configured. Add one!</Text>
        ) : (
          rooms.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.roomNum}>Room {r.number}</Text>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{r.type}</Text>
                </View>
              </View>
              <Text style={styles.hostel}>🏢 {r.hostel?.name || 'HMS Hostel'}</Text>
              <View style={styles.details}>
                <Text style={styles.detailItem}>Floor: {r.floor || '—'}</Text>
                <Text style={styles.detailItem}>Wing: {r.wing || '—'}</Text>
                <Text style={styles.detailItem}>Capacity: {r.capacity} Beds</Text>
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
            <Text style={styles.modalTitle}>Add Room</Text>
            <TextInput style={styles.input} placeholder="Room Number" placeholderTextColor="#9CA3AF" value={form.number} onChangeText={(t) => setForm({ ...form, number: t })} />
            <TextInput style={styles.input} placeholder="Floor" placeholderTextColor="#9CA3AF" value={form.floor} onChangeText={(t) => setForm({ ...form, floor: t })} />
            <TextInput style={styles.input} placeholder="Wing" placeholderTextColor="#9CA3AF" value={form.wing} onChangeText={(t) => setForm({ ...form, wing: t })} />
            <TextInput style={styles.input} placeholder="Capacity" placeholderTextColor="#9CA3AF" keyboardType="numeric" value={form.capacity} onChangeText={(t) => setForm({ ...form, capacity: t })} />
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
              <TouchableOpacity style={[styles.submitBtn, isPending && { opacity: 0.5 }]} onPress={createRoom} disabled={isPending}><Text style={styles.submitText}>Add Room</Text></TouchableOpacity>
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
  roomNum: { fontSize: 16, fontWeight: '900', color: '#111827' },
  tag: { backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 9, fontWeight: '800', color: '#4F46E5' },
  hostel: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 10 },
  details: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 },
  detailItem: { fontSize: 11, color: '#4B5563', fontWeight: '700' },
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
