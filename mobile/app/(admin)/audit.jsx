import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TextInput } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export default function AdminAuditLog() {
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin_audit_logs'],
    queryFn: async () => {
      const res = await api.get('/api/admin/audit');
      return res.data;
    },
  });

  const logs = (data?.logs || data?.data || []).filter(log =>
    log.description?.toLowerCase().includes(search.toLowerCase()) ||
    log.action?.toLowerCase().includes(search.toLowerCase()) ||
    log.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput style={styles.searchInput} placeholder="Search audit logs..." placeholderTextColor="#9CA3AF" value={search} onChangeText={setSearch} />
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />} contentContainerStyle={{ padding: 16 }}>
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>No matching log items.</Text>
        ) : (
          logs.map((log, idx) => (
            <View key={idx} style={styles.logCard}>
              <View style={styles.logLeft}>
                <Text style={styles.logAction}>{log.action?.toUpperCase()}</Text>
                <Text style={styles.logDesc}>{log.description}</Text>
                <Text style={styles.logMeta}>User: {log.user?.name || 'System'} · IP: {log.ipAddress || 'Internal'}</Text>
              </View>
              <Text style={styles.logDate}>{log.createdAt ? new Date(log.createdAt).toLocaleDateString() : '—'}</Text>
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
  logCard: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logLeft: { flex: 1, marginRight: 12 },
  logAction: { fontSize: 10, fontWeight: '900', color: '#4F46E5', marginBottom: 4 },
  logDesc: { fontSize: 12, color: '#111827', fontWeight: '700', lineHeight: 16 },
  logMeta: { fontSize: 11, color: '#6B7280', marginTop: 6, fontWeight: '500' },
  logDate: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, paddingVertical: 32 },
});
