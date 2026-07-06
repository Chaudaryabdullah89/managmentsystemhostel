import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Building, ShieldAlert } from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows } from '../../lib/theme';

export default function Register() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <ShieldAlert size={40} color="#EF4444" />
        </View>
        <Text style={styles.title}>Registration Closed</Text>
        <Text style={styles.subtitle}>
          Mobile application profile registration has been disabled. Accounts can only be provisioned and assigned by the Hostel Administration.
        </Text>
        <Text style={styles.note}>
          Please contact your warden or hostel management desk to obtain your sign in credentials.
        </Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace('/auth/login')}
          activeOpacity={0.8}
        >
          <Text style={styles.backBtnText}>Return to Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    padding: spacing.xl * 1.5,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...shadows.premium,
    width: '100%',
    maxWidth: 340,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  note: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '500',
    marginBottom: spacing.xl,
  },
  backBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: borderRadius.medium,
    height: 48,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.premium,
  },
  backBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
