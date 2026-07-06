import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from '../../lib/storage';
import api from '../../lib/api';
import { router } from 'expo-router';

export default function StaffProfile() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['staff_profile'],
    queryFn: async () => {
      const res = await api.get('/api/staff/profile');
      return res.data;
    },
    onSuccess: (d) => setForm({ name: d.name, phone: d.phone }),
  });

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: () => api.put('/api/staff/profile', form),
    onSuccess: () => { qc.invalidateQueries(['staff_profile']); setEditing(false); Alert.alert('Updated', 'Profile saved!'); },
    onError: () => Alert.alert('Error', 'Failed to save profile.'),
  });

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('jwt');
    router.replace('/auth/login');
  };

  const staff = data || {};

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}>
      <View style={styles.heroCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(staff.name || 'S')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.heroName}>{staff.name || 'Staff Member'}</Text>
        <Text style={styles.heroRole}>{staff.role || 'Staff'}</Text>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>#{staff.id?.slice(-6) || '——'}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>CONTACT INFO</Text>
      <View style={styles.card}>
        {[
          ['Email', staff.email],
          ['Phone', staff.phone || '—'],
          ['Hostel', staff.hostel?.name || '—'],
          ['Joined', staff.createdAt ? new Date(staff.createdAt).toDateString() : '—'],
        ].map(([label, val]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowVal}>{val}</Text>
          </View>
        ))}
      </View>

      {editing ? (
        <>
          <Text style={styles.sectionTitle}>EDIT PROFILE</Text>
          <View style={styles.card}>
            <TextInput style={styles.input} placeholder="Full Name" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
            <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={form.phone} onChangeText={(t) => setForm({ ...form, phone: t })} />
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, isPending && { opacity: 0.5 }]} onPress={updateProfile} disabled={isPending}><Text style={styles.saveText}>Save Changes</Text></TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <TouchableOpacity style={styles.editBtn} onPress={() => { setForm({ name: staff.name, phone: staff.phone }); setEditing(true); }}>
          <Text style={styles.editBtnText}>✏️ Edit Profile</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={() => Alert.alert('Logout', 'Are you sure?', [
        { text: 'Cancel' }, { text: 'Logout', style: 'destructive', onPress: handleLogout }
      ])}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  heroCard: { backgroundColor: '#4F46E5', borderRadius: 24, padding: 28, alignItems: 'center', marginBottom: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  heroName: { fontSize: 18, fontWeight: '900', color: '#FFF', marginBottom: 4 },
  heroRole: { fontSize: 12, color: '#C7D2FE', fontWeight: '700', marginBottom: 10 },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 5 },
  heroBadgeText: { fontSize: 11, color: '#FFF', fontWeight: '800' },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 10 },
  card: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLabel: { fontSize: 12, color: '#6B7280', fontWeight: '700' },
  rowVal: { fontSize: 12, color: '#111827', fontWeight: '800', flex: 1, textAlign: 'right' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: '#111827', marginBottom: 10 },
  editActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F3F4F6' },
  cancelText: { fontSize: 13, fontWeight: '800', color: '#6B7280' },
  saveBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: '#4F46E5' },
  saveText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  editBtn: { backgroundColor: '#EEF2FF', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  editBtnText: { fontSize: 13, fontWeight: '800', color: '#4F46E5' },
  logoutBtn: { backgroundColor: '#FEE2E2', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 30 },
  logoutText: { fontSize: 13, fontWeight: '800', color: '#991B1B' },
});
