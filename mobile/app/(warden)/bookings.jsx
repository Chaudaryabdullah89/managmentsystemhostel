import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

const STATUS_COLOR = { confirmed: '#DCFCE7', pending: '#FEF9C3', cancelled: '#FEE2E2', 'checked-in': '#EDE9FE', 'checked-out': '#F3F4F6' };
const STATUS_TEXT  = { confirmed: '#166534', pending: '#854D0E', cancelled: '#991B1B', 'checked-in': '#5B21B6', 'checked-out': '#374151' };

export default function WardenBookings() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['warden_bookings', filter],
    queryFn: async () => {
      const res = await api.get(`/api/warden/bookings?status=${filter}`);
      return res.data;
    },
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/api/warden/bookings/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries(['warden_bookings']),
    onError: () => Alert.alert('Error', 'Action failed'),
  });

  const statuses = ['all', 'pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'];
  const bookings = data?.bookings || data?.data || [];

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        {statuses.map((s) => (
          <TouchableOpacity key={s} style={[styles.filterPill, filter === s && styles.filterPillActive]} onPress={() => setFilter(s)}>
            <Text style={[styles.filterText, filter === s && styles.filterTextActive]}>{s.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />} contentContainerStyle={{ padding: 16 }}>
        {bookings.length === 0 ? (
          <Text style={styles.emptyText}>No bookings found.</Text>
        ) : (
          bookings.map((b) => (
            <View key={b.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.guestName}>{b.guest?.name || 'Guest'}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLOR[b.status] || '#F3F4F6' }]}>
                  <Text style={[styles.badgeText, { color: STATUS_TEXT[b.status] || '#374151' }]}>{b.status?.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.room}>Room {b.room?.number || '—'} · {b.hostel?.name || '—'}</Text>
              <Text style={styles.dates}>📅 {b.checkIn ? new Date(b.checkIn).toDateString() : '—'} → {b.checkOut ? new Date(b.checkOut).toDateString() : '—'}</Text>
              <Text style={styles.amount}>PKR {(b.amount || 0).toLocaleString()}</Text>

              {b.status === 'confirmed' && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus({ id: b.id, status: 'checked-in' })}>
                  <Text style={styles.actionBtnText}>✔ Check In</Text>
                </TouchableOpacity>
              )}
              {b.status === 'checked-in' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }]} onPress={() => updateStatus({ id: b.id, status: 'checked-out' })}>
                  <Text style={styles.actionBtnText}>🚪 Check Out</Text>
                </TouchableOpacity>
              )}
              {b.status === 'pending' && (
                <View style={styles.pendingActions}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => updateStatus({ id: b.id, status: 'confirmed' })}>
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => updateStatus({ id: b.id, status: 'cancelled' })}>
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  filterBar: { maxHeight: 52, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterPill: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, backgroundColor: '#F3F4F6' },
  filterPillActive: { backgroundColor: '#4F46E5' },
  filterText: { fontSize: 10, fontWeight: '800', color: '#6B7280' },
  filterTextActive: { color: '#FFF' },
  card: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  guestName: { fontSize: 14, fontWeight: '900', color: '#111827' },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  room: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 4 },
  dates: { fontSize: 11, color: '#374151', fontWeight: '600', marginBottom: 4 },
  amount: { fontSize: 14, fontWeight: '900', color: '#4F46E5', marginBottom: 10 },
  actionBtn: { backgroundColor: '#4F46E5', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  actionBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  pendingActions: { flexDirection: 'row', gap: 8 },
  approveBtn: { flex: 1, backgroundColor: '#4F46E5', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  approveBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  rejectBtn: { flex: 1, backgroundColor: '#FEE2E2', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  rejectBtnText: { color: '#991B1B', fontSize: 12, fontWeight: '800' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, paddingVertical: 32 },
});
