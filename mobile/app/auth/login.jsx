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
import { router } from "expo-router";
import api from "../../lib/api";
import { colors, spacing, borderRadius, shadows } from "../../lib/theme";
import { Building, Mail, Lock, Eye, EyeOff, ShieldCheck, Globe } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { data: branding } = useQuery({
    queryKey: ["branding_public_settings"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/settings/public");
        return res.data?.data || res.data?.settings || res.data || {};
      } catch (err) {
        console.error("[Branding Fetch] Error:", err.message);
        return {};
      }
    },
    staleTime: 1000 * 60 * 30,
  });

  // Two-Factor Authentication states
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [twoFactorMethod, setTwoFactorMethod] = useState("");
  const [twoFactorOtp, setTwoFactorOtp] = useState("");
  const [twoFactorOtpFocused, setTwoFactorOtpFocused] = useState(false);

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
        if (role === "ADMIN" || role === "WARDEN") {
          router.replace("/auth/restricted");
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
        if (role === "ADMIN" || role === "WARDEN") {
          router.replace("/auth/restricted");
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

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId || clientId.includes("your_google_client_id_here")) {
        Alert.alert(
          "Configuration Required ⚙️",
          "Please configure EXPO_PUBLIC_GOOGLE_CLIENT_ID in your mobile/app/.env file."
        );
        setGoogleLoading(false);
        return;
      }

      // Determine redirect URI for Google Console.
      // If we are running in local dev and baseURL points to localhost or an IP, we use http://localhost:3000/api/auth/google/callback.
      // If we are in production, we use the production callback url.
      const backendOrigin = api.defaults.baseURL.replace(/\/$/, "");
      const callbackUrl = `${backendOrigin}/api/auth/google/callback`;

      // Create the redirect URL back to the mobile app
      const mobileRedirectUrl = Linking.createURL("auth/login");

      // Construct Google OAuth URL with response_type=code (authorization code flow)
      const authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" +
        `client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent("openid email profile")}` +
        `&state=${encodeURIComponent(mobileRedirectUrl)}` + 
        `&prompt=select_account`;

      console.log("[Google Login] Initiating OAuth Session:", { authUrl, mobileRedirectUrl });

      const result = await WebBrowser.openAuthSessionAsync(authUrl, mobileRedirectUrl);

      if (result.type === "success" && result.url) {
        console.log("[Google Login] Redirected back with URL:", result.url);

        // Parse token and user info returned in the query parameters from the backend redirect
        const parsed = Linking.parse(result.url);
        const { token, userRole } = parsed.queryParams || {};

        if (token && userRole) {
          await SecureStore.setItemAsync("user_token", token);
          await SecureStore.setItemAsync("user_role", userRole);

          const role = userRole.toUpperCase();
          if (role === "ADMIN" || role === "WARDEN") {
            router.replace("/auth/restricted");
          } else if (role === "STAFF") {
            router.replace("/(staff)/home");
          } else {
            router.replace("/(resident)/home");
          }
        } else {
          Alert.alert("Authentication Failed", "Failed to retrieve session token from Google Sign-In.");
        }
      } else {
        console.log("[Google Login] Flow cancelled or closed by user:", result.type);
      }
    } catch (err) {
      console.error("[Google Login] Error:", err);
      Alert.alert("Google Sign-In Error", err.message || "An unexpected error occurred.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.shieldWrapper}>
            <Building size={32} color="#4F46E5" />
          </View>
          <Text style={styles.title}>{branding?.companyName || "Hostel Portal"}</Text>
          <Text style={styles.subtitle}>Sign in to your residency dashboard</Text>
        </View>

        {/* Conditional render: 2FA Verification Form vs Password Login Form */}
        {requires2FA ? (
          <View style={styles.card}>
            <View style={styles.formHeader}>
              <ShieldCheck size={20} color="#16A34A" style={{ marginBottom: 6 }} />
              <Text style={styles.sectionTitle}>Two-Factor Security</Text>
              <Text style={styles.sectionSubtitle}>
                {twoFactorMethod === "EMAIL"
                  ? "Enter the 6-digit code sent to your registered email address."
                  : "Enter the code from your Authenticator app (TOTP)."}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>SECURITY CODE</Text>
              <View style={[
                styles.inputWrapper,
                twoFactorOtpFocused && styles.inputWrapperFocused
              ]}>
                <TextInput
                  style={[styles.inputField, styles.otpInput]}
                  onFocus={() => setTwoFactorOtpFocused(true)}
                  onBlur={() => setTwoFactorOtpFocused(false)}
                  placeholder="000000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={twoFactorOtp}
                  onChangeText={setTwoFactorOtp}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleVerify2FA}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
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
              <View style={[
                styles.inputWrapper,
                emailFocused && styles.inputWrapperFocused
              ]}>
                <Mail size={18} color={emailFocused ? "#4F46E5" : "#94A3B8"} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputField}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="e.g. resident@hms.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={[
                styles.inputWrapper,
                passwordFocused && styles.inputWrapperFocused
              ]}>
                <Lock size={18} color={passwordFocused ? "#4F46E5" : "#94A3B8"} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputField}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="Enter your security password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  {showPassword ? <EyeOff size={16} color="#94A3B8" /> : <Eye size={16} color="#94A3B8" />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>


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
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    height: 52,
    paddingHorizontal: spacing.lg,
    backgroundColor: "#F8FAFC",
  },
  inputWrapperFocused: {
    borderColor: "#4F46E5",
    backgroundColor: colors.white,
  },
  inputIcon: {
    marginRight: spacing.md,
  },
  inputField: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  eyeBtn: {
    padding: spacing.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  formHeader: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  otpInput: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 6,
  },
  loginButton: {
    backgroundColor: "#4F46E5",
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
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bioButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: borderRadius.medium,
    height: 50,
    marginTop: spacing.md,
    backgroundColor: colors.white,
  },
  bioButtonText: {
    color: "#4F46E5",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resendBtn: {
    alignItems: "center",
    marginTop: spacing.md,
    paddingVertical: 6,
  },
  resendText: {
    color: "#4F46E5",
    fontSize: 13,
    fontWeight: "800",
  },
  backBtn: {
    alignItems: "center",
    marginTop: spacing.sm,
    paddingVertical: 6,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
});
