import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
  LayoutAnimation,
  StatusBar,
  Animated,
  Image,
  Share,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as SecureStore from "../../lib/storage";
import api from "../../lib/api";
import { colors, spacing, borderRadius, shadows } from "../../lib/theme";
import {
  User,
  Lock,
  Fingerprint,
  Phone,
  CreditCard,
  Calendar,
  Building,
  Home,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Eye,
  EyeOff,
  Share2,
  Key,
  Mail,
  LogOut,
  MapPin,
  HeartPulse,
  History,
} from "lucide-react-native";

/* ─────────── Pulsing Skeleton ─────────── */
function PulsingSkeleton({ children }) {
  const pulseAnim = React.useRef(new Animated.Value(0.3)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.8, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);
  return <Animated.View style={{ opacity: pulseAnim }}>{children}</Animated.View>;
}

function ProfileSkeleton({ insets }) {
  const bg = '#E2E8F0';
  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC', paddingTop: insets?.top || 0 }}>
      {/* Header banner */}
      <View style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 20, paddingVertical: 24, alignItems: 'center', gap: 12 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: bg }} />
        <View style={{ width: 140, height: 16, borderRadius: 7, backgroundColor: bg }} />
        <View style={{ width: 100, height: 11, borderRadius: 5, backgroundColor: bg }} />
      </View>
      {/* Tab bar */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
        {[1,2,3].map(i => (
          <View key={i} style={{ flex: 1, height: 34, borderRadius: 10, backgroundColor: bg }} />
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }} scrollEnabled={false}>
        <PulsingSkeleton>
          {/* Info card */}
          <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', padding: 20, marginBottom: 14 }}>
            <View style={{ width: 80, height: 10, borderRadius: 5, backgroundColor: bg, marginBottom: 14 }} />
            {[1,2,3,4].map(i => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
                <View style={{ gap: 6 }}>
                  <View style={{ width: 70, height: 9, borderRadius: 4, backgroundColor: bg }} />
                  <View style={{ width: 120, height: 12, borderRadius: 5, backgroundColor: bg }} />
                </View>
                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: bg }} />
              </View>
            ))}
          </View>
          {/* Residency card */}
          <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', padding: 20 }}>
            <View style={{ width: 100, height: 10, borderRadius: 5, backgroundColor: bg, marginBottom: 14 }} />
            {[1,2,3].map(i => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
                <View style={{ gap: 6 }}>
                  <View style={{ width: 80, height: 9, borderRadius: 4, backgroundColor: bg }} />
                  <View style={{ width: 100, height: 12, borderRadius: 5, backgroundColor: bg }} />
                </View>
                <View style={{ width: 70, height: 22, borderRadius: 8, backgroundColor: bg }} />
              </View>
            ))}
          </View>
        </PulsingSkeleton>
      </ScrollView>
    </View>
  );
}

export default function Profile() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'security' | 'card'
  
  // Security input states
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  // Full Profile query matching Web app
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["profile_detailed_data"],
    queryFn: async () => {
      const meRes = await api.get("/api/auth/me");
      const userId = meRes.data?.user?.id;
      const res = await api.get(`/api/users/${userId}/full-profile`);
      return res.data?.data;
    },
  });

  const handleTabChange = (tab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  // Sign out handler
  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await SecureStore.deleteItemAsync("user_token");
          await SecureStore.deleteItemAsync("user_role");
          router.replace("/auth/login");
        },
      },
    ]);
  };

  // Change Password Mutation
  const { mutate: changePassword, isPending: changingPassword } = useMutation({
    mutationFn: async (payload) => {
      const meRes = await api.get("/api/auth/me");
      const userId = meRes.data?.user?.id;
      return api.post(`/api/auth/changepassword/${userId}`, payload);
    },
    onSuccess: () => {
      Alert.alert("Success", "Password changed successfully.");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (err) => {
      Alert.alert("Error", err.response?.data?.error || "Failed to update password.");
    },
  });

  const handlePasswordSubmit = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      return Alert.alert("Required", "Please fill in all fields.");
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return Alert.alert("Mismatch", "New passwords do not match.");
    }
    if (passwordData.newPassword.length < 6) {
      return Alert.alert("Too Short", "Password must be at least 6 characters.");
    }
    changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  // Send Email Change OTP
  const handleSendOtp = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      return Alert.alert("Required", "Please enter a valid email address.");
    }
    setEmailLoading(true);
    try {
      await api.post("/api/auth/change-email/send-otp", { email: newEmail });
      Alert.alert("Code Sent", "Verification code has been sent to your new email.");
      setShowOtpInput(true);
    } catch (err) {
      Alert.alert("Failed", err.response?.data?.message || "Failed to send code.");
    } finally {
      setEmailLoading(false);
    }
  };

  // Verify Email Change OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      return Alert.alert("Required", "Please enter the 6-digit verification code.");
    }
    setEmailLoading(true);
    try {
      const meRes = await api.get("/api/auth/me");
      const userId = meRes.data?.user?.id;
      await api.post("/api/auth/change-email/verify-otp", {
        email: newEmail,
        otp,
        userId,
      });
      Alert.alert("Success", "Email address has been updated successfully.");
      setShowOtpInput(false);
      setNewEmail("");
      setOtp("");
      refetch();
    } catch (err) {
      Alert.alert("Failed", err.response?.data?.message || "Invalid verification code.");
    } finally {
      setEmailLoading(false);
    }
  };

  // Enable/Disable 2FA
  const { mutate: toggle2FA, isPending: toggling2FA } = useMutation({
    mutationFn: async () => {
      const isEnabled = profile?.basic?.twoFactorEnabled;
      if (isEnabled) {
        return api.post("/api/auth/2fa/disable");
      } else {
        // Simple TOTP initialization for TOTP default
        const setupRes = await api.post("/api/auth/2fa/setup", { method: "TOTP" });
        return api.post("/api/auth/2fa/verify", { otp: "000000", method: "TOTP", verifySetup: true });
      }
    },
    onSuccess: () => {
      Alert.alert("2FA Updated", "Two-Factor Authentication status has been updated.");
      refetch();
    },
    onError: (err) => {
      Alert.alert("Failed", err.response?.data?.message || "Failed to update 2FA status.");
    },
  });

  // Share digital ID pass details
  const handleShareId = async () => {
    try {
      const details = `HMS Hostel Smart Pass\nName: ${userData.name}\nRoom: Room ${residency.roomNumber || "Unassigned"}\nHostel: ${hostel.name || "HMS block"}\nReg #: ${userData.regNumber || "N/A"}`;
      await Share.share({
        message: details,
        title: "HMS Smart Pass Details",
      });
    } catch (err) {
      Alert.alert("Error", "Could not complete sharing.");
    }
  };

  if (isLoading) {
    return <ProfileSkeleton insets={insets} />;
  }

  const userData = profile?.basic || {};
  const resident = profile?.resident || {};
  const hostel = profile?.hostel || {};
  const residency = profile?.residency || {};
  const historyLogs = profile?.history || [];
  
  const checkInDate = residency.checkIn ? new Date(residency.checkIn) : null;
  const isCheckedOut = !residency.roomNumber && historyLogs.length > 0;

  return (
    <View style={[styles.container]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Custom Header */}
      <View style={[styles.topHeader, { paddingTop: insets.top }]}>
        <View style={styles.topHeaderContent}>
          <View>
            <Text style={styles.topHeaderTitle}>My Profile Center</Text>
            <Text style={styles.topHeaderSubtitle}>Manage Account, ID & Security</Text>
          </View>
          <TouchableOpacity
            style={styles.headerLogoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LogOut size={14} color="#EF4444" style={{ marginRight: 4 }} />
            <Text style={styles.headerLogoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Segment Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "profile" && styles.tabButtonActive]}
          onPress={() => handleTabChange("profile")}
          activeOpacity={0.7}
        >
          <User size={16} color={activeTab === "profile" ? "#2563EB" : "#64748B"} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, activeTab === "profile" && styles.tabTextActive]}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "security" && styles.tabButtonActive]}
          onPress={() => handleTabChange("security")}
          activeOpacity={0.7}
        >
          <Lock size={16} color={activeTab === "security" ? "#2563EB" : "#64748B"} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, activeTab === "security" && styles.tabTextActive]}>Security</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "card" && styles.tabButtonActive]}
          onPress={() => handleTabChange("card")}
          activeOpacity={0.7}
        >
          <Fingerprint size={16} color={activeTab === "card" ? "#2563EB" : "#64748B"} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, activeTab === "card" && styles.tabTextActive]}>ID Pass</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─────────── TAB 1: PROFILE INFO ─────────── */}
        {activeTab === "profile" && (
          <View style={{ gap: spacing.lg }}>
            {/* User Profile Header Card */}
            <View style={styles.profileHeaderCard}>
              <View style={styles.headerCardDecor1} />
              <View style={styles.headerCardDecor2} />
              <View style={styles.avatarCircle}>
                {userData.image ? (
                  <Image source={{ uri: userData.image }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarText}>{userData.name ? userData.name[0].toUpperCase() : "U"}</Text>
                )}
                <View style={[styles.statusDot, { backgroundColor: isCheckedOut ? "#EF4444" : "#10B981" }]} />
              </View>
              <Text style={styles.profileName}>{userData.name || "Resident Name"}</Text>
              <Text style={styles.profileEmail}>{userData.email || "user@example.com"}</Text>
              
              <View style={styles.profileBadgesRow}>
                <View style={styles.badgeLabel}>
                  <Text style={styles.badgeLabelText}>
                    {isCheckedOut ? "Checked Out" : userData.role || "Resident"}
                  </Text>
                </View>
                {userData.regNumber && (
                  <View style={[styles.badgeLabel, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                    <Text style={[styles.badgeLabelText, { color: "#FFFFFF" }]}>
                      Reg: {userData.regNumber}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Stay / Residency Details */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionHeader}>Stay / Room Details</Text>
              <View style={styles.detailCard}>
                {residency.roomNumber ? (
                  <View style={{ gap: spacing.md }}>
                    <View style={styles.detailRow}>
                      <View style={[styles.iconWrapperCircle, { backgroundColor: "#EEF2FF" }]}>
                        <Building size={16} color="#4F46E5" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailLabel}>Hostel Block</Text>
                        <Text style={styles.detailValue}>{hostel.name || "HMS Block"}</Text>
                        <Text style={styles.detailSubValue}>{hostel.address || "Address not set"}</Text>
                      </View>
                    </View>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                      <View style={[styles.iconWrapperCircle, { backgroundColor: "#E0F2FE" }]}>
                        <Home size={16} color="#0284C7" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailLabel}>Allocated Room</Text>
                        <Text style={styles.detailValue}>
                          Room {residency.roomNumber} ({residency.roomType || "Standard"})
                        </Text>
                        <Text style={styles.detailSubValue}>Floor {residency.floor || 0}</Text>
                      </View>
                    </View>
                    {checkInDate && (
                      <>
                        <View style={styles.detailDivider} />
                        <View style={styles.detailRow}>
                          <View style={[styles.iconWrapperCircle, { backgroundColor: "#ECFDF5" }]}>
                            <Calendar size={16} color="#059669" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.detailLabel}>Check-In Date</Text>
                            <Text style={styles.detailValue}>
                              {checkInDate.toLocaleDateString("en-PK", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </Text>
                          </View>
                        </View>
                      </>
                    )}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Building size={32} color="#94A3B8" style={{ marginBottom: 6 }} />
                    <Text style={styles.emptyStateText}>No active room allocation found.</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Profile Fields: CNIC, Phone, Address, Blood Group, Institution, Occupation */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionHeader}>Personal Information</Text>
              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <View style={[styles.iconWrapperCircle, { backgroundColor: "#FFF7ED" }]}>
                    <CreditCard size={15} color="#EA580C" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>CNIC Number</Text>
                    <Text style={styles.detailValue}>{userData.cnic || "Not Added"}</Text>
                  </View>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailRow}>
                  <View style={[styles.iconWrapperCircle, { backgroundColor: "#F0FDFA" }]}>
                    <Phone size={15} color="#0D9488" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Phone Number</Text>
                    <Text style={styles.detailValue}>{userData.phone || "Not Added"}</Text>
                  </View>
                </View>
                
                {resident.bloodGroup && (
                  <>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                      <View style={[styles.iconWrapperCircle, { backgroundColor: "#FEF2F2" }]}>
                        <HeartPulse size={15} color="#EF4444" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailLabel}>Blood Group</Text>
                        <Text style={styles.detailValue}>{resident.bloodGroup}</Text>
                      </View>
                    </View>
                  </>
                )}

                {resident.institution && (
                  <>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                      <View style={[styles.iconWrapperCircle, { backgroundColor: "#EEF2FF" }]}>
                        <Building size={15} color="#4F46E5" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailLabel}>Institution</Text>
                        <Text style={styles.detailValue}>{resident.institution}</Text>
                      </View>
                    </View>
                  </>
                )}

                {resident.occupation && (
                  <>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                      <View style={[styles.iconWrapperCircle, { backgroundColor: "#F5F5F7" }]}>
                        <User size={15} color="#3A3A3C" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailLabel}>Occupation</Text>
                        <Text style={styles.detailValue}>{resident.occupation}</Text>
                      </View>
                    </View>
                  </>
                )}

                <View style={styles.detailDivider} />
                <View style={styles.detailRow}>
                  <View style={[styles.iconWrapperCircle, { backgroundColor: "#FDF2F8" }]}>
                    <MapPin size={15} color="#DB2777" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Home Address</Text>
                    <Text style={styles.detailValue}>
                      {resident.address || userData.address || "Address not available"}
                    </Text>
                    {resident.city && <Text style={styles.detailSubValue}>City: {resident.city}</Text>}
                  </View>
                </View>
              </View>
            </View>

            {/* Emergency & Guardian Contact */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionHeader}>Emergency Contacts</Text>
              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <View style={[styles.iconWrapperCircle, { backgroundColor: "#F0FDFA" }]}>
                    <User size={15} color="#16A34A" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Guardian Name</Text>
                    <Text style={styles.detailValue}>{resident.guardianName || "N/A"}</Text>
                  </View>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailRow}>
                  <View style={[styles.iconWrapperCircle, { backgroundColor: "#FEF9C3" }]}>
                    <Phone size={15} color="#CA8A04" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Guardian Contact</Text>
                    <Text style={styles.detailValue}>{resident.guardianPhone || "N/A"}</Text>
                  </View>
                </View>
                <View style={styles.detailDivider} />
                
                <View style={styles.emergencyWarningBox}>
                  <HeartPulse size={18} color="#EF4444" style={{ marginRight: 10, marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.emergencyWarningLabel}>EMERGENCY PHONE</Text>
                    <Text style={styles.emergencyWarningVal}>{resident.emergencyContact || "Not Registered"}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Residency History Logs */}
            {historyLogs.length > 0 && (
              <View style={styles.infoSection}>
                <Text style={styles.sectionHeader}>Residency History Logs</Text>
                <View style={styles.detailCard}>
                  {historyLogs.slice(0, 3).map((log, index) => (
                    <View key={log.id || index}>
                      {index > 0 && <View style={styles.detailDivider} />}
                      <View style={styles.historyRow}>
                        <History size={14} color="#64748B" style={{ marginRight: 10, marginTop: 2 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.historyTitle}>Room {log.roomNumber || log.Room?.roomNumber || "N/A"}</Text>
                          <Text style={styles.historyDate}>
                            Checked In: {log.checkIn ? new Date(log.checkIn).toLocaleDateString() : "N/A"}
                          </Text>
                          {log.checkOut && (
                            <Text style={styles.historyDate}>
                              Checked Out: {new Date(log.checkOut).toLocaleDateString()}
                            </Text>
                          )}
                        </View>
                        <View style={[styles.historyStatusBadge, { backgroundColor: log.checkOut ? "#FEF2F2" : "#ECFDF5" }]}>
                          <Text style={[styles.historyStatusText, { color: log.checkOut ? "#EF4444" : "#059669" }]}>
                            {log.checkOut ? "Archived" : "Active"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ─────────── TAB 2: SECURITY SETTINGS ─────────── */}
        {activeTab === "security" && (
          <View style={{ gap: spacing.lg }}>
            {/* Change Password Form Card */}
            <View style={styles.securityFormCard}>
              <View style={styles.formHeaderRow}>
                <Key size={16} color="#4F46E5" style={{ marginRight: 6 }} />
                <Text style={styles.formTitle}>Change Password</Text>
              </View>
              
              <View style={{ gap: spacing.md }}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Current Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter current password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showCurrentPass}
                      value={passwordData.currentPassword}
                      onChangeText={(txt) => setPasswordData({ ...passwordData, currentPassword: txt })}
                    />
                    <TouchableOpacity
                      onPress={() => setShowCurrentPass(!showCurrentPass)}
                      style={styles.eyeBtn}
                    >
                      {showCurrentPass ? <EyeOff size={16} color="#94A3B8" /> : <Eye size={16} color="#94A3B8" />}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Minimum 6 characters"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showNewPass}
                      value={passwordData.newPassword}
                      onChangeText={(txt) => setPasswordData({ ...passwordData, newPassword: txt })}
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPass(!showNewPass)}
                      style={styles.eyeBtn}
                    >
                      {showNewPass ? <EyeOff size={16} color="#94A3B8" /> : <Eye size={16} color="#94A3B8" />}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm New Password</Text>
                  <TextInput
                    style={styles.formTextInput}
                    placeholder="Verify new password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showNewPass}
                    value={passwordData.confirmPassword}
                    onChangeText={(txt) => setPasswordData({ ...passwordData, confirmPassword: txt })}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.formSubmitBtn, changingPassword && { opacity: 0.7 }]}
                  onPress={handlePasswordSubmit}
                  disabled={changingPassword}
                  activeOpacity={0.8}
                >
                  {changingPassword ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.formSubmitBtnText}>Update Account Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Change Email Form Card */}
            <View style={styles.securityFormCard}>
              <View style={styles.formHeaderRow}>
                <Mail size={16} color="#0D9488" style={{ marginRight: 6 }} />
                <Text style={styles.formTitle}>Change Email Address</Text>
              </View>

              <View style={{ gap: spacing.md }}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New Email Address</Text>
                  <TextInput
                    style={styles.formTextInput}
                    placeholder="username@newdomain.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={newEmail}
                    onChangeText={setNewEmail}
                    editable={!showOtpInput}
                  />
                </View>

                {showOtpInput && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Verification Code (OTP)</Text>
                    <TextInput
                      style={[styles.formTextInput, styles.otpInput]}
                      placeholder="000000"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otp}
                      onChangeText={setOtp}
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.formSubmitBtn, { backgroundColor: "#0D9488" }, emailLoading && { opacity: 0.7 }]}
                  onPress={showOtpInput ? handleVerifyOtp : handleSendOtp}
                  disabled={emailLoading}
                  activeOpacity={0.8}
                >
                  {emailLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.formSubmitBtnText}>
                      {showOtpInput ? "Verify OTP & Update" : "Send Verification Code"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* 2FA Security Switch */}
            <View style={styles.securityFormCard}>
              <View style={styles.formHeaderRow}>
                <ShieldCheck size={16} color="#16A34A" style={{ marginRight: 6 }} />
                <Text style={styles.formTitle}>Two-Factor Security (2FA)</Text>
              </View>
              
              <Text style={styles.securityNote}>
                Adds an extra layer of protection to your residency account logs. Requires a prompt verification code upon login.
              </Text>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>2FA Status</Text>
                  <Text style={[styles.toggleStatus, { color: userData.twoFactorEnabled ? "#16A34A" : "#94A3B8" }]}>
                    {userData.twoFactorEnabled ? "Active & Protected" : "Not Configured / Inactive"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.statusToggleBtn, { backgroundColor: userData.twoFactorEnabled ? "#FEF2F2" : "#ECFDF5" }]}
                  onPress={() => toggle2FA()}
                  disabled={toggling2FA}
                  activeOpacity={0.8}
                >
                  {toggling2FA ? (
                    <ActivityIndicator size="small" color={userData.twoFactorEnabled ? "#EF4444" : "#10B981"} />
                  ) : (
                    <Text style={[styles.statusToggleBtnText, { color: userData.twoFactorEnabled ? "#EF4444" : "#10B981" }]}>
                      {userData.twoFactorEnabled ? "Disable" : "Enable"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ─────────── TAB 3: DIGITAL SMART ID CARD ─────────── */}
        {activeTab === "card" && (
          <View style={styles.cardTabContainer}>
            {/* Visual Smart Card PASS Container */}
            <View style={styles.smartCardContainer}>
              <View style={styles.smartCardBackgroundDecor1} />
              <View style={styles.smartCardBackgroundDecor2} />

              {/* Card top banner header */}
              <View style={styles.smartCardHeader}>
                <Text style={styles.smartCardHostelTitle} numberOfLines={1}>
                  {hostel.name || "HMS RESIDENCY BLOCK"}
                </Text>
                <Text style={styles.smartCardSubTitle}>RESIDENT DIGITAL PASS CARD</Text>
              </View>

              {/* Avatar circle with glow border */}
              <View style={styles.smartCardAvatarWrapper}>
                <View style={styles.smartCardAvatarCircle}>
                  {userData.image ? (
                    <Image source={{ uri: userData.image }} style={styles.smartCardAvatar} />
                  ) : (
                    <Text style={styles.smartCardAvatarText}>{userData.name ? userData.name[0].toUpperCase() : "U"}</Text>
                  )}
                </View>
                <View style={styles.smartCardStatusBadge}>
                  <Text style={styles.smartCardStatusText}>{isCheckedOut ? "INACTIVE" : "ACTIVE"}</Text>
                </View>
              </View>

              {/* Resident details list metadata */}
              <View style={styles.smartCardBody}>
                <Text style={styles.smartCardName}>{userData.name}</Text>
                <Text style={styles.smartCardRegNumber}>Reg: {userData.regNumber || "N/A"}</Text>

                <View style={styles.smartCardFields}>
                  <View style={styles.smartCardFieldRow}>
                    <Text style={styles.smartCardFieldLabel}>Room Space</Text>
                    <Text style={styles.smartCardFieldValue}>
                      {residency.roomNumber ? `Room ${residency.roomNumber}` : "Not Assigned"}
                    </Text>
                  </View>
                  <View style={styles.smartCardFieldDivider} />
                  <View style={styles.smartCardFieldRow}>
                    <Text style={styles.smartCardFieldLabel}>CNIC Number</Text>
                    <Text style={styles.smartCardFieldValue}>{userData.cnic || "N/A"}</Text>
                  </View>
                </View>
              </View>

              {/* QR Code and pass issue date details */}
              <View style={styles.smartCardFooter}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.smartCardFooterLabel}>Issued Date</Text>
                  <Text style={styles.smartCardFooterVal}>
                    {userData.joinedAt ? new Date(userData.joinedAt).toLocaleDateString() : "N/A"}
                  </Text>
                </View>
                
                {/* Dynamically loads network generated QR based on Resident ID */}
                <View style={styles.qrCodeWrapper}>
                  <Image
                    source={{
                      uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(userData.uid || userData.email || "guest")}`,
                    }}
                    style={styles.qrCodeImage}
                  />
                </View>
              </View>
            </View>

            {/* Quick Share action button */}
            <TouchableOpacity
              style={styles.shareIdPassBtn}
              onPress={handleShareId}
              activeOpacity={0.8}
            >
              <Share2 size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.shareIdPassText}>Share Residency Smart Pass</Text>
            </TouchableOpacity>
            
            <Text style={styles.screenshotGuide}>
              💡 Tip: You can take a screenshot of this ID card to use as a digital gate pass/clearance pass at the entry registers.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { justifyContent: "center", alignItems: "center" },
  
  /* Top Header */
  topHeader: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  topHeaderContent: {
    height: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  topHeaderTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  topHeaderSubtitle: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 1,
  },
  headerLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  headerLogoutText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#EF4444",
  },

  /* Navigation Tabs Segment */
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    height: 48,
    alignItems: "center",
    justifyContent: "space-between",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  tabButtonActive: {
    backgroundColor: "#F0F5FF",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#2563EB",
    fontWeight: "900",
  },

  /* Scroll container */
  scrollBody: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 40 },

  profileHeaderCard: {
    backgroundColor: "#312E81", // Rich royal indigo background
    borderRadius: borderRadius.large,
    padding: spacing.xl,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    ...shadows.premium,
  },
  headerCardDecor1: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    position: "absolute",
    top: -20,
    left: -20,
  },
  headerCardDecor2: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    position: "absolute",
    bottom: -40,
    right: -20,
  },
  iconWrapperCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: spacing.md,
  },
  avatarImg: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: "#1E293B",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
    marginBottom: spacing.md,
  },
  profileBadgesRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  badgeLabel: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeLabelText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },

  /* Info sections cards */
  infoSection: {},
  sectionHeader: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  detailCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.lg,
    ...shadows.premium,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
  },
  detailSubValue: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 2,
  },
  detailDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: spacing.md,
  },
  infoGridRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  emergencyWarningBox: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  emergencyWarningLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: "#EF4444",
    letterSpacing: 0.5,
  },
  emergencyWarningVal: {
    fontSize: 13,
    fontWeight: "800",
    color: "#991B1B",
    marginTop: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },

  /* History Logs */
  historyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "500",
    marginTop: 1,
  },
  historyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  historyStatusText: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  /* Security forms styling */
  securityFormCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.lg,
    ...shadows.premium,
  },
  formHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md + 2,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  formTextInput: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: borderRadius.medium,
    height: 44,
    paddingHorizontal: spacing.md,
    fontSize: 13,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: borderRadius.medium,
    backgroundColor: "#F8FAFC",
    height: 44,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: spacing.md,
    fontSize: 13,
    color: "#1E293B",
  },
  eyeBtn: {
    paddingHorizontal: spacing.md,
    height: "100%",
    justifyContent: "center",
  },
  formSubmitBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: borderRadius.medium,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
    ...shadows.premium,
  },
  formSubmitBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
  },
  otpInput: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 4,
  },
  securityNote: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
    fontWeight: "500",
    marginBottom: spacing.md,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    backgroundColor: "#F8FAFC",
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E293B",
  },
  toggleStatus: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  statusToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  statusToggleBtnText: {
    fontSize: 10,
    fontWeight: "800",
  },

  /* Digital Smart ID Card tab styling */
  cardTabContainer: {
    alignItems: "center",
    gap: spacing.lg,
  },
  smartCardContainer: {
    width: 290,
    height: 430,
    borderRadius: 24,
    backgroundColor: "#1E1B4B", // Midnight Indigo-Purple
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    position: "relative",
    overflow: "hidden",
    justifyContent: "space-between",
    ...shadows.premium,
  },
  smartCardBackgroundDecor1: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    position: "absolute",
    top: -30,
    left: -30,
  },
  smartCardBackgroundDecor2: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(16, 185, 129, 0.06)",
    position: "absolute",
    bottom: -30,
    right: -30,
  },
  smartCardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    pb: spacing.xs,
    alignItems: "center",
  },
  smartCardHostelTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#818CF8",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    width: "100%",
    textAlign: "center",
  },
  smartCardSubTitle: {
    fontSize: 7.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1,
    marginTop: 2,
    textTransform: "uppercase",
  },
  smartCardAvatarWrapper: {
    alignItems: "center",
    position: "relative",
  },
  smartCardAvatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  smartCardAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  smartCardAvatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFF",
  },
  smartCardStatusBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    position: "absolute",
    bottom: -6,
  },
  smartCardStatusText: {
    fontSize: 7.5,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  smartCardBody: {
    alignItems: "center",
    gap: 4,
  },
  smartCardName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFF",
  },
  smartCardRegNumber: {
    fontSize: 9,
    color: "#818CF8",
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  smartCardFields: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  smartCardFieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smartCardFieldLabel: {
    fontSize: 8,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    fontWeight: "800",
  },
  smartCardFieldValue: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFF",
  },
  smartCardFieldDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  smartCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: spacing.md,
  },
  smartCardFooterLabel: {
    fontSize: 7,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    fontWeight: "800",
    marginBottom: 2,
  },
  smartCardFooterVal: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFF",
  },
  qrCodeWrapper: {
    backgroundColor: "#FFF",
    padding: 3,
    borderRadius: 6,
  },
  qrCodeImage: {
    width: 48,
    height: 48,
  },
  shareIdPassBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
    height: 44,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.xl,
    ...shadows.premium,
  },
  shareIdPassText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
  },
  screenshotGuide: {
    fontSize: 10,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 14,
    fontWeight: "600",
    paddingHorizontal: spacing.lg,
  },
});
