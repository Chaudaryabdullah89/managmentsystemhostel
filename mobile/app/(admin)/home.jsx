import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, StatusBar, Dimensions, Animated } from 'react-native';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
  Bed, RefreshCw, AlertTriangle, Bell, Utensils, CreditCard,
  DollarSign, Receipt, Users, BarChart3, Search, Shield, Building, Wallet, Percent, ChevronRight
} from 'lucide-react-native';
import api from '../../lib/api';
import { colors, spacing, borderRadius, shadows } from '../../lib/theme';

const SHORTCUTS = [
  { title: 'Rooms', Icon: Bed, route: '/(admin)/rooms' },
  { title: 'Room Swaps', Icon: RefreshCw, route: '/(admin)/swaps' },
  { title: 'Complaints', Icon: AlertTriangle, route: '/(admin)/complaints' },
  { title: 'Notice Board', Icon: Bell, route: '/(admin)/notices' },
  { title: 'Mess Menu', Icon: Utensils, route: '/(admin)/mess' },
  { title: 'Payments', Icon: CreditCard, route: '/(admin)/payments' },
  { title: 'Salaries', Icon: DollarSign, route: '/(admin)/salaries' },
  { title: 'Expenses', Icon: Receipt, route: '/(admin)/expenses' },
  { title: 'Users Records', Icon: Users, route: '/(admin)/users' },
  { title: 'Reports', Icon: BarChart3, route: '/(admin)/reports' },
  { title: 'Audit & Search', Icon: Search, route: '/(admin)/audit' },
  { title: 'Security Settings', Icon: Shield, route: '/(admin)/settings' },
];

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

/* ─────────────────────────── Admin Dashboard Skeleton ─────────────────────────── */
function AdminSkeleton() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      scrollEnabled={false}
    >
      <PulsingSkeleton>
        {/* Welcome Banner Card Skeleton */}
        <View style={[styles.bannerCard, { minHeight: 120, justifyContent: 'center' }]}>
          <View style={{ width: 140, height: 10, borderRadius: 5, backgroundColor: '#E5E7EB', marginBottom: 12 }} />
          <View style={{ width: 180, height: 20, borderRadius: 6, backgroundColor: '#E5E7EB', marginBottom: 12 }} />
          <View style={{ width: '90%', height: 10, borderRadius: 5, backgroundColor: '#E5E7EB', marginBottom: 6 }} />
          <View style={{ width: '70%', height: 10, borderRadius: 5, backgroundColor: '#E5E7EB' }} />
        </View>

        {/* KPI Stats Grid Skeleton */}
        <View style={{ width: 120, height: 12, borderRadius: 6, backgroundColor: '#E5E7EB', marginVertical: 14 }} />
        <View style={styles.statsGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={[styles.statCard, { minHeight: 70 }]}>
              <View style={styles.statCardHeader}>
                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#E5E7EB' }} />
                <View style={{ width: 60, height: 18, borderRadius: 5, backgroundColor: '#E5E7EB' }} />
              </View>
              <View style={{ width: 80, height: 10, borderRadius: 5, backgroundColor: '#E5E7EB', marginTop: 10 }} />
            </View>
          ))}
        </View>

        {/* Quick Actions Grid Skeleton */}
        <View style={{ width: 100, height: 12, borderRadius: 6, backgroundColor: '#E5E7EB', marginVertical: 14 }} />
        <View style={styles.shortcutGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={[styles.shortcutCard, { minHeight: 60 }]}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#E5E7EB' }} />
              <View style={{ width: 60, height: 10, borderRadius: 5, backgroundColor: '#E5E7EB', flex: 1, marginLeft: 10 }} />
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#E5E7EB' }} />
            </View>
          ))}
        </View>
      </PulsingSkeleton>
    </ScrollView>
  );
}

export default function AdminDashboard() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin_dashboard_stats'],
    queryFn: async () => {
      const [financials, hostels, complaints, payments] = await Promise.allSettled([
        api.get('/api/admin/financials'),
        api.get('/api/hostels?limit=1'),
        api.get('/api/complaints?stats=true'),
        api.get('/api/payments?status=PENDING&limit=1'),
      ]);
      const fin = financials.status === 'fulfilled' ? financials.value.data : {};
      const hostelCount = hostels.status === 'fulfilled' ? (hostels.value.data?.pagination?.total || 0) : 0;
      const complaintStats = complaints.status === 'fulfilled' ? complaints.value.data?.data : {};
      const pendingPayCount = payments.status === 'fulfilled' ? (payments.value.data?.pagination?.total || 0) : 0;
      return {
        totalHostels: hostelCount,
        totalResidents: complaintStats?.totalResidents || 0,
        totalRevenue: fin?.summary?.totalRevenue || 0,
        pendingPayments: pendingPayCount,
        activeComplaints: complaintStats?.pending || 0,
        totalBeds: fin?.totalBeds || 0,
        occupiedBeds: fin?.occupiedBeds || 0,
      };
    },
  });

  const stats = data || {
    totalHostels: 0,
    totalRooms: 0,
    occupiedBeds: 0,
    totalBeds: 0,
    totalResidents: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    activeComplaints: 0,
  };

  const statItems = [
    { label: 'Total Hostels', val: stats.totalHostels, Icon: Building, color: colors.primary },
    { label: 'Total Residents', val: stats.totalResidents, Icon: Users, color: colors.success },
    { label: 'Revenue Collected', val: `PKR ${(stats.totalRevenue || 0).toLocaleString()}`, Icon: Wallet, color: colors.primary },
    { label: 'Pending Invoices', val: stats.pendingPayments, Icon: CreditCard, color: colors.danger },
    { label: 'Complaints Pending', val: stats.activeComplaints, Icon: AlertTriangle, color: '#D97706' },
    { label: 'Occupancy Rate', val: `${stats.totalBeds > 0 ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100) : 0}%`, Icon: Percent, color: '#8B5CF6' },
  ];

  if (isLoading && !data) {
    return <AdminSkeleton />;
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Welcome Banner Card - Premium Light Style */}
      <View style={styles.bannerCard}>
        <Text style={styles.bannerLabel}>HMS EXECUTIVE COMMAND</Text>
        <Text style={styles.bannerTitle}>Admin Dashboard</Text>
        <Text style={styles.bannerSubtitle}>Monitor revenue collection, configure room configurations, and inspect audit logs.</Text>
      </View>

      {/* KPI Stats Grid */}
      <Text style={styles.sectionTitle}>System Overview</Text>
      <View style={styles.statsGrid}>
        {statItems.map((item) => {
          const IconComponent = item.Icon;
          return (
            <View key={item.label} style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <View style={styles.statIconWrapper}>
                  <IconComponent size={16} color={colors.textSecondary} />
                </View>
                <Text style={[styles.statNum, { color: item.color }]} numberOfLines={1}>{item.val}</Text>
              </View>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Quick Access Actions Grid */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.shortcutGrid}>
        {SHORTCUTS.map((s) => {
          const IconComponent = s.Icon;
          return (
            <TouchableOpacity 
              key={s.title} 
              style={styles.shortcutCard} 
              onPress={() => router.push(s.route)}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrapper}>
                <IconComponent size={20} color={colors.primary} />
              </View>
              <Text style={styles.shortcutTitle} numberOfLines={2}>{s.title}</Text>
              <ChevronRight size={10} color={colors.textPlaceholder} style={styles.arrowIcon} />
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.giant,
  },
  bannerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.premiumHover,
  },
  bannerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.xs,
    letterSpacing: -0.5,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontWeight: '500',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: spacing.sm + 2,
    marginTop: spacing.lg,
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2 - 0.5,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.premium,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.small,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNum: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.5,
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.xs,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  shortcutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingBottom: spacing.giant,
  },
  shortcutCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2 - 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md + 2,
    ...shadows.premium,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.small,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  shortcutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  arrowIcon: {
    marginLeft: spacing.xs,
  },
});
