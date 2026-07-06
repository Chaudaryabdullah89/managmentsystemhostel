import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Modal,
  TextInput,
  Animated,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Calendar,
  Building,
  CalendarDays,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  Info,
  RefreshCw,
  X,
  Send,
} from "lucide-react-native";
import api from "../../lib/api";
import { router } from "expo-router";
import { colors, spacing, borderRadius, shadows } from "../../lib/theme";

const STATUS_META = {
  CONFIRMED: { bg: "#ECFDF5", text: "#059669", label: "Confirmed" },
  CHECKED_IN: { bg: "#EFF6FF", text: "#2563EB", label: "Checked In" },
  PENDING: { bg: "#FFFBEB", text: "#D97706", label: "Pending Approval" },
  CANCELLED: { bg: "#FEF2F2", text: "#DC2626", label: "Cancelled" },
  CHECKED_OUT: { bg: "#F3F4F6", text: "#4B5563", label: "Checked Out" },
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status?.toUpperCase()] || {
    bg: "#F3F4F6",
    text: "#374151",
    label: status || "—",
  };
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[styles.badgeText, { color: meta.text }]}>{meta.label}</Text>
    </View>
  );
};

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

function BookingsSkeleton({ insets }) {
  const bg = '#E2E8F0';
  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC', paddingTop: insets?.top || 0 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
        <View style={{ width: 140, height: 16, borderRadius: 6, backgroundColor: bg, marginBottom: 6 }} />
        <View style={{ width: 200, height: 11, borderRadius: 5, backgroundColor: bg }} />
      </View>
      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 14 }}>
        {[1,2,3].map(i => (
          <View key={i} style={{ flex: 1, height: 70, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9' }} />
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }} scrollEnabled={false}>
        <PulsingSkeleton>
          {[1,2,3].map(i => (
            <View key={i} style={{ backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9', padding: 18, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
                <View style={{ gap: 8 }}>
                  <View style={{ width: 120, height: 13, borderRadius: 5, backgroundColor: bg }} />
                  <View style={{ width: 80, height: 10, borderRadius: 4, backgroundColor: bg }} />
                </View>
                <View style={{ width: 70, height: 26, borderRadius: 10, backgroundColor: bg }} />
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {[1,2].map(j => (
                  <View key={j} style={{ flex: 1, height: 54, borderRadius: 12, backgroundColor: bg }} />
                ))}
              </View>
              <View style={{ width: '70%', height: 9, borderRadius: 4, backgroundColor: bg }} />
            </View>
          ))}
        </PulsingSkeleton>
      </ScrollView>
    </View>
  );
}

export default function ResidentBookings() {
  const insets = useSafeAreaInsets();
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["resident_bookings_list"],
    queryFn: async () => {
      const res = await api.get("/api/guest/dashboard");
      return res.data;
    },
  });

  const { data: swapsData, refetch: refetchSwaps } = useQuery({
    queryKey: ["resident_room_swaps"],
    queryFn: async () => {
      const res = await api.get("/api/guest/room-swap");
      return res.data;
    },
  });

  const rawBookings = data?.bookings || data?.data || [];
  const bookings = rawBookings.map((b) => ({
    ...b,
    room: { number: b.Room?.roomNumber || b.room?.number || "—" },
    hostel: b.Room?.Hostel || b.hostel,
    amount: b.totalAmount || b.amount || 0,
  }));

  const swapRequests = swapsData?.requests || [];

  const activeCount = bookings.filter(
    (b) => b.status?.toUpperCase() === "CONFIRMED" || b.status?.toUpperCase() === "CHECKED_IN"
  ).length;
  const pendingCount = bookings.filter((b) => b.status?.toUpperCase() === "PENDING").length;

  const getDaysCount = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const diffTime = Math.abs(new Date(checkOut) - new Date(checkIn));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleRefreshAll = async () => {
    await Promise.all([refetch(), refetchSwaps()]);
  };

  if (isLoading && bookings.length === 0) {
    return <BookingsSkeleton insets={insets} />;
  }

  if (isError && bookings.length === 0) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <ShieldAlert size={48} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text style={styles.errorTitle}>Failed to Load Bookings</Text>
        <Text style={styles.errorSubtitle}>
          {error?.message || "Please check your network and try again."}
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header Bar */}
      <View style={[styles.topHeader, { paddingTop: insets.top, height: 56 + insets.top }]}>
        <View style={styles.topHeaderContent}>
          <Text style={styles.topHeaderTitle}>My Bookings</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace("/(resident)/home")}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefreshAll}
            tintColor={colors.primary}
          />
        }
      >
        {/* Analytics Statistics Panel */}
        <View style={styles.analyticsPanel}>
          <View style={styles.statCell}>
            <View style={[styles.statIconBox, { backgroundColor: "#ECFDF5" }]}>
              <CheckCircle2 size={16} color="#059669" />
            </View>
            <View>
              <Text style={styles.statNumber}>{activeCount}</Text>
              <Text style={styles.statLabel}>Active Stay</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <View style={[styles.statIconBox, { backgroundColor: "#FFFBEB" }]}>
              <Clock size={16} color="#D97706" />
            </View>
            <View>
              <Text style={styles.statNumber}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <View style={[styles.statIconBox, { backgroundColor: "#EFF6FF" }]}>
              <Calendar size={16} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.statNumber}>{bookings.length}</Text>
              <Text style={styles.statLabel}>Total Booked</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Residency Timeline & Bookings</Text>

        {bookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Info size={32} color="#94A3B8" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTextTitle}>No Bookings Found</Text>
            <Text style={styles.emptyTextSubtitle}>
              You don't have any hostel bookings registered under your profile.
            </Text>
          </View>
        ) : (
          bookings.map((b) => {
            const stayNights = getDaysCount(b.checkIn, b.checkOut);
            const isConfirmedOrCheckedIn =
              b.status?.toUpperCase() === "CONFIRMED" ||
              b.status?.toUpperCase() === "CHECKED_IN";
            return (
              <View key={b.id} style={styles.bookingCard}>
                {/* Header Row */}
                <View style={styles.bookingCardHeader}>
                  <View>
                    <Text style={styles.roomLabel}>
                      ROOM {b.room?.number || "—"}
                    </Text>
                    <View style={styles.hostelRow}>
                      <Building size={12} color="#64748B" style={{ marginRight: 4 }} />
                      <Text style={styles.hostelName}>
                        {b.hostel?.name || "HMS Hostel"}
                      </Text>
                    </View>
                  </View>
                  <StatusBadge status={b.status} />
                </View>

                {/* Boarding Pass Dates Split Layout */}
                <View style={styles.boardingPassDivider}>
                  <View style={styles.dashedLine} />
                  <View style={styles.leftCutout} />
                  <View style={styles.rightCutout} />
                </View>

                <View style={styles.datesGrid}>
                  <View style={styles.dateBlock}>
                    <Text style={styles.dateBlockHeader}>CHECK-IN</Text>
                    <Text style={styles.dateBlockVal}>
                      {b.checkIn
                        ? new Date(b.checkIn).toLocaleDateString("en-PK", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </Text>
                  </View>
                  <View style={styles.verticalBorder} />
                  <View style={[styles.dateBlock, { alignItems: "flex-end" }]}>
                    <Text style={styles.dateBlockHeader}>CHECK-OUT</Text>
                    <Text style={styles.dateBlockVal}>
                      {b.checkOut
                        ? new Date(b.checkOut).toLocaleDateString("en-PK", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </Text>
                  </View>
                </View>

                {/* Optional stay information duration */}
                {stayNights > 0 && (
                  <View style={styles.stayNightsWrapper}>
                    <CalendarDays size={12} color="#4F46E5" style={{ marginRight: 6 }} />
                    <Text style={styles.stayNightsText}>
                      Stay Duration: <Text style={{ fontWeight: "700" }}>{stayNights} Nights</Text>
                    </Text>
                  </View>
                )}

                {/* Total Billing Footer */}
                <View style={styles.amountBreakdown}>
                  <View>
                    <Text style={styles.amountLabel}>Total Fees</Text>
                    <Text style={styles.amountVal}>
                      PKR {b.amount.toLocaleString()}
                    </Text>
                  </View>
                  {b.status?.toUpperCase() === "PENDING" ? (
                    <TouchableOpacity
                      style={styles.payNowIndicator}
                      onPress={() => router.push("/(resident)/payments")}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.payNowIndicatorText}>View Invoice</Text>
                      <ArrowUpRight size={10} color="#4F46E5" style={{ marginLeft: 3 }} />
                    </TouchableOpacity>
                  ) : (
                    isConfirmedOrCheckedIn && (
                      <TouchableOpacity
                        style={styles.swapBtn}
                        onPress={() => {
                          setSelectedBooking(b);
                          setSwapModalVisible(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <RefreshCw size={12} color="#4F46E5" style={{ marginRight: 4 }} />
                        <Text style={styles.swapBtnText}>Request Swap</Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            );
          })
        )}

        {/* Room Swap Requests Section */}
        {swapRequests.length > 0 && (
          <View style={{ marginTop: spacing.xl }}>
            <Text style={styles.sectionTitle}>Room Swap Requests</Text>
            {swapRequests.map((s) => {
              const statusUpper = s.status?.toUpperCase() || "PENDING";
              const isApproved = statusUpper === "APPROVED";
              const isRejected = statusUpper === "REJECTED";
              let badgeColor = "#FFFBEB";
              let textColor = "#D97706";
              if (isApproved) {
                badgeColor = "#ECFDF5";
                textColor = "#059669";
              } else if (isRejected) {
                badgeColor = "#FEF2F2";
                textColor = "#DC2626";
              }

              return (
                <View key={s.id} style={styles.swapRequestCard}>
                  <View style={styles.swapRequestHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <RefreshCw size={14} color="#64748B" style={{ marginRight: 6 }} />
                      <Text style={styles.swapRequestTitle}>
                        Room {s.FromRoom?.roomNumber || "—"} → Room {s.ToRoom?.roomNumber || "—"}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                      <Text style={[styles.badgeText, { color: textColor }]}>
                        {statusUpper}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.swapRequestReason}>
                    Reason: {s.reason || "No reason provided."}
                  </Text>
                  <Text style={styles.swapRequestDate}>
                    Requested on:{" "}
                    {s.createdAt
                      ? new Date(s.createdAt).toLocaleDateString("en-PK", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Room Swap Modal */}
      <RoomSwapModal
        visible={swapModalVisible}
        onClose={() => {
          setSwapModalVisible(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onSubmitted={handleRefreshAll}
      />
    </View>
  );
}

function RoomSwapModal({ visible, onClose, booking, onSubmitted }) {
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hostelId = booking?.Room?.hostelId || booking?.hostel?.hostelId || booking?.hostelId;
  const currentRoomId = booking?.Room?.id || booking?.roomId;

  const { data: roomsRes, isLoading: loadingRooms } = useQuery({
    queryKey: ["hostel_rooms", hostelId],
    queryFn: async () => {
      const res = await api.get(`/api/rooms/roombyhostel?hostelId=${hostelId}`);
      return res.data;
    },
    enabled: visible && !!hostelId,
  });

  const rooms = roomsRes?.data || [];
  const eligibleRooms = rooms.filter(
    (r) => r.id !== currentRoomId && (r.Booking?.length || 0) < r.capacity
  );

  const handleSubmit = async () => {
    if (!selectedRoomId) {
      import("react-native").then(({ Alert }) => {
        Alert.alert("Selection Required", "Please select a destination room.");
      });
      return;
    }
    if (!reason.trim()) {
      import("react-native").then(({ Alert }) => {
        Alert.alert("Reason Required", "Please specify a reason for the swap.");
      });
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/api/guest/room-swap", {
        toRoomId: selectedRoomId,
        reason: reason.trim(),
      });
      import("react-native").then(({ Alert }) => {
        Alert.alert("Success", "Room swap request submitted successfully!");
      });
      onSubmitted();
      onClose();
      setSelectedRoomId("");
      setReason("");
    } catch (err) {
      import("react-native").then(({ Alert }) => {
        Alert.alert(
          "Error",
          err?.response?.data?.error || "Failed to process room swap request."
        );
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleContainer}>
            <RefreshCw
              size={18}
              color={colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.modalTitle}>Request Room Swap</Text>
          </View>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={16} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Current Room Details</Text>
          <View style={styles.currentRoomCard}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Building size={16} color="#475569" style={{ marginRight: 8 }} />
              <Text style={styles.currentRoomText}>
                Room {booking?.room?.number || "—"} ({booking?.hostel?.name || "HMS Hostel"})
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
            Select Destination Room
          </Text>

          {loadingRooms ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : eligibleRooms.length === 0 ? (
            <View style={styles.emptyEligibleRoomsBox}>
              <Info size={20} color="#94A3B8" style={{ marginBottom: 6 }} />
              <Text style={styles.emptyEligibleRoomsText}>
                No other available rooms with vacant beds in this hostel.
              </Text>
            </View>
          ) : (
            <View style={styles.roomsListWrapper}>
              {eligibleRooms.map((room) => {
                const isSelected = selectedRoomId === room.id;
                const activeBeds = room.Booking?.length || 0;
                return (
                  <TouchableOpacity
                    key={room.id}
                    style={[
                      styles.roomSelectCard,
                      isSelected && styles.roomSelectCardActive,
                    ]}
                    onPress={() => setSelectedRoomId(room.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.roomSelectHeader}>
                      <Text
                        style={[
                          styles.roomSelectNumber,
                          isSelected && styles.roomSelectNumberActive,
                        ]}
                      >
                        Room {room.roomNumber}
                      </Text>
                      <View
                        style={[
                          styles.roomOccupancyBadge,
                          isSelected && { backgroundColor: "#EEF2FF" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.roomOccupancyText,
                            isSelected && { color: "#4F46E5" },
                          ]}
                        >
                          {activeBeds}/{room.capacity} occupied
                        </Text>
                      </View>
                    </View>
                    <View style={styles.roomSelectSubRow}>
                      <Text style={styles.roomSelectType}>{room.type}</Text>
                      <Text style={styles.roomSelectPrice}>
                        PKR {room.price?.toLocaleString() || 0}/mo
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
            Reason for Swap
          </Text>
          <View style={styles.formCard}>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Provide a brief explanation (e.g. want to live with a friend, room issue)"
              placeholderTextColor={colors.textPlaceholder}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                (submitting || !selectedRoomId || !reason.trim()) && { opacity: 0.6 },
              ]}
              onPress={handleSubmit}
              disabled={submitting || !selectedRoomId || !reason.trim()}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Send size={14} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.primaryBtnText}>SUBMIT REQUEST</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  contentContainer: { padding: spacing.lg, paddingBottom: 40 },

  /* Top Custom Header bar styles */
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
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },

  /* Analytics Panels */
  analyticsPanel: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: spacing.xl,
    ...shadows.premium,
  },
  statCell: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#E2E8F0",
  },

  /* Section Title */
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 1.5,
    marginBottom: spacing.md,
    textTransform: "uppercase",
  },

  /* Booking Card */
  bookingCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    marginBottom: spacing.md,
    ...shadows.premium,
    position: "relative",
    overflow: "hidden",
  },
  bookingCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: spacing.lg,
  },
  roomLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  hostelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  hostelName: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  /* Boarding pass split line decorations */
  boardingPassDivider: {
    height: 1,
    justifyContent: "center",
    position: "relative",
  },
  dashedLine: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    marginHorizontal: spacing.lg,
  },
  leftCutout: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#F8FAFC",
    position: "absolute",
    left: -6,
    top: -5,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
  },
  rightCutout: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#F8FAFC",
    position: "absolute",
    right: -6,
    top: -5,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
  },

  /* Dates Grid block */
  datesGrid: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateBlock: {
    flex: 1,
  },
  dateBlockHeader: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  dateBlockVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  verticalBorder: {
    width: 1,
    height: 32,
    backgroundColor: "#F1F5F9",
    marginHorizontal: spacing.md,
  },

  /* Stay nights indicator wrapper */
  stayNightsWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    marginHorizontal: spacing.lg,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: spacing.md,
  },
  stayNightsText: {
    fontSize: 10,
    color: "#4F46E5",
    fontWeight: "600",
  },

  /* Card breakdown billing footer */
  amountBreakdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: "#FAFAFA",
  },
  amountLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amountVal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#4F46E5",
    marginTop: 2,
  },
  payNowIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  payNowIndicatorText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#4F46E5",
  },

  /* Badge capsule */
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  /* Loading & Error */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryBtnText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 13,
  },

  /* Empty state details */
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.xxl,
    alignItems: "center",
    ...shadows.premium,
  },
  emptyTextTitle: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "700",
    marginBottom: 4,
  },
  emptyTextSubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
  swapBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  swapBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563EB",
  },
  swapRequestCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.premium,
  },
  swapRequestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  swapRequestTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  swapRequestReason: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 6,
  },
  swapRequestDate: {
    fontSize: 9,
    color: "#94A3B8",
    fontWeight: "600",
  },

  /* Modal Base styles */
  modalContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: colors.white,
  },
  modalTitleContainer: { flexDirection: "row", alignItems: "center" },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Current Room details */
  currentRoomCard: {
    backgroundColor: "#EEF2F6",
    borderRadius: borderRadius.medium,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: spacing.xs,
  },
  currentRoomText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },

  /* Destination selector style */
  roomsListWrapper: {
    gap: spacing.sm,
  },
  roomSelectCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.lg,
    ...shadows.premium,
  },
  roomSelectCardActive: {
    borderColor: "#3B82F6",
    backgroundColor: "#F0F5FF",
  },
  roomSelectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  roomSelectNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  roomSelectNumberActive: {
    color: "#2563EB",
  },
  roomOccupancyBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roomOccupancyText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
  },
  roomSelectSubRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  roomSelectType: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  roomSelectPrice: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "700",
  },

  /* Form & Primary buttons */
  formCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.lg,
    ...shadows.premium,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: borderRadius.small,
    height: 46,
    paddingHorizontal: spacing.md,
    fontSize: 13,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
    marginBottom: spacing.md,
  },
  multiline: { height: 80, paddingTop: spacing.sm, textAlignVertical: "top" },
  primaryBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: borderRadius.small,
    height: 46,
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

  /* Empty rooms text */
  emptyEligibleRoomsBox: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.xl,
    alignItems: "center",
    ...shadows.premium,
  },
  emptyEligibleRoomsText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 16,
  },
});
