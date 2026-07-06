import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

export default function AdminHostels() {
  const qc = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', totalRooms: '' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin_hostels'],
    queryFn: async () => {
      const res = await api.get('/api/hostels');
      return res.data;
    },
  });

  const { mutate: createHostel, isPending } = useMutation({
    mutationFn: () => api.post('/api/hostels', { ...form, totalRooms: Number(form.totalRooms) }),
    onSuccess: () => {
      qc.invalidateQueries(['admin_hostels']);
      setModalVisible(false);
      setForm({ name: '', location: '', totalRooms: '' });
      Alert.alert('Success', 'Hostel created!');
    },
    onError: () => Alert.alert('Error', 'Failed to create hostel.'),
  });

  const hostels = data?.hostels || data?.data || [];

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />} contentContainerStyle={{ padding: 16 }}>
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Active Properties</Text>
          <Text style={styles.statsValue}>{hostels.length} Hostels Managed</Text>
        </View>

        {hostels.length === 0 ? (
          <Text style={styles.emptyText}>No hostels listed yet. Add one!</Text>
        ) : (
          hostels.map((h) => (
            <View key={h.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.hostelName}>{h.name}</Text>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{h.type || 'Shared'}</Text>
                </View>
              </View>
              <Text style={styles.hostelLocation}>📍 {h.location || 'No location set'}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statMini}>
                  <Text style={styles.miniLabel}>Rooms</Text>
                  <Text style={styles.miniVal}>{h.totalRooms || h.rooms?.length || 0}</Text>
                </View>
                <View style={styles.statMini}>
                  <Text style={styles.miniLabel}>Capacity</Text>
                  <Text style={styles.miniVal}>{h.capacity || 0} Beds</Text>
                </View>
                <View style={styles.statMini}>
                  <Text style={styles.miniLabel}>Warden</Text>
                  <Text style={styles.miniVal}>{h.warden?.name || 'Unassigned'}</Text>
                </View>
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
            <Text style={styles.modalTitle}>Add New Hostel</Text>
            <TextInput style={styles.input} placeholder="Hostel Name" placeholderTextColor="#9CA3AF" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
            <TextInput style={styles.input} placeholder="Location" placeholderTextColor="#9CA3AF" value={form.location} onChangeText={(t) => setForm({ ...form, location: t })} />
            <TextInput style={styles.input} placeholder="Total Rooms Capacity" placeholderTextColor="#9CA3AF" keyboardType="numeric" value={form.totalRooms} onChangeText={(t) => setForm({ ...form, totalRooms: t })} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, isPending && { opacity: 0.5 }]} onPress={createHostel} disabled={isPending}><Text style={styles.submitText}>Add Hostel</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  statsCard: { backgroundColor: '#4F46E5', borderRadius: 20, padding: 20, marginBottom: 20 },
  statsTitle: { fontSize: 11, fontWeight: '700', color: '#C7D2FE', letterSpacing: 1 },
  statsValue: { fontSize: 20, fontWeight: '900', color: '#FFF', marginTop: 4 },
  card: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  hostelName: { fontSize: 15, fontWeight: '900', color: '#111827' },
  tag: { backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 9, fontWeight: '800', color: '#4F46E5' },
  hostelLocation: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  statMini: { flex: 1 },
  miniLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '800', textTransform: 'uppercase', marginBottom: 2 },
  miniVal: { fontSize: 12, color: '#111827', fontWeight: '800' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  fabText: { fontSize: 28, color: '#FFF', fontWeight: '300', marginTop: -2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 16 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: '#111827', marginBottom: 12, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: '#F3F4F6' },
  cancelText: { fontSize: 13, fontWeight: '800', color: '#6B7280' },
  submitBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: '#4F46E5' },
  submitText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, paddingVertical: 32 },
});
