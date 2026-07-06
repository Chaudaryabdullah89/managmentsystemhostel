import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export default function AdminReports() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin_reports_data'],
    queryFn: async () => {
      const res = await api.get('/api/reports');
      return res.data;
    },
  });

  const reports = data?.reports || [
    { name: 'July 2026 Occupancy Audit', type: 'Occupancy', date: 'July 05, 2026' },
    { name: 'Financial Ledger Q2', type: 'Finance', date: 'June 30, 2026' },
    { name: 'System Security Integrity Log', type: 'Security', date: 'July 04, 2026' },
  ];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Analytical Reporting</Text>
        <Text style={styles.summarySub}>Generate and review system-wide audit sheets.</Text>
      </View>

      <Text style={styles.sectionTitle}>AVAILABLE REPORTS</Text>
      {reports.map((r, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.name}>{r.name}</Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{r.type.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.date}>Generated: {r.date}</Text>
          <TouchableOpacity style={styles.downloadBtn} onPress={() => Alert.alert('Processing', 'Preparing report download details...')}>
            <Text style={styles.downloadText}>📥 Download PDF Report</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  summaryCard: { backgroundColor: '#4F46E5', borderRadius: 20, padding: 20, marginBottom: 20 },
  summaryTitle: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  summarySub: { fontSize: 11, color: '#E0E7FF', marginTop: 4, fontWeight: '500' },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 13, fontWeight: '800', color: '#111827', flex: 1, marginRight: 8 },
  tag: { backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 9, fontWeight: '800', color: '#4F46E5' },
  date: { fontSize: 11, color: '#6B7280', fontWeight: '500', marginBottom: 12 },
  downloadBtn: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  downloadText: { fontSize: 11, fontWeight: '800', color: '#4F46E5' },
});
