import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, RefreshControl, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export default function WardenResidents() {
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['warden_residents'],
    queryFn: async () => {
      const res = await api.get('/api/warden/residents');
      return res.data;
    },
  });

  const residents = (data?.residents || data?.data || []).filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase()) ||
    String(r.room?.number).includes(search)
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or room..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.statsRow}>
        {[
          ['Total', data?.total || 0, '#4F46E5'],
          ['Active', data?.active || 0, '#10B981'],
          ['Pending', data?.pending || 0, '#F59E0B'],
        ].map(([label, val, color]) => (
          <View key={label} style={styles.statCard}>
            <Text style={[styles.statNum, { color }]}>{val}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />} contentContainerStyle={{ padding: 16 }}>
        {residents.length === 0 ? (
          <Text style={styles.emptyText}>No residents match your search.</Text>
        ) : (
          residents.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(r.name || 'R')[0].toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.name}>{r.name}</Text>
                  <Text style={styles.email}>{r.email}</Text>
                  <Text style={styles.phone}>{r.phone || '—'}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.roomNum}>Room {r.room?.number || '—'}</Text>
                <View style={[styles.badge, r.status === 'active' ? styles.activeBadge : styles.pendingBadge]}>
                  <Text style={r.status === 'active' ? styles.activeText : styles.pendingText}>
                    {r.status?.toUpperCase() || 'ACTIVE'}
                  </Text>
                </View>
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
  searchBar: { padding: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  searchInput: { backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: '#111827', fontWeight: '600' },
  statsRow: { flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 16, paddingBottom: 14, gap: 10 },
  statCard: { flex: 1, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 14, paddingVertical: 12 },
  statNum: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 10, color: '#6B7280', fontWeight: '700', marginTop: 2 },
  card: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '900', color: '#4F46E5' },
  name: { fontSize: 13, fontWeight: '800', color: '#111827' },
  email: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  phone: { fontSize: 11, color: '#9CA3AF' },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  roomNum: { fontSize: 13, fontWeight: '900', color: '#4F46E5' },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  activeBadge: { backgroundColor: '#DCFCE7' },
  pendingBadge: { backgroundColor: '#FEF9C3' },
  activeText: { fontSize: 9, fontWeight: '800', color: '#166534' },
  pendingText: { fontSize: 9, fontWeight: '800', color: '#854D0E' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, paddingVertical: 32 },
});
