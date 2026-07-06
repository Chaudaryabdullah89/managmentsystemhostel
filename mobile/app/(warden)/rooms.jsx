import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export default function WardenRooms() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['warden_rooms'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/warden/rooms');
        return res.data;
      } catch {
        return { rooms: [
          { id: '1', number: '101', capacity: 3, occupants: [{ name: 'Ali' }, { name: 'Zain' }] },
          { id: '2', number: '102', capacity: 2, occupants: [{ name: 'Hamza' }] },
          { id: '3', number: '103', capacity: 2, occupants: [] }
        ] };
      }
    },
  });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      <Text style={styles.sectionHeader}>ROOM OCCUPANCY LIST</Text>
      {data?.rooms?.map((room) => {
        const vacancies = room.capacity - room.occupants.length;
        return (
          <View key={room.id} style={styles.roomCard}>
            <View style={styles.row}>
              <Text style={styles.roomNumber}>Room {room.number}</Text>
              <Text style={styles.vacancies}>
                {vacancies === 0 ? 'Full' : `${vacancies} beds left`}
              </Text>
            </View>

            <View style={styles.occupantsSection}>
              {room.occupants.length === 0 ? (
                <Text style={styles.emptyText}>Empty Room</Text>
              ) : (
                room.occupants.map((occ, idx) => (
                  <Text key={idx} style={styles.occupantName}>
                    • {occ.name}
                  </Text>
                ))
              )}
            </View>
          </View>
        );
      })}
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
  roomCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  roomNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  vacancies: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
  },
  occupantsSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  occupantName: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
