import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  Linking,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  Download,
  CreditCard,
  Banknote,
  Calendar,
  Building,
  ShieldCheck,
} from "lucide-react-native";
import api from "../../lib/api";
import { colors, spacing, borderRadius, shadows } from "../../lib/theme";
import Constants from "expo-constants";
import * as SecureStore from "../../lib/storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/* Build base URL matching api.js logic */
function getBaseUrl() {
  if (Constants.expoConfig?.hostUri) {
    const host = Constants.expoConfig.hostUri.split(":")[0];
    return `http://${host}:3000`;
  }
  return "http://localhost:3000";
}

/* ─────────── Status Meta ─────────── */
const STATUS_META = {
  PAID: {
    label: "Paid",
    bgColor: "#ECFDF5",
    textColor: "#059669",
    borderColor: "#A7F3D0",
    icon: CheckCircle2,
  },
  PENDING: {
    label: "Pending",
    bgColor: "#FFFBEB",
    textColor: "#D97706",
    borderColor: "#FDE68A",
    icon: Clock,
  },
  OVERDUE: {
    label: "Overdue",
    bgColor: "#FEF2F2",
    textColor: "#DC2626",
    borderColor: "#FECACA",
    icon: AlertCircle,
  },
  PARTIAL: {
    label: "Partial",
    bgColor: "#EFF6FF",
    textColor: "#2563EB",
    borderColor: "#BFDBFE",
    icon: Clock,
  },
};

/* ─────────── Payment Method Icons ─────────── */
const METHOD_META = {
  CASH: { label: "Cash", icon: Banknote, color: "#059669" },
  ONLINE: { label: "Online", icon: CreditCard, color: "#2563EB" },
  BANK_TRANSFER: { label: "Bank Transfer", icon: Building, color: "#7C3AED" },
  CHEQUE: { label: "Cheque", icon: Receipt, color: "#D97706" },
};

/* ─────────── Animated Progress Ring ─────────── */
function StatsProgressArc({ paid, total }) {
  const pct = total > 0 ? Math.min(paid / total, 1) : 0;
  const pctText = Math.round(pct * 100);

  return (
    <View style={styles.arcContainer}>
      <View style={styles.arcOuter}>
        <View style={styles.arcInner}>
          <Text style={styles.arcPct}>{pctText}%</Text>
          <Text style={styles.arcLabel}>Paid</Text>
        </View>
      </View>
    </View>
  );
}

/* ─────────── Invoice Card ─────────── */
function InvoiceCard({ invoice, onUpload, uploading, onDownload, downloadingId }) {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  const statusKey = invoice.status?.toUpperCase() || "PENDING";
  const meta = STATUS_META[statusKey] || STATUS_META.PENDING;
  const StatusIcon = meta.icon;

  const methodKey = invoice.method?.toUpperCase() || "CASH";
  const methodMeta = METHOD_META[methodKey] || METHOD_META.CASH;
  const MethodIcon = methodMeta.icon;

  const isPaid = statusKey === "PAID";

  const invoiceMonth = invoice.month || invoice.notes?.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/)?.[0];
  const invoiceYear = invoice.year || new Date(invoice.date || Date.now()).getFullYear();
  const displayTitle = invoiceMonth ? `${invoiceMonth} ${invoiceYear} — Rent` : (invoice.notes?.slice(0, 40) || "Accommodation Invoice");

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      <View style={[styles.invoiceCard, isPaid && styles.invoiceCardPaid]}>
        {/* Left Accent Stripe */}
        <View style={[styles.cardStripe, { backgroundColor: meta.textColor }]} />

        <View style={styles.cardBody}>
          {/* Top Row: Title + Status Badge */}
          <View style={styles.cardTopRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.invoiceTitle} numberOfLines={1}>{displayTitle}</Text>
              <View style={styles.cardMeta}>
                <Calendar size={13} color="#94A3B8" style={{ marginRight: 4 }} />
                <Text style={styles.cardMetaText}>
                  {new Date(invoice.date || Date.now()).toLocaleDateString("en-PK", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: meta.bgColor, borderColor: meta.borderColor }]}>
              <StatusIcon size={12} color={meta.textColor} style={{ marginRight: 3 }} />
              <Text style={[styles.statusBadgeText, { color: meta.textColor }]}>{meta.label}</Text>
            </View>
          </View>

          {/* Amount display */}
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>AMOUNT DUE</Text>
            <Text style={[styles.amount, isPaid && styles.amountPaid]}>
              PKR {Number(invoice.amount || 0).toLocaleString()}
            </Text>
          </View>

          {/* Payment method chip */}
          <View style={styles.methodRow}>
            <View style={[styles.methodChip, { backgroundColor: methodMeta.color + "12" }]}>
              <MethodIcon size={14} color={methodMeta.color} style={{ marginRight: 4 }} />
              <Text style={[styles.methodChipText, { color: methodMeta.color }]}>{methodMeta.label}</Text>
            </View>
            {invoice.uid && (
              <Text style={styles.uidText}>#{invoice.uid}</Text>
            )}
          </View>

          {/* Notes / reference */}
          {invoice.notes ? (
            <Text style={styles.invoiceNotes} numberOfLines={2}>{invoice.notes}</Text>
          ) : null}

          {/* Upload Receipt Action */}
          {!isPaid && (
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={() => onUpload(invoice.id)}
              disabled={uploading}
              activeOpacity={0.85}
            >
              {uploading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Upload size={16} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.uploadBtnText}>Upload Payment Receipt</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Paid: footer + download receipt */}
          {isPaid && (
            <>
              <View style={styles.paidFooter}>
                <CheckCircle2 size={14} color="#059669" style={{ marginRight: 5 }} />
                <Text style={styles.paidFooterText}>Payment verified and cleared</Text>
              </View>
              <TouchableOpacity
                style={styles.downloadBtn}
                activeOpacity={0.82}
                disabled={downloadingId === invoice.id}
                onPress={() => onDownload(invoice.id, invoice.uid)}
              >
                {downloadingId === invoice.id ? (
                  <ActivityIndicator size="small" color="#4F46E5" style={{ marginRight: 5 }} />
                ) : (
                  <Download size={15} color="#4F46E5" style={{ marginRight: 5 }} />
                )}
                <Text style={styles.downloadBtnText}>
                  {downloadingId === invoice.id ? "Downloading…" : "Download Receipt PDF"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

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

function PaymentsSkeleton({ insets }) {
  const bg = '#E2E8F0';
  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC', paddingTop: insets?.top || 0 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <View style={{ width: 130, height: 16, borderRadius: 6, backgroundColor: bg, marginBottom: 6 }} />
          <View style={{ width: 180, height: 11, borderRadius: 5, backgroundColor: bg }} />
        </View>
        <View style={{ width: 70, height: 26, borderRadius: 10, backgroundColor: bg }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }} scrollEnabled={false}>
        <PulsingSkeleton>
          {/* Stats cards */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            {[1,2,3].map(i => (
              <View key={i} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', padding: 14, alignItems: 'center', gap: 6 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: bg }} />
                <View style={{ width: 55, height: 13, borderRadius: 5, backgroundColor: bg }} />
                <View style={{ width: 45, height: 10, borderRadius: 4, backgroundColor: bg }} />
              </View>
            ))}
          </View>

          {/* Filter tabs */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
            {[1,2,3].map(i => (
              <View key={i} style={{ flex: 1, height: 34, borderRadius: 10, backgroundColor: bg }} />
            ))}
          </View>

          {/* Invoice cards */}
          {[1,2,3,4].map(i => (
            <View key={i} style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', padding: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ gap: 7 }}>
                  <View style={{ width: 100, height: 13, borderRadius: 5, backgroundColor: bg }} />
                  <View style={{ width: 70, height: 10, borderRadius: 4, backgroundColor: bg }} />
                </View>
                <View style={{ width: 65, height: 24, borderRadius: 8, backgroundColor: bg }} />
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1, height: 32, borderRadius: 8, backgroundColor: bg }} />
                <View style={{ flex: 1, height: 32, borderRadius: 8, backgroundColor: bg }} />
              </View>
            </View>
          ))}
        </PulsingSkeleton>
      </ScrollView>
    </View>
  );
}

/* ─────────── Main Screen ─────────── */
export default function Payments() {
  const insets = useSafeAreaInsets();
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [filter, setFilter] = useState("ALL"); // ALL | PENDING | PAID

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["resident_payments"],
    queryFn: async () => {
      const meRes = await api.get("/api/auth/me");
      const userId = meRes.data?.user?.id;
      const res = await api.get(`/api/payments?userId=${userId}&limit=50`);
      return res.data;
    },
  });

  const allPayments = data?.payments || data?.data || [];

  const filteredPayments = allPayments.filter((p) => {
    if (filter === "PAID") return p.status?.toUpperCase() === "PAID";
    if (filter === "PENDING") return p.status?.toUpperCase() !== "PAID";
    return true;
  });

  const totalAmount = allPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const paidAmount = allPayments
    .filter((p) => p.status?.toUpperCase() === "PAID")
    .reduce((s, p) => s + Number(p.amount || 0), 0);
  const pendingAmount = totalAmount - paidAmount;
  const pendingCount = allPayments.filter((p) => p.status?.toUpperCase() !== "PAID").length;


  const handleDownload = async (paymentId, uid) => {
    setDownloadingId(paymentId);
    try {
      const token = await SecureStore.getItemAsync("user_token");
      const base = getBaseUrl();
      const url = `${base}/api/payments/${paymentId}/receipt`;
      const dest = `${FileSystem.cacheDirectory}Receipt-${uid || paymentId.slice(-6)}.pdf`;

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        dest,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const downloadResult = await downloadResumable.downloadAsync();

      if (!downloadResult || downloadResult.status !== 200) {
        Alert.alert("Error", "Could not download receipt. Please try again.");
        return;
      }
      const { uri } = downloadResult;

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Receipt" });
      } else {
        Alert.alert("Downloaded", `Saved to: ${uri}`);
      }
    } catch (err) {
      Alert.alert("Download Failed", err.message || "Unable to download receipt.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleUpload = async (paymentId) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Please grant library access to upload receipts.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const uri = asset.uri;
    const filename = uri.split("/").pop() || "receipt.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const mimeType = match ? `image/${match[1].replace("jpg", "jpeg")}` : "image/jpeg";

    setUploading(true);
    try {
      // Step 1: Upload to Cloudinary
      const CLOUD_NAME = "dwrukwox4";
      const UPLOAD_PRESET = "iamges";

      const cloudForm = new FormData();
      cloudForm.append("file", { uri, name: filename, type: mimeType });
      cloudForm.append("upload_preset", UPLOAD_PRESET);
      cloudForm.append("folder", "payment_receipts");

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: cloudForm }
      );

      if (!cloudRes.ok) {
        const errText = await cloudRes.text();
        throw new Error(`Image upload failed: ${errText}`);
      }

      const cloudData = await cloudRes.json();
      const receiptUrl = cloudData.secure_url;

      if (!receiptUrl) {
        throw new Error("No URL returned from image upload.");
      }

      // Step 2: PATCH the payment record with the Cloudinary URL
      await api.patch(`/api/payments/${paymentId}`, {
        receiptUrl,
        method: "BANK_TRANSFER",
        status: "PENDING",
      });

      Alert.alert(
        "Receipt Uploaded ✅",
        "Your receipt has been submitted for review by the admin."
      );
      refetch();
    } catch (err) {
      console.error("[Receipt Upload] Error:", err.message);
      Alert.alert(
        "Upload Failed",
        err.message || "Unable to submit receipt. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  if (isLoading && !data) {
    return <PaymentsSkeleton insets={insets} />;
  }

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderContent}>
          <View>
            <Text style={styles.topHeaderTitle}>Payment Center</Text>
            <Text style={styles.topHeaderSubtitle}>Invoices & Rent Clearance</Text>
          </View>
          <View style={styles.headerBadge}>
            {pendingCount > 0 ? (
              <>
                <AlertCircle size={14} color="#DC2626" style={{ marginRight: 4 }} />
                <Text style={styles.headerBadgeText}>{pendingCount} Due</Text>
              </>
            ) : (
              <>
                <ShieldCheck size={14} color="#059669" style={{ marginRight: 4 }} />
                <Text style={[styles.headerBadgeText, { color: "#059669" }]}>All Clear</Text>
              </>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* Financial Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryLabel}>TOTAL OUTSTANDING</Text>
            <Text style={styles.summaryTotal}>PKR {totalAmount.toLocaleString()}</Text>

            <View style={styles.summaryRowDivider} />

            <View style={styles.summaryStatsGrid}>
              <View style={styles.summaryStatItem}>
                <View style={[styles.summaryStatDot, { backgroundColor: "#059669" }]} />
                <View>
                  <Text style={styles.summaryStatLabel}>PAID</Text>
                  <Text style={[styles.summaryStatVal, { color: "#059669" }]}>
                    PKR {paidAmount.toLocaleString()}
                  </Text>
                </View>
              </View>
              <View style={styles.summaryStatItem}>
                <View style={[styles.summaryStatDot, { backgroundColor: "#DC2626" }]} />
                <View>
                  <Text style={styles.summaryStatLabel}>PENDING</Text>
                  <Text style={[styles.summaryStatVal, { color: "#DC2626" }]}>
                    PKR {pendingAmount.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <StatsProgressArc paid={paidAmount} total={totalAmount} />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {["ALL", "PENDING", "PAID"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, filter === tab && styles.filterTabActive]}
              onPress={() => setFilter(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterTabText, filter === tab && styles.filterTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Invoice List */}
        <Text style={styles.sectionTitle}>
          {filter === "ALL" ? "ALL INVOICES" : filter === "PENDING" ? "PENDING DUES" : "PAYMENT HISTORY"}
          {" "}({filteredPayments.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
        ) : filteredPayments.length === 0 ? (
          <View style={styles.emptyCard}>
            <CheckCircle2 size={40} color="#A7F3D0" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>
              {filter === "PENDING" ? "No Pending Dues" : "No Records Found"}
            </Text>
            <Text style={styles.emptySubtext}>
              {filter === "PENDING"
                ? "You're all caught up! No outstanding payments."
                : "Your payment history will appear here."}
            </Text>
          </View>
        ) : (
          filteredPayments.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onUpload={handleUpload}
              uploading={uploading}
              onDownload={handleDownload}
              downloadingId={downloadingId}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

/* ─────────── Styles ─────────── */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },

  /* Header */
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
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  headerBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#DC2626",
  },

  container: { flex: 1 },
  contentContainer: { padding: spacing.lg, paddingBottom: 40 },

  /* Summary Card */
  summaryCard: {
    backgroundColor: "#1E293B",
    borderRadius: borderRadius.large,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...shadows.premium,
  },
  summaryLeft: { flex: 1, marginRight: spacing.lg },
  summaryLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  summaryTotal: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: -0.5,
    marginTop: 4,
  },
  summaryRowDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: spacing.md,
  },
  summaryStatsGrid: { flexDirection: "row", gap: spacing.xl },
  summaryStatItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  summaryStatDot: { width: 8, height: 8, borderRadius: 4 },
  summaryStatLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1,
  },
  summaryStatVal: {
    fontSize: 12,
    fontWeight: "900",
    marginTop: 1,
  },

  /* Arc Progress */
  arcContainer: { alignItems: "center", justifyContent: "center" },
  arcOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 3,
    borderColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
  },
  arcInner: { alignItems: "center" },
  arcPct: { fontSize: 18, fontWeight: "900", color: "#34D399" },
  arcLabel: { fontSize: 8, color: "rgba(255,255,255,0.5)", fontWeight: "700", marginTop: -2 },

  /* Filter Tabs */
  filterRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 3,
    marginBottom: spacing.lg,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: "#FFFFFF",
    ...shadows.premium,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  filterTabTextActive: {
    color: "#1E293B",
    fontWeight: "900",
  },

  /* Section title */
  sectionTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: spacing.sm + 2,
  },

  /* Invoice Card */
  invoiceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    marginBottom: spacing.md,
    flexDirection: "row",
    overflow: "hidden",
    ...shadows.premium,
  },
  invoiceCardPaid: {
    borderColor: "#D1FAE5",
    backgroundColor: "#FAFFFE",
  },
  cardStripe: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: spacing.lg,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  invoiceTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  cardMetaText: {
    fontSize: 9,
    color: "#94A3B8",
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  amountRow: { marginBottom: spacing.sm },
  amountLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  amount: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -1,
  },
  amountPaid: { color: "#059669" },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  methodChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  methodChipText: {
    fontSize: 10,
    fontWeight: "800",
  },
  uidText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94A3B8",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  invoiceNotes: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "500",
    lineHeight: 14,
    marginBottom: spacing.sm,
  },

  /* Upload Button */
  uploadBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: borderRadius.medium,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    ...shadows.premium,
  },
  uploadBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  /* Paid footer */
  paidFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    padding: spacing.sm,
  },
  paidFooterText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: borderRadius.medium,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: spacing.xs + 2,
    backgroundColor: "#EEF2FF",
  },
  downloadBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4F46E5",
  },

  /* Empty State */
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.giant * 1.5,
    backgroundColor: "#FFF",
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    ...shadows.premium,
    marginTop: spacing.sm,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 17,
    fontWeight: "500",
  },
});
