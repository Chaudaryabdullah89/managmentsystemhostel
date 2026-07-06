import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar
} from 'react-native';
import { router } from 'expo-router';
import api from '../../lib/api';
import { colors, spacing, borderRadius, shadows } from '../../lib/theme';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please fill in all registration fields');
      return;
    }

    setLoading(true);
    try {
      // Mobile registration via PUT /api/auth/mobile-login
      const res = await api.put('/api/auth/mobile-login', {
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone?.trim() || '0000-0000000',
      });

      if (res.data.success) {
        // Registration returns a token, store it and navigate
        if (res.data.token && res.data.User) {
          const { token, User: user } = res.data;
          await SecureStore.setItemAsync('user_token', token);
          await SecureStore.setItemAsync('user_role', user.role);
          Alert.alert('Registration Successful', 'Welcome! Your account has been created.', [
            { text: 'OK', onPress: () => router.replace('/(resident)/home') }
          ]);
        } else {
          Alert.alert('Failed to Apply', 'Invalid response format from server.');
        }
      } else {
        Alert.alert('Failed to Apply', res.data.message || 'Unable to register profile.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Server connection error';
      Alert.alert('Application Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Apply Profile</Text>
          <Text style={styles.subtitle}>Submit details for hostel allocation</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              style={[
                styles.input,
                nameFocused && styles.inputFocused
              ]}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              placeholder="e.g. Bilal Shah"
              placeholderTextColor={colors.textPlaceholder}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput
              style={[
                styles.input,
                emailFocused && styles.inputFocused
              ]}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              placeholder="e.g. bilal@example.com"
              placeholderTextColor={colors.textPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CHOOSE PASSWORD</Text>
            <TextInput
              style={[
                styles.input,
                passwordFocused && styles.inputFocused
              ]}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              placeholder="Min. 8 characters suggested"
              placeholderTextColor={colors.textPlaceholder}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity 
            style={[styles.registerButton, loading && styles.registerButtonDisabled]} 
            onPress={handleRegister} 
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.registerButtonText}>Apply Profile</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => router.push('/auth/login')} activeOpacity={0.6}>
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginLinkText}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.giant,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.giant,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.premiumHover,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.xs + 2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    height: 52,
    paddingHorizontal: spacing.lg,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: '#F8F9FA',
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  registerButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    ...shadows.premium,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  footerLinks: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  loginText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  loginLinkText: {
    color: colors.primary,
    fontWeight: '700',
  },
});
