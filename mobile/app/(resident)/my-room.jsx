import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import api from "../../lib/api";
import { colors, spacing, borderRadius, shadows } from "../../lib/theme";
import {
  Building,
  Users,
  ChevronRight,
  Info,
  Phone,
  Mail,
  ArrowUpRight,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  Receipt,
  User,
  Wifi,
  Wind,
  Key,
  ShieldCheck,
  ChevronDown,
  Sparkles,
} from "lucide-react-native";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/* ─────────── Pulsing Skeleton Wrapper ─────────── */
function PulsingSkeleton({ children, style }) {
  const pulseAnim = React.useRef(new Animated.Value(0.3)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.8, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);
  return <Animated.View style={[style, { opacity: pulseAnim }]}>{children}</Animated.View>;
}

/* ─────────── My Room Skeleton ─────────── */
function MyRoomSkeleton({ insets }) {
  const bg = '#E2E8F0';
  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Top Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: (insets?.top || 0) + 14, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <View style={{ width: 120, height: 16, borderRadius: 6, backgroundColor: bg, marginBottom: 6 }} />
          <View style={{ width: 180, height: 11, borderRadius: 5, backgroundColor: bg }} />
        </View>
        <View style={{ width: 60, height: 22, borderRadius: 10, backgroundColor: bg }} />
      </View>
      {/* Tab bar skeleton */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
        {[1,2,3].map(i => (
          <View key={i} style={{ flex: 1, height: 34, borderRadius: 10, backgroundColor: bg }} />
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} scrollEnabled={false}>
        <PulsingSkeleton>
          {/* Boarding pass / room ticket skeleton */}
          <View style={{ borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9', padding: 20, marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ gap: 8 }}>
                <View style={{ width: 130, height: 10, borderRadius: 5, backgroundColor: bg }} />
                <View style={{ width: 90, height: 22, borderRadius: 6, backgroundColor: bg }} />
              </View>
              <View style={{ width: 70, height: 28, borderRadius: 12, backgroundColor: bg }} />
            </View>
            <View style={{ width: 160, height: 11, borderRadius: 5, backgroundColor: bg, marginBottom: 16 }} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[1,2,3].map(i => (
                <View key={i} style={{ flex: 1, height: 50, borderRadius: 12, backgroundColor: bg }} />
              ))}
            </View>
          </View>

          {/* Amenities skeleton */}
          <View style={{ borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9', padding: 20 }}>
            <View style={{ width: 100, height: 10, borderRadius: 5, backgroundColor: bg, marginBottom: 14 }} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {[1,2,3,4,5,6].map(i => (
                <View key={i} style={{ width: (SCREEN_WIDTH - 80) / 3, height: 34, borderRadius: 10, backgroundColor: bg }} />
              ))}
            </View>
          </View>

          {/* Payment history skeleton */}
          <View style={{ borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9', padding: 20 }}>
            <View style={{ width: 120, height: 10, borderRadius: 5, backgroundColor: bg, marginBottom: 14 }} />
            {[1,2,3].map(i => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ gap: 6 }}>
                  <View style={{ width: 80, height: 11, borderRadius: 5, backgroundColor: bg }} />
                  <View style={{ width: 60, height: 9, borderRadius: 4, backgroundColor: bg }} />
                </View>
                <View style={{ width: 70, height: 24, borderRadius: 8, backgroundColor: bg }} />
              </View>
            ))}
          </View>
        </PulsingSkeleton>
      </ScrollView>
    </View>
  );
}

export default function MyRoom() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("space"); // "space" | "roommates" | "swap"
  const [roommateDetail, setRoommateDetail] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [reason, setReason] = useState("");

  // Rules expanded states
  const [expandedRule, setExpandedRule] = useState(null);

  /* ─────────── API Data Fetching ─────────── */
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ["my_room_dashboard"],
    queryFn: async () => {
      const res = await api.get("/api/guest/dashboard");
      return res.data;
    },
  });

  const activeBooking =
    dashboardData?.bookings?.find(
      (b) =>
        b.status === "CONFIRMED" ||
        b.status === "confirmed" ||
        b.status === "CHECKED_IN",
    ) || dashboardData?.bookings?.[0];

  const room = activeBooking?.Room
    ? {
        id: activeBooking.Room.id,
        number: activeBooking.Room.roomNumber || activeBooking.Room.number,
        floor: activeBooking.Room.floor,
        type: activeBooking.Room.type,
        capacity: activeBooking.Room.capacity,
        amenities: activeBooking.Room.amenities || [],
        wing: activeBooking.Room.wing,
        monthlyRent:
          activeBooking.Room.monthlyRent || activeBooking.Room.price || 0,
      }
    : null;

  const hostel = activeBooking?.Room?.Hostel;
  const roommates = dashboardData?.roommates || [];
  const payments =
    dashboardData?.payments || dashboardData?.data?.payments || [];

  const { data: roomsData, isLoading: isRoomsLoading } = useQuery({
    queryKey: ["eligible_rooms_swap", hostel?.id],
    queryFn: async () => {
      const res = await api.get(
        `/api/rooms/roombyhostel?hostelId=${hostel.id}`,
      );
      return res.data;
    },
    enabled: !!hostel?.id && activeTab === "swap",
  });

  const allRooms = roomsData?.rooms || roomsData?.data || [];
  const availableRooms = allRooms.filter(
    (r) => r.id !== room?.id && (r.Booking?.length || 0) < r.capacity,
  );

  const { data: swapHistory, refetch: refetchHistory } = useQuery({
    queryKey: ["swap_history"],
    queryFn: async () => {
      const res = await api.get("/api/guest/room-swap");
      return res.data;
    },
    enabled: activeTab === "swap",
  });

  const mySwaps = swapHistory?.requests || swapHistory?.data || [];
  const pendingSwap = mySwaps.find(
    (s) => s.status?.toUpperCase() === "PENDING",
  );

  // Calculations for billing overview
  const paidPayments = payments.filter(
    (p) => p.status?.toUpperCase() === "PAID",
  );
  const pendingPayments = payments.filter((p) =>
    ["PENDING", "OVERDUE", "PARTIAL"].includes(p.status?.toUpperCase()),
  );
  const totalPaid = paidPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalPending = pendingPayments.reduce(
    (s, p) => s + Number(p.amount || 0),
    0,
  );

  const checkInDate = activeBooking?.checkIn
    ? new Date(activeBooking.checkIn)
    : null;
  const today = new Date();
  const daysStayed = checkInDate
    ? Math.floor((today - checkInDate) / (1000 * 60 * 60 * 24))
    : 0;

  /* ─────────── Mutations ─────────── */
  const { mutate: submitSwap, isPending: isSubmitting } = useMutation({
    mutationFn: () =>
      api.post("/api/guest/room-swap", { toRoomId: selectedRoomId, reason }),
    onSuccess: () => {
      qc.invalidateQueries(["swap_history"]);
      setSelectedRoomId("");
      setReason("");
      Alert.alert(
        "Success",
        "Your room swap request has been submitted for approval.",
      );
    },
    onError: (err) => {
      Alert.alert(
        "Submission Failed",
        err?.response?.data?.error || "Unable to submit request.",
      );
    },
  });

  const handleSwapSubmit = () => {
    if (!selectedRoomId)
      return Alert.alert("Required", "Please choose a target room.");
    if (!reason.trim())
      return Alert.alert("Required", "Please supply a reason for swapping.");
    submitSwap();
  };

  const handleCall = (phone) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email) => {
    if (email) Linking.openURL(`mailto:${email}`);
  };

  const changeTabAnimated = (tab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const handleRefresh = async () => {
    await refetchDashboard();
    if (activeTab === "swap") {
      await refetchHistory();
    }
  };

  if (isDashboardLoading && !dashboardData) {
    return <MyRoomSkeleton insets={insets} />;
  }

  return (
    <View style={[styles.container]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header */}
      <View style={[styles.topHeader, { paddingTop: insets.top }]}>
        <View style={styles.topHeaderContent}>
          <View>
            <Text style={styles.topHeaderTitle}>My Residency</Text>
            <Text style={styles.topHeaderSubtitle}>
              Room Space & Booking Details
            </Text>
          </View>
          {room && (
            <View style={styles.headerBadge}>
              <CheckCircle2
                size={12}
                color="#059669"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.headerBadgeText}>Active</Text>
            </View>
          )}
        </View>
      </View>
      {/* Segmented Control / Tabs */}

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "space" && styles.tabButtonActive,
          ]}
          onPress={() => changeTabAnimated("space")}
          activeOpacity={0.7}
        >
          <Building
            size={16}
            color={activeTab === "space" ? "#2563EB" : "#64748B"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "space" && styles.tabTextActive,
            ]}
          >
            Space
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "roommates" && styles.tabButtonActive,
          ]}
          onPress={() => changeTabAnimated("roommates")}
          activeOpacity={0.7}
        >
          <Users
            size={16}
            color={activeTab === "roommates" ? "#2563EB" : "#64748B"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "roommates" && styles.tabTextActive,
            ]}
          >
            Roommates {roommates.length > 0 && `(${roommates.length})`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "swap" && styles.tabButtonActive,
          ]}
          onPress={() => changeTabAnimated("swap")}
          activeOpacity={0.7}
        >
          <Send
            size={15}
            color={activeTab === "swap" ? "#2563EB" : "#64748B"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "swap" && styles.tabTextActive,
            ]}
          >
            Swap Hub
          </Text>
          {pendingSwap && <View style={styles.alertDot} />}
        </TouchableOpacity>
      </View>

      {/* Main Tab Content */}
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isDashboardLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {!room ? (
          <View style={styles.emptyState}>
            <Building size={48} color="#94A3B8" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyStateTitle}>No Active Allocation</Text>
            <Text style={styles.emptyStateDesc}>
              No stay record was found. Once administrative staff confirms your
              booking and allocates a room, your workspace will appear here.
            </Text>
          </View>
        ) : (
          <>
            {activeTab === "space" && (
              <View style={{ gap: spacing.lg }}>
                {/* Visual Boarding Pass Residency Ticket */}
                <View style={styles.boardingPassTicket}>
                  <View style={styles.ticketHeader}>
                    <View>
                      <Text style={styles.ticketLabel}>
                        ALLOCATED SPACE PASS
                      </Text>
                      <Text style={styles.ticketTitle}>Room {room.number}</Text>
                    </View>
                    <View style={styles.ticketPremiumBadge}>
                      <Text style={styles.ticketPremiumBadgeText}>
                        {room.type || "Standard"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.ticketHostel}>
                    {hostel?.name || "HMS Premium Block"}
                  </Text>

                  {/* Cutout split */}
                  <View style={styles.ticketDivider}>
                    <View style={styles.ticketDashedLine} />
                    <View style={styles.ticketLeftCutout} />
                    <View style={styles.ticketRightCutout} />
                  </View>

                  <View style={styles.ticketStatsGrid}>
                    <View style={styles.ticketStatItem}>
                      <Text style={styles.ticketStatLabel}>WING</Text>
                      <Text style={styles.ticketStatValue}>
                        {room.wing || "Main Block"}
                      </Text>
                    </View>
                    <View style={styles.ticketStatItem}>
                      <Text style={styles.ticketStatLabel}>STAY DURATION</Text>
                      <Text style={styles.ticketStatValue}>
                        {daysStayed} Days
                      </Text>
                    </View>
                    <View style={styles.ticketStatItem}>
                      <Text style={styles.ticketStatLabel}>MONTHLY RENT</Text>
                      <Text style={styles.ticketStatValue}>
                        PKR {room.monthlyRent.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Ledger & Billing Overview Details */}
                <View>
                  <Text style={styles.sectionHeader}>
                    BILLING & PAYMENTS STATUS
                  </Text>

                  <View style={styles.billingStatsRow}>
                    <View style={styles.billingStatCard}>
                      <View
                        style={[
                          styles.billingStatIconBox,
                          { backgroundColor: "#ECFDF5" },
                        ]}
                      >
                        <CheckCircle2 size={16} color="#059669" />
                      </View>
                      <View>
                        <Text style={styles.billingStatLabel}>TOTAL PAID</Text>
                        <Text
                          style={[
                            styles.billingStatValue,
                            { color: "#059669" },
                          ]}
                        >
                          PKR {totalPaid.toLocaleString()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.billingStatCard}>
                      <View
                        style={[
                          styles.billingStatIconBox,
                          { backgroundColor: "#FEF3C7" },
                        ]}
                      >
                        <AlertCircle size={16} color="#D97706" />
                      </View>
                      <View>
                        <Text style={styles.billingStatLabel}>UNPAID DUES</Text>
                        <Text
                          style={[
                            styles.billingStatValue,
                            { color: "#D97706" },
                          ]}
                        >
                          PKR {totalPending.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Recent Invoices list */}
                  <View style={styles.invoicesListCard}>
                    <View style={styles.invoicesHeaderRow}>
                      <Text style={styles.invoicesListTitle}>
                        RECENT TRANSACTION HISTORY
                      </Text>
                      <TouchableOpacity
                        onPress={() => router.push("/(resident)/payments")}
                        activeOpacity={0.6}
                      >
                        <Text style={styles.viewAllBtnText}>View All</Text>
                      </TouchableOpacity>
                    </View>

                    {payments.length === 0 ? (
                      <Text style={styles.emptyInvoicesText}>
                        No invoice records log found.
                      </Text>
                    ) : (
                      payments.slice(0, 3).map((payment) => {
                        const isPaid = payment.status?.toUpperCase() === "PAID";
                        return (
                          <View key={payment.id} style={styles.invoiceListItem}>
                            <View style={styles.invoiceItemLeft}>
                              <View
                                style={[
                                  styles.invoiceItemIconBox,
                                  {
                                    backgroundColor: isPaid
                                      ? "#ECFDF5"
                                      : "#FFFBEB",
                                  },
                                ]}
                              >
                                <Receipt
                                  size={14}
                                  color={isPaid ? "#059669" : "#D97706"}
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={styles.invoiceItemNote}
                                  numberOfLines={1}
                                >
                                  {payment.notes ||
                                    payment.type ||
                                    "Stay Rent Invoice"}
                                </Text>
                                <Text style={styles.invoiceItemDate}>
                                  {new Date(payment.date).toLocaleDateString(
                                    "en-PK",
                                    {
                                      day: "numeric",
                                      month: "short",
                                    },
                                  )}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.invoiceItemRight}>
                              <Text style={styles.invoiceItemAmount}>
                                PKR {payment.amount?.toLocaleString()}
                              </Text>
                              <View
                                style={[
                                  styles.invoiceStatusPill,
                                  {
                                    backgroundColor: isPaid
                                      ? "#ECFDF5"
                                      : "#FEF3C7",
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.invoiceStatusPillText,
                                    { color: isPaid ? "#059669" : "#D97706" },
                                  ]}
                                >
                                  {isPaid ? "Paid ✓" : "Unpaid"}
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                </View>

                {/* Hostel Details Card */}
                {hostel && (
                  <View>
                    <Text style={styles.sectionHeader}>
                      HOSTEL DIRECTORY INFO
                    </Text>
                    <View style={styles.directoryCard}>
                      <View style={styles.directoryRow}>
                        <Building
                          size={16}
                          color="#64748B"
                          style={{ marginRight: 10 }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.directoryLabel}>ADDRESS</Text>
                          <Text style={styles.directoryVal}>
                            {hostel.completeaddress ||
                              hostel.address ||
                              "Main Campus Road"}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.directoryDivider} />
                      <View style={styles.directoryRow}>
                        <Phone
                          size={16}
                          color="#64748B"
                          style={{ marginRight: 10 }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.directoryLabel}>
                            WARDEN CONTACT
                          </Text>
                          <Text style={styles.directoryVal}>
                            {hostel.phone || hostel.contact || "Not Available"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Animated Room Utilities Section */}
                <View>
                  <Text style={styles.sectionHeader}>
                    ROOM UTILITIES & STATUS
                  </Text>
                  <View style={styles.utilitiesGrid}>
                    <View style={styles.utilityItem}>
                      <View
                        style={[
                          styles.utilityIconWrapper,
                          { backgroundColor: "#EEF2FF" },
                        ]}
                      >
                        <Wifi size={16} color="#4F46E5" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.utilityName}>Room Wi-Fi</Text>
                        <Text style={styles.utilityStatusText}>
                          50 Mbps • Connected
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.miniBadge,
                          { backgroundColor: "#ECFDF5" },
                        ]}
                      >
                        <Text
                          style={[styles.miniBadgeText, { color: "#059669" }]}
                        >
                          Active
                        </Text>
                      </View>
                    </View>

                    <View style={styles.utilityItem}>
                      <View
                        style={[
                          styles.utilityIconWrapper,
                          { backgroundColor: "#F0FDF4" },
                        ]}
                      >
                        <Wind size={16} color="#16A34A" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.utilityName}>Air Conditioning</Text>
                        <Text style={styles.utilityStatusText}>
                          Climate Controlled
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.miniBadge,
                          { backgroundColor: "#ECFDF5" },
                        ]}
                      >
                        <Text
                          style={[styles.miniBadgeText, { color: "#059669" }]}
                        >
                          Verified
                        </Text>
                      </View>
                    </View>

                    {/* <View style={styles.utilityItem}>
                      <View style={[styles.utilityIconWrapper, { backgroundColor: "#FFF7ED" }]}>
                        <Key size={16} color="#EA580C" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.utilityName}>Digital Card Lock</Text>
                        <Text style={styles.utilityStatusText}>Secure Smart Access</Text>
                      </View>
                      <View style={[styles.miniBadge, { backgroundColor: "#ECFDF5" }]}>
                        <Text style={[styles.miniBadgeText, { color: "#059669" }]}>Safe</Text>
                      </View>
                    </View> */}

                    <View style={styles.utilityItem}>
                      <View
                        style={[
                          styles.utilityIconWrapper,
                          { backgroundColor: "#F5F3FF" },
                        ]}
                      >
                        <Sparkles size={16} color="#7C3AED" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.utilityName}>Room Cleaning</Text>
                        <Text style={styles.utilityStatusText}>
                          Scheduled Weekly
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.miniBadge,
                          { backgroundColor: "#EFF6FF" },
                        ]}
                      >
                        <Text
                          style={[styles.miniBadgeText, { color: "#2563EB" }]}
                        >
                          Pending
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Residency Guidelines Accordion Section */}
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={styles.sectionHeader}>
                    RESIDENCY RULES & GUIDELINES
                  </Text>

                  <View style={styles.rulesList}>
                    {[
                      {
                        title: "Quiet Hours Policy",
                        icon: Info,
                        color: "#3B82F6",
                        desc: "For occupant convenience, strict quiet hours are observed from 10:00 PM to 07:00 AM. Please keep volume low on devices.",
                      },
                      {
                        title: "Visitor & Guest Access",
                        icon: Users,
                        color: "#10B981",
                        desc: "Day guests are allowed in common rooms till 09:00 PM. No overnight stay of external visitors is allowed without warden approval.",
                      },
                      {
                        title: "Maintenance Reports",
                        icon: AlertCircle,
                        color: "#EF4444",
                        desc: "If any room fixture is broken, raise a housekeeping request immediately. Administrative staff visits on Tuesdays for general fixes.",
                      },
                    ].map((rule, idx) => {
                      const isExpanded = expandedRule === idx;
                      const RuleIcon = rule.icon;
                      return (
                        <View
                          key={idx}
                          style={[
                            styles.ruleCard,
                            isExpanded && styles.ruleCardExpanded,
                          ]}
                        >
                          <TouchableOpacity
                            style={styles.ruleHeader}
                            onPress={() => {
                              LayoutAnimation.configureNext(
                                LayoutAnimation.Presets.easeInEaseOut,
                              );
                              setExpandedRule(isExpanded ? null : idx);
                            }}
                            activeOpacity={0.8}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <View
                                style={[
                                  styles.ruleIconWrapper,
                                  { backgroundColor: rule.color + "12" },
                                ]}
                              >
                                <RuleIcon size={14} color={rule.color} />
                              </View>
                              <Text style={styles.ruleTitleText}>
                                {rule.title}
                              </Text>
                            </View>
                            <ChevronDown
                              size={14}
                              color="#94A3B8"
                              style={{
                                transform: [
                                  { rotate: isExpanded ? "180deg" : "0deg" },
                                ],
                              }}
                            />
                          </TouchableOpacity>

                          {isExpanded && (
                            <View style={styles.ruleBody}>
                              <Text style={styles.ruleBodyText}>
                                {rule.desc}
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {activeTab === "roommates" && (
              <View style={{ gap: spacing.md }}>
                <Text style={styles.sectionHeader}>
                  ROOM OCCUPANTS ({roommates.length + 1})
                </Text>

                {/* Visual Identity Badge Card for current user */}
                <View style={styles.occupantBadgeCardActive}>
                  <View style={styles.occupantBadgeLeftStripe} />
                  <View style={styles.occupantBadgeMainContent}>
                    <View style={styles.occupantHeaderRow}>
                      <View
                        style={[
                          styles.badgeAvatarCircle,
                          {
                            backgroundColor: "#2563EB",
                            borderColor: "#BFDBFE",
                          },
                        ]}
                      >
                        <Text style={styles.badgeAvatarTextYou}>U</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Text style={styles.occupantBadgeName}>
                            {dashboardData?.me?.name || "You"}
                          </Text>
                          <View style={styles.youBadge}>
                            <Text style={styles.youBadgeText}>YOU</Text>
                          </View>
                        </View>
                        <Text style={styles.occupantBadgeEmail}>
                          {dashboardData?.me?.email || "Resident Owner"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.badgeDivider} />
                    <View style={styles.badgeFooterInfo}>
                      <Text style={styles.badgeFooterLabel}>
                        ALLOCATED SEAT:{" "}
                        <Text style={styles.badgeFooterValue}>Bed Slot A</Text>
                      </Text>
                      <Text style={styles.badgeFooterLabel}>
                        STATUS:{" "}
                        <Text
                          style={[
                            styles.badgeFooterValue,
                            { color: "#10B981" },
                          ]}
                        >
                          Active Stay
                        </Text>
                      </Text>
                    </View>
                  </View>
                </View>

                {roommates.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Users
                      size={28}
                      color="#94A3B8"
                      style={{ marginBottom: 8 }}
                    />
                    <Text style={styles.emptyText}>
                      No roommates registered for this room.
                    </Text>
                  </View>
                ) : (
                  roommates.map((r, index) => {
                    const initials = r.name?.[0]?.toUpperCase() || "?";
                    const bedLetter = String.fromCharCode(66 + index); // Bed Slot B, C, D...
                    return (
                      <View key={r.id} style={styles.occupantBadgeCard}>
                        <View
                          style={[
                            styles.occupantBadgeLeftStripe,
                            { backgroundColor: "#64748B" },
                          ]}
                        />
                        <View style={styles.occupantBadgeMainContent}>
                          <View style={styles.occupantHeaderRow}>
                            <View style={styles.badgeAvatarCircle}>
                              <Text style={styles.badgeAvatarText}>
                                {initials}
                              </Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <Text style={styles.occupantBadgeName}>
                                {r.name}
                              </Text>
                              <Text style={styles.occupantBadgeEmail}>
                                {r.email}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.detailChevronBtn}
                              onPress={() => {
                                LayoutAnimation.configureNext(
                                  LayoutAnimation.Presets.spring,
                                );
                                setRoommateDetail(r);
                              }}
                              activeOpacity={0.7}
                            >
                              <ChevronRight size={16} color="#94A3B8" />
                            </TouchableOpacity>
                          </View>

                          <View style={styles.badgeDivider} />

                          <View style={styles.badgeFooterRowWithActions}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.badgeFooterLabel}>
                                ALLOCATED SEAT:{" "}
                                <Text style={styles.badgeFooterValue}>
                                  Bed Slot {bedLetter}
                                </Text>
                              </Text>
                            </View>
                            <View style={styles.badgeFooterActions}>
                              {r.phone && (
                                <TouchableOpacity
                                  style={styles.badgeActionBtn}
                                  onPress={() => handleCall(r.phone)}
                                  activeOpacity={0.6}
                                >
                                  <Phone size={13} color="#4F46E5" />
                                  <Text style={styles.badgeActionBtnText}>
                                    Call
                                  </Text>
                                </TouchableOpacity>
                              )}
                              <TouchableOpacity
                                style={styles.badgeActionBtn}
                                onPress={() => handleEmail(r.email)}
                                activeOpacity={0.6}
                              >
                                <Mail size={13} color="#4F46E5" />
                                <Text style={styles.badgeActionBtnText}>
                                  Email
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {activeTab === "swap" && (
              <View style={{ gap: spacing.lg }}>
                {pendingSwap ? (
                  <View style={styles.pendingSwapBanner}>
                    <View style={styles.pendingSwapHeader}>
                      <View style={styles.pendingSwapIconBox}>
                        <ActivityIndicator color="#D97706" size="small" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pendingSwapTitle}>
                          Swap Request Pending
                        </Text>
                        <Text style={styles.pendingSwapSubtitle}>
                          Transfer proposal submitted on{" "}
                          {new Date(pendingSwap.createdAt).toLocaleDateString(
                            "en-PK",
                            {
                              day: "numeric",
                              month: "short",
                            },
                          )}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.pendingSwapDetails}>
                      <Text style={styles.pendingSwapDetailText}>
                        Requested Destination:{" "}
                        <Text style={{ fontWeight: "700", color: "#1E293B" }}>
                          Room{" "}
                          {pendingSwap.ToRoom?.roomNumber ||
                            pendingSwap.toRoom?.roomNumber ||
                            pendingSwap.toRoom?.number ||
                            "—"}
                        </Text>
                      </Text>
                      <Text style={styles.pendingSwapDetailText}>
                        Reason:{" "}
                        <Text style={{ fontStyle: "italic" }}>
                          "{pendingSwap.reason}"
                        </Text>
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.formCard}>
                    <Text style={styles.sectionHeader}>
                      REQUEST NEW ROOM SWAP
                    </Text>
                    <Text style={styles.formInstructions}>
                      Choose a target room that has vacant spots. The
                      administration will check space availability and verify
                      before approving.
                    </Text>

                    <Text style={styles.inputLabel}>
                      AVAILABLE DESTINATION ROOMS
                    </Text>
                    {isRoomsLoading ? (
                      <ActivityIndicator
                        color={colors.primary}
                        style={{ marginVertical: 20 }}
                      />
                    ) : availableRooms.length === 0 ? (
                      <View style={styles.emptyRoomsBox}>
                        <Info
                          size={16}
                          color="#64748B"
                          style={{ marginBottom: 4 }}
                        />
                        <Text style={styles.emptyRoomsText}>
                          No other rooms with vacancy found in this hostel.
                        </Text>
                      </View>
                    ) : (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.roomsHorizontalScroll}
                      >
                        {availableRooms.map((r) => {
                          const isSelected = selectedRoomId === r.id;
                          return (
                            <TouchableOpacity
                              key={r.id}
                              style={[
                                styles.roomSelectorCard,
                                isSelected && styles.roomSelectorCardActive,
                              ]}
                              onPress={() => setSelectedRoomId(r.id)}
                              activeOpacity={0.8}
                            >
                              <Text
                                style={[
                                  styles.roomSelectorNum,
                                  isSelected && styles.roomSelectorNumActive,
                                ]}
                              >
                                Room {r.roomNumber || r.number}
                              </Text>
                              <Text style={styles.roomSelectorFloor}>
                                Floor {r.floor || "0"}
                              </Text>
                              <View style={styles.vacancyBadge}>
                                <Text style={styles.vacancyText}>
                                  Vacant Space
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}

                    <Text
                      style={[styles.inputLabel, { marginTop: spacing.md }]}
                    >
                      REASON FOR PROPOSAL *
                    </Text>
                    <TextInput
                      style={[styles.input, styles.multiline]}
                      placeholder="Explain your swap preferences (e.g. floor preference, roommate alignment)..."
                      placeholderTextColor="#94A3B8"
                      value={reason}
                      onChangeText={setReason}
                      multiline
                      numberOfLines={3}
                    />

                    <TouchableOpacity
                      style={[
                        styles.primaryBtn,
                        (isSubmitting || !selectedRoomId || !reason.trim()) && {
                          opacity: 0.6,
                        },
                      ]}
                      onPress={handleSwapSubmit}
                      disabled={
                        isSubmitting || !selectedRoomId || !reason.trim()
                      }
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Send
                            size={14}
                            color="#fff"
                            style={{ marginRight: 6 }}
                          />
                          <Text style={styles.primaryBtnText}>
                            SUBMIT SWAP REQUEST
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* History Log */}
                {mySwaps.length > 0 && (
                  <View>
                    <Text style={styles.sectionHeader}>SWAP REQUEST LOGS</Text>
                    {mySwaps.map((s) => {
                      const isApproved = s.status?.toUpperCase() === "APPROVED";
                      const isRejected = s.status?.toUpperCase() === "REJECTED";

                      let badgeBg = "#FFFBEB";
                      let badgeText = "#D97706";
                      if (isApproved) {
                        badgeBg = "#ECFDF5";
                        badgeText = "#10B981";
                      } else if (isRejected) {
                        badgeBg = "#FEE2E2";
                        badgeText = "#EF4444";
                      }

                      const displayRoomNum =
                        s.ToRoom?.roomNumber ||
                        s.toRoom?.roomNumber ||
                        s.toRoom?.number ||
                        "—";

                      return (
                        <View key={s.id} style={styles.historyCard}>
                          <View style={styles.historyHeader}>
                            <Text style={styles.historyTitle}>
                              Room {room.number} ➔ Room {displayRoomNum}
                            </Text>
                            <View
                              style={[
                                styles.statusBadge,
                                { backgroundColor: badgeBg },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  { color: badgeText },
                                ]}
                              >
                                {s.status || "Pending"}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.historyReason}>{s.reason}</Text>
                          <Text style={styles.historyDate}>
                            Logged on{" "}
                            {new Date(s.createdAt).toLocaleDateString("en-PK", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Roommate Detail Modal */}
      <Modal
        visible={!!roommateDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setRoommateDetail(null)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <View style={styles.modalTopHeader}>
            <Text style={styles.modalHeading}>Occupant Profile</Text>
            <TouchableOpacity
              style={styles.modalCloseCircle}
              onPress={() => setRoommateDetail(null)}
            >
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollBody}>
            <View style={styles.modalAvatarContainer}>
              <View style={styles.largeAvatar}>
                <Text style={styles.largeAvatarText}>
                  {roommateDetail?.name?.[0]?.toUpperCase() || "?"}
                </Text>
              </View>
              <Text style={styles.modalProfileName}>
                {roommateDetail?.name}
              </Text>
              <Text style={styles.modalProfileRole}>HMS Roommate</Text>
            </View>

            <View style={styles.profileDetailsCard}>
              <Text style={styles.profileDetailsTitle}>CONTACT INFO</Text>

              <TouchableOpacity
                style={styles.profileRow}
                onPress={() => handleEmail(roommateDetail?.email)}
                activeOpacity={0.6}
              >
                <Mail size={16} color="#64748B" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileLabel}>EMAIL ADDRESS</Text>
                  <Text style={styles.profileVal}>
                    {roommateDetail?.email || "—"}
                  </Text>
                </View>
                <ArrowUpRight size={14} color="#94A3B8" />
              </TouchableOpacity>

              <View style={styles.profileDivider} />

              <TouchableOpacity
                style={styles.profileRow}
                onPress={() => handleCall(roommateDetail?.phone)}
                disabled={!roommateDetail?.phone}
                activeOpacity={0.6}
              >
                <Phone size={16} color="#64748B" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileLabel}>PHONE NUMBER</Text>
                  <Text style={styles.profileVal}>
                    {roommateDetail?.phone || "Not shared"}
                  </Text>
                </View>
                {roommateDetail?.phone && (
                  <ArrowUpRight size={14} color="#94A3B8" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.profileAlertBox}>
              <Info
                size={14}
                color="#3B82F6"
                style={{ marginRight: 8, marginTop: 1 }}
              />
              <Text style={styles.profileAlertText}>
                Contact details are shared only with room occupants to
                coordinate hostel logistics.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  topHeader: {
    backgroundColor: colors.white,
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
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  topHeaderSubtitle: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 1,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  headerBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#059669",
  },

  /* Tabs Segment */
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
    position: "relative",
  },
  tabButtonActive: {
    backgroundColor: "#EFF6FF",
  },
  tabText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#2563EB",
    fontWeight: "800",
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
    position: "absolute",
    right: 12,
    top: 8,
  },

  /* Body Content scroll styles */
  scrollBody: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 40 },

  /* Empty state */
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: spacing.xxl,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  emptyStateDesc: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },

  /* Boarding Pass Ticket */
  boardingPassTicket: {
    backgroundColor: "#312E81", // Rich royal indigo background
    borderRadius: borderRadius.large,
    overflow: "hidden",
    ...shadows.premium,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: spacing.xl,
  },
  ticketLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
  },
  ticketTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  ticketPremiumBadge: {
    backgroundColor: "#3B82F6",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  ticketPremiumBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.white,
  },
  ticketHostel: {
    fontSize: 12,
    color: "#CBD5E1",
    fontWeight: "600",
    marginHorizontal: spacing.xl,
    marginTop: -4,
    marginBottom: spacing.xl,
  },
  ticketDivider: {
    height: 1,
    justifyContent: "center",
    position: "relative",
  },
  ticketDashedLine: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderStyle: "dashed",
    marginHorizontal: spacing.xl,
  },
  ticketLeftCutout: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#F8FAFC",
    position: "absolute",
    left: -7,
    top: -6,
  },
  ticketRightCutout: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#F8FAFC",
    position: "absolute",
    right: -7,
    top: -6,
  },
  ticketStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.xl,
  },
  ticketStatItem: {
    flex: 1,
  },
  ticketStatLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  ticketStatValue: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.white,
    marginTop: 2,
  },

  /* Billing & Payments */
  billingStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  billingStatCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.md,
    ...shadows.premium,
  },
  billingStatIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  billingStatLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  billingStatValue: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  invoicesListCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.lg,
    ...shadows.premium,
    marginBottom: spacing.lg,
  },
  invoicesHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  invoicesListTitle: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
  },
  viewAllBtnText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563EB",
  },
  emptyInvoicesText: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
    paddingVertical: 12,
  },
  invoiceListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  invoiceItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  invoiceItemIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  invoiceItemNote: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  invoiceItemDate: {
    fontSize: 9,
    color: "#94A3B8",
    marginTop: 2,
  },
  invoiceItemRight: {
    alignItems: "flex-end",
  },
  invoiceItemAmount: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E293B",
  },
  invoiceStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 3,
  },
  invoiceStatusPillText: {
    fontSize: 8,
    fontWeight: "800",
  },

  sectionHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },

  /* Premium ID Card styling for roommates tab */
  occupantBadgeCardActive: {
    backgroundColor: "#F8FAFC",
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    overflow: "hidden",
    ...shadows.premium,
    marginBottom: spacing.md,
  },
  occupantBadgeCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    ...shadows.premium,
    marginBottom: spacing.md,
  },
  occupantBadgeLeftStripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: "#2563EB",
  },
  occupantBadgeMainContent: {
    padding: spacing.lg,
    paddingLeft: spacing.xl,
  },
  occupantHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  badgeAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeAvatarText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#475569",
  },
  badgeAvatarTextYou: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.white,
  },
  occupantBadgeName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  occupantBadgeEmail: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  youBadge: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginLeft: 6,
  },
  youBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: colors.white,
  },
  detailChevronBtn: {
    padding: 6,
  },
  badgeDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: spacing.md,
  },
  badgeFooterInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeFooterLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  badgeFooterValue: {
    fontSize: 9,
    fontWeight: "800",
    color: "#475569",
  },
  badgeFooterRowWithActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeFooterActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  badgeActionBtnText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#4F46E5",
  },

  /* Directory Card */
  directoryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.lg,
    ...shadows.premium,
  },
  directoryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  directoryLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  directoryVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  directoryDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: spacing.md,
  },

  /* Roommate Card */
  roommateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.md + 2,
    ...shadows.premium,
    marginBottom: spacing.sm,
  },
  roommateAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  roommateAvatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2563EB",
  },
  roommateName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  roommateEmail: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  roommateActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  roommateActionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },

  /* Empty state & cards */
  emptyCard: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: borderRadius.large,
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
  },

  /* Pending Swap Banner */
  pendingSwapBanner: {
    backgroundColor: "#FFFBEB",
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    padding: spacing.xl,
    ...shadows.premium,
  },
  pendingSwapHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  pendingSwapIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  pendingSwapTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#92400E",
  },
  pendingSwapSubtitle: {
    fontSize: 11,
    color: "#B45309",
    marginTop: 2,
  },
  pendingSwapDetails: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#FCD34D",
    paddingTop: spacing.md,
    gap: 4,
  },
  pendingSwapDetailText: {
    fontSize: 11,
    color: "#78350F",
  },

  /* Form Card & Rooms */
  formCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.lg,
    ...shadows.premium,
  },
  formInstructions: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  emptyRoomsBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: borderRadius.medium,
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyRoomsText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
  },
  roomsHorizontalScroll: {
    gap: spacing.sm,
    paddingBottom: 2,
  },
  roomSelectorCard: {
    width: 100,
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: spacing.md,
    alignItems: "center",
  },
  roomSelectorCardActive: {
    borderColor: "#3B82F6",
    backgroundColor: "#F0F5FF",
  },
  roomSelectorNum: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E293B",
  },
  roomSelectorNumActive: {
    color: "#2563EB",
  },
  roomSelectorFloor: {
    fontSize: 9,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 2,
  },
  vacancyBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  vacancyText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#10B981",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: borderRadius.small,
    height: 44,
    paddingHorizontal: spacing.md,
    fontSize: 13,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
    marginBottom: spacing.md,
  },
  multiline: { height: 74, paddingTop: spacing.sm, textAlignVertical: "top" },
  primaryBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: borderRadius.medium,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  /* History Cards */
  historyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.premium,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  historyReason: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 9,
    color: "#94A3B8",
    fontWeight: "600",
  },

  /* Modal Base Styles */
  modalContent: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  modalTopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: colors.white,
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalCloseCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalScrollBody: {
    padding: spacing.xl,
    paddingBottom: 40,
    gap: spacing.lg,
  },
  modalAvatarContainer: {
    alignItems: "center",
  },
  largeAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#BFDBFE",
    marginBottom: 10,
  },
  largeAvatarText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2563EB",
  },
  modalProfileName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalProfileRole: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 2,
  },
  profileDetailsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.lg,
    ...shadows.premium,
  },
  profileDetailsTitle: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  profileLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  profileVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  profileDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: spacing.md,
  },
  profileAlertBox: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: borderRadius.medium,
    padding: spacing.md,
  },
  profileAlertText: {
    flex: 1,
    fontSize: 10,
    color: "#1E40AF",
    lineHeight: 14,
    fontWeight: "500",
  },

  /* New Room Utilities Styles */
  utilitiesGrid: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  utilityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.md,
    ...shadows.premium,
  },
  utilityIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  utilityName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E293B",
  },
  utilityStatusText: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "600",
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  /* New Rules Guidelines Styles */
  rulesList: {
    gap: spacing.xs,
  },
  ruleCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    ...shadows.premium,
    overflow: "hidden",
  },
  ruleCardExpanded: {
    borderColor: "#E2E8F0",
  },
  ruleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
  },
  ruleIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  ruleTitleText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
  },
  ruleBody: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    padding: spacing.md,
    backgroundColor: "#FAFAFA",
  },
  ruleBodyText: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
    fontWeight: "600",
  },
});
