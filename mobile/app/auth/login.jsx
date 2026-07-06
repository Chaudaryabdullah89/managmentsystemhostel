import React, { useState, useEffect } from "react";
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
  StatusBar,
} from "react-native";
import * as SecureStore from "../../lib/storage";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import api from "../../lib/api";
import { colors, spacing, borderRadius, shadows } from "../../lib/theme";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Two-Factor Authentication states
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [twoFactorMethod, setTwoFactorMethod] = useState("");
  const [twoFactorOtp, setTwoFactorOtp] = useState("");
  const [twoFactorOtpFocused, setTwoFactorOtpFocused] = useState(false);

  // Check if biometric authentication is available on device
  useEffect(() => {
    async function checkBiometrics() {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    }
    checkBiometrics();
  }, []);

  // Auto-prompt biometric login on launch if already registered
  useEffect(() => {
    async function autoBiometric() {
      const savedToken = await SecureStore.getItemAsync("user_token");
      const savedRole = await SecureStore.getItemAsync("user_role");
      if (savedToken && savedRole && biometricAvailable) {
        const timer = setTimeout(() => {
          handleBiometricLogin();
        }, 800);
        return () => clearTimeout(timer);
      }
    }
    autoBiometric();
  }, [biometricAvailable]);

  const sendEmailOTP = async (token) => {
    try {
      await api.post("/api/auth/2fa/send-email-otp", { tempToken: token });
      Alert.alert("Code Sent", "A 2FA verification code has been sent to your email.");
    } catch (err) {
      Alert.alert("Failed", "Unable to trigger email OTP. Please contact admin.");
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Required Fields", "Please enter your email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/auth/mobile-login", { email: email.trim(), password });
      
      // Handle 2FA intercept
      if (res.data?.requires2FA) {
        setRequires2FA(true);
        setTempToken(res.data.tempToken);
        setTwoFactorMethod(res.data.twoFactorMethod);
        if (res.data.twoFactorMethod === "EMAIL") {
          sendEmailOTP(res.data.tempToken);
        }
        return;
      }

      const { token, User: user } = res.data;

      if (token && user) {
        await SecureStore.setItemAsync("user_token", token);
        await SecureStore.setItemAsync("user_role", user.role);

        const role = user.role.toUpperCase();
        if (role === "ADMIN") {
          router.replace("/(admin)/home");
        } else if (role === "WARDEN") {
          router.replace("/(warden)/home");
        } else if (role === "STAFF") {
          router.replace("/(staff)/home");
        } else {
          router.replace("/(resident)/home");
        }
      } else {
        Alert.alert("Login Failed", "Invalid response format from server");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Unable to connect to the server";
      Alert.alert("Sign In Failed", errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFactorOtp.trim() || twoFactorOtp.length < 6) {
      Alert.alert("Code Required", "Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/auth/2fa/login", {
        tempToken,
        otp: twoFactorOtp.trim(),
        method: twoFactorMethod,
      });

      const { token, User: user } = res.data;

      if (token && user) {
        await SecureStore.setItemAsync("user_token", token);
        await SecureStore.setItemAsync("user_role", user.role);

        const role = user.role.toUpperCase();
        if (role === "ADMIN") {
          router.replace("/(admin)/home");
        } else if (role === "WARDEN") {
          router.replace("/(warden)/home");
        } else if (role === "STAFF") {
          router.replace("/(staff)/home");
        } else {
          router.replace("/(resident)/home");
        }
      } else {
        Alert.alert("Error", "Invalid session token received.");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Invalid or expired verification code.";
      Alert.alert("Verification Failed", errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    const savedToken = await SecureStore.getItemAsync("user_token");
    const savedRole = await SecureStore.getItemAsync("user_role");

    if (!savedToken || !savedRole) {
      Alert.alert("Password Required", "Please sign in with password first to enroll biometrics.");
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock Portal Access",
      fallbackLabel: "Use password",
    });

    if (result.success) {
      const role = savedRole.toUpperCase();
      if (role === "ADMIN") {
        router.replace("/(admin)/home");
      } else if (role === "WARDEN") {
        router.replace("/(warden)/home");
      } else if (role === "STAFF") {
        router.replace("/(staff)/home");
      } else {
        router.replace("/(resident)/home");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.shieldWrapper}>
            <Text style={styles.shieldIcon}>🛡️</Text>
          </View>
          <Text style={styles.title}>HMS Portal</Text>
          <Text style={styles.subtitle}>Sign in to your residency dashboard</Text>
        </View>

        {/* Conditional render: 2FA Verification Form vs Password Login Form */}
        {requires2FA ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Two-Factor Security</Text>
            <Text style={styles.sectionSubtitle}>
              {twoFactorMethod === "EMAIL"
                ? "Enter the 6-digit code sent to your registered email address."
                : "Enter the code from your Authenticator app (TOTP)."}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>SECURITY CODE</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.otpInput,
                  twoFactorOtpFocused && styles.inputFocused
                ]}
                onFocus={() => setTwoFactorOtpFocused(true)}
                onBlur={() => setTwoFactorOtpFocused(false)}
                placeholder="000000"
                placeholderTextColor={colors.textPlaceholder}
                keyboardType="number-pad"
                maxLength={6}
                value={twoFactorOtp}
                onChangeText={setTwoFactorOtp}
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleVerify2FA}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Verify & Unlock</Text>
              )}
            </TouchableOpacity>

            {twoFactorMethod === "EMAIL" && (
              <TouchableOpacity
                style={styles.resendBtn}
                onPress={() => sendEmailOTP(tempToken)}
                activeOpacity={0.7}
              >
                <Text style={styles.resendText}>Resend Security Code</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                setRequires2FA(false);
                setTwoFactorOtp("");
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.backText}>← Back to Password Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS / USERNAME</Text>
              <TextInput
                style={[
                  styles.input,
                  emailFocused && styles.inputFocused
                ]}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="e.g. resident@hms.com"
                placeholderTextColor={colors.textPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={[
                  styles.input,
                  passwordFocused && styles.inputFocused
                ]}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="Enter your security password"
                placeholderTextColor={colors.textPlaceholder}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {biometricAvailable && (
              <TouchableOpacity
                style={styles.bioButton}
                onPress={handleBiometricLogin}
                activeOpacity={0.7}
              >
                <Text style={styles.bioIcon}>👤</Text>
                <Text style={styles.bioButtonText}>Unlock with Touch ID / Face ID</Text>
              </TouchableOpacity>
            )}

            <View style={styles.footerLinks}>
              <TouchableOpacity onPress={() => router.push("/auth/register")} activeOpacity={0.6}>
                <Text style={styles.registerText}>
                  Don't have an account? <Text style={styles.registerLinkText}>Apply Now</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.giant,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.giant,
  },
  shieldWrapper: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.large,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadows.premium,
  },
  shieldIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontWeight: "500",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.premiumHover,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: spacing.lg,
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
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
    backgroundColor: "#F8F9FA",
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  otpInput: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 6,
    height: 56,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    ...shadows.premium,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  bioButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    height: 50,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
  },
  bioIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  bioButtonText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  resendBtn: {
    alignItems: "center",
    marginTop: spacing.md,
    paddingVertical: 6,
  },
  resendText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  backBtn: {
    alignItems: "center",
    marginTop: spacing.sm,
    paddingVertical: 6,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  footerLinks: {
    alignItems: "center",
    marginTop: spacing.xl,
  },
  registerText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  registerLinkText: {
    color: colors.primary,
    fontWeight: "700",
  },
});
