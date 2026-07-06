import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import api from '../../lib/api';

export default function AdminProfile() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin_profile_data'],
    queryFn: async () => {
      const res = await api.get('/api/auth/me');
      return res.data;
    },
  });

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('user_role');
    router.replace('/auth/login');
  };

  const admin = data || { name: 'System Administrator', email: 'admin@hms.com', role: 'admin' };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>A</Text>
        </View>
        <Text style={styles.name}>{admin.name}</Text>
        <Text style={styles.role}>{admin.role?.toUpperCase()}</Text>
      </View>

      <Text style={styles.sectionTitle}>ACCOUNT DETAILS</Text>
      <View style={styles.card}>
        {[
          ['Email Address', admin.email],
          ['Access level', 'Super Administrator'],
          ['MFA Protection', 'Enabled (Biometrics)'],
        ].map(([label, val]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{val}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => Alert.alert('Logout', 'Are you sure?', [
        { text: 'Cancel' }, { text: 'Logout', style: 'destructive', onPress: handleLogout }
      ])}>
        <Text style={styles.logoutText}>🚪 Logout System Session</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  heroCard: { backgroundColor: '#4F46E5', borderRadius: 24, padding: 30, alignItems: 'center', marginBottom: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  name: { fontSize: 18, fontWeight: '900', color: '#FFF', marginBottom: 4 },
  role: { fontSize: 12, color: '#C7D2FE', fontWeight: '700' },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 10 },
  card: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLabel: { fontSize: 12, color: '#6B7280', fontWeight: '700' },
  rowValue: { fontSize: 12, color: '#111827', fontWeight: '800', flex: 1, textAlign: 'right' },
  logoutBtn: { backgroundColor: '#FEE2E2', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 40 },
  logoutText: { fontSize: 13, fontWeight: '900', color: '#991B1B' },
});
