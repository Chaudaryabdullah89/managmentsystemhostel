import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

const ACTION_ICON = {
  login: '🔐',
  logout: '🚪',
  create: '✅',
  update: '✏️',
  delete: '🗑️',
  approve: '✔',
  reject: '✖',
};

export default function WardenAuditLog() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['warden_audit'],
    queryFn: async () => {
      const res = await api.get('/api/warden/audit-log');
      return res.data;
    },
  });

  const logs = data?.logs || data?.data || [];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}>
      <View style={styles.statsRow}>
        {[
          ['Total Events', data?.total || 0],
          ['Today', data?.today || 0],
          ['This Week', data?.thisWeek || 0],
        ].map(([label, val]) => (
          <View key={label} style={styles.statCard}>
            <Text style={styles.statNum}>{val}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
      {logs.length === 0 ? (
        <Text style={styles.emptyText}>No audit logs available.</Text>
      ) : (
        logs.map((log, i) => (
          <View key={i} style={styles.logCard}>
            <View style={styles.logIcon}>
              <Text style={styles.logIconText}>{ACTION_ICON[log.action] || '📋'}</Text>
            </View>
            <View style={styles.logContent}>
              <Text style={styles.logAction}>{log.description || log.action}</Text>
              <Text style={styles.logUser}>By: {log.user?.name || log.userId || 'System'}</Text>
              <Text style={styles.logTime}>{log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}</Text>
            </View>
            <View style={[styles.logBadge, log.action === 'delete' ? styles.dangerBadge : styles.infoBadge]}>
              <Text style={log.action === 'delete' ? styles.dangerText : styles.infoText}>
                {(log.action || '—').toUpperCase()}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#4F46E5', borderRadius: 16, padding: 14, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  statLabel: { fontSize: 9, color: '#C7D2FE', fontWeight: '700', marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 12 },
  logCard: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  logIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  logIconText: { fontSize: 16 },
  logContent: { flex: 1 },
  logAction: { fontSize: 12, fontWeight: '800', color: '#111827', marginBottom: 2 },
  logUser: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginBottom: 2 },
  logTime: { fontSize: 10, color: '#9CA3AF' },
  logBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  infoBadge: { backgroundColor: '#EEF2FF' },
  dangerBadge: { backgroundColor: '#FEE2E2' },
  infoText: { fontSize: 8, fontWeight: '800', color: '#4F46E5' },
  dangerText: { fontSize: 8, fontWeight: '800', color: '#991B1B' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, paddingVertical: 32 },
});
