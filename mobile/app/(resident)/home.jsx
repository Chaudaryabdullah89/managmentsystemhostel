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
  Alert,
  TextInput,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Platform,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Plane,
  MessageSquare,
  Bell,
  User,
  Bed,
  Building,
  ChevronRight,
  Send,
  AlertTriangle,
  Clock,
  Info,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  CreditCard,
  ExternalLink,
  CalendarDays,
  UserCheck,
  HelpCircle,
  Search,
  ChevronDown,
  X,
  Sparkles,
  Wifi,
} from "lucide-react-native";
import api from "../../lib/api";
import { router, useLocalSearchParams } from "expo-router";
import { colors, spacing, borderRadius, shadows } from "../../lib/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/* ─────────────────────────── status helpers ─────────────────────────── */
const STATUS_META = {
  CONFIRMED: { bg: "#EFF6FF", text: colors.primary, label: "Confirmed" },
  CHECKED_IN: { bg: "#ECFDF5", text: colors.success, label: "Checked In" },
  PENDING: { bg: "#FFFBEB", text: "#D97706", label: "Pending" },
  CANCELLED: { bg: "#FEF2F2", text: colors.danger, label: "Cancelled" },
  CHECKED_OUT: { bg: "#F3F4F6", text: "#6B7280", label: "Checked Out" },
  RESOLVED: { bg: "#ECFDF5", text: colors.success, label: "Resolved" },
  IN_PROGRESS: { bg: "#EFF6FF", text: colors.primary, label: "In Progress" },
  APPROVED: { bg: "#ECFDF5", text: colors.success, label: "Approved" },
  REJECTED: { bg: "#FEF2F2", text: colors.danger, label: "Rejected" },
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

/* ─────────────────────────── Pulsing Animation ─────────────────────────── */
function PulsingDot() {
  const pulseAnim = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#10B981", // emerald 500
        opacity: pulseAnim,
        transform: [
          {
            scale: pulseAnim.interpolate({
              inputRange: [0.4, 1],
              outputRange: [0.9, 1.2],
            }),
          },
        ],
      }}
    />
  );
}

/* ─────────────────────────── Mess Menu Today ─────────────────────────── */
function MessMenuWidget({ messMenus, isLoading }) {
  const currentHour = new Date().getHours();

  const getActiveMealIndex = () => {
    if (currentHour >= 5 && currentHour < 11) return 0; // Breakfast
    if (currentHour >= 11 && currentHour < 17) return 1; // Lunch
    return 2; // Dinner
  };

  const activeIndex = getActiveMealIndex();

  const DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const todayDayName = DAYS[new Date().getDay()];
  const todayMenu =
    messMenus?.find(
      (m) => m.dayOfWeek?.toUpperCase() === todayDayName.toUpperCase()
    ) || {};

  const meals = [
    {
      name: "Breakfast",
      time: "08:00 AM - 10:00 AM",
      menu: todayMenu.breakfast || "Not Scheduled",
    },
    {
      name: "Lunch",
      time: "01:00 PM - 03:00 PM",
      menu: todayMenu.lunch || "Not Scheduled",
    },
    {
      name: "Dinner",
      time: "08:00 PM - 10:00 PM",
      menu: todayMenu.dinner || "Not Scheduled",
    },
  ];

  return (
    <View style={styles.messWidgetContainer}>
      <Text style={styles.sectionTitle}>TODAY'S MESS SCHEDULE</Text>
      <View style={styles.messCard}>
        {isLoading ? (
          <PulsingSkeleton style={{ padding: 14, gap: 14 }}>
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
                >
                  <View
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      backgroundColor: "#E2E8F0",
                    }}
                  />
                  <View style={{ gap: 4 }}>
                    <View
                      style={{
                        width: 60,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: "#E2E8F0",
                      }}
                    />
                    <View
                      style={{
                        width: 100,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#E2E8F0",
                      }}
                    />
                  </View>
                </View>
                <View
                  style={{
                    width: 80,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: "#E2E8F0",
                  }}
                />
              </View>
            ))}
          </PulsingSkeleton>
        ) : (
          meals.map((meal, index) => {
            const isActive = index === activeIndex;
            return (
              <View
                key={index}
                style={[styles.mealRow, isActive && styles.mealRowActive]}
              >
                <View style={styles.mealLeft}>
                  <View
                    style={[
                      styles.mealIconWrapper,
                      isActive && styles.mealIconWrapperActive,
                    ]}
                  >
                    {isActive ? (
                      <PulsingDot />
                    ) : (
                      <View style={styles.inactiveDot} />
                    )}
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text
                        style={[
                          styles.mealName,
                          isActive && styles.mealNameActive,
                        ]}
                      >
                        {meal.name}
                      </Text>
                      {isActive && (
                        <View style={styles.activeTag}>
                          <Text style={styles.activeTagText}>SERVING NOW</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.mealTime}>{meal.time}</Text>
                  </View>
                </View>
                <View style={styles.mealRight}>
                  <Text
                    style={[styles.mealMenu, isActive && styles.mealMenuActive]}
                    numberOfLines={1}
                  >
                    {meal.menu}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

/* ─────────────────────────── Pulsing Skeleton Wrapper ─────────────────────────── */
function PulsingSkeleton({ children, style }) {
  const pulseAnim = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View style={[style, { opacity: pulseAnim }]}>
      {children}
    </Animated.View>
  );
}

/* ─────────────────────────── Skeleton Card ─────────────────────────── */
function SkeletonCard() {
  return (
    <PulsingSkeleton>
      <View style={styles.skeletonCard}>
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonCircle} />
          <View style={styles.skeletonTitleLine} />
        </View>
        <View style={styles.skeletonBodyLine} />
        <View style={[styles.skeletonBodyLine, { width: "70%" }]} />
      </View>
    </PulsingSkeleton>
  );
}

/* ─────────────────────────── Home Page Skeleton ─────────────────────────── */
function HomeSkeleton() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      scrollEnabled={false}
    >
      <PulsingSkeleton>
        {/* Greetings Section Skeleton */}
        <View style={[styles.greetingRow, { gap: 6 }]}>
          <View
            style={{
              width: 100,
              height: 10,
              borderRadius: 5,
              backgroundColor: "#E2E8F0",
            }}
          />
          <View
            style={{
              width: 180,
              height: 22,
              borderRadius: 6,
              backgroundColor: "#E2E8F0",
            }}
          />
        </View>

        {/* Residency Status & Timeline Card Skeleton */}
        <View style={[styles.statusCard, { minHeight: 120, padding: spacing.lg }]}>
          <View
            style={[
              styles.statusCardHeader,
              { borderBottomWidth: 0, paddingHorizontal: 0, paddingTop: 0 },
            ]}
          >
            <View
              style={{
                width: 120,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#E2E8F0",
              }}
            />
            <View
              style={{
                width: 80,
                height: 16,
                borderRadius: 8,
                backgroundColor: "#E2E8F0",
              }}
            />
          </View>
          <View style={[styles.timelineWrapper, { marginVertical: 10, paddingHorizontal: 0 }]}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "#E2E8F0",
              }}
            />
            <View
              style={{
                flex: 1,
                height: 2,
                backgroundColor: "#E2E8F0",
                marginTop: 22,
              }}
            />
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "#E2E8F0",
              }}
            />
            <View
              style={{
                flex: 1,
                height: 2,
                backgroundColor: "#E2E8F0",
                marginTop: 22,
              }}
            />
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "#E2E8F0",
              }}
            />
          </View>
        </View>

        {/* Finance Card Skeleton */}
        <View
          style={[styles.bankingCard, { minHeight: 110, padding: spacing.lg }]}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <View style={{ gap: 6, flex: 1 }}>
              <View
                style={{
                  width: 130,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: "#E2E8F0",
                }}
              />
              <View
                style={{
                  width: 160,
                  height: 24,
                  borderRadius: 6,
                  backgroundColor: "#E2E8F0",
                }}
              />
              <View
                style={{
                  width: 100,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: "#E2E8F0",
                }}
              />
            </View>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "#E2E8F0",
              }}
            />
          </View>
          <View
            style={{ height: 36, borderRadius: 8, backgroundColor: "#E2E8F0" }}
          />
        </View>

        {/* Services Title */}
        <View
          style={{
            width: 120,
            height: 12,
            borderRadius: 6,
            backgroundColor: "#E2E8F0",
            marginVertical: 14,
          }}
        />

        {/* Services Grid Skeleton */}
        <View style={styles.modernGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.gridCard, { minHeight: 90 }]}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "#E2E8F0",
                  marginBottom: 10,
                }}
              />
              <View
                style={{
                  width: "60%",
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#E2E8F0",
                  marginBottom: 6,
                }}
              />
              <View
                style={{
                  width: "90%",
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#E2E8F0",
                }}
              />
            </View>
          ))}
        </View>

        {/* Today's Mess Schedule title */}
        <View
          style={{
            width: 140,
            height: 12,
            borderRadius: 6,
            backgroundColor: "#E2E8F0",
            marginVertical: 14,
          }}
        />

        {/* Mess Card Skeleton */}
        <View style={[styles.messCard, { minHeight: 150, padding: 14, gap: 14 }]}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <View
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: "#E2E8F0",
                  }}
                />
                <View style={{ gap: 4 }}>
                  <View
                    style={{
                      width: 60,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "#E2E8F0",
                    }}
                  />
                  <View
                    style={{
                      width: 100,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#E2E8F0",
                    }}
                  />
                </View>
              </View>
              <View
                style={{
                  width: 80,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#E2E8F0",
                }}
              />
            </View>
          ))}
        </View>
      </PulsingSkeleton>
    </ScrollView>
  );
}

/* ─────────────────────────── Complaints Widget ─────────────────────────── */
function ComplaintsWidget({ complaints, onOpenSupport, isLoading }) {
  const activeComplaints = (complaints || []).filter(
    (c) => c.status !== "RESOLVED" && c.status !== "resolved"
  );

  return (
    <View style={styles.complWidgetContainer}>
      <View style={styles.complWidgetHeader}>
        <Text style={styles.sectionTitle}>Support Desk Tracker</Text>
        <TouchableOpacity onPress={onOpenSupport} activeOpacity={0.6}>
          <Text style={styles.complWidgetLink}>
            {isLoading || activeComplaints.length > 0 ? "View All" : "File Ticket"}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ gap: spacing.xs }}>
          <SkeletonCard />
        </View>
      ) : activeComplaints.length === 0 ? (
        <View style={styles.complCleanCard}>
          <View style={styles.complCleanIconBox}>
            <CheckCircle2 size={16} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.complCleanTitle}>All Systems Operational</Text>
            <Text style={styles.complCleanDesc}>
              No active support tickets logged for your room.
            </Text>
          </View>
        </View>
      ) : (
        <View style={{ gap: spacing.xs }}>
          {activeComplaints.slice(0, 2).map((c) => {
            const statusUpper = c.status?.toUpperCase() || "PENDING";
            const isPending = statusUpper === "PENDING";
            const isInProgress = statusUpper === "IN_PROGRESS";
            
            let statusPercent = 0.33;
            let statusLabel = "Logged";
            let activeColor = "#D97706";

            if (isInProgress) {
              statusPercent = 0.66;
              statusLabel = "In Progress";
              activeColor = colors.primary;
            } else if (statusUpper === "RESOLVED") {
              statusPercent = 1.0;
              statusLabel = "Resolved";
              activeColor = colors.success;
            }

            return (
              <TouchableOpacity
                key={c.id}
                style={styles.complCard}
                onPress={onOpenSupport}
                activeOpacity={0.8}
              >
                <View style={styles.complCardTop}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.complTitle} numberOfLines={1}>
                      {c.title}
                    </Text>
                    <Text style={styles.complDesc} numberOfLines={1}>
                      {c.description || "No description provided."}
                    </Text>
                  </View>
                  <StatusBadge status={c.status} />
                </View>

                {/* Progress Visual Tracker */}
                <View style={styles.complProgressBox}>
                  <View style={styles.complProgressLabels}>
                    <Text style={[styles.complProgressStatusLabel, { color: activeColor }]}>
                      Status: {statusLabel}
                    </Text>
                    <Text style={styles.complProgressPercentText}>
                      {Math.round(statusPercent * 100)}% Resolved
                    </Text>
                  </View>
                  <View style={styles.complProgressBarBg}>
                    <View
                      style={[
                        styles.complProgressBarFill,
                        {
                          width: `${statusPercent * 100}%`,
                          backgroundColor: activeColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

/* ─────────────────────────── Highlights Carousel ─────────────────────────── */
function HighlightsCarousel() {
  const highlights = [
    {
      title: "Gate Pass Duty",
      desc: "Secure digital outpass prior to 9 PM.",
      bg: "#EEF2F6",
      text: "#334155",
      tag: "SECURITY",
    },
    {
      title: "Sunday Barbecue",
      desc: "Special barbecue dinner scheduled for 8 PM.",
      bg: "#FEE2E2",
      text: "#B91C1C",
      tag: "EVENT",
    },
    {
      title: "Speed Upgrade",
      desc: "Hostel core fiber upgrade is complete.",
      bg: "#E0F2FE",
      text: "#0369A1",
      tag: "NETWORK",
    },
  ];

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.sectionTitle}>CAMPUS HIGHLIGHTS</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.lg }}
      >
        {highlights.map((h, i) => (
          <View
            key={i}
            style={[styles.highlightCard, { backgroundColor: h.bg }]}
          >
            <Text style={[styles.highlightTag, { color: h.text }]}>
              {h.tag}
            </Text>
            <Text style={styles.highlightTitle}>{h.title}</Text>
            <Text style={styles.highlightDesc} numberOfLines={2}>
              {h.desc}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/* ─────────────────────────── FAQs Accordion ─────────────────────────── */
function FAQAccordion() {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const faqs = [
    {
      q: "WiFi & Connection Details",
      a: "SSID: HMS_Premium_WiFi\nPassword: portalguestsecure\nSpeed: 50 Mbps. Available 24/7 across all hostel wings.",
      icon: Wifi,
      color: "#4F46E5",
      bg: "#EEF2FF",
    },
    {
      q: "Warden & Support Hotline",
      a: "Helpline: 0300-1234567\nOffice hours: 9:00 AM - 6:00 PM\nFor late night gates pass or security issues, contact the warden duty desk.",
      icon: ShieldAlert,
      color: "#EA580C",
      bg: "#FFF7ED",
    },
    {
      q: "Laundry & Housekeeping Timing",
      a: "Laundry drops: Mon & Thu (8:00 AM - 12:00 PM)\nRoom cleaning schedule: Daily between 10:00 AM and 2:00 PM.",
      icon: Bed,
      color: "#16A34A",
      bg: "#F0FDF4",
    },
  ];

  const toggleExpand = (index) => {
    if (Platform.OS === "android") {
      import("react-native").then(({ UIManager }) => {
        if (UIManager.setLayoutAnimationEnabledExperimental) {
          UIManager.setLayoutAnimationEnabledExperimental(true);
        }
      });
    }
    import("react-native").then(({ LayoutAnimation }) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    });
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={styles.faqContainer}>
      <Text style={styles.sectionTitle}>RESIDENT WING GUIDELINES</Text>
      {faqs.map((faq, index) => {
        const Icon = faq.icon;
        const isExpanded = expandedIndex === index;
        return (
          <TouchableOpacity
            key={index}
            style={[styles.faqCard, isExpanded && styles.faqCardExpanded]}
            onPress={() => toggleExpand(index)}
            activeOpacity={0.8}
          >
            <View style={styles.faqHeader}>
              <View style={[styles.faqIconWrapper, { backgroundColor: faq.bg }]}>
                <Icon
                  size={16}
                  color={faq.color}
                />
              </View>
              <Text
                style={[
                  styles.faqQuestion,
                  isExpanded && styles.faqQuestionExpanded,
                ]}
              >
                {faq.q}
              </Text>
              <ChevronDown
                size={14}
                color="#94A3B8"
                style={{
                  transform: [{ rotate: isExpanded ? "180deg" : "0deg" }],
                }}
              />
            </View>
            {isExpanded && (
              <View style={styles.faqBody}>
                <Text style={styles.faqAnswer}>{faq.a}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ─────────────────────────── Header ─────────────────────────── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const getTodayDate = () => {
  const options = { weekday: "long", month: "short", day: "numeric" };
  return new Date().toLocaleDateString("en-US", options).toUpperCase();
};

/* ─────────────────────────── Top Header ─────────────────────────── */
function TopHeader({ userProfile, onOpenNotices }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.topHeader,
        { paddingTop: insets.top, height: 56 + insets.top },
      ]}
    >
      <View style={styles.topHeaderContent}>
        <View style={styles.topHeaderLeft}>
          <Building
            size={20}
            color={colors.primary}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.topHeaderTitle}>Hostel Portal</Text>
        </View>
        <View style={styles.topHeaderRight}>
          <TouchableOpacity
            style={styles.topHeaderIconBtn}
            onPress={onOpenNotices}
            activeOpacity={0.7}
          >
            <Bell size={18} color="#475569" />
            <View style={styles.bellIndicatorDot} />
          </TouchableOpacity>
          <View style={styles.avatarBorder}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarLetter}>
                {userProfile?.name?.[0]?.toUpperCase() || "R"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ─────────────────────────── Main Home Screen ─────────────────────────── */
export default function Home() {
  const [activeModal, setActiveModal] = useState(null); // 'bookings' | 'leave' | 'support' | 'notices'
  const queryClient = useQueryClient();
  const { openModal } = useLocalSearchParams();

  React.useEffect(() => {
    if (openModal) {
      setActiveModal(openModal);
    }
  }, [openModal]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["resident_dashboard_all"],
    queryFn: async () => {
      const [dashRes, meRes, messRes] = await Promise.all([
        api.get("/api/guest/dashboard"),
        api.get("/api/auth/me"),
        api.get("/api/mess"),
      ]);
      return {
        ...dashRes.data,
        me: meRes.data?.user,
        messMenus: messRes.data?.data || [],
      };
    },
  });

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
    staleTime: 1000 * 60 * 30, // 30 minutes cache
  });

  const userProfile = data?.me || data?.user;
  const bookings = data?.bookings || data?.data?.bookings || [];
  const payments = data?.payments || data?.data?.payments || data?.data || [];
  const complaints = data?.complaints || data?.data?.complaints || [];
  const notices = data?.notices || data?.data?.notices || [];

  console.log("DEBUG DASHBOARD DATA:", { data, isLoading, bookings, payments });



  if (isError && !data) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          backgroundColor: "#F8FAFC",
        }}
      >
        <ShieldAlert size={48} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#0F172A",
            marginBottom: 8,
          }}
        >
          Failed to Load Dashboard
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: "#64748B",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          {error?.message || "Please check your connection and try again."}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 10,
          }}
          onPress={() => refetch()}
        >
          <Text style={{ color: "#FFF", fontWeight: "700" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Extract active booking details
  const activeBooking =
    bookings?.find(
      (b) =>
        b.status === "CONFIRMED" ||
        b.status === "confirmed" ||
        b.status === "CHECKED_IN",
    ) || bookings?.[0];

  const room = activeBooking?.Room
    ? {
        number: activeBooking.Room.roomNumber,
        floor: activeBooking.Room.floor,
        hostelName: activeBooking.Room.Hostel?.name || (branding?.companyShortName ? branding.companyShortName + " Hostel" : "HMS Hostel"),
      }
    : null;

  // Dues calculations
  const pendingInvoices = payments?.filter((p) => p.status === "PENDING") || [];
  const pendingComplaintsCount =
    complaints?.filter((c) => c.status !== "RESOLVED")?.length || 0;

  // Determine residency timeline step details
  const getTimelineStep = () => {
    if (!activeBooking) return 0;
    if (activeBooking.status === "CHECKED_IN") return 3;
    if (
      activeBooking.status === "CONFIRMED" ||
      activeBooking.status === "confirmed"
    )
      return 2;
    return 1; // Pending approval / booked
  };

  const timelineStep = getTimelineStep();

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Premium Sticky Top Header */}
      <TopHeader
        userProfile={userProfile}
        onOpenNotices={() => setActiveModal("notices")}
      />

      {isLoading && !data ? (
        <HomeSkeleton />
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        >
        {/* Greetings Section */}
        <View style={styles.greetingRow}>
          <Text style={styles.greetingDate}>{getTodayDate()}</Text>
          <Text style={styles.greetingText}>
            {getGreeting()},{" "}
            <Text style={styles.greetingName}>
              {userProfile?.name || "Resident"}
            </Text>
          </Text>
        </View>

        {/* Residency Status & Timeline Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusCardHeader}>
            <Text style={styles.statusCardTitle}>YOUR RESIDENCY STATUS</Text>
            <View
              style={[
                styles.statusIndicatorBadge,
                timelineStep >= 2 ? styles.badgeSuccess : styles.badgeProgress,
              ]}
            >
              <Text
                style={[
                  styles.statusIndicatorText,
                  timelineStep >= 2 ? styles.textSuccess : styles.textProgress,
                ]}
              >
                {activeBooking?.status?.toUpperCase()?.replace("_", " ") ||
                  "NO ACTIVE BOOKING"}
              </Text>
            </View>
          </View>

          {activeBooking ? (
            <View style={styles.timelineWrapper}>
              {/* Step 1: Booked */}
              <View style={styles.timelineStep}>
                <View style={[styles.stepCircle, styles.circleActive]}>
                  <CheckCircle2 size={16} color="#3B82F6" />
                </View>
                <View
                  style={[
                    styles.stepLine,
                    timelineStep >= 2 ? styles.lineActive : styles.lineInactive,
                  ]}
                />
                <Text style={styles.stepLabelActive}>Booked</Text>
              </View>

              {/* Step 2: Confirmed */}
              <View style={styles.timelineStep}>
                <View
                  style={[
                    styles.stepCircle,
                    timelineStep >= 2
                      ? styles.circleActive
                      : styles.circleInactive,
                  ]}
                >
                  {timelineStep >= 2 ? (
                    <CheckCircle2 size={16} color="#3B82F6" />
                  ) : (
                    <Circle size={14} color="#9CA3AF" />
                  )}
                </View>
                <View
                  style={[
                    styles.stepLine,
                    timelineStep >= 3 ? styles.lineActive : styles.lineInactive,
                  ]}
                />
                <Text
                  style={
                    timelineStep >= 2
                      ? styles.stepLabelActive
                      : styles.stepLabelInactive
                  }
                >
                  Confirmed
                </Text>
              </View>

              {/* Step 3: Checked In */}
              <View style={styles.timelineStep}>
                <View
                  style={[
                    styles.stepCircle,
                    timelineStep >= 3
                      ? styles.circleActive
                      : styles.circleInactive,
                  ]}
                >
                  {timelineStep >= 3 ? (
                    <UserCheck size={16} color="#3B82F6" />
                  ) : (
                    <Circle size={14} color="#9CA3AF" />
                  )}
                </View>
                <Text
                  style={
                    timelineStep >= 3
                      ? styles.stepLabelActive
                      : styles.stepLabelInactive
                  }
                >
                  Checked In
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noResidencyContainer}>
              <View style={styles.noResidencyIconWrapper}>
                <Bed size={20} color="#64748B" />
              </View>
              <Text style={styles.noResidencyTitle}>No Active Residency</Text>
              <Text style={styles.noResidencySubtitle}>
                You don't have an active hostel booking or check-in registered
                in the system.
              </Text>
              <TouchableOpacity
                style={styles.noResidencyBtn}
                onPress={() => setActiveModal("bookings")}
                activeOpacity={0.8}
              >
                <Text style={styles.noResidencyBtnText}>
                  View Bookings Portal
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {room && (
            <View style={styles.roomBadgeRow}>
              <View style={styles.roomBadgeCell}>
                <Building
                  size={14}
                  color="#6B7280"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.roomBadgeText} numberOfLines={1}>
                  {room.hostelName}
                </Text>
              </View>
              <View style={styles.roomBadgeDivider} />
              <View style={styles.roomBadgeCell}>
                <Bed size={14} color="#6B7280" style={{ marginRight: 6 }} />
                <Text style={styles.roomBadgeText}>Room {room.number}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Finance Card - Banking Style Layout */}
        <View style={styles.bankingCard}>
          <View style={styles.bankingCardMain}>
            <View style={styles.bankingCardLeft}>
              <Text style={styles.bankingLabel}>OUTSTANDING INVOICES</Text>
              <Text style={styles.bankingAmount}>
                PKR{" "}
                {pendingInvoices
                  .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
                  .toLocaleString()}
              </Text>
              <Text style={styles.bankingSubtext}>
                {pendingInvoices.length}{" "}
                {pendingInvoices.length === 1 ? "bill is" : "bills are"}{" "}
                awaiting payment
              </Text>
            </View>
            <View style={styles.bankingCardIconWrapper}>
              <CreditCard size={28} color="#4F46E5" style={{ opacity: 0.8 }} />
            </View>
          </View>

          <TouchableOpacity
            style={styles.bankingPayBtn}
            onPress={() => router.push("/(resident)/payments")}
            activeOpacity={0.8}
          >
            <Text style={styles.bankingPayBtnText}>Access Payments Portal</Text>
            <ArrowUpRight
              size={14}
              color={colors.white}
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>
        </View>

        {/* Dynamic Action Grid (Standard Monochromatic Color coding) */}
        <Text style={styles.sectionTitle}>WORKSPACE SERVICES</Text>
        <View style={styles.modernGrid}>
          {/* Action 1: Bookings */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => setActiveModal("bookings")}
            activeOpacity={0.75}
          >
            <View style={styles.gridCardTop}>
              <View
                style={[styles.gridIconBox, { backgroundColor: "#E0F2FE" }]}
              >
                <Calendar size={18} color="#0284C7" />
              </View>
              <ChevronRight size={14} color={colors.textPlaceholder} />
            </View>
            <Text style={styles.gridCardTitle}>Bookings</Text>
            <Text style={styles.gridCardDesc}>
              View room details & active dates
            </Text>
          </TouchableOpacity>

          {/* Action 2: Housekeeping & Room Services */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => setActiveModal("housekeeping")}
            activeOpacity={0.75}
          >
            <View style={styles.gridCardTop}>
              <View
                style={[styles.gridIconBox, { backgroundColor: "#F0FDF4" }]}
              >
                <Sparkles size={18} color="#16A34A" />
              </View>
              <ChevronRight size={14} color={colors.textPlaceholder} />
            </View>
            <Text style={styles.gridCardTitle}>Housekeeping</Text>
            <Text style={styles.gridCardDesc}>
              View room cleaning & laundry logs
            </Text>
          </TouchableOpacity>

          {/* Action 3: Support */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => setActiveModal("support")}
            activeOpacity={0.75}
          >
            <View style={styles.gridCardTop}>
              <View
                style={[styles.gridIconBox, { backgroundColor: "#FEE2E2" }]}
              >
                <MessageSquare size={18} color="#DC2626" />
              </View>
              <ChevronRight size={14} color={colors.textPlaceholder} />
            </View>
            <Text style={styles.gridCardTitle}>Support Desk</Text>
            <Text style={styles.gridCardDesc}>
              {pendingComplaintsCount > 0
                ? `${pendingComplaintsCount} Active Tickets`
                : "Raise ticket for maintenance"}
            </Text>
          </TouchableOpacity>

          {/* Action 4: Notices */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => setActiveModal("notices")}
            activeOpacity={0.75}
          >
            <View style={styles.gridCardTop}>
              <View
                style={[styles.gridIconBox, { backgroundColor: "#FEF3C7" }]}
              >
                <Bell size={18} color="#D97706" />
              </View>
              <ChevronRight size={14} color={colors.textPlaceholder} />
            </View>
            <Text style={styles.gridCardTitle}>Bulletins</Text>
            <Text style={styles.gridCardDesc}>
              {notices.length > 0
                ? `${notices.length} Alerts Posted`
                : "No recent notices"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Today's Mess Menu Widget */}
        <MessMenuWidget messMenus={data?.messMenus} />

        {/* Support & Complaints Widget */}
        <ComplaintsWidget
          complaints={complaints}
          onOpenSupport={() => setActiveModal("support")}
          isLoading={isLoading}
        />

        {/* Campus Highlights Carousel */}
        {/* <HighlightsCarousel /> */}

        {/* Wing FAQ/Guidelines Accordion */}
        <FAQAccordion />

        {/* Notices Bulletin section */}
        {/* Notices Bulletin section */}
        {(isLoading || notices.length > 0) && (
          <View style={styles.bulletinSection}>
            <View style={styles.bulletinHeader}>
              <Text style={styles.sectionTitle}>BULLETIN BOARD</Text>
              <TouchableOpacity
                onPress={() => setActiveModal("notices")}
                activeOpacity={0.6}
              >
                <Text style={styles.bulletinLink}>View All</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={{ gap: spacing.xs }}>
                <SkeletonCard />
                <SkeletonCard />
              </View>
            ) : (
              notices.slice(0, 2).map((notice, idx) => {
                const isHigh = notice.priority?.toUpperCase() === "HIGH";
                const category = notice.category || "GENERAL";
                
                // Color mapping for notice categories
                let categoryColor = "#4F46E5";
                let categoryBg = "#EEF2FF";
                if (category.toUpperCase() === "FOOD") {
                  categoryColor = "#EA580C";
                  categoryBg = "#FFF7ED";
                } else if (category.toUpperCase() === "MAINTENANCE") {
                  categoryColor = "#0D9488";
                  categoryBg = "#F0FDFA";
                } else if (category.toUpperCase() === "SECURITY") {
                  categoryColor = "#DC2626";
                  categoryBg = "#FEF2F2";
                }

                return (
                  <TouchableOpacity
                    key={notice.id}
                    style={[
                      styles.bulletinCard,
                      isHigh && styles.bulletinCardHighPriority,
                    ]}
                    onPress={() => setActiveModal("notices")}
                    activeOpacity={0.8}
                  >
                    <View style={styles.bulletinCardTop}>
                      <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 6 }}>
                        <View style={[styles.bulletinCategoryPill, { backgroundColor: categoryBg }]}>
                          <Text style={[styles.bulletinCategoryText, { color: categoryColor }]}>
                            {category}
                          </Text>
                        </View>
                        {isHigh && (
                          <View style={styles.bulletinUrgentPill}>
                            <Text style={styles.bulletinUrgentText}>URGENT</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.bulletinCardDate}>
                        {new Date(notice.createdAt).toLocaleDateString("en-PK", {
                          day: "numeric",
                          month: "short",
                        })}
                      </Text>
                    </View>
                    
                    <Text style={styles.bulletinCardTitle} numberOfLines={1}>
                      {notice.title}
                    </Text>
                    
                    <Text style={styles.bulletinCardBody} numberOfLines={2}>
                      {notice.content}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
      )}

      {/* Modals */}
      <BookingsModal
        visible={activeModal === "bookings"}
        onClose={() => setActiveModal(null)}
      />
      <HousekeepingModal
        visible={activeModal === "housekeeping"}
        onClose={() => setActiveModal(null)}
        userId={userProfile?.id}
      />
      <SupportModal
        visible={activeModal === "support"}
        onClose={() => setActiveModal(null)}
        userId={userProfile?.id}
      />
      <NoticesModal
        visible={activeModal === "notices"}
        onClose={() => setActiveModal(null)}
        notices={notices}
      />
    </View>
  );
}

/* ─────────────────────────── Modal Subcomponents ─────────────────────────── */
function BookingsModal({ visible, onClose }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["resident_bookings"],
    queryFn: async () => {
      const res = await api.get("/api/guest/dashboard");
      return res.data;
    },
    enabled: visible,
  });

  const rawBookings = data?.bookings || data?.data || [];
  const bookings = rawBookings.map((b) => ({
    ...b,
    room: { number: b.Room?.roomNumber || b.room?.number || "—" },
    hostel: b.Room?.Hostel || b.hostel,
    amount: b.totalAmount || b.amount || 0,
  }));

  const getDaysCount = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const diffTime = Math.abs(new Date(checkOut) - new Date(checkIn));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
            <Calendar
              size={18}
              color={colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.modalTitle}>My Bookings</Text>
          </View>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={16} color="#64748B" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator
            style={{ marginTop: 40 }}
            color={colors.primary}
            size="large"
          />
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(b) => b.id}
            contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <Info
                  size={28}
                  color={colors.textSecondary}
                  style={{ marginBottom: 8 }}
                />
                <Text style={styles.emptyText}>No bookings found.</Text>
              </View>
            }
            renderItem={({ item: b }) => {
              const stayNights = getDaysCount(b.checkIn, b.checkOut);
              const isConfirmedOrCheckedIn =
                b.status?.toUpperCase() === "CONFIRMED" ||
                b.status?.toUpperCase() === "CHECKED_IN";
              return (
                <View style={styles.bookingCard}>
                  {/* Header Row */}
                  <View style={styles.bookingCardHeader}>
                    <View>
                      <Text style={styles.roomLabel}>
                        ROOM {b.room?.number || "—"}
                      </Text>
                      <View style={styles.hostelRow}>
                        <Building size={12} color="#64748B" style={{ marginRight: 4 }} />
                        <Text style={styles.hostelName}>
                          {b.hostel?.name || (branding?.companyShortName ? branding.companyShortName + " Hostel" : "HMS Hostel")}
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
                        onPress={() => {
                          onClose();
                          router.push("/(resident)/payments");
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.payNowIndicatorText}>Pay Invoice</Text>
                        <ArrowUpRight size={10} color="#4F46E5" style={{ marginLeft: 3 }} />
                      </TouchableOpacity>
                    ) : (
                      isConfirmedOrCheckedIn && (
                        <TouchableOpacity
                          style={styles.payNowIndicator}
                          onPress={() => {
                            onClose();
                            router.push("/(resident)/bookings");
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.payNowIndicatorText}>Manage Stay</Text>
                          <ArrowUpRight size={10} color="#4F46E5" style={{ marginLeft: 3 }} />
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

function HousekeepingModal({ visible, onClose, userId }) {
  const [activeTab, setActiveTab] = useState("cleaning"); // "cleaning" | "laundry"

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["housekeeping_logs", userId, activeTab],
    queryFn: async () => {
      const res = await api.get(
        `/api/warden/logs?userId=${userId}&type=${activeTab}`,
      );
      return res.data;
    },
    enabled: visible && !!userId,
  });

  const logs = data?.data || [];

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
            <Sparkles
              size={18}
              color={colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.modalTitle}>Housekeeping & Services</Text>
          </View>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={16} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Segmented Control Tab Bar */}
        <View style={styles.tabBarContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "cleaning" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("cleaning")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "cleaning" && styles.tabButtonTextActive,
              ]}
            >
              Cleaning Logs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "laundry" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("laundry")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "laundry" && styles.tabButtonTextActive,
              ]}
            >
              Laundry Logs
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        >
          {isLoading ? (
            <ActivityIndicator
              style={{ marginTop: 40 }}
              color={colors.primary}
              size="large"
            />
          ) : logs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Info
                size={28}
                color={colors.textSecondary}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.emptyText}>
                No {activeTab} history found for your room.
              </Text>
            </View>
          ) : (
            logs.map((log) => {
              const date = log.performedAt || log.collectedAt || log.createdAt;
              return (
                <View key={log.id} style={styles.logCard}>
                  <View style={styles.logCardHeader}>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <CalendarDays
                        size={14}
                        color="#64748B"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.logCardDate}>
                        {date
                          ? new Date(date).toLocaleDateString("en-PK", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </Text>
                    </View>
                    <StatusBadge status={log.status || "COMPLETED"} />
                  </View>

                  {activeTab === "laundry" && (
                    <View style={styles.logCardMetaRow}>
                      <Text style={styles.logCardMetaLabel}>
                        Items Collected:
                      </Text>
                      <Text style={styles.logCardMetaValue}>
                        {log.itemsCount || 0} items
                      </Text>
                    </View>
                  )}

                  {log.notes ? (
                    <View style={styles.logNotesBox}>
                      <Text style={styles.logNotesText}>{log.notes}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function SupportModal({ visible, onClose, userId }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("MAINTENANCE");
  const [priority, setPriority] = useState("MEDIUM");
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["resident_complaints"],
    queryFn: async () => {
      const res = await api.get("/api/complaints");
      return res.data;
    },
    enabled: visible,
  });
  const complaints = data?.data || data?.complaints || [];

  const CATS = [
    { value: "MAINTENANCE", label: "Maintenance", color: "#D97706", bg: "#FFFBEB" },
    { value: "ELECTRICAL", label: "Electrical", color: "#CA8A04", bg: "#FEFCE8" },
    { value: "PLUMBING", label: "Plumbing", color: "#2563EB", bg: "#EFF6FF" },
    { value: "INTERNET", label: "WiFi / Net", color: "#7C3AED", bg: "#F5F3FF" },
    { value: "CLEANLINESS", label: "Cleaning", color: "#16A34A", bg: "#F0FDF4" },
    { value: "SECURITY", label: "Security", color: "#DC2626", bg: "#FEF2F2" },
    { value: "NOISE", label: "Noise", color: "#9333EA", bg: "#FDF4FF" },
    { value: "OTHER", label: "Other", color: "#64748B", bg: "#F8FAFC" },
  ];

  const PRIS = [
    { value: "LOW", label: "Low", dot: "#94A3B8" },
    { value: "MEDIUM", label: "Medium", dot: "#F59E0B" },
    { value: "HIGH", label: "High", dot: "#EA580C" },
    { value: "URGENT", label: "Urgent", dot: "#DC2626" },
  ];

  const getStatusStyle = (status) => {
    const s = status?.toUpperCase();
    if (["RESOLVED", "COMPLETED"].includes(s)) return { bg: "#ECFDF5", text: "#16A34A", label: "Resolved ✓" };
    if (["IN_PROGRESS", "PROCESSING"].includes(s)) return { bg: "#EFF6FF", text: "#2563EB", label: "In Progress" };
    if (s === "REJECTED") return { bg: "#FEF2F2", text: "#DC2626", label: "Rejected" };
    return { bg: "#FFFBEB", text: "#D97706", label: "Pending" };
  };

  const handleSubmit = async () => {
    if (!title.trim() || !desc.trim())
      return Alert.alert("Missing Fields", "Please fill in title and description.");
    setSubmitting(true);
    try {
      await api.post("/api/complaints", { title: title.trim(), description: desc.trim(), category, priority });
      qc.invalidateQueries(["resident_complaints"]);
      refetch();
      setTitle(""); setDesc(""); setCategory("MAINTENANCE"); setPriority("MEDIUM");
      Alert.alert("Submitted ✓", "Your complaint has been filed successfully!");
    } catch {
      Alert.alert("Error", "Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendComment = async (complaintId) => {
    if (!commentText.trim()) return;
    setSendingComment(true);
    try {
      await api.post("/api/complaints/comments", { complaintId, message: commentText.trim() });
      setCommentText("");
      refetch();
    } catch {
      Alert.alert("Error", "Could not send message.");
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0", alignSelf: "center", marginTop: 10, marginBottom: 4 }} />

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}>
          <View>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#0F172A", letterSpacing: -0.5 }}>Support Center</Text>
            <Text style={{ fontSize: 10, color: "#64748B", fontWeight: "600", marginTop: 1 }}>File & track your complaints</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#4F46E5" />} showsVerticalScrollIndicator={false}>

          {/* FILE COMPLAINT FORM */}
          <View style={{ backgroundColor: "#fff", borderRadius: 20, borderWidth: 1.5, borderColor: "#F1F5F9", marginBottom: 24, overflow: "hidden" }}>
            <View style={{ backgroundColor: "#1E1B4B", paddingHorizontal: 20, paddingVertical: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#A5B4FC", textTransform: "uppercase", letterSpacing: 1 }}>File a New Complaint</Text>
              <Text style={{ fontSize: 10, color: "#C7D2FE", fontWeight: "600", marginTop: 2 }}>Our warden team will respond promptly</Text>
            </View>

            <View style={{ padding: 16 }}>
              <Text style={{ fontSize: 9, fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Issue Category</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {CATS.map((cat) => {
                  const isSel = category === cat.value;
                  return (
                    <TouchableOpacity key={cat.value} onPress={() => setCategory(cat.value)} activeOpacity={0.7}
                      style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: isSel ? cat.color : "#E2E8F0", backgroundColor: isSel ? cat.bg : "#F8FAFC" }}>
                      <Text style={{ fontSize: 9, fontWeight: "800", color: isSel ? cat.color : "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5 }}>{cat.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={{ fontSize: 9, fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Urgency Level</Text>
              <View style={{ flexDirection: "row", gap: 6, marginBottom: 16 }}>
                {PRIS.map((p) => {
                  const isSel = priority === p.value;
                  return (
                    <TouchableOpacity key={p.value} onPress={() => setPriority(p.value)} activeOpacity={0.7}
                      style={{ flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: isSel ? "#4F46E5" : "#E2E8F0", backgroundColor: isSel ? "#4F46E5" : "#F8FAFC" }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isSel ? "#fff" : p.dot, marginBottom: 4 }} />
                      <Text style={{ fontSize: 8, fontWeight: "800", color: isSel ? "#fff" : "#64748B", textTransform: "uppercase" }}>{p.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={{ fontSize: 9, fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Issue Title</Text>
              <TextInput style={{ height: 42, borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 10, paddingHorizontal: 14, fontSize: 12, color: "#0F172A", backgroundColor: "#F8FAFC", marginBottom: 12 }}
                placeholder="e.g., Ceiling fan is broken" placeholderTextColor="#94A3B8" value={title} onChangeText={setTitle} />

              <Text style={{ fontSize: 9, fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Detailed Description</Text>
              <TextInput style={{ minHeight: 80, borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 10, paddingHorizontal: 14, paddingTop: 12, fontSize: 12, color: "#0F172A", backgroundColor: "#F8FAFC", textAlignVertical: "top", marginBottom: 16 }}
                placeholder="Describe the problem so staff can act quickly..." placeholderTextColor="#94A3B8" multiline numberOfLines={4} value={desc} onChangeText={setDesc} />

              <TouchableOpacity onPress={handleSubmit} disabled={submitting || !title.trim() || !desc.trim()} activeOpacity={0.8}
                style={{ backgroundColor: "#4F46E5", borderRadius: 12, height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, opacity: (submitting || !title.trim() || !desc.trim()) ? 0.6 : 1 }}>
                {submitting ? <ActivityIndicator color="#fff" size="small" /> : (
                  <>
                    <Send size={14} color="#fff" />
                    <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 }}>Submit Complaint</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* COMPLAINT HISTORY */}
          <Text style={{ fontSize: 9, fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            Complaint History ({complaints.length})
          </Text>

          {isLoading ? (
            <ActivityIndicator color="#4F46E5" style={{ marginTop: 20 }} />
          ) : complaints.length === 0 ? (
            <View style={{ backgroundColor: "#fff", borderRadius: 16, borderWidth: 1.5, borderColor: "#F1F5F9", padding: 32, alignItems: "center" }}>
              <MessageSquare size={28} color="#CBD5E1" style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 12, color: "#94A3B8", fontWeight: "600", textAlign: "center" }}>No complaints filed yet.</Text>
            </View>
          ) : (
            complaints.map((t) => {
              const isExpanded = expandedId === t.id;
              const catConf = CATS.find((c) => c.value === t.category) || CATS[7];
              const statusSt = getStatusStyle(t.status);
              return (
                <TouchableOpacity key={t.id} onPress={() => setExpandedId(isExpanded ? null : t.id)} activeOpacity={0.85}
                  style={{ backgroundColor: "#fff", borderRadius: 16, borderWidth: 1.5, borderColor: isExpanded ? "#4F46E5" : "#F1F5F9", marginBottom: 10, overflow: "hidden" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", padding: 14 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: catConf.bg, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: catConf.color }} />
                    </View>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                        <Text style={{ fontSize: 8, fontWeight: "800", color: catConf.color, textTransform: "uppercase" }}>{catConf.label}</Text>
                        <Text style={{ fontSize: 8, color: "#CBD5E1" }}>·</Text>
                        <Text style={{ fontSize: 8, fontWeight: "700", color: "#94A3B8" }}>#{(t.uid || t.id?.slice(-6) || "").toUpperCase()}</Text>
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: "800", color: "#0F172A" }} numberOfLines={isExpanded ? undefined : 1}>{t.title}</Text>
                      <Text style={{ fontSize: 10, color: "#64748B", marginTop: 2 }} numberOfLines={isExpanded ? undefined : 1}>{t.description}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                      <View style={{ backgroundColor: statusSt.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                        <Text style={{ fontSize: 8, fontWeight: "800", color: statusSt.text, textTransform: "uppercase" }}>{statusSt.label}</Text>
                      </View>
                      <Text style={{ fontSize: 8, color: "#94A3B8", fontWeight: "600" }}>
                        {new Date(t.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                      </Text>
                    </View>
                  </View>

                  {isExpanded && (
                    <View style={{ borderTopWidth: 1, borderTopColor: "#F1F5F9" }}>
                      <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}>
                        {[{ label: "Priority", value: t.priority || "MEDIUM" }, { label: "Status", value: t.status }, { label: "Filed", value: new Date(t.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" }) }]
                          .map((meta, i) => (
                            <View key={meta.label} style={{ flex: 1, padding: 10, borderRightWidth: i < 2 ? 1 : 0, borderRightColor: "#F1F5F9" }}>
                              <Text style={{ fontSize: 7, fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{meta.label}</Text>
                              <Text style={{ fontSize: 10, fontWeight: "800", color: "#1E293B" }}>{meta.value}</Text>
                            </View>
                          ))}
                      </View>

                      {t.resolutionNotes && (
                        <View style={{ margin: 12, padding: 12, backgroundColor: "#ECFDF5", borderRadius: 10, borderWidth: 1, borderColor: "#A7F3D0" }}>
                          <Text style={{ fontSize: 8, fontWeight: "800", color: "#065F46", textTransform: "uppercase", marginBottom: 4 }}>Resolution Note</Text>
                          <Text style={{ fontSize: 11, color: "#047857", lineHeight: 16 }}>{t.resolutionNotes}</Text>
                        </View>
                      )}

                      <View style={{ paddingHorizontal: 14, paddingTop: 10 }}>
                        <Text style={{ fontSize: 8, fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                          Conversation ({t.comments?.length || 0})
                        </Text>
                        {t.comments && t.comments.length > 0 ? (
                          t.comments.map((c, idx) => {
                            const isOwn = c.User?.id === userId;
                            return (
                              <View key={c.id || idx} style={{ flexDirection: isOwn ? "row-reverse" : "row", marginBottom: 10, alignItems: "flex-end", gap: 8 }}>
                                <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: isOwn ? "#4F46E5" : "#F1F5F9", alignItems: "center", justifyContent: "center" }}>
                                  <Text style={{ fontSize: 10, fontWeight: "800", color: isOwn ? "#fff" : "#475569" }}>{c.User?.name?.charAt(0)?.toUpperCase() || "?"}</Text>
                                </View>
                                <View style={{ maxWidth: "75%", backgroundColor: isOwn ? "#4F46E5" : "#fff", borderRadius: 12, borderTopRightRadius: isOwn ? 2 : 12, borderTopLeftRadius: isOwn ? 12 : 2, padding: 10, borderWidth: isOwn ? 0 : 1, borderColor: "#F1F5F9" }}>
                                  <Text style={{ fontSize: 8, fontWeight: "800", color: isOwn ? "#C7D2FE" : "#94A3B8", textTransform: "uppercase", marginBottom: 3 }}>{isOwn ? "You" : (c.User?.name || "Staff")}</Text>
                                  <Text style={{ fontSize: 11, color: isOwn ? "#fff" : "#1E293B", lineHeight: 16 }}>{c.message}</Text>
                                </View>
                              </View>
                            );
                          })
                        ) : (
                          <View style={{ padding: 16, backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", marginBottom: 10 }}>
                            <Text style={{ fontSize: 10, color: "#94A3B8", fontWeight: "600", textAlign: "center" }}>No messages yet. Reply below to notify the warden.</Text>
                          </View>
                        )}

                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 14 }}>
                          <TextInput style={{ flex: 1, height: 38, backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 20, paddingHorizontal: 14, fontSize: 12, color: "#0F172A" }}
                            placeholder="Write a reply to the warden..." placeholderTextColor="#94A3B8"
                            value={expandedId === t.id ? commentText : ""} onChangeText={setCommentText} />
                          <TouchableOpacity onPress={() => handleSendComment(t.id)} disabled={!commentText.trim() || sendingComment} activeOpacity={0.8}
                            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#4F46E5", alignItems: "center", justifyContent: "center", opacity: (!commentText.trim() || sendingComment) ? 0.5 : 1 }}>
                            {sendingComment ? <ActivityIndicator color="#fff" size="small" /> : <Send size={14} color="#fff" />}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}


function NoticesModal({ visible, onClose, notices }) {
  const [selected, setSelected] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotices = (notices || []).filter(
    (n) =>
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleSelect = (n) => {
    if (Platform.OS === "android") {
      import("react-native").then(({ UIManager }) => {
        UIManager.setLayoutAnimationEnabledExperimental &&
          UIManager.setLayoutAnimationEnabledExperimental(true);
      });
    }
    import("react-native").then(({ LayoutAnimation }) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    });
    setSelected(selected?.id === n.id ? null : n);
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

        {/* Custom Header */}
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleContainer}>
            <Bell size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.modalTitle}>Notice Board</Text>
            <View style={styles.modalCountBadge}>
              <Text style={styles.modalCountText}>
                {(notices || []).length}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={16} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Search Input Bar */}
        {(notices || []).length > 0 && (
          <View style={styles.searchBarWrapper}>
            <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchBarInput}
              placeholder="Search announcements..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>
        )}

        <FlatList
          data={filteredNotices}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Info
                size={28}
                color={colors.textSecondary}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "No matching announcements found."
                  : "No notices posted."}
              </Text>
            </View>
          }
          renderItem={({ item: n }) => {
            const isHigh = n.priority === "HIGH";
            const isExpanded = selected?.id === n.id;
            return (
              <TouchableOpacity
                style={[
                  styles.noticeDetailCard,
                  isHigh && styles.noticeDetailCardHigh,
                  isExpanded && styles.noticeDetailCardExpanded,
                ]}
                onPress={() => toggleSelect(n)}
                activeOpacity={0.85}
              >
                <View style={styles.noticeDetailHeader}>
                  <View style={styles.noticeDetailLeft}>
                    <View
                      style={[
                        styles.noticeIconWrapper,
                        isHigh && styles.noticeIconWrapperHigh,
                      ]}
                    >
                      {isHigh ? (
                        <ShieldAlert size={14} color="#EF4444" />
                      ) : (
                        <Info size={14} color="#64748B" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text
                          style={[
                            styles.noticeDetailTitle,
                            isExpanded && styles.noticeDetailTitleActive,
                          ]}
                          numberOfLines={isExpanded ? undefined : 1}
                        >
                          {n.title}
                        </Text>
                        {isHigh && (
                          <View style={styles.highPriorityBadge}>
                            <Text style={styles.highPriorityBadgeText}>
                              IMPORTANT
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.noticeDetailDate}>
                        {new Date(n.createdAt).toLocaleDateString("en-PK", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                  </View>
                  <ChevronDown
                    size={16}
                    color="#94A3B8"
                    style={{
                      transform: [{ rotate: isExpanded ? "180deg" : "0deg" }],
                    }}
                  />
                </View>
                {isExpanded && (
                  <View style={styles.noticeExpandedContentWrapper}>
                    <Text style={styles.noticeDetailContent}>{n.content}</Text>
                    <View style={styles.noticeFooterRow}>
                      <User
                        size={10}
                        color="#94A3B8"
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.noticeAuthorText}>
                        Posted by: Hostel Management Desk
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

/* ─────────────────────────── Styles ─────────────────────────── */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1, backgroundColor: "#F8FAFC" }, // Modern Slate 50 backdrop
  contentContainer: { padding: spacing.lg, paddingBottom: 40 },

  /* Premium Sticky Top Header */
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
  topHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  topHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  topHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  topHeaderIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: "#EFF2F5",
    position: "relative",
  },
  bellIndicatorDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  avatarBorder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 2,
    backgroundColor: "#E2E8F0",
  },
  avatarInner: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },

  /* Greeting Section inside scroll view */
  greetingRow: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  greetingDate: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  greetingText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#64748B",
  },
  greetingName: {
    fontWeight: "800",
    color: "#0F172A",
  },

  /* Stepper Timeline Status Card */
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.xl,
    marginBottom: spacing.md + 2,
    ...shadows.premiumHover,
  },
  statusCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg + 2,
  },
  statusCardTitle: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B", // Slate 500
    letterSpacing: 1.2,
  },
  statusIndicatorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeSuccess: {
    backgroundColor: "#DCFCE7",
  },
  badgeProgress: {
    backgroundColor: "#FEF3C7",
  },
  statusIndicatorText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  textSuccess: {
    color: "#16A34A",
  },
  textProgress: {
    color: "#D97706",
  },
  timelineWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  timelineStep: {
    alignItems: "center",
    flex: 1,
    position: "relative",
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  circleActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  circleInactive: {
    backgroundColor: colors.white,
    borderColor: "#E2E8F0",
  },
  stepLine: {
    position: "absolute",
    top: 13,
    left: "50%",
    width: "100%",
    height: 2,
    zIndex: -1,
  },
  lineActive: {
    backgroundColor: "#3B82F6",
  },
  lineInactive: {
    backgroundColor: "#E2E8F0",
  },
  stepLabelActive: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1E293B", // Slate 800
    marginTop: 8,
  },
  stepLabelInactive: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94A3B8", // Slate 400
    marginTop: 8,
  },
  noResidencyContainer: {
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  noResidencyIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  noResidencyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  noResidencySubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  noResidencyBtn: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  noResidencyBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  roomBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
  },
  roomBadgeCell: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  roomBadgeDivider: {
    width: 1,
    height: 18,
    backgroundColor: "#E2E8F0",
    marginHorizontal: spacing.md,
  },
  roomBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155", // Slate 700
  },

  /* Premium Banking Card Style */
  bankingCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    overflow: "hidden",
    marginBottom: spacing.xl,
    ...shadows.premiumHover,
  },
  bankingCardMain: {
    padding: spacing.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bankingCardLeft: {
    flex: 1,
  },
  bankingLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 1,
    marginBottom: 4,
  },
  bankingAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  bankingSubtext: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 3,
  },
  bankingCardIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.medium,
    backgroundColor: "#EEF2FF", // Indigo 50 tint
    alignItems: "center",
    justifyContent: "center",
  },
  bankingPayBtn: {
    backgroundColor: "#4F46E5", // Premium Indigo
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bankingPayBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  /* Section Title */
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 1.5,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    textTransform: "uppercase",
  },

  /* Modern Work Grid styling */
  modernGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  gridCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2 - 0.5,
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.xl,
    ...shadows.premium,
  },
  gridCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  gridIconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.medium,
    alignItems: "center",
    justifyContent: "center",
  },
  gridCardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  gridCardDesc: {
    fontSize: 10.5,
    color: "#64748B",
    lineHeight: 15,
    fontWeight: "500",
  },

  /* Bulletin Section */
  bulletinSection: {
    marginBottom: spacing.giant,
  },
  bulletinHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  bulletinLink: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4F46E5",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  bulletinCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.premium,
  },
  bulletinCardHighPriority: {
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  bulletinCardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  bulletinCategoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bulletinCategoryText: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bulletinUrgentPill: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  bulletinUrgentText: {
    fontSize: 8.5,
    fontWeight: "900",
    color: "#EF4444",
  },
  bulletinCardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  bulletinCardDate: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
    marginLeft: 8,
  },
  bulletinCardBody: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
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
  modalCloseBtnText: { fontSize: 11, color: "#64748B", fontWeight: "800" },

  /* Booking Item cards */
  bookingCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.premium,
  },
  bookingCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  bookingRoom: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  bookingHostel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  bookingDates: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: borderRadius.small,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  bookingDivider: { width: 1, height: 24, backgroundColor: "#E2E8F0" },
  dateLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  dateVal: { fontSize: 12, fontWeight: "700", color: "#1E293B" },
  bookingAmount: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  amountLabel: { fontSize: 11, color: "#64748B", fontWeight: "600" },
  amountVal: { fontSize: 14, fontWeight: "800", color: "#4F46E5" },

  /* Badge capsule */
  badge: {
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  badgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.3 },

  /* Outpass Card */
  leaveCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.premium,
  },
  leaveCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  leaveTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginRight: 8,
  },
  leaveReason: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 8,
    lineHeight: 18,
    fontWeight: "500",
  },
  leaveMeta: { flexDirection: "row", alignItems: "center" },
  leaveDate: {
    fontSize: 11,
    color: "#64748B",
    marginLeft: 4,
    fontWeight: "600",
  },

  /* Complaint Ticket */
  ticketCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.premium,
  },
  ticketTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginRight: 8,
  },
  ticketDetails: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: spacing.md,
  },
  ticketDesc: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: spacing.sm,
    fontWeight: "500",
  },
  ticketDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: spacing.sm,
  },
  ticketMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketDate: {
    fontSize: 11,
    color: "#64748B",
    marginLeft: 4,
    fontWeight: "600",
  },

  /* Notice items */
  noticeDetailCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.premium,
  },
  noticeDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  noticeDetailTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginRight: 8,
  },
  noticeDetailDate: { fontSize: 11, color: "#64748B", fontWeight: "600" },
  noticeDetailContent: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
    fontWeight: "500",
  },

  /* Interactive Form Cards */
  formCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.lg,
    ...shadows.premium,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: borderRadius.small,
    height: 46,
    paddingHorizontal: spacing.md,
    fontSize: 14,
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

  /* Empty state details */
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.xxl,
    alignItems: "center",
    ...shadows.premium,
  },
  emptyText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
  },

  /* Today's Mess Menu Widget Styles */
  messWidgetContainer: {
    marginBottom: spacing.lg,
  },
  messCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.md,
    ...shadows.premium,
  },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  mealRowActive: {
    backgroundColor: "#F8FAFC",
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 0,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  mealLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1.2,
  },
  mealIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  mealIconWrapperActive: {
    backgroundColor: "#E0F2FE",
  },
  inactiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#94A3B8",
  },
  mealName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  mealNameActive: {
    color: "#0F172A",
    fontWeight: "800",
  },
  mealTime: {
    fontSize: 9,
    color: "#94A3B8",
    fontWeight: "600",
    marginTop: 2,
  },
  mealMenu: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
    textAlign: "right",
  },
  mealMenuActive: {
    color: "#0284C7",
    fontWeight: "800",
  },
  activeTag: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  activeTagText: {
    fontSize: 7,
    fontWeight: "800",
    color: "#065F46",
  },
  mealRight: {
    flex: 1,
    alignItems: "flex-end",
  },

  /* Campus Highlights Carousel Styles */
  highlightCard: {
    width: SCREEN_WIDTH * 0.58,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#EFF2F5",
    marginRight: 2,
    ...shadows.premium,
  },
  highlightTag: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 6,
  },
  highlightTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  highlightDesc: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
    fontWeight: "500",
  },

  /* FAQ Accordion Styles */
  faqContainer: {
    marginBottom: spacing.lg,
  },
  faqCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.md,
    marginBottom: spacing.xs,
    ...shadows.premium,
  },
  faqCardExpanded: {
    borderColor: "#E2E8F0",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  faqIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  faqQuestion: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    flex: 1,
  },
  faqQuestionExpanded: {
    color: colors.primary,
    fontWeight: "800",
  },
  faqBody: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: spacing.md,
  },
  faqAnswer: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 18,
    fontWeight: "500",
  },

  /* Notice Board Redesign Styles */
  modalCountBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 6,
  },
  modalCountText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
  },
  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    height: 40,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchBarInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "500",
    paddingVertical: 0,
  },
  noticeDetailCardHigh: {
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
    backgroundColor: "#FFF5F5",
    borderColor: "#FEE2E2",
  },
  noticeDetailCardExpanded: {
    borderColor: "#CBD5E1",
  },
  noticeDetailLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  noticeIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  noticeIconWrapperHigh: {
    backgroundColor: "#FEE2E2",
  },
  noticeDetailTitleActive: {
    color: colors.primary,
    fontWeight: "800",
  },
  highPriorityBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  highPriorityBadgeText: {
    fontSize: 7,
    fontWeight: "900",
    color: "#EF4444",
  },
  noticeExpandedContentWrapper: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: spacing.md,
  },
  noticeFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
  },
  noticeAuthorText: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
  },

  /* Housekeeping Tab & Modal Styles */
  tabBarContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: borderRadius.medium,
    padding: 4,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.medium - 2,
  },
  tabButtonActive: {
    backgroundColor: colors.white,
    ...shadows.premium,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: "800",
  },
  logCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.premium,
  },
  logCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  logCardDate: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  logCardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  logCardMetaLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginRight: 4,
  },
  logCardMetaValue: {
    fontSize: 11,
    color: "#1E293B",
    fontWeight: "700",
  },
  logNotesBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: borderRadius.small,
    padding: spacing.md,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  logNotesText: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
    fontWeight: "500",
  },

  /* Complaints Widget Styles */
  complWidgetContainer: {
    marginBottom: spacing.xl,
  },
  complWidgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  complWidgetLink: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4F46E5",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  complCleanCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
    padding: spacing.lg,
    ...shadows.premium,
  },
  complCleanIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  complCleanTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#065F46",
    marginBottom: 2,
  },
  complCleanDesc: {
    fontSize: 11,
    color: "#047857",
    fontWeight: "500",
  },
  complCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.lg,
    marginBottom: spacing.xs,
    ...shadows.premium,
  },
  complCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  complTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  complDesc: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  complProgressBox: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: spacing.sm,
  },
  complProgressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  complProgressStatusLabel: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  complProgressPercentText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94A3B8",
  },
  complProgressBarBg: {
    height: 4,
    backgroundColor: "#F1F5F9",
    borderRadius: 2,
    overflow: "hidden",
  },
  complProgressBarFill: {
    height: "100%",
    borderRadius: 2,
  },

  /* Booking Card Redesign Styles for Modal */
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

  /* Skeleton Loading Styles */
  skeletonCard: {
    backgroundColor: "#F1F5F9",
    borderRadius: borderRadius.large,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    opacity: 0.6,
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  skeletonCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
    marginRight: 8,
  },
  skeletonTitleLine: {
    width: "40%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
  },
  skeletonBodyLine: {
    width: "90%",
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E2E8F0",
    marginBottom: 6,
  },
});
