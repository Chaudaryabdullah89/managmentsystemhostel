import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  StatusBar,
  Animated,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Utensils,
  Coffee,
  Sun,
  Moon,
  MessageSquare,
  Star,
  ThumbsUp,
  ChevronDown,
  X,
  Send,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react-native";
import api from "../../lib/api";
import { colors, spacing, borderRadius, shadows } from "../../lib/theme";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MEAL_TIMES = [
  {
    key: "BREAKFAST",
    label: "Breakfast",
    start: 7,
    end: 11,
    icon: Coffee,
    color: "#D97706",
  },
  {
    key: "LUNCH",
    label: "Lunch",
    start: 11,
    end: 16,
    icon: Sun,
    color: "#2563EB",
  },
  {
    key: "DINNER",
    label: "Dinner",
    start: 18,
    end: 22,
    icon: Moon,
    color: "#4F46E5",
  },
];

const RATING_EMOJIS = [
  { val: 1, emoji: "🤢", label: "Terrible" },
  { val: 2, emoji: "😕", label: "Bad" },
  { val: 3, emoji: "😐", label: "Okay" },
  { val: 4, emoji: "😋", label: "Good" },
  { val: 5, emoji: "😍", label: "Excellent" },
];
/* ─────────── Interactive Animated Rating Emoji Button ─────────── */
function RatingEmojiButton({ emojiObj, isSelected, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isSelected) {
      Animated.spring(scale, {
        toValue: 1.18,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(scale, {
        toValue: 1.0,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [isSelected]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{ flex: 1, marginHorizontal: 3 }}
    >
      <Animated.View
        style={[
          styles.emojiCard,
          isSelected && styles.emojiCardActive,
          { transform: [{ scale }] },
        ]}
      >
        <Text style={styles.emojiText}>{emojiObj.emoji}</Text>
        <Text
          style={[
            styles.emojiLabel,
            isSelected && styles.emojiLabelActive,
          ]}
        >
          {emojiObj.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

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

/* ─────────── Mess Page Skeleton ─────────── */
function MessSkeleton({ insets }) {
  const bg = '#E2E8F0';
  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC', paddingTop: insets?.top || 0 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
        <View style={{ width: 120, height: 16, borderRadius: 6, backgroundColor: bg, marginBottom: 6 }} />
        <View style={{ width: 180, height: 11, borderRadius: 5, backgroundColor: bg }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }} scrollEnabled={false}>
        <PulsingSkeleton>
          {/* Today banner skeleton */}
          <View style={{ borderRadius: 18, backgroundColor: '#C7D2FE', padding: 20, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ width: 90, height: 12, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.4)' }} />
              <View style={{ width: 70, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.4)' }} />
            </View>
            <View style={{ width: '80%', height: 22, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.4)', marginBottom: 16 }} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[1,2,3].map(i => (
                <View key={i} style={{ flex: 1, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.3)' }} />
              ))}
            </View>
          </View>

          {/* Ratings row skeleton */}
          <View style={{ width: 130, height: 11, borderRadius: 5, backgroundColor: bg, marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            {[1,2,3].map(i => (
              <View key={i} style={{ flex: 1, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9', padding: 14, alignItems: 'center', gap: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: bg }} />
                <View style={{ width: 50, height: 10, borderRadius: 5, backgroundColor: bg }} />
                <View style={{ width: 40, height: 14, borderRadius: 6, backgroundColor: bg }} />
                <View style={{ width: 60, height: 9, borderRadius: 4, backgroundColor: bg }} />
              </View>
            ))}
          </View>

          {/* Weekly menu skeleton */}
          <View style={{ width: 140, height: 11, borderRadius: 5, backgroundColor: bg, marginBottom: 12 }} />
          {[1,2,3,4,5].map(i => (
            <View key={i} style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 8, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: bg }} />
                <View style={{ width: 90, height: 12, borderRadius: 5, backgroundColor: bg }} />
              </View>
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: bg }} />
            </View>
          ))}
        </PulsingSkeleton>
      </ScrollView>
    </View>
  );
}

export default function MessScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [expandedDay, setExpandedDay] = useState(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState("LUNCH");

  // Rating states
  const [selectedRating, setSelectedRating] = useState(5);
  const [comments, setComments] = useState("");

  // Entrance animation values
  const bannerFade = useRef(new Animated.Value(0)).current;
  const bannerSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(bannerFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(bannerSlide, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const currentHour = new Date().getHours();

  // Find currently active meal based on time of day
  const activeMeal =
    MEAL_TIMES.find((m) => currentHour >= m.start && currentHour < m.end) ||
    MEAL_TIMES[2];

  /* ─────────── Tanstack Queries ─────────── */
  const {
    data: dashboardData,
    isLoading: loadingDash,
    refetch: refetchDash,
  } = useQuery({
    queryKey: ["guest_dashboard_mess"],
    queryFn: async () => {
      const res = await api.get("/api/guest/dashboard");
      return res.data;
    },
  });

  // Resolve hostelId from dashboard response with multiple fallbacks
  const hostelId =
    dashboardData?.hostelId ||
    dashboardData?.bookings?.[0]?.Room?.Hostel?.id ||
    dashboardData?.bookings?.[0]?.Room?.hostelId ||
    null;

  const {
    data: messData,
    isLoading: loadingMess,
    refetch: refetchMess,
  } = useQuery({
    queryKey: ["mess_menus"],
    queryFn: async () => {
      const res = await api.get("/api/mess");
      return res.data?.data || [];
    },
  });

  const {
    data: feedbackData,
    isLoading: loadingFeedback,
    refetch: refetchFeedback,
  } = useQuery({
    queryKey: ["mess_feedback", hostelId],
    queryFn: async () => {
      const res = await api.get(
        `/api/guest/mess/feedback?hostelId=${hostelId}`,
      );
      return res.data;
    },
    enabled: !!hostelId,
  });

  const { mutate: submitFeedback, isPending: submittingFeedback } = useMutation(
    {
      mutationFn: (payload) => api.post("/api/guest/mess/feedback", payload),
      onSuccess: () => {
        Alert.alert("Feedback Submitted", "Thank you for rating the food!");
        setComments("");
        setSelectedRating(5);
        setRatingModalVisible(false);
        qc.invalidateQueries(["mess_feedback", hostelId]);
      },
      onError: (err) => {
        Alert.alert(
          "Submission Failed",
          err.response?.data?.error || "Failed to submit rating.",
        );
      },
    },
  );

  const handleRefreshAll = async () => {
    await Promise.all([refetchDash(), refetchMess(), refetchFeedback()]);
  };

  const handleRatingSubmit = () => {
    if (!hostelId)
      return Alert.alert("Error", "No assigned hostel found for your account.");
    submitFeedback({
      hostelId,
      mealType: selectedMealType,
      rating: selectedRating,
      comments: comments.trim(),
    });
  };

  const toggleDayExpand = (day) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDay(expandedDay === day ? null : day);
  };

  const todayDayName = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ][new Date().getDay()];
  const todayMenu = messData?.find((m) => m.dayOfWeek === todayDayName) || {};

  const averageStats = feedbackData?.averages || {
    BREAKFAST: { avg: 0, count: 0 },
    LUNCH: { avg: 0, count: 0 },
    DINNER: { avg: 0, count: 0 },
  };

  const recentFeedbacks = feedbackData?.feedbacks || [];

  const isInitialLoading = (loadingDash || loadingMess) && !messData;

  if (isInitialLoading) {
    return <MessSkeleton insets={insets} />;
  }

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header bar */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderContent}>
          <View>
            <Text style={styles.topHeaderTitle}>Mess & Dining</Text>
            <Text style={styles.topHeaderSubtitle}>
              Daily Menu & Culinary Ratings
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={loadingDash || loadingMess || loadingFeedback}
            onRefresh={handleRefreshAll}
            tintColor={colors.primary}
          />
        }
      >
        {/* Today's Serving Banner Card (Animated) */}
        <Animated.View
          style={{
            opacity: bannerFade,
            transform: [{ translateY: bannerSlide }],
          }}
        >
          <View style={styles.todayBanner}>
            <View style={styles.bannerHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Clock size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.bannerSubtitleText}>SERVING NOW</Text>
              </View>
              <View style={styles.bannerActiveBadge}>
                <Text style={styles.bannerActiveBadgeText}>
                  {activeMeal.label}
                </Text>
              </View>
            </View>

            <Text style={styles.bannerMealTitle}>
              {todayMenu[activeMeal.key.toLowerCase()] ||
                "Check Notice Board / Serving Counter"}
            </Text>

            <View style={styles.bannerDivider} />

            <View style={styles.bannerQuickDetailsRow}>
              {MEAL_TIMES.map((m) => {
                const isCurrent = m.key === activeMeal.key;
                const MealIcon = m.icon;
                return (
                  <View
                    key={m.key}
                    style={[
                      styles.quickMealItem,
                      isCurrent && styles.quickMealItemActive,
                    ]}
                  >
                    <MealIcon
                      size={16}
                      color={isCurrent ? "#FFF" : "rgba(255,255,255,0.6)"}
                    />
                    <Text
                      style={[
                        styles.quickMealText,
                        isCurrent && styles.quickMealTextActive,
                      ]}
                    >
                      {m.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* Meal rating stats row */}
        <Text style={styles.sectionTitle}>CATERING RATINGS</Text>
        <View style={styles.ratingsRow}>
          {MEAL_TIMES.map((m) => {
            const stat = averageStats[m.key] || { avg: 0, count: 0 };
            return (
              <TouchableOpacity
                key={m.key}
                style={styles.ratingStatCard}
                onPress={() => {
                  setSelectedMealType(m.key);
                  setRatingModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.ratingIconBox,
                    { backgroundColor: m.color + "15" },
                  ]}
                >
                  <Utensils size={18} color={m.color} />
                </View>
                <Text style={styles.ratingMealLabel}>{m.label}</Text>
                <View style={styles.starsRow}>
                  <Star
                    size={13}
                    color="#FBBC05"
                    fill="#FBBC05"
                    style={{ marginRight: 3 }}
                  />
                  <Text style={styles.ratingAvgVal}>
                    {stat.avg > 0 ? stat.avg : "—"}
                  </Text>
                </View>
                <Text style={styles.ratingCountText}>
                  {stat.count} responses
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Weekly Menu Accordion */}
        <Text style={styles.sectionTitle}>WEEKLY DINING MENU</Text>
        {loadingMess && messData?.length === 0 ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginVertical: 20 }}
          />
        ) : (
          <View style={styles.accordionContainer}>
            {[
              "MONDAY",
              "TUESDAY",
              "WEDNESDAY",
              "THURSDAY",
              "FRIDAY",
              "SATURDAY",
              "SUNDAY",
            ].map((day) => {
              const menuRecord =
                messData?.find((m) => m.dayOfWeek === day) || {};
              const isToday = day === todayDayName;
              const isExpanded = expandedDay === day;

              return (
                <View
                  key={day}
                  style={[
                    styles.accordionCard,
                    isToday && styles.accordionCardToday,
                    isExpanded && styles.accordionCardExpanded,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.accordionHeader}
                    onPress={() => toggleDayExpand(day)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Calendar
                        size={16}
                        color={isToday ? "#2563EB" : "#64748B"}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={[
                          styles.accordionDayText,
                          isToday && styles.accordionDayTextToday,
                        ]}
                      >
                        {day}
                      </Text>
                      {isToday && (
                        <View style={styles.todayBadge}>
                          <Text style={styles.todayBadgeText}>TODAY</Text>
                        </View>
                      )}
                    </View>
                    <ChevronDown
                      size={16}
                      color="#94A3B8"
                      style={{
                        transform: [{ rotate: isExpanded ? "180deg" : "0deg" }],
                      }}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.accordionBody}>
                      {MEAL_TIMES.map((m) => {
                        const menuVal = menuRecord[m.key.toLowerCase()];
                        const MealIcon = m.icon;
                        return (
                          <View key={m.key} style={styles.menuDetailRow}>
                            <View
                              style={[
                                styles.menuDetailIconBox,
                                { backgroundColor: m.color + "10" },
                              ]}
                            >
                              <MealIcon size={16} color={m.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.menuDetailLabel}>
                                {m.label}
                              </Text>
                              <Text style={styles.menuDetailText}>
                                {menuVal ||
                                  "Not scheduled / Warden update pending"}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Recent feedbacks review */}
        {recentFeedbacks.length > 0 && (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={styles.sectionTitle}>RECENT GUEST REVIEWS</Text>
            {recentFeedbacks.slice(0, 3).map((f) => (
              <View key={f.id} style={styles.feedbackItemCard}>
                <View style={styles.feedbackItemHeader}>
                  <Text style={styles.reviewerName}>
                    {f.User?.name || "Resident"}
                  </Text>
                  <View style={styles.reviewerRating}>
                    <Star
                      size={12}
                      color="#FBBC05"
                      fill="#FBBC05"
                      style={{ marginRight: 2 }}
                    />
                    <Text style={styles.reviewerRatingText}>{f.rating}/5</Text>
                  </View>
                </View>
                <Text style={styles.feedbackItemMealLabel}>{f.mealType}</Text>
                {f.comments && (
                  <Text style={styles.feedbackItemComments}>
                    "{f.comments}"
                  </Text>
                )}
                <Text style={styles.feedbackItemDate}>
                  {new Date(f.createdAt).toLocaleDateString("en-PK", {
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Culinary Feedback Submission Drawer Modal */}
      <Modal
        visible={ratingModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <View style={styles.modalTopHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Sparkles
                size={18}
                color={colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.modalHeading}>Submit Dining Review</Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseCircle}
              onPress={() => setRatingModalVisible(false)}
            >
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
            <Text style={styles.sectionHeader}>Meal Selection</Text>
            <View style={styles.mealSegmentRow}>
              {MEAL_TIMES.map((m) => {
                const isSelected = selectedMealType === m.key;
                return (
                  <TouchableOpacity
                    key={m.key}
                    style={[
                      styles.segmentBtn,
                      isSelected && styles.segmentBtnActive,
                    ]}
                    onPress={() => setSelectedMealType(m.key)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.segmentBtnText,
                        isSelected && styles.segmentBtnTextActive,
                      ]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
              Rate Today's Quality
            </Text>
            <View style={styles.emojiGrid}>
              {RATING_EMOJIS.map((emojiObj) => (
                <RatingEmojiButton
                  key={emojiObj.val}
                  emojiObj={emojiObj}
                  isSelected={selectedRating === emojiObj.val}
                  onPress={() => setSelectedRating(emojiObj.val)}
                />
              ))}
            </View>

            <Text style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
              Optional Comments
            </Text>
            <View style={styles.commentsForm}>
              <TextInput
                style={styles.commentsInput}
                placeholder="How was the taste, hotness, or cleanliness? Provide details..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={comments}
                onChangeText={setComments}
              />

              <TouchableOpacity
                style={[
                  styles.submitRatingBtn,
                  submittingFeedback && { opacity: 0.6 },
                ]}
                onPress={handleRatingSubmit}
                disabled={submittingFeedback}
              >
                {submittingFeedback ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <ThumbsUp
                      size={16}
                      color="#FFF"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.submitRatingBtnText}>
                      Submit Culinary Feedback
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
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
  container: { flex: 1 },
  contentContainer: { padding: spacing.lg, paddingBottom: 40 },

  /* Today Serving Banner */
  todayBanner: {
    backgroundColor: "#1E293B", // dark slate
    borderRadius: borderRadius.large,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.premium,
  },
  bannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  bannerSubtitleText: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1.5,
  },
  bannerActiveBadge: {
    backgroundColor: "#2563EB", // indigo
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bannerActiveBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  bannerMealTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFF",
    lineHeight: 28,
  },
  bannerDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: spacing.md + 2,
  },
  bannerQuickDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickMealItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  quickMealItemActive: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  quickMealText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    marginLeft: 6,
  },
  quickMealTextActive: {
    color: "#FFF",
    fontWeight: "900",
  },

  /* Section Title */
  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 1.2,
    marginBottom: spacing.sm + 2,
    marginTop: spacing.md,
    textTransform: "uppercase",
  },

  /* Ratings Row */
  ratingsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  ratingStatCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.md,
    alignItems: "center",
    ...shadows.premium,
  },
  ratingIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  ratingMealLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  ratingAvgVal: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1E293B",
  },
  ratingCountText: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
    marginTop: 2,
  },

  /* Accordion Week */
  accordionContainer: {
    gap: spacing.xs,
  },
  accordionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    ...shadows.premium,
    overflow: "hidden",
  },
  accordionCardToday: {
    borderColor: "#BFDBFE",
    backgroundColor: "#F0F6FF",
  },
  accordionCardExpanded: {
    borderColor: "#E2E8F0",
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md + 2,
  },
  accordionDayText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  accordionDayTextToday: {
    color: "#2563EB",
    fontWeight: "900",
  },
  todayBadge: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  todayBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "900",
  },
  accordionBody: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: "#FAFAFA",
  },
  menuDetailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  menuDetailIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 2,
  },
  menuDetailLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  menuDetailText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "700",
    marginTop: 1,
    lineHeight: 18,
  },

  /* Reviews Items */
  feedbackItemCard: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    borderRadius: borderRadius.medium,
    padding: spacing.md + 2,
    marginBottom: spacing.xs,
    ...shadows.premium,
  },
  feedbackItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
  },
  reviewerRating: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  reviewerRatingText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#B45309",
  },
  feedbackItemMealLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 2,
  },
  feedbackItemComments: {
    fontSize: 13,
    color: "#475569",
    fontStyle: "italic",
    marginTop: 6,
    lineHeight: 18,
  },
  feedbackItemDate: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
    marginTop: 6,
  },

  /* Modal Base styles */
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
    fontSize: 17,
    fontWeight: "900",
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

  /* Meal selection inside modal */
  mealSegmentRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: colors.white,
    ...shadows.premium,
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  segmentBtnTextActive: {
    color: "#2563EB",
    fontWeight: "900",
  },

  /* Emojis selector */
  emojiGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  emojiCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - 24) / 5,
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    paddingVertical: spacing.sm,
    alignItems: "center",
    ...shadows.premium,
  },
  emojiCardActive: {
    borderColor: "#3B82F6",
    backgroundColor: "#F0F5FF",
  },
  emojiText: {
    fontSize: 28,
    marginBottom: 4,
  },
  emojiLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
  },
  emojiLabelActive: {
    color: "#2563EB",
    fontWeight: "900",
  },

  /* Comments & submit btn */
  commentsForm: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    borderRadius: borderRadius.large,
    padding: spacing.lg,
    ...shadows.premium,
  },
  commentsInput: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: borderRadius.small,
    height: 80,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    fontSize: 13,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
    marginBottom: spacing.md,
    textAlignVertical: "top",
  },
  submitRatingBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: borderRadius.small,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  submitRatingBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
