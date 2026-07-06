import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export default function WardenComplaints() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['warden_complaints'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/warden/complaints');
        return res.data;
      } catch {
        return { complaints: [
          { id: '1', title: 'Water leakage', description: 'Plumbing issue in room 102', status: 'PENDING' },
          { id: '2', title: 'Wifi down', description: 'No internet access in wing B', status: 'IN_PROGRESS' }
        ] };
      }
    },
  });

  const handleResolve = async (id) => {
    try {
      await api.patch(`/api/complaints/${id}`, { status: 'RESOLVED' });
      Alert.alert('Success', 'Complaint marked as resolved');
      refetch();
    } catch {
      Alert.alert('Error', 'Unable to resolve complaint');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      <Text style={styles.sectionHeader}>FILED COMPLAINTS</Text>
      {data?.complaints?.map((ticket) => (
        <View key={ticket.id} style={styles.card}>
          <Text style={styles.title}>{ticket.title}</Text>
          <Text style={styles.desc}>{ticket.description}</Text>
          {ticket.status !== 'RESOLVED' && (
            <TouchableOpacity onPress={() => handleResolve(ticket.id)} style={styles.btn}>
              <Text style={styles.btnText}>MARK RESOLVED</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  desc: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: '#EEF2F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#4F46E5',
    fontSize: 10,
    fontWeight: '900',
  },
});
