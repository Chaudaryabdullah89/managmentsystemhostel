import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  StatusBar,
  SafeAreaView,
  ActivityIndicator
} from "react-native";
import * as SecureStore from "../../lib/storage";
import { router } from "expo-router";
import { ShieldAlert, Globe, LogOut } from "lucide-react-native";
import { colors, spacing, borderRadius, shadows } from "../../lib/theme";
import api from "../../lib/api";

export default function RestrictedAccess() {
  const [role, setRole] = useState("ADMIN");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoleAndToken() {
      try {
        const [savedRole, savedToken] = await Promise.all([
          SecureStore.getItemAsync("user_role"),
          SecureStore.getItemAsync("user_token")
        ]);
        if (savedRole) {
          setRole(savedRole.toUpperCase());
        }
        if (savedToken) {
          setToken(savedToken);
        }
      } catch (err) {
        console.error("Failed to load role/token in restricted page:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRoleAndToken();
  }, []);

  const handleSignOut = async () => {
    try {
      await SecureStore.deleteItemAsync("user_token");
      await SecureStore.deleteItemAsync("user_role");
      router.replace("/auth/login");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const handleOpenWebsite = () => {
    const isProd = api.defaults.baseURL.includes("vercel.app") || api.defaults.baseURL.includes("https://");
    const webOrigin = isProd ? api.defaults.baseURL.replace(/\/$/, "") : "http://localhost:3000";
    
    if (token) {
      // Fancy long token URL to automatically log in the browser session without password prompt
      const fancyUrl = `${webOrigin}/api/auth/autologin?` + 
        `token=${token}` + 
        `&auth_source=mobile_app_handshake` +
        `&handshake_id=${Math.random().toString(36).substring(2, 15)}` +
        `&client_platform=react_native` +
        `&timestamp=${Date.now()}`;
      Linking.openURL(fancyUrl);
    } else {
      Linking.openURL(webOrigin);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <ShieldAlert size={48} color="#EF4444" />
        </View>

        <Text style={styles.title}>Access Restricted</Text>
        <Text style={styles.roleTag}>{role} ACCOUNT</Text>

        <Text style={styles.description}>
          This mobile application is designed exclusively for residents and guests to manage bookings, payments, and dining reviews.
        </Text>

        <Text style={styles.instruction}>
          Administrative and warden dashboards are only accessible via the web management portal.
        </Text>

        {/* Web Portal Card */}
        <TouchableOpacity
          style={styles.webCard}
          onPress={handleOpenWebsite}
          activeOpacity={0.8}
        >
          <View style={styles.webCardIcon}>
            <Globe size={20} color="#4F46E5" />
          </View>
          <View style={styles.webCardContent}>
            <Text style={styles.webCardTitle}>Web Management Portal</Text>
            <Text style={styles.webCardUrl}>portalhms.vercel.app</Text>
          </View>
        </TouchableOpacity>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleOpenWebsite}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Go to Website</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <LogOut size={16} color="#64748B" style={{ marginRight: 8 }} />
            <Text style={styles.signOutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC"
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: spacing.xs,
  },
  roleTag: {
    fontSize: 12,
    fontWeight: "700",
    color: "#EF4444",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    marginBottom: spacing.lg,
    letterSpacing: 1,
  },
  description: {
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  instruction: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  webCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: "100%",
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  webCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  webCardContent: {
    flex: 1,
  },
  webCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  webCardUrl: {
    fontSize: 13,
    color: "#4F46E5",
    marginTop: 2,
    fontWeight: "500",
  },
  buttonContainer: {
    width: "100%",
    gap: spacing.md,
  },
  primaryBtn: {
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: "center",
    width: "100%",
    ...shadows.md,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  signOutBtn: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  signOutBtnText: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "600",
  },
});
