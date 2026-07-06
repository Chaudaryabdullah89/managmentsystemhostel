import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

const STATUS_COLOR = { confirmed: '#DCFCE7', pending: '#FEF9C3', cancelled: '#FEE2E2', 'checked-in': '#EDE9FE', 'checked-out': '#F3F4F6' };
const STATUS_TEXT  = { confirmed: '#166534', pending: '#854D0E', cancelled: '#991B1B', 'checked-in': '#5B21B6', 'checked-out': '#374151' };

export default function AdminBookings() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin_bookings', filter],
    queryFn: async () => {
      const res = await api.get(`/api/bookings?status=${filter}`);
      return res.data;
    },
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/api/bookings/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries(['admin_bookings']),
    onError: () => Alert.alert('Error', 'Action failed'),
  });

  const bookings = data?.bookings || data?.data || [];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        {['all', 'pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'].map((s) => (
          <TouchableOpacity key={s} style={[styles.filterPill, filter === s && styles.filterPillActive]} onPress={() => setFilter(s)}>
            <Text style={[styles.filterText, filter === s && styles.filterTextActive]}>{s.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />} contentContainerStyle={{ padding: 16 }}>
        {bookings.length === 0 ? (
          <Text style={styles.emptyText}>No bookings matching filter.</Text>
        ) : (
          bookings.map((b) => (
            <View key={b.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.guestName}>{b.guest?.name || 'Guest User'}</Text>
                  <Text style={styles.guestEmail}>{b.guest?.email || 'No email'}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: STATUS_COLOR[b.status] || '#F3F4F6' }]}>
                  <Text style={[styles.badgeText, { color: STATUS_TEXT[b.status] || '#374151' }]}>{b.status?.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.room}>🏢 {b.hostel?.name || 'HMS Hostel'} · Room {b.room?.number || 'Pending'}</Text>
              <Text style={styles.dates}>📅 {b.checkIn ? new Date(b.checkIn).toDateString() : '—'} → {b.checkOut ? new Date(b.checkOut).toDateString() : '—'}</Text>
              <View style={styles.divider} />
              <View style={styles.bottomRow}>
                <Text style={styles.amount}>PKR {(b.amount || 0).toLocaleString()}</Text>
                {b.status === 'pending' && (
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => updateStatus({ id: b.id, status: 'cancelled' })}>
                      <Text style={styles.rejectBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => updateStatus({ id: b.id, status: 'confirmed' })}>
                      <Text style={styles.approveBtnText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  guestName: { fontSize: 14, fontWeight: '900', color: '#111827' },
  guestEmail: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  room: { fontSize: 12, color: '#374151', fontWeight: '700', marginBottom: 4 },
  dates: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 15, fontWeight: '900', color: '#4F46E5' },
  actions: { flexDirection: 'row', gap: 8 },
  approveBtn: { backgroundColor: '#4F46E5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  approveBtnText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  rejectBtn: { backgroundColor: '#FEE2E2', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  rejectBtnText: { color: '#991B1B', fontSize: 11, fontWeight: '800' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, paddingVertical: 32 },
});
