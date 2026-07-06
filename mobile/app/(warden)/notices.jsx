import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, RefreshControl, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

export default function WardenNotices() {
  const qc = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', priority: 'normal' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['warden_notices'],
    queryFn: async () => {
      const res = await api.get('/api/warden/notices');
      return res.data;
    },
  });

  const { mutate: postNotice, isPending } = useMutation({
    mutationFn: () => api.post('/api/warden/notices', form),
    onSuccess: () => {
      qc.invalidateQueries(['warden_notices']);
      setModalVisible(false);
      setForm({ title: '', content: '', priority: 'normal' });
      Alert.alert('Success', 'Notice posted!');
    },
    onError: () => Alert.alert('Error', 'Could not post notice.'),
  });

  const notices = data?.notices || data?.data || [];
  const priorityColor = { high: '#FEE2E2', normal: '#EEF2FF', low: '#F0FDF4' };
  const priorityText = { high: '#991B1B', normal: '#3730A3', low: '#166534' };

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />} contentContainerStyle={{ padding: 16 }}>
        {notices.length === 0 ? (
          <Text style={styles.emptyText}>No notices yet. Post the first one!</Text>
        ) : (
          notices.map((n) => (
            <View key={n.id} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: n.priority === 'high' ? '#EF4444' : n.priority === 'normal' ? '#4F46E5' : '#10B981' }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{n.title}</Text>
                <View style={[styles.badge, { backgroundColor: priorityColor[n.priority] || '#EEF2FF' }]}>
                  <Text style={[styles.badgeText, { color: priorityText[n.priority] || '#3730A3' }]}>{(n.priority || 'normal').toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.cardContent}>{n.content}</Text>
              <Text style={styles.cardDate}>{n.createdAt ? new Date(n.createdAt).toDateString() : '—'}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Notice</Text>
            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor="#9CA3AF"
              value={form.title}
              onChangeText={(t) => setForm({ ...form, title: t })}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Content"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={form.content}
              onChangeText={(t) => setForm({ ...form, content: t })}
            />
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityRow}>
              {['low', 'normal', 'high'].map((p) => (
                <TouchableOpacity key={p} style={[styles.priorityBtn, form.priority === p && styles.priorityBtnActive]} onPress={() => setForm({ ...form, priority: p })}>
                  <Text style={[styles.priorityBtnText, form.priority === p && styles.priorityBtnTextActive]}>{p.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, isPending && styles.disabled]} onPress={postNotice} disabled={isPending}>
                <Text style={styles.submitText}>Post Notice</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  card: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '900', color: '#111827', flex: 1, marginRight: 8 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  cardContent: { fontSize: 12, color: '#374151', lineHeight: 18, marginBottom: 8 },
  cardDate: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  fabText: { fontSize: 28, color: '#FFF', fontWeight: '300', marginTop: -2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 16 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: '#111827', marginBottom: 12, fontWeight: '600' },
  textArea: { height: 100, textAlignVertical: 'top' },
  label: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 8 },
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  priorityBtn: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center', backgroundColor: '#F3F4F6' },
  priorityBtnActive: { backgroundColor: '#4F46E5' },
  priorityBtnText: { fontSize: 11, fontWeight: '800', color: '#6B7280' },
  priorityBtnTextActive: { color: '#FFF' },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: '#F3F4F6' },
  cancelText: { fontSize: 13, fontWeight: '800', color: '#6B7280' },
  submitBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: '#4F46E5' },
  submitText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  disabled: { opacity: 0.5 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, paddingVertical: 32 },
});
