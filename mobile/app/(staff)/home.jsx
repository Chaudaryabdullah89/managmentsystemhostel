import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as SecureStore from '../../lib/storage';
import { router } from 'expo-router';

export default function StaffHome() {
  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Sign out of Support Staff Workspace?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('user_token');
          await SecureStore.deleteItemAsync('user_role');
          router.replace('/auth/login');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>S</Text>
        </View>
        <Text style={styles.name}>Support Officer</Text>
        <Text style={styles.role}>Shift Operations</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>ASSIGNED SHIFT</Text>
        <Text style={styles.value}>Day Shift (09:00 AM - 05:00 PM)</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>SIGN OUT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4F46E5',
  },
  name: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  role: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    marginBottom: 36,
  },
  label: {
    fontSize: 9,
    fontWeight: '900',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
