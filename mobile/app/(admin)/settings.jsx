import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Switch, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

export default function AdminSettings() {
  const qc = useQueryClient();
  const [switches, setSwitches] = useState({
    enableLaundry: true,
    enableMess: true,
    enableGuestBookings: true,
    enableComplaintsSystem: true,
    enablePaymentProcessing: true,
    maintenanceMode: false,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin_security_settings'],
    queryFn: async () => {
      const res = await api.get('/api/settings');
      return res.data;
    },
    onSuccess: (d) => {
      if (d?.settings) {
        setSwitches({
          enableLaundry: !!d.settings.enableLaundry,
          enableMess: !!d.settings.enableMess,
          enableGuestBookings: !!d.settings.enableGuestBookings,
          enableComplaintsSystem: !!d.settings.enableComplaintsSystem,
          enablePaymentProcessing: !!d.settings.enablePaymentProcessing,
          maintenanceMode: !!d.settings.maintenanceMode,
        });
      }
    },
  });

  const { mutate: updateSettings } = useMutation({
    mutationFn: (newSettings) => api.put('/api/settings', newSettings),
    onSuccess: () => {
      qc.invalidateQueries(['admin_security_settings']);
      Alert.alert('Saved', 'System policies updated successfully!');
    },
    onError: () => Alert.alert('Error', 'Failed to update configurations.'),
  });

  const toggleSwitch = (key) => {
    const updated = { ...switches, [key]: !switches[key] };
    setSwitches(updated);
    updateSettings(updated);
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>🛡️ Intrusion Detection System</Text>
        <Text style={styles.bannerDesc}>Configure global firewalls and system middleware thresholds.</Text>
      </View>

      <Text style={styles.sectionTitle}>CORE SERVICES</Text>
      <View style={styles.card}>
        {[
          ['enableLaundry', 'Laundry Service', 'Enable laundry collection and tracking'],
          ['enableMess', 'Mess / Cafeteria', 'Enable daily menu display and feedback system'],
          ['enableGuestBookings', 'Guest Booking Requests', 'Allow guests to apply for rooms online'],
          ['enableComplaintsSystem', 'Support Complaints', 'Allow residents to submit complaints'],
          ['enablePaymentProcessing', 'Fee Processing', 'Enable payment tracking and OneBill system'],
        ].map(([key, title, desc]) => (
          <View key={key} style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{title}</Text>
              <Text style={styles.settingDesc}>{desc}</Text>
            </View>
            <Switch
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={switches[key] ? '#4F46E5' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => toggleSwitch(key)}
              value={switches[key]}
            />
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>SYSTEM POLICIES</Text>
      <View style={styles.card}>
        {[
          ['maintenanceMode', 'Lockdown / Maintenance Mode', 'Suspend all non-admin routes instantly for maintenance'],
        ].map(([key, title, desc]) => (
          <View key={key} style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{title}</Text>
              <Text style={styles.settingDesc}>{desc}</Text>
            </View>
            <Switch
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={switches[key] ? '#4F46E5' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => toggleSwitch(key)}
              value={switches[key]}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  banner: { backgroundColor: '#4F46E5', borderRadius: 20, padding: 20, marginBottom: 20 },
  bannerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  bannerDesc: { fontSize: 11, color: '#E0E7FF', marginTop: 4, fontWeight: '500', lineHeight: 16 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 16 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  settingText: { flex: 1, marginRight: 16 },
  settingTitle: { fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 2 },
  settingDesc: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
});
