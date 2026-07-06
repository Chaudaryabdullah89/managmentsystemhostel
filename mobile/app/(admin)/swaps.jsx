import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert, Modal } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

export default function AdminRoomSwaps() {
  const qc = useQueryClient();
  const [detailModal, setDetailModal] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin_swaps'],
    queryFn: async () => {
      const res = await api.get('/api/guest/room-swap');
      return res.data;
    },
  });

  const { mutate: decide } = useMutation({
    mutationFn: ({ id, status }) => api.put('/api/guest/room-swap', { requestId: id, status: status.toUpperCase() }),
    onSuccess: () => { qc.invalidateQueries(['admin_swaps']); setDetailModal(null); Alert.alert('Done', 'Decision saved!'); },
    onError: () => Alert.alert('Error', 'Action failed.'),
  });

  const swaps = data?.requests || data?.data?.requests || data?.swaps || [];
  const STATUS_COLOR = { pending: '#FEF9C3', approved: '#DCFCE7', rejected: '#FEE2E2' };
  const STATUS_TEXT  = { pending: '#854D0E', approved: '#166534', rejected: '#991B1B' };

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />} contentContainerStyle={{ padding: 16 }}>
        {swaps.length === 0 ? (
          <Text style={styles.emptyText}>No room swap requests found.</Text>
        ) : (
          swaps.map((s) => (
            <TouchableOpacity key={s.id} style={styles.card} onPress={() => setDetailModal(s)}>
              <View style={styles.cardHeader}>
                <Text style={styles.requesterName}>{s.requester?.name || 'Resident'}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLOR[s.status] || '#F3F4F6' }]}>
                  <Text style={[styles.badgeText, { color: STATUS_TEXT[s.status] || '#374151' }]}>{s.status?.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.hostel}>🏢 {s.hostel?.name || 'HMS Hostel'}</Text>
              <View style={styles.swapRow}>
                <View style={styles.roomBox}>
                  <Text style={styles.roomLabel}>FROM</Text>
                  <Text style={styles.roomNum}>Room {s.fromRoom?.number || '—'}</Text>
                </View>
                <Text style={styles.arrow}>→</Text>
                <View style={styles.roomBox}>
                  <Text style={styles.roomLabel}>TO</Text>
                  <Text style={styles.roomNum}>Room {s.toRoom?.number || '—'}</Text>
                </View>
              </View>
              <Text style={styles.reason} numberOfLines={2}>📝 {s.reason || 'No reason provided'}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {detailModal && (
        <Modal visible animationType="slide" transparent>
          <View style={styles.overlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Room Swap Request</Text>
              <Text style={styles.modalSub}>From: <Text style={styles.bold}>{detailModal.requester?.name}</Text></Text>
              <Text style={styles.modalSub}>Room: <Text style={styles.bold}>{detailModal.fromRoom?.number} → {detailModal.toRoom?.number}</Text></Text>
              <Text style={styles.modalSub}>Reason: <Text style={styles.bold}>{detailModal.reason || '—'}</Text></Text>
              {detailModal.status === 'pending' ? (
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setDetailModal(null)}><Text style={styles.cancelText}>Close</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => decide({ id: detailModal.id, status: 'rejected' })}><Text style={styles.rejectText}>Reject</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => decide({ id: detailModal.id, status: 'approved' })}><Text style={styles.approveText}>Approve</Text></TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.closeBtn} onPress={() => setDetailModal(null)}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
              )}
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
  requesterName: { fontSize: 14, fontWeight: '900', color: '#111827' },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  hostel: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginBottom: 10 },
  swapRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 10 },
  roomBox: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 10, alignItems: 'center', flex: 1 },
  roomLabel: { fontSize: 9, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1 },
  roomNum: { fontSize: 16, fontWeight: '900', color: '#111827' },
  arrow: { fontSize: 20, color: '#4F46E5', fontWeight: '900' },
  reason: { fontSize: 11, color: '#374151', lineHeight: 16, marginBottom: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 16 },
  modalSub: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  bold: { fontWeight: '800', color: '#111827' },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 20 },
  cancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: '#F3F4F6' },
  cancelText: { fontSize: 12, fontWeight: '800', color: '#6B7280' },
  rejectBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: '#FEE2E2' },
  rejectText: { fontSize: 12, fontWeight: '800', color: '#991B1B' },
  approveBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: '#4F46E5' },
  approveText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  closeBtn: { marginTop: 20, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: '#F3F4F6' },
  closeText: { fontSize: 13, fontWeight: '800', color: '#6B7280' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, paddingVertical: 32 },
});
