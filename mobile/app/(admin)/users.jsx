import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, RefreshControl, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

export default function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin_users', roleFilter],
    queryFn: async () => {
      const res = await api.get(`/api/users?role=${roleFilter}`);
      return res.data;
    },
  });

  const { mutate: changeStatus } = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/api/users/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries(['admin_users']); Alert.alert('Updated', 'User status updated successfully.'); },
    onError: () => Alert.alert('Error', 'Failed to update user.'),
  });

  const users = (data?.users || data?.data || []).filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput style={styles.searchInput} placeholder="Search users by name or email..." placeholderTextColor="#9CA3AF" value={search} onChangeText={setSearch} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        {['all', 'resident', 'guest', 'warden', 'staff', 'admin'].map((r) => (
          <TouchableOpacity key={r} style={[styles.filterPill, roleFilter === r && styles.filterPillActive]} onPress={() => setRoleFilter(r)}>
            <Text style={[styles.filterText, roleFilter === r && styles.filterTextActive]}>{r.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />} contentContainerStyle={{ padding: 16 }}>
        {users.length === 0 ? (
          <Text style={styles.emptyText}>No users match your criteria.</Text>
        ) : (
          users.map((u) => (
            <View key={u.id} style={styles.card}>
              <View style={styles.left}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(u.name || 'U')[0].toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.name}>{u.name}</Text>
                  <Text style={styles.email}>{u.email}</Text>
                  <Text style={styles.roleTag}>{u.role?.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.right}>
                <View style={[styles.statusBadge, u.status === 'active' ? styles.active : styles.suspended]}>
                  <Text style={styles.statusText}>{u.status?.toUpperCase() || 'ACTIVE'}</Text>
                </View>
                <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Action', 'Modify user state', [
                  { text: 'Activate', onPress: () => changeStatus({ id: u.id, status: 'active' }) },
                  { text: 'Suspend', onPress: () => changeStatus({ id: u.id, status: 'suspended' }), style: 'destructive' },
                  { text: 'Cancel', style: 'cancel' },
                ])}>
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
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
  filterBar: { maxHeight: 52, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterPill: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, backgroundColor: '#F3F4F6' },
  filterPillActive: { backgroundColor: '#4F46E5' },
  filterText: { fontSize: 10, fontWeight: '800', color: '#6B7280' },
  filterTextActive: { color: '#FFF' },
  card: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '900', color: '#4F46E5' },
  name: { fontSize: 13, fontWeight: '800', color: '#111827' },
  email: { fontSize: 11, color: '#6B7280', fontWeight: '500', marginVertical: 2 },
  roleTag: { fontSize: 9, fontWeight: '800', color: '#4F46E5' },
  right: { alignItems: 'flex-end', gap: 8 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  active: { backgroundColor: '#DCFCE7' },
  suspended: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 8, fontWeight: '900', color: '#374151' },
  actionBtn: { backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  actionText: { fontSize: 10, fontWeight: '800', color: '#4F46E5' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, paddingVertical: 32 },
});
