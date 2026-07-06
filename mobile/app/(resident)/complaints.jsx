import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  UIManager,
  LayoutAnimation,
  Dimensions,
  Animated,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../../lib/api";
import { colors, spacing, borderRadius, shadows } from "../../lib/theme";
import {
  X,
  Send,
  Plus,
  Wifi,
  Wrench,
  Shield,
  Trash2,
  AlertTriangle,
  MessageSquare,
  Clipboard,
  Calendar,
} from "lucide-react-native";

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CATEGORIES = [
  { label: "Maintenance", value: "MAINTENANCE", icon: Wrench, color: "#4F46E5" },
  { label: "Internet", value: "INTERNET", icon: Wifi, color: "#2563EB" },
  { label: "Cleanliness", value: "CLEANLINESS", icon: Clipboard, color: "#10B981" },
  { label: "Security", value: "SECURITY", icon: Shield, color: "#EA4335" },
  { label: "Noise / Disturbance", value: "NOISE", icon: AlertTriangle, color: "#D97706" },
  { label: "Other", value: "OTHER", icon: InfoIcon, color: "#64748B" },
];

function InfoIcon(props) {
  return <Text style={{ fontSize: 13, fontWeight: "900", color: props.color || "#64748B" }}>ℹ️</Text>;
}

const PRIORITIES = [
  { label: "Low", value: "LOW", color: "#64748B" },
  { label: "Medium", value: "MEDIUM", color: "#2563EB" },
  { label: "High / Urgent", value: "HIGH", color: "#EA4335" },
];

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

function ComplaintsSkeleton({ insets }) {
  const bg = '#E2E8F0';
  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC', paddingTop: insets?.top || 0 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <View style={{ width: 120, height: 16, borderRadius: 6, backgroundColor: bg, marginBottom: 6 }} />
          <View style={{ width: 200, height: 11, borderRadius: 5, backgroundColor: bg }} />
        </View>
        <View style={{ width: 100, height: 34, borderRadius: 10, backgroundColor: bg }} />
      </View>
      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 14 }}>
        {[1,2,3].map(i => (
          <View key={i} style={{ flex: 1, height: 68, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9' }} />
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }} scrollEnabled={false}>
        <PulsingSkeleton>
          <View style={{ width: 160, height: 10, borderRadius: 5, backgroundColor: bg, marginBottom: 12 }} />
          {[1,2,3,4].map(i => (
            <View key={i} style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', padding: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{ gap: 7 }}>
                  <View style={{ width: 140, height: 13, borderRadius: 5, backgroundColor: bg }} />
                  <View style={{ width: 90, height: 10, borderRadius: 4, backgroundColor: bg }} />
                </View>
                <View style={{ width: 60, height: 22, borderRadius: 8, backgroundColor: bg }} />
              </View>
              <View style={{ width: '85%', height: 9, borderRadius: 4, backgroundColor: bg, marginBottom: 6 }} />
              <View style={{ width: '60%', height: 9, borderRadius: 4, backgroundColor: bg, marginBottom: 12 }} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ width: 60, height: 22, borderRadius: 8, backgroundColor: bg }} />
                <View style={{ width: 60, height: 22, borderRadius: 8, backgroundColor: bg }} />
              </View>
            </View>
          ))}
        </PulsingSkeleton>
      </ScrollView>
    </View>
  );
}

export default function Complaints() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  
  // Form states
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("MAINTENANCE");
  const [priority, setPriority] = useState("MEDIUM");
  const [commentText, setCommentText] = useState("");

  /* ─────────── Tanstack Queries ─────────── */
  const { data: complaintsData, isLoading, refetch } = useQuery({
    queryKey: ["resident_complaints"],
    queryFn: async () => {
      const res = await api.get("/api/complaints");
      return res.data;
    },
  });

  const complaints = complaintsData?.data || complaintsData?.complaints || [];

  const { mutate: createComplaint, isPending: submitting } = useMutation({
    mutationFn: (payload) => api.post("/api/complaints", payload),
    onSuccess: () => {
      Alert.alert("Success", "Your support ticket has been filed successfully.");
      setTitle("");
      setDesc("");
      setCategory("MAINTENANCE");
      setPriority("MEDIUM");
      setIsFormOpen(false);
      qc.invalidateQueries(["resident_complaints"]);
    },
    onError: (err) => {
      Alert.alert("Submission Failed", err.response?.data?.error || "Something went wrong.");
    },
  });

  const { mutate: addComment, isPending: sendingComment } = useMutation({
    mutationFn: (payload) => api.post("/api/complaints/comments", payload),
    onSuccess: (res) => {
      setCommentText("");
      // Update active ticket state to show new comment in timeline instantly
      if (activeTicket) {
        const newComment = res.data?.data || res.data || {};
        // Retrieve fresh user info to mock locally or query update
        setActiveTicket((prev) => ({
          ...prev,
          comments: [...(prev.comments || []), newComment],
        }));
      }
      qc.invalidateQueries(["resident_complaints"]);
    },
    onError: (err) => {
      Alert.alert("Comment Failed", err.response?.data?.error || "Unable to post comment.");
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) return Alert.alert("Required", "Please supply a complaint title.");
    if (!desc.trim()) return Alert.alert("Required", "Please supply a detailed description.");
    createComplaint({
      title: title.trim(),
      description: desc.trim(),
      category,
      priority,
    });
  };

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    addComment({
      complaintId: activeTicket.id,
      message: commentText.trim(),
    });
  };

  const toggleFormDrawer = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFormOpen(!isFormOpen);
  };

  const selectTicket = (ticket) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setActiveTicket(ticket);
  };

  if (isLoading && !complaintsData) {
    return <ComplaintsSkeleton insets={insets} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header Section */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderContent}>
          <View>
            <Text style={styles.topHeaderTitle}>Support Center</Text>
            <Text style={styles.topHeaderSubtitle}>HMS Helplines & Maintenance Logs</Text>
          </View>
          <TouchableOpacity
            style={styles.newTicketBtn}
            onPress={toggleFormDrawer}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.newTicketBtnText}>FILE TICKET</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Form Drawer (Render inline with smooth height change) */}
      {isFormOpen && (
        <View style={styles.formContainer}>
          <Text style={styles.sectionHeader}>FILE A SERVICE TICKET</Text>
          
          <TextInput
            style={styles.input}
            placeholder="What is the issue? (e.g., WiFi disconnected)"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Explain the problem in detail so the warden can resolve it..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            value={desc}
            onChangeText={setDesc}
          />

          <Text style={styles.inputSubLabel}>CATEGORY TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.value;
              const Icon = cat.icon;
              return (
                <TouchableOpacity
                  key={cat.value}
                  onPress={() => setCategory(cat.value)}
                  style={[
                    styles.catChip,
                    isSelected && { backgroundColor: cat.color, borderColor: cat.color },
                  ]}
                  activeOpacity={0.8}
                >
                  <Icon size={12} color={isSelected ? "#FFF" : cat.color} style={{ marginRight: 6 }} />
                  <Text style={[styles.catChipText, isSelected && { color: "#FFF" }]}>{cat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.inputSubLabel, { marginTop: spacing.md }]}>PRIORITY LEVEL</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => {
              const isSelected = priority === p.value;
              return (
                <TouchableOpacity
                  key={p.value}
                  onPress={() => setPriority(p.value)}
                  style={[
                    styles.priorityChip,
                    isSelected && { borderColor: p.color, backgroundColor: p.color + "15" },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.priorityChipText, { color: p.color }]}>{p.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={toggleFormDrawer}>
              <Text style={styles.cancelBtnText}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Complaints History List */}
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        <Text style={styles.sectionHeader}>SUPPORT TICKET ARCHIVES ({complaints.length})</Text>
        
        {complaints.length === 0 ? (
          <View style={styles.emptyCard}>
            <AlertTriangle size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyText}>You haven't filed any complaints yet.</Text>
          </View>
        ) : (
          complaints.map((ticket) => {
            const isResolved = ticket.status === "RESOLVED";
            const isPending = ticket.status === "PENDING";
            const catObj = CATEGORIES.find((c) => c.value === ticket.category) || CATEGORIES[5];
            const CatIcon = catObj.icon;

            let badgeBg = "#EFF6FF";
            let badgeText = "#2563EB";
            if (isResolved) {
              badgeBg = "#ECFDF5";
              badgeText = "#10B981";
            } else if (isPending) {
              badgeBg = "#FFFBEB";
              badgeText = "#D97706";
            }

            return (
              <TouchableOpacity
                key={ticket.id}
                style={styles.ticketCard}
                onPress={() => selectTicket(ticket)}
                activeOpacity={0.85}
              >
                <View style={styles.ticketHeader}>
                  <View style={[styles.categoryCircle, { backgroundColor: catObj.color + "15" }]}>
                    <CatIcon size={14} color={catObj.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.ticketTitle} numberOfLines={1}>
                      {ticket.title}
                    </Text>
                    <Text style={styles.ticketMeta}>
                      ID: {ticket.uid || "#" + ticket.id.slice(-6).toUpperCase()} ·{" "}
                      {new Date(ticket.createdAt).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.statusBadgeText, { color: badgeText }]}>
                      {ticket.status}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.ticketDesc} numberOfLines={2}>
                  {ticket.description}
                </Text>

                {ticket.comments?.length > 0 && (
                  <View style={styles.commentsIndicator}>
                    <MessageSquare size={12} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.commentsIndicatorText}>
                      {ticket.comments.length} message{ticket.comments.length > 1 ? "s" : ""}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Ticket Comments Detail Drawer Modal */}
      <Modal
        visible={!!activeTicket}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveTicket(null)}
      >
        {activeTicket && (
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTopHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.modalHeading} numberOfLines={1}>{activeTicket.title}</Text>
                <Text style={styles.modalSubheading}>
                  Logged on {new Date(activeTicket.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setActiveTicket(null)}
              >
                <X size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Chat Timeline list */}
            <ScrollView style={styles.modalTimelineScroll} contentContainerStyle={{ padding: spacing.lg }}>
              {/* Main description badge card */}
              <View style={styles.modalDescriptionCard}>
                <Text style={styles.modalDescriptionLabel}>TICKET DETAILS</Text>
                <Text style={styles.modalDescriptionText}>{activeTicket.description}</Text>
                
                <View style={styles.modalMetaRow}>
                  <View style={styles.metaBadgeItem}>
                    <Text style={styles.metaBadgeLabel}>CATEGORY</Text>
                    <Text style={styles.metaBadgeValue}>{activeTicket.category}</Text>
                  </View>
                  <View style={styles.metaBadgeItem}>
                    <Text style={styles.metaBadgeLabel}>PRIORITY</Text>
                    <Text style={[styles.metaBadgeValue, { color: activeTicket.priority === "HIGH" ? "#EA4335" : "#2563EB" }]}>
                      {activeTicket.priority}
                    </Text>
                  </View>
                  <View style={styles.metaBadgeItem}>
                    <Text style={styles.metaBadgeLabel}>STATUS</Text>
                    <Text style={styles.metaBadgeValue}>{activeTicket.status}</Text>
                  </View>
                </View>

                {activeTicket.resolutionNotes && (
                  <View style={styles.resolutionBox}>
                    <Text style={styles.resolutionTitle}>RESOLUTION NOTES</Text>
                    <Text style={styles.resolutionText}>{activeTicket.resolutionNotes}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.timelineTitle}>CONVERSATION HISTORY</Text>

              {(!activeTicket.comments || activeTicket.comments.length === 0) ? (
                <View style={styles.emptyCommentsBox}>
                  <MessageSquare size={20} color="#94A3B8" style={{ marginBottom: 4 }} />
                  <Text style={styles.emptyCommentsText}>
                    No communication messages logged yet. Use the chat bar below to notify the hostel warden.
                  </Text>
                </View>
              ) : (
                activeTicket.comments.map((comment, index) => {
                  const isWarden = comment.User?.role === "WARDEN" || comment.User?.role === "ADMIN";
                  return (
                    <View
                      key={comment.id || index}
                      style={[
                        styles.commentBubble,
                        isWarden ? styles.commentBubbleLeft : styles.commentBubbleRight,
                      ]}
                    >
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>
                          {isWarden ? "HMS Staff (" + comment.User?.name + ")" : "You"}
                        </Text>
                        <Text style={styles.commentTime}>
                          {new Date(comment.createdAt).toLocaleDateString("en-PK", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                      <Text style={styles.commentMessage}>{comment.message}</Text>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Chat Input Bar */}
            <View style={[styles.modalInputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <TextInput
                style={styles.modalChatInput}
                placeholder="Type your message to the warden..."
                placeholderTextColor="#94A3B8"
                value={commentText}
                onChangeText={setCommentText}
                onSubmitEditing={handlePostComment}
              />
              <TouchableOpacity
                style={[styles.sendCommentBtn, !commentText.trim() && { opacity: 0.6 }]}
                onPress={handlePostComment}
                disabled={!commentText.trim() || sendingComment}
              >
                {sendingComment ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Send size={15} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    height: 58,
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
  newTicketBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  newTicketBtnText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  /* Form Drawer */
  formContainer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderBottomWidth: 1.5,
    borderBottomColor: "#E2E8F0",
    ...shadows.premium,
  },
  sectionHeader: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1.2,
    marginBottom: spacing.md,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: borderRadius.small,
    height: 42,
    paddingHorizontal: spacing.md,
    fontSize: 13,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
    marginBottom: spacing.md,
  },
  multiline: { height: 72, paddingTop: spacing.sm, textAlignVertical: "top" },
  inputSubLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  categoryScroll: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: borderRadius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 6,
  },
  catChipText: {
    fontSize: 10,
    fontWeight: "750",
    color: "#475569",
  },
  priorityRow: {
    flexDirection: "row",
    gap: 6,
  },
  priorityChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  priorityChipText: {
    fontSize: 10,
    fontWeight: "800",
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: spacing.lg,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  submitBtn: {
    backgroundColor: "#4F46E5",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
  },
  submitBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  /* scroll and list body */
  scrollBody: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 40 },

  /* Empty State */
  emptyCard: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: borderRadius.large,
    padding: spacing.xl * 1.5,
    alignItems: "center",
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
  },

  /* Ticket card */
  ticketCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.md + 2,
    marginBottom: spacing.sm,
    ...shadows.premium,
  },
  ticketHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ticketTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  ticketMeta: {
    fontSize: 9,
    color: "#94A3B8",
    fontWeight: "600",
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  ticketDesc: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  commentsIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: spacing.sm,
  },
  commentsIndicatorText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
  },

  /* Modal timeline content */
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
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSubheading: {
    fontSize: 9,
    color: "#94A3B8",
    fontWeight: "600",
    marginTop: 1,
  },
  modalCloseCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTimelineScroll: {
    flex: 1,
  },
  modalDescriptionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: spacing.lg,
    ...shadows.premium,
    marginBottom: spacing.xl,
  },
  modalDescriptionLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalDescriptionText: {
    fontSize: 12,
    color: "#334155",
    lineHeight: 18,
  },
  modalMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  metaBadgeItem: {
    alignItems: "center",
    flex: 1,
  },
  metaBadgeLabel: {
    fontSize: 7,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  metaBadgeValue: {
    fontSize: 9,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 2,
  },
  resolutionBox: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  resolutionTitle: {
    fontSize: 8,
    fontWeight: "800",
    color: "#065F46",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  resolutionText: {
    fontSize: 11,
    color: "#047857",
    lineHeight: 15,
  },
  timelineTitle: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1.2,
    marginBottom: spacing.md,
  },
  emptyCommentsBox: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    borderRadius: borderRadius.large,
    padding: spacing.lg,
    alignItems: "center",
  },
  emptyCommentsText: {
    fontSize: 11,
    color: "#B45309",
    textAlign: "center",
    lineHeight: 16,
  },
  commentBubble: {
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.sm,
    maxWidth: "85%",
  },
  commentBubbleRight: {
    alignSelf: "flex-end",
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  commentBubbleLeft: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    gap: 12,
  },
  commentAuthor: {
    fontSize: 9,
    fontWeight: "800",
    color: "#475569",
  },
  commentTime: {
    fontSize: 8,
    color: "#94A3B8",
    fontWeight: "600",
  },
  commentMessage: {
    fontSize: 11,
    color: "#1E293B",
    lineHeight: 15,
  },

  /* Input chat bar */
  modalInputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    padding: spacing.md,
    gap: 8,
  },
  modalChatInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 12,
    color: "#1E293B",
  },
  sendCommentBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
});
