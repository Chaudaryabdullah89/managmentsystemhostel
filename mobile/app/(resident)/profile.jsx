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
  Modal,
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

  // 2FA Setup states
  const [setup2FAMethod, setSetup2FAMethod] = useState(null); // 'TOTP' | 'EMAIL' | 'BACKUP_CODES' | null
  const [twoFactorOtp, setTwoFactorOtp] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [backupCodesSaved, setBackupCodesSaved] = useState(false);
  const [setup2FALoading, setSetup2FALoading] = useState(false);
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);

  // Start 2FA setup process
  const handleEnable2FAInit = async (method) => {
    setSetup2FAMethod(method);
    setTwoFactorOtp("");
    setTwoFactorSecret("");
    setBackupCodes([]);
    setBackupCodesSaved(false);
    setSetup2FALoading(true);
    setShow2FASetupModal(true);

    try {
      const res = await api.post("/api/auth/2fa/setup", { method });
      if (method === "TOTP") {
        setTwoFactorSecret(res.data.secret || "");
      } else if (method === "BACKUP_CODES") {
        setBackupCodes(res.data.codes || []);
      } else if (method === "EMAIL") {
        Alert.alert("Code Sent", "A verification code has been sent to your email address.");
      }
    } catch (err) {
      Alert.alert("Setup Error", err.response?.data?.message || "Could not initialize 2FA setup.");
      setShow2FASetupModal(false);
      setSetup2FAMethod(null);
    } finally {
      setSetup2FALoading(false);
    }
  };

  // Verify and finalize 2FA setup
  const handleVerify2FASetup = async () => {
    if (setup2FAMethod === "BACKUP_CODES") {
      if (!backupCodesSaved) {
        Alert.alert("Action Required", "Please confirm that you have securely saved your backup codes first.");
        return;
      }
      setSetup2FALoading(true);
      try {
        await api.post("/api/auth/2fa/verify", { otp: "confirmed", method: "BACKUP_CODES" });
        Alert.alert("2FA Enabled", "Backup Codes two-factor authentication is now active.");
        setShow2FASetupModal(false);
        setSetup2FAMethod(null);
        refetch();
      } catch (err) {
        Alert.alert("Verification Failed", err.response?.data?.message || "Could not activate 2FA.");
      } finally {
        setSetup2FALoading(false);
      }
      return;
    }

    if (!twoFactorOtp.trim() || twoFactorOtp.length < 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit verification code.");
      return;
    }

    setSetup2FALoading(true);
    try {
      await api.post("/api/auth/2fa/verify", {
        otp: twoFactorOtp.trim(),
        method: setup2FAMethod,
      });
      Alert.alert("2FA Configured ✅", "Two-Factor authentication has been successfully set up and is now active.");
      setShow2FASetupModal(false);
      setSetup2FAMethod(null);
      refetch();
    } catch (err) {
      Alert.alert("Verification Failed", err.response?.data?.message || "Invalid setup verification code.");
    } finally {
      setSetup2FALoading(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async () => {
    Alert.alert(
      "Disable 2FA?",
      "This will remove the verification check. Your account will be less secure.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable",
          style: "destructive",
          onPress: async () => {
            try {
              await api.post("/api/auth/2fa/disable");
              Alert.alert("2FA Disabled", "Two-Factor authentication is now inactive.");
              refetch();
            } catch (err) {
              Alert.alert("Error", err.response?.data?.message || "Failed to disable 2FA.");
            }
          }
        }
      ]
    );
  };

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



            {/* Multi-Method Two-Factor Authentication (2FA) */}
            <View style={styles.securityFormCard}>
              <View style={styles.formHeaderRow}>
                <ShieldCheck size={16} color="#16A34A" style={{ marginRight: 6 }} />
                <Text style={styles.formTitle}>Multi-Factor Authentication (2FA)</Text>
              </View>
              
              <Text style={styles.securityNote}>
                Protect your account details with a secondary validation prompt when signing in.
              </Text>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>Current Status</Text>
                  <Text style={[styles.toggleStatus, { color: profile?.basic?.twoFactorEnabled ? "#16A34A" : "#94A3B8" }]}>
                    {profile?.basic?.twoFactorEnabled 
                      ? `Active via ${profile.basic.twoFactorMethod === "TOTP" ? "Authenticator App" : profile.basic.twoFactorMethod === "EMAIL" ? "Email OTP" : "Backup Codes"}` 
                      : "Not Configured / Inactive"}
                  </Text>
                </View>
                {profile?.basic?.twoFactorEnabled && (
                  <TouchableOpacity
                    style={[styles.statusToggleBtn, { backgroundColor: "#FEF2F2" }]}
                    onPress={handleDisable2FA}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.statusToggleBtnText, { color: "#EF4444" }]}>Disable 2FA</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Grid or list of 2FA options */}
              <View style={{ gap: spacing.md, marginTop: spacing.md }}>
                {/* Option 1: Authenticator App */}
                <View style={[
                  styles.mfaOptionRow,
                  profile?.basic?.twoFactorEnabled && profile?.basic?.twoFactorMethod === "TOTP" && styles.mfaOptionRowActive
                ]}>
                  <View style={styles.mfaOptionLeft}>
                    <View style={[styles.mfaIconBox, { backgroundColor: "#EEF2FF" }]}>
                      <Key size={14} color="#4F46E5" />
                    </View>
                    <View>
                      <Text style={styles.mfaOptionTitle}>Authenticator App</Text>
                      <Text style={styles.mfaOptionDesc}>Google Authenticator or Authy</Text>
                    </View>
                  </View>
                  {!(profile?.basic?.twoFactorEnabled && profile?.basic?.twoFactorMethod === "TOTP") && (
                    <TouchableOpacity
                      style={styles.mfaActionBtn}
                      onPress={() => handleEnable2FAInit("TOTP")}
                    >
                      <Text style={styles.mfaActionBtnText}>
                        {profile?.basic?.twoFactorEnabled ? "Switch" : "Setup"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Option 2: Email OTP */}
                <View style={[
                  styles.mfaOptionRow,
                  profile?.basic?.twoFactorEnabled && profile?.basic?.twoFactorMethod === "EMAIL" && styles.mfaOptionRowActive
                ]}>
                  <View style={styles.mfaOptionLeft}>
                    <View style={[styles.mfaIconBox, { backgroundColor: "#E0F2FE" }]}>
                      <Mail size={14} color="#0284C7" />
                    </View>
                    <View>
                      <Text style={styles.mfaOptionTitle}>Email Verification Code</Text>
                      <Text style={styles.mfaOptionDesc}>One-time code to your registered email</Text>
                    </View>
                  </View>
                  {!(profile?.basic?.twoFactorEnabled && profile?.basic?.twoFactorMethod === "EMAIL") && (
                    <TouchableOpacity
                      style={styles.mfaActionBtn}
                      onPress={() => handleEnable2FAInit("EMAIL")}
                    >
                      <Text style={styles.mfaActionBtnText}>
                        {profile?.basic?.twoFactorEnabled ? "Switch" : "Setup"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Option 3: Backup Codes */}
                <View style={[
                  styles.mfaOptionRow,
                  profile?.basic?.twoFactorEnabled && profile?.basic?.twoFactorMethod === "BACKUP_CODES" && styles.mfaOptionRowActive
                ]}>
                  <View style={styles.mfaOptionLeft}>
                    <View style={[styles.mfaIconBox, { backgroundColor: "#FEF3C7" }]}>
                      <ShieldCheck size={14} color="#D97706" />
                    </View>
                    <View>
                      <Text style={styles.mfaOptionTitle}>Emergency Backup Codes</Text>
                      <Text style={styles.mfaOptionDesc}>Pre-generated one-time recovery keys</Text>
                    </View>
                  </View>
                  {!(profile?.basic?.twoFactorEnabled && profile?.basic?.twoFactorMethod === "BACKUP_CODES") && (
                    <TouchableOpacity
                      style={styles.mfaActionBtn}
                      onPress={() => handleEnable2FAInit("BACKUP_CODES")}
                    >
                      <Text style={styles.mfaActionBtnText}>
                        {profile?.basic?.twoFactorEnabled ? "Switch" : "Setup"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
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

      {/* 2FA Setup Interactive Modal Dialog */}
      <Modal
        visible={show2FASetupModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShow2FASetupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>
                Setup 2FA: {setup2FAMethod === "TOTP" ? "Authenticator App" : setup2FAMethod === "EMAIL" ? "Email Code" : "Backup Codes"}
              </Text>
              <TouchableOpacity onPress={() => setShow2FASetupModal(false)} style={styles.modalCloseIcon}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBodyScroll} style={{ maxHeight: 400 }}>
              {setup2FALoading ? (
                <View style={styles.modalLoadingBox}>
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text style={styles.modalLoadingText}>Loading configuration...</Text>
                </View>
              ) : (
                <View style={{ gap: spacing.md }}>
                  {/* TOTP Instructions */}
                  {setup2FAMethod === "TOTP" && (
                    <View style={{ gap: spacing.sm }}>
                      <Text style={styles.modalInstructions}>
                        Copy this secret configuration key and add it manually to your Authenticator app (Google Authenticator, Authy, or Duo Mobile):
                      </Text>
                      <View style={styles.secretKeyBox}>
                        <Text style={styles.secretKeyText} selectable={true}>{twoFactorSecret}</Text>
                      </View>
                      <Text style={styles.modalInstructions}>
                        Once added, enter the 6-digit OTP code below to verify and activate:
                      </Text>
                      <TextInput
                        style={styles.modalOtpInput}
                        placeholder="Enter 6-digit code"
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={twoFactorOtp}
                        onChangeText={setTwoFactorOtp}
                      />
                    </View>
                  )}

                  {/* EMAIL Instructions */}
                  {setup2FAMethod === "EMAIL" && (
                    <View style={{ gap: spacing.sm }}>
                      <Text style={styles.modalInstructions}>
                        We have sent a verification code to your registered email address ({profile?.basic?.email}).
                      </Text>
                      <Text style={styles.modalInstructions}>
                        Please enter the 6-digit verification code below:
                      </Text>
                      <TextInput
                        style={styles.modalOtpInput}
                        placeholder="Enter 6-digit code"
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={twoFactorOtp}
                        onChangeText={setTwoFactorOtp}
                      />
                    </View>
                  )}

                  {/* BACKUP CODES Instructions */}
                  {setup2FAMethod === "BACKUP_CODES" && (
                    <View style={{ gap: spacing.sm }}>
                      <Text style={styles.modalInstructions}>
                        Save these emergency backup recovery codes in a safe place. Each code can be used only once to bypass sign-in checks:
                      </Text>
                      <View style={styles.backupCodesList}>
                        {backupCodes.map((code, idx) => (
                          <Text key={idx} style={styles.backupCodeItem} selectable={true}>{code}</Text>
                        ))}
                      </View>
                      <TouchableOpacity
                        style={styles.confirmCheckboxRow}
                        onPress={() => setBackupCodesSaved(!backupCodesSaved)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.checkbox, backupCodesSaved && styles.checkboxChecked]}>
                          {backupCodesSaved && <Text style={styles.checkboxTick}>✓</Text>}
                        </View>
                        <Text style={styles.checkboxLabel}>I have copied and saved these backup recovery codes.</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalVerifyBtn, setup2FALoading && { opacity: 0.6 }]}
                onPress={handleVerify2FASetup}
                disabled={setup2FALoading}
              >
                <Text style={styles.modalVerifyBtnText}>
                  {setup2FAMethod === "BACKUP_CODES" ? "Activate Backup Codes" : "Verify & Enable"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  /* MFA / Biometrics Styles */
  unavailableRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  unavailableText: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "750",
    flex: 1,
  },
  mfaOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: colors.white,
  },
  mfaOptionRowActive: {
    borderColor: "#10B981",
    backgroundColor: "#ECFDF5",
  },
  mfaOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
    marginRight: spacing.sm,
  },
  mfaIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  mfaOptionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1E293B",
  },
  mfaOptionDesc: {
    fontSize: 9,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 1,
  },
  mfaActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#D8D8D8",
    ...shadows.premium,
  },
  mfaActionBtnText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1E293B",
    textTransform: "uppercase",
  },
  
  /* Modal Overlay Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    width: "100%",
    padding: spacing.xl,
    ...shadows.premium,
    elevation: 5,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  modalHeaderTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1E293B",
  },
  modalCloseIcon: {
    padding: 4,
  },
  modalBodyScroll: {
    paddingVertical: spacing.xs,
  },
  modalLoadingBox: {
    padding: spacing.giant,
    alignItems: "center",
    gap: spacing.md,
  },
  modalLoadingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  modalInstructions: {
    fontSize: 11,
    color: "#475569",
    lineHeight: 16,
    fontWeight: "655",
  },
  secretKeyBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginVertical: spacing.xs,
    alignItems: "center",
  },
  secretKeyText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#4F46E5",
    letterSpacing: 1.5,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  modalOtpInput: {
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    color: "#1E293B",
    marginVertical: spacing.xs,
    backgroundColor: "#F8FAFC",
  },
  backupCodesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    backgroundColor: "#F8FAFC",
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginVertical: spacing.xs,
    justifyContent: "space-between",
  },
  backupCodeItem: {
    width: "48%",
    fontSize: 12,
    fontWeight: "900",
    color: "#334155",
    backgroundColor: colors.white,
    padding: 6,
    textAlign: "center",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  confirmCheckboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  checkboxChecked: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  checkboxTick: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
  },
  checkboxLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
    flex: 1,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  modalVerifyBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: borderRadius.medium,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  modalVerifyBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
});
