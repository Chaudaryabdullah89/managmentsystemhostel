import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Animated } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

/* ─────────────────────────── Pulsing Skeleton Wrapper ─────────────────────────── */
function PulsingSkeleton({ children, style }) {
  const pulseAnim = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View style={[style, { opacity: pulseAnim }]}>
      {children}
    </Animated.View>
  );
}

/* ─────────────────────────── Warden Dashboard Skeleton ─────────────────────────── */
function WardenSkeleton() {
  return (
    <ScrollView style={styles.container} scrollEnabled={false}>
      <PulsingSkeleton>
        {/* Header Section Skeleton */}
        <View style={styles.headerSection}>
          <View style={{ width: 180, height: 16, borderRadius: 5, backgroundColor: '#E5E7EB', marginBottom: 6 }} />
          <View style={{ width: 150, height: 12, borderRadius: 4, backgroundColor: '#E5E7EB' }} />
        </View>

        {/* Stats Grid Skeleton */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <View style={{ width: 60, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' }} />
            <View style={{ width: 40, height: 24, borderRadius: 5, backgroundColor: '#E5E7EB', marginTop: 10 }} />
          </View>
          <View style={styles.statBox}>
            <View style={{ width: 60, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' }} />
            <View style={{ width: 40, height: 24, borderRadius: 5, backgroundColor: '#E5E7EB', marginTop: 10 }} />
          </View>
          <View style={[styles.statBox, { width: '100%' }]}>
            <View style={{ width: 80, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' }} />
            <View style={{ width: 40, height: 24, borderRadius: 5, backgroundColor: '#E5E7EB', marginTop: 10 }} />
          </View>
        </View>

        {/* Recent Complaints Skeleton */}
        <View style={{ width: 120, height: 10, borderRadius: 5, backgroundColor: '#E5E7EB', marginVertical: 14 }} />
        {[1, 2].map((i) => (
          <View key={i} style={[styles.ticketCard, { minHeight: 70 }]}>
            <View style={styles.ticketRow}>
              <View style={{ width: 120, height: 12, borderRadius: 5, backgroundColor: '#E5E7EB' }} />
              <View style={{ width: 40, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' }} />
            </View>
            <View style={{ width: '90%', height: 10, borderRadius: 4, backgroundColor: '#E5E7EB', marginTop: 10 }} />
          </View>
        ))}
      </PulsingSkeleton>
    </ScrollView>
  );
}

export default function WardenHome() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['warden_dashboard'],
    queryFn: async () => {
      const meRes = await api.get('/api/auth/me');
      const userId = meRes.data?.user?.id;
      const statsRes = await api.get(`/api/warden/stats?userId=${userId}`);
      const complaintsRes = await api.get(`/api/complaints`);
      return {
        stats: statsRes.data?.data || {},
        recentComplaints: complaintsRes.data?.data || [],
      };
    },
  });

  const stats = {
    residents: data?.stats?.totalResidents || 0,
    emptyBeds: (data?.stats?.occupancy?.total || 0) - (data?.stats?.occupancy?.occupied || 0),
    pendingComplaints: data?.stats?.activeComplaints || 0,
  };

  if (isLoading && !data) {
    return <WardenSkeleton />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      <View style={styles.headerSection}>
        <Text style={styles.welcomeText}>HMS WARDEN OVERVIEW</Text>
        <Text style={styles.subtext}>Manage your branch operations</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>RESIDENTS</Text>
          <Text style={styles.statNumber}>{stats.residents}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>EMPTY BEDS</Text>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.emptyBeds}</Text>
        </View>
        <View style={[styles.statBox, { colSpan: 2 }]}>
          <Text style={styles.statLabel}>PENDING ISSUES</Text>
          <Text style={[styles.statNumber, { color: '#EF4444' }]}>{stats.pendingComplaints}</Text>
        </View>
      </View>

      <Text style={styles.sectionHeader}>RECENT COMPLAINTS</Text>
      {(!data?.recentComplaints || data.recentComplaints.length === 0) && (
        <Text style={styles.emptyText}>All systems operational. No pending reports.</Text>
      )}

      {data?.recentComplaints?.map((ticket) => (
        <View key={ticket.id} style={styles.ticketCard}>
          <View style={styles.ticketRow}>
            <Text style={styles.ticketTitle}>{ticket.title}</Text>
            <Text style={styles.ticketPriority}>{ticket.priority}</Text>
          </View>
          <Text style={styles.ticketDesc}>{ticket.description}</Text>
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
  headerSection: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: 0.5,
  },
  subtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#4F46E5',
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ticketTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  ticketPriority: {
    fontSize: 8,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  ticketDesc: {
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 16,
  },
  emptyText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    paddingVertical: 14,
  },
});
