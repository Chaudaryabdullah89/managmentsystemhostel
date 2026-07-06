import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

const STATUS_COLOR = { pending: '#FEF9C3', 'in-progress': '#EDE9FE', resolved: '#DCFCE7' };
const STATUS_TEXT  = { pending: '#854D0E', 'in-progress': '#5B21B6', resolved: '#166534' };

export default function AdminComplaints() {
  const qc = useQueryClient();
  const [detailModal, setDetailModal] = useState(null);
  const [statusVal, setStatusVal] = useState('resolved');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin_complaints'],
    queryFn: async () => {
      const res = await api.get('/api/complaints');
      return res.data;
    },
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/api/complaints/${id}`, { status }),
    onSuccess: () => { qc.invalidateQueries(['admin_complaints']); setDetailModal(null); Alert.alert('Updated', 'Complaint status saved!'); },
    onError: () => Alert.alert('Error', 'Action failed.'),
  });

  const complaints = data?.complaints || data?.data || [];

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />} contentContainerStyle={{ padding: 16 }}>
        {complaints.length === 0 ? (
          <Text style={styles.emptyText}>No complaints filed.</Text>
        ) : (
          complaints.map((c) => (
            <TouchableOpacity key={c.id} style={styles.card} onPress={() => setDetailModal(c)}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{c.title}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLOR[c.status] || '#F3F4F6' }]}>
                  <Text style={[styles.badgeText, { color: STATUS_TEXT[c.status] || '#374151' }]}>{c.status?.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.cardSub}>By: {c.resident?.name || 'Resident'} · Room {c.room?.number || '—'}</Text>
              <Text style={styles.desc} numberOfLines={2}>{c.description}</Text>
              <Text style={styles.date}>{c.createdAt ? new Date(c.createdAt).toDateString() : '—'}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {detailModal && (
        <Modal visible animationType="slide" transparent>
          <View style={styles.overlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>{detailModal.title}</Text>
              <Text style={styles.modalSub}>From: <Text style={styles.bold}>{detailModal.resident?.name} (Room {detailModal.room?.number})</Text></Text>
              <Text style={styles.modalDesc}>{detailModal.description}</Text>
              <Text style={styles.label}>Update Status</Text>
              <View style={styles.statusRow}>
                {['pending', 'in-progress', 'resolved'].map((s) => (
                  <TouchableOpacity key={s} style={[styles.statusBtn, statusVal === s && styles.statusBtnActive]} onPress={() => setStatusVal(s)}>
                    <Text style={[styles.statusBtnText, statusVal === s && styles.statusBtnTextActive]}>{s.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setDetailModal(null)}><Text style={styles.cancelText}>Close</Text></TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={() => updateStatus({ id: detailModal.id, status: statusVal })}><Text style={styles.submitText}>Save Status</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  card: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: '900', color: '#111827', flex: 1, marginRight: 8 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  cardSub: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginBottom: 8 },
  desc: { fontSize: 12, color: '#374151', lineHeight: 18, marginBottom: 8 },
  date: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#111827', marginBottom: 8 },
  modalSub: { fontSize: 12, color: '#6B7280', marginBottom: 14 },
  modalDesc: { fontSize: 13, color: '#374151', lineHeight: 20, marginBottom: 20 },
  bold: { fontWeight: '800', color: '#111827' },
  label: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 8 },
  statusRow: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  statusBtn: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center', backgroundColor: '#F3F4F6' },
  statusBtnActive: { backgroundColor: '#4F46E5' },
  statusBtnText: { fontSize: 10, fontWeight: '800', color: '#6B7280' },
  statusBtnTextActive: { color: '#FFF' },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: '#F3F4F6' },
  cancelText: { fontSize: 13, fontWeight: '800', color: '#6B7280' },
  submitBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: '#4F46E5' },
  submitText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, paddingVertical: 32 },
});
