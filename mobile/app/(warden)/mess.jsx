import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

export default function WardenMess() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('menu');
  const [menuModal, setMenuModal] = useState(false);
  const [menuForm, setMenuForm] = useState({ meal: 'breakfast', items: '' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['warden_mess'],
    queryFn: async () => {
      const meRes = await api.get('/api/auth/me');
      const hostelId = meRes.data?.user?.hostelId;
      const res = await api.get(`/api/mess?hostelId=${hostelId}`);
      
      // Let's index the menus by day of week
      const menus = res.data?.data || [];
      const today = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][new Date().getDay()];
      const todayMenu = menus.find(m => m.dayOfWeek === today) || {};

      return {
        menus,
        todayMenu,
        hostelId,
      };
    },
  });

  const { mutate: updateMenu, isPending } = useMutation({
    mutationFn: () => {
      const days = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
      const today = days[new Date().getDay()];
      
      const payload = {
        hostelId: data?.hostelId,
        dayOfWeek: today, // Warden edits today's menu from the card
      };

      if (menuForm.meal === 'breakfast') payload.breakfast = menuForm.items;
      if (menuForm.meal === 'lunch') payload.lunch = menuForm.items;
      if (menuForm.meal === 'dinner') payload.dinner = menuForm.items;

      return api.post('/api/mess', payload);
    },
    onSuccess: () => { qc.invalidateQueries(['warden_mess']); setMenuModal(false); Alert.alert('Updated', 'Menu updated!'); },
    onError: () => Alert.alert('Error', 'Failed to update.'),
  });

  const attendance = []; // Feedback replaces attendance for GUEST
  const menu = {
    breakfast: [data?.todayMenu?.breakfast].filter(Boolean),
    lunch: [data?.todayMenu?.lunch].filter(Boolean),
    dinner: [data?.todayMenu?.dinner].filter(Boolean),
  };
  const meals = ['breakfast', 'lunch', 'dinner'];

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {['menu', 'attendance'].map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'menu' ? "📋 Today's Menu" : '📊 Attendance'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />} contentContainerStyle={{ padding: 16 }}>
        {tab === 'menu' ? (
          <>
            {meals.map((meal) => (
              <View key={meal} style={styles.mealCard}>
                <Text style={styles.mealLabel}>{meal.charAt(0).toUpperCase() + meal.slice(1)}</Text>
                <Text style={styles.mealItems}>{(menu[meal] || []).join(', ') || 'Not set'}</Text>
                <TouchableOpacity style={styles.editBtn} onPress={() => { setMenuForm({ meal, items: (menu[meal] || []).join(', ') }); setMenuModal(true); }}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        ) : (
          <>
            <View style={styles.statsRow}>
              {[['Total', data?.totalStudents || 0], ['Present', data?.presentToday || 0], ['Absent', (data?.totalStudents || 0) - (data?.presentToday || 0)]].map(([l, v]) => (
                <View key={l} style={styles.statCard}>
                  <Text style={styles.statNum}>{v}</Text>
                  <Text style={styles.statLabel}>{l}</Text>
                </View>
              ))}
            </View>
            {attendance.length === 0 ? <Text style={styles.emptyText}>No records today.</Text> : attendance.map((a, i) => (
              <View key={i} style={styles.recordRow}>
                <Text style={styles.residentName}>{a.resident?.name || '—'}</Text>
                <Text style={styles.mealType}>{a.meal}</Text>
                <View style={[styles.badge, a.present ? styles.presentBadge : styles.absentBadge]}>
                  <Text style={styles.badgeText}>{a.present ? 'Present' : 'Absent'}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={menuModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Edit {menuForm.meal.charAt(0).toUpperCase() + menuForm.meal.slice(1)}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Items separated by commas (e.g. Rice, Dal, Roti)"
              placeholderTextColor="#9CA3AF"
              multiline
              value={menuForm.items}
              onChangeText={(t) => setMenuForm({ ...menuForm, items: t })}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setMenuModal(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, isPending && { opacity: 0.5 }]} onPress={updateMenu} disabled={isPending}><Text style={styles.submitText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#4F46E5' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  tabTextActive: { color: '#4F46E5', fontWeight: '900' },
  mealCard: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 10 },
  mealLabel: { fontSize: 13, fontWeight: '900', color: '#111827', marginBottom: 6 },
  mealItems: { fontSize: 12, color: '#374151', marginBottom: 10, lineHeight: 18 },
  editBtn: { alignSelf: 'flex-end', backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  editBtnText: { fontSize: 11, fontWeight: '800', color: '#4F46E5' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '900', color: '#4F46E5' },
  statLabel: { fontSize: 10, color: '#6B7280', fontWeight: '700', marginTop: 2 },
  recordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginBottom: 6 },
  residentName: { flex: 1, fontSize: 12, fontWeight: '700', color: '#111827' },
  mealType: { fontSize: 11, color: '#6B7280', width: 72, fontWeight: '600' },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  presentBadge: { backgroundColor: '#DCFCE7' },
  absentBadge: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#374151' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, paddingVertical: 32 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 16 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 13, color: '#111827', marginBottom: 12 },
  textArea: { height: 100, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: '#F3F4F6' },
  cancelText: { fontSize: 13, fontWeight: '800', color: '#6B7280' },
  submitBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: '#4F46E5' },
  submitText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
});
