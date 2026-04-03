import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useVaults, type Vault } from "@/context/VaultContext";
import { TransactionItem } from "@/components/TransactionItem";

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function MainVaultBlock({
  mainVault,
  childVaults,
  index,
}: {
  mainVault: Vault;
  childVaults: Vault[];
  index: number;
}) {
  const totalIn = mainVault.transactions
    .filter((t) => t.type === "credit")
    .reduce((s, t) => s + t.amount, 0);
  const totalChildSpent = childVaults.reduce((sum, cv) => {
    return (
      sum +
      cv.transactions
        .filter((tx) => tx.type === "debit")
        .reduce((s, tx) => s + tx.amount, 0)
    );
  }, 0);
  const mainAvailable = totalIn - totalChildSpent;
  const totalAllocated = childVaults.reduce((s, v) => s + v.balance, 0);

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 80)}
      style={styles.mainBlock}
    >
      {/* Main Vault Card */}
      <Pressable
        style={({ pressed }) => [
          styles.mainVaultCard,
          { opacity: pressed ? 0.93 : 1 },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: "/vault/[id]", params: { id: mainVault.id } });
        }}
      >
        <LinearGradient colors={["#2A2050", "#1A1F3A"]} style={styles.mainVaultGradient}>
          <View style={styles.mainVaultTop}>
            <View style={[styles.mainVaultIcon, { backgroundColor: `${mainVault.color}25` }]}>
              <Text style={styles.mainVaultIconText}>{mainVault.icon}</Text>
            </View>
            <View style={styles.mainVaultMeta}>
              <Text style={styles.mainVaultName}>{mainVault.name}</Text>
              <View style={styles.mainBadge}>
                <Feather name="shield" size={9} color={Colors.accent} />
                <Text style={styles.mainBadgeText}>MAIN VAULT</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
          </View>

          <View style={styles.mainVaultBalanceRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={[styles.mainVaultBalance, { color: mainVault.color || Colors.accent }]}>
                {formatCurrency(totalIn)}
              </Text>
              <View style={styles.mainVaultSubRow}>
                <View style={styles.miniPill}>
                  <Feather name="check-circle" size={10} color={Colors.success} />
                  <Text style={[styles.miniPillText, { color: Colors.success }]}>
                    Available {formatCurrency(mainAvailable)}
                  </Text>
                </View>
                {totalChildSpent > 0 && (
                  <View style={[styles.miniPill, { backgroundColor: `${Colors.danger}10`, borderColor: `${Colors.danger}25` }]}>
                    <Feather name="trending-down" size={10} color={Colors.danger} />
                    <Text style={[styles.miniPillText, { color: Colors.danger }]}>
                      Spent {formatCurrency(totalChildSpent)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>
      </Pressable>

      {/* Sub-Vaults */}
      <View style={styles.childSection}>
        <View style={styles.connectorLine} />

        <View style={styles.childHeader}>
          <View style={styles.childHeaderLeft}>
            <View style={styles.childDot} />
            <Text style={styles.childTitle}>Sub-Vaults</Text>
            {childVaults.length > 0 && (
              <View style={styles.childCount}>
                <Text style={styles.childCountText}>{childVaults.length}</Text>
              </View>
            )}
          </View>
          <Pressable
            style={styles.addChildBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: "/vault/create", params: { parentId: mainVault.id } });
            }}
          >
            <Feather name="plus" size={14} color={Colors.accent} />
            <Text style={styles.addChildText}>Add</Text>
          </Pressable>
        </View>

        {childVaults.length === 0 ? (
          <Pressable
            style={styles.emptyChildCard}
            onPress={() =>
              router.push({ pathname: "/vault/create", params: { parentId: mainVault.id } })
            }
          >
            <Feather name="plus-circle" size={20} color={Colors.muted} />
            <Text style={styles.emptyChildText}>Add sub-vaults to organise expenses</Text>
            <Text style={styles.emptyChildHint}>e.g. Home, Construction, Marriage</Text>
          </Pressable>
        ) : (
          <View style={styles.childList}>
            {childVaults.map((vault, i) => {
              const isLast = i === childVaults.length - 1;
              const credit = vault.transactions
                .filter((t) => t.type === "credit")
                .reduce((s, t) => s + t.amount, 0);
              const debit = vault.transactions
                .filter((t) => t.type === "debit")
                .reduce((s, t) => s + t.amount, 0);

              return (
                <Animated.View
                  key={vault.id}
                  entering={FadeInDown.duration(280).delay(i * 50)}
                  style={styles.childRowWrap}
                >
                  <View style={styles.branchWrap}>
                    <View style={[styles.branchVert, isLast && { height: 28 }]} />
                    <View style={styles.branchHoriz} />
                  </View>
                  <Pressable
                    style={({ pressed }) => [styles.childCard, { opacity: pressed ? 0.88 : 1 }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({ pathname: "/vault/[id]", params: { id: vault.id } });
                    }}
                  >
                    <View style={[styles.childVaultIcon, { backgroundColor: `${vault.color}22` }]}>
                      <Text style={styles.childVaultIconText}>{vault.icon}</Text>
                    </View>
                    <View style={styles.childCardInfo}>
                      <Text style={styles.childCardName}>{vault.name}</Text>
                      <View style={styles.childCardStats}>
                        <Feather name="arrow-down-left" size={10} color={Colors.success} />
                        <Text style={styles.childStatText}>{formatCurrency(credit)}</Text>
                        <Text style={styles.childStatDot}>·</Text>
                        <Feather name="arrow-up-right" size={10} color={Colors.danger} />
                        <Text style={styles.childStatText}>{formatCurrency(debit)}</Text>
                      </View>
                    </View>
                    <View style={styles.childCardRight}>
                      <Text style={[styles.childBalance, { color: vault.color || Colors.accent }]}>
                        {formatCurrency(vault.balance)}
                      </Text>
                      <Feather name="chevron-right" size={14} color={Colors.muted} />
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { vaults, mainVaults, isLoading, refreshVaults } = useVaults();

  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1200 }),
        withTiming(1, { duration: 1200 })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  if (!user) {
    router.replace("/(auth)");
    return null;
  }

  const recentTransactions = vaults
    .flatMap((v) => v.transactions.map((t) => ({ ...t, vaultName: v.name })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const grandTotal = vaults.reduce((s, v) => s + v.balance, 0);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshVaults} tintColor={Colors.accent} />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <View style={styles.headerRight}>
            {vaults.length > 0 && (
              <View style={styles.totalPill}>
                <Text style={styles.totalPillLabel}>Total</Text>
                <Text style={styles.totalPillValue}>{formatCurrency(grandTotal)}</Text>
              </View>
            )}
            <Pressable style={styles.notifButton} onPress={() => Haptics.selectionAsync()}>
              <Feather name="bell" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>
        </Animated.View>

        {/* "New Main Vault" button — always visible */}
        <Animated.View entering={FadeIn.duration(400).delay(60)} style={styles.newMainRow}>
          <Text style={styles.vaultsHeading}>
            {mainVaults.length === 0
              ? "Get Started"
              : `Main Vaults (${mainVaults.length})`}
          </Text>
          <Pressable
            style={styles.newMainBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: "/vault/create", params: { isMain: "true" } });
            }}
          >
            <Feather name="plus" size={14} color={Colors.accent} />
            <Text style={styles.newMainText}>New Main Vault</Text>
          </Pressable>
        </Animated.View>

        {/* Loading skeleton */}
        {isLoading ? (
          <Animated.View style={[styles.skeleton, pulseStyle]} />
        ) : mainVaults.length === 0 ? (
          /* Empty state */
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <Pressable
              style={styles.emptyMainCard}
              onPress={() =>
                router.push({ pathname: "/vault/create", params: { isMain: "true" } })
              }
            >
              <LinearGradient colors={["#2A2050", "#1A1F3A"]} style={styles.emptyMainGradient}>
                <View style={styles.emptyMainIcon}>
                  <Feather name="shield" size={28} color={Colors.muted} />
                </View>
                <Text style={styles.emptyMainTitle}>No Vaults Yet</Text>
                <Text style={styles.emptyMainSub}>
                  Create your first main vault. Each main vault can hold multiple sub-vaults to organise your expenses.
                </Text>
                <LinearGradient
                  colors={[Colors.accent, Colors.accentLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emptyMainBtn}
                >
                  <Feather name="plus" size={16} color={Colors.primary} />
                  <Text style={styles.emptyMainBtnText}>Create Main Vault</Text>
                </LinearGradient>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ) : (
          /* All main vaults with their children */
          <View>
            {mainVaults.map((mv, i) => {
              const children = vaults.filter((v) => !v.isMain && v.parentId === mv.id);
              return (
                <MainVaultBlock
                  key={mv.id}
                  mainVault={mv}
                  childVaults={children}
                  index={i}
                />
              );
            })}
          </View>
        )}

        {/* Recent Activity */}
        {recentTransactions.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </View>
            <View style={styles.txCard}>
              {recentTransactions.map((tx, i) => (
                <React.Fragment key={tx.id}>
                  <TransactionItem transaction={tx} showVaultName={(tx as any).vaultName} />
                  {i < recentTransactions.length - 1 && <View style={styles.separator} />}
                </React.Fragment>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flex: 1 },
  content: { paddingTop: 16 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  greeting: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  userName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  totalPill: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  totalPillLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.textSecondary,
    lineHeight: 12,
  },
  totalPillValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.accent,
  },
  notifButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  newMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  vaultsHeading: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  newMainBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: `${Colors.accent}18`,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  newMainText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.accent,
  },

  skeleton: {
    height: 180,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    marginHorizontal: 20,
    marginBottom: 8,
  },

  /* Empty state */
  emptyMainCard: {
    marginHorizontal: 20,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  emptyMainGradient: {
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  emptyMainIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyMainTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.textPrimary,
  },
  emptyMainSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 6,
  },
  emptyMainBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyMainBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.primary,
  },

  /* Per-main-vault block */
  mainBlock: {
    marginBottom: 20,
  },
  mainVaultCard: {
    marginHorizontal: 20,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mainVaultGradient: { padding: 20 },
  mainVaultTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  mainVaultIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  mainVaultIconText: { fontSize: 22 },
  mainVaultMeta: { flex: 1 },
  mainVaultName: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  mainBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  mainBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.accent,
    letterSpacing: 0.8,
  },
  mainVaultBalanceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  balanceLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 3,
  },
  mainVaultBalance: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    letterSpacing: -0.8,
  },
  mainVaultSubRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  miniPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${Colors.success}12`,
    borderWidth: 1,
    borderColor: `${Colors.success}28`,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  miniPillText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.success,
  },

  /* Sub-vaults tree */
  childSection: {
    marginLeft: 36,
    marginRight: 20,
    marginTop: 0,
  },
  connectorLine: {
    width: 2,
    height: 16,
    backgroundColor: Colors.border,
    marginLeft: 12,
  },
  childHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  childHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  childDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    marginLeft: 8,
  },
  childTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  childCount: {
    backgroundColor: `${Colors.accent}22`,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  childCountText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: Colors.accent,
  },
  addChildBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: `${Colors.accent}14`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addChildText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.accent,
  },

  emptyChildCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
    padding: 18,
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  emptyChildText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  emptyChildHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
    textAlign: "center",
  },

  childList: { gap: 8 },
  childRowWrap: { flexDirection: "row", alignItems: "flex-start" },
  branchWrap: { width: 22, alignItems: "flex-start" },
  branchVert: {
    width: 2,
    height: "100%",
    backgroundColor: Colors.border,
    position: "absolute",
    left: 10,
    top: 0,
  },
  branchHoriz: {
    width: 12,
    height: 2,
    backgroundColor: Colors.border,
    marginTop: 26,
    marginLeft: 10,
  },
  childCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    gap: 10,
  },
  childVaultIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  childVaultIconText: { fontSize: 18 },
  childCardInfo: { flex: 1 },
  childCardName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  childCardStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  childStatText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  childStatDot: { color: Colors.muted, fontSize: 11 },
  childCardRight: { alignItems: "flex-end", gap: 4 },
  childBalance: { fontFamily: "Inter_700Bold", fontSize: 14 },

  /* Recent activity */
  section: { marginTop: 8, marginBottom: 8 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  txCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 20 + 42 + 14,
  },
});
