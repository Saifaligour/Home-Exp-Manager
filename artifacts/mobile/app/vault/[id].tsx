import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useVaults } from "@/context/VaultContext";
import { TransactionItem } from "@/components/TransactionItem";

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

type Tab = "transactions" | "sub-vaults" | "members";

export default function VaultDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { vaults, deleteTransaction, deleteVault, getVaultStats } = useVaults();
  const [activeTab, setActiveTab] = useState<Tab>("transactions");

  const vault = vaults.find((v) => v.id === id);
  const childVaults = vault?.isMain
    ? vaults.filter((v) => !v.isMain && v.parentId === vault.id)
    : [];
  const stats = vault ? getVaultStats(vault) : null;

  const isAdmin = vault?.members.some(
    (m) => m.userId === user?.id && m.role === "admin"
  ) ?? false;

  if (!vault) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <Feather name="alert-circle" size={40} color={Colors.muted} />
          <Text style={styles.notFoundText}>Vault not found</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const totalChildBalance = childVaults.reduce((s, v) => s + v.balance, 0);

  const handleDeleteTx = (txId: string, desc: string) => {
    if (!isAdmin) return;
    Alert.alert("Delete Transaction", `Delete "${desc}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteTransaction(vault.id, txId);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleDeleteVault = () => {
    if (!isAdmin) return;
    Alert.alert(
      "Delete Vault",
      `Are you sure you want to delete "${vault.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteVault(vault.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.replace("/");
          },
        },
      ]
    );
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "transactions", label: "Transactions", count: vault.transactions.length },
    ...(vault.isMain
      ? [{ key: "sub-vaults" as Tab, label: "Sub-Vaults", count: childVaults.length }]
      : []),
    { key: "members", label: "Members", count: vault.members.length },
  ];

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? 67 : insets.top },
      ]}
    >
      {/* Header */}
      <View style={styles.headerBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {vault.name}
          </Text>
          {vault.isMain && (
            <View style={styles.headerBadge}>
              <Feather name="shield" size={9} color={Colors.accent} />
              <Text style={styles.headerBadgeText}>MAIN</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {isAdmin && (
            <Pressable
              style={[styles.headerAction, styles.headerActionDanger]}
              onPress={handleDeleteVault}
            >
              <Feather name="trash-2" size={16} color={Colors.danger} />
            </Pressable>
          )}
          <Pressable
            style={styles.headerAction}
            onPress={() =>
              router.push({
                pathname: "/members/[vaultId]",
                params: { vaultId: vault.id },
              })
            }
          >
            <Feather name="users" size={18} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance card */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.balanceCard}
        >
          <LinearGradient colors={["#2A2050", "#1A1F3A"]} style={styles.balanceGradient}>
            <View style={styles.balanceIconRow}>
              <View
                style={[
                  styles.vaultIconBadge,
                  { backgroundColor: `${vault.color}22` },
                ]}
              >
                <Text style={styles.vaultIcon}>{vault.icon}</Text>
              </View>
              {vault.isMain && childVaults.length > 0 && (
                <View style={styles.childBadge}>
                  <Feather name="git-branch" size={10} color={Colors.textSecondary} />
                  <Text style={styles.childBadgeText}>
                    {childVaults.length} sub-vault{childVaults.length !== 1 ? "s" : ""}
                  </Text>
                </View>
              )}
            </View>

            {/* Main vault: Total balance (source of truth) + available breakdown */}
            {vault.isMain ? (
              <>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <Text style={[styles.balance, { color: vault.color || Colors.accent }]}>
                  {formatCurrency(stats?.totalIn ?? 0)}
                </Text>

                {/* Available breakdown pill */}
                <View style={styles.availableRow}>
                  <View style={styles.availablePill}>
                    <Feather name="check-circle" size={12} color={Colors.success} />
                    <Text style={styles.availablePillText}>
                      Available: {formatCurrency(vault.balance)}
                    </Text>
                  </View>
                  {(stats?.totalAllocated ?? 0) > 0 && (
                    <View style={[styles.availablePill, { backgroundColor: "rgba(167,139,250,0.12)", borderColor: "rgba(167,139,250,0.3)" }]}>
                      <Feather name="send" size={12} color="#A78BFA" />
                      <Text style={[styles.availablePillText, { color: "#A78BFA" }]}>
                        Allocated: {formatCurrency(stats?.totalAllocated ?? 0)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <View style={styles.statIcon}>
                      <Feather name="arrow-down-left" size={14} color={Colors.success} />
                    </View>
                    <Text style={styles.statLabel}>Total In</Text>
                    <Text style={[styles.statValue, { color: Colors.success }]}>
                      {formatCurrency(stats?.totalIn ?? 0)}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <View style={[styles.statIcon, { backgroundColor: "rgba(167,139,250,0.15)" }]}>
                      <Feather name="send" size={14} color="#A78BFA" />
                    </View>
                    <Text style={styles.statLabel}>Allocated</Text>
                    <Text style={[styles.statValue, { color: "#A78BFA" }]}>
                      {formatCurrency(stats?.totalAllocated ?? 0)}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <View style={[styles.statIcon, { backgroundColor: `${Colors.success}18` }]}>
                      <Feather name="check-circle" size={14} color={Colors.success} />
                    </View>
                    <Text style={styles.statLabel}>Available</Text>
                    <Text style={[styles.statValue, { color: Colors.success }]}>
                      {formatCurrency(vault.balance)}
                    </Text>
                  </View>
                </View>

                {childVaults.length > 0 && (
                  <View style={styles.childSummaryRow}>
                    <Feather name="git-branch" size={12} color={Colors.textSecondary} />
                    <Text style={styles.childSummaryText}>
                      {childVaults.length} sub-vault{childVaults.length !== 1 ? "s" : ""} hold{" "}
                      <Text style={{ color: Colors.accent }}>{formatCurrency(totalChildBalance)}</Text>
                    </Text>
                  </View>
                )}
              </>
            ) : (
              /* Child vault: show budget / spent / remaining */
              <>
                <Text style={styles.balanceLabel}>Remaining Budget</Text>
                <Text style={[styles.balance, { color: vault.color || Colors.accent }]}>
                  {formatCurrency(vault.balance)}
                </Text>

                {/* Budget progress bar */}
                {(stats?.budget ?? 0) > 0 && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(
                              100,
                              ((stats?.spent ?? 0) / (stats?.budget ?? 1)) * 100
                            )}%` as any,
                            backgroundColor:
                              (stats?.spent ?? 0) >= (stats?.budget ?? 0)
                                ? Colors.danger
                                : Colors.success,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressLabel}>
                      {Math.min(
                        100,
                        Math.round(
                          ((stats?.spent ?? 0) / (stats?.budget ?? 1)) * 100
                        )
                      )}% used
                    </Text>
                  </View>
                )}

                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <View style={[styles.statIcon, { backgroundColor: "rgba(167,139,250,0.15)" }]}>
                      <Feather name="arrow-left-circle" size={14} color="#A78BFA" />
                    </View>
                    <Text style={styles.statLabel}>Budget</Text>
                    <Text style={[styles.statValue, { color: "#A78BFA" }]}>
                      {formatCurrency(stats?.budget ?? 0)}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <View style={[styles.statIcon, { backgroundColor: `${Colors.danger}18` }]}>
                      <Feather name="arrow-up-right" size={14} color={Colors.danger} />
                    </View>
                    <Text style={styles.statLabel}>Spent</Text>
                    <Text style={[styles.statValue, { color: Colors.danger }]}>
                      {formatCurrency(stats?.spent ?? 0)}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <View style={styles.statIcon}>
                      <Feather name="check-circle" size={14} color={Colors.success} />
                    </View>
                    <Text style={styles.statLabel}>Remaining</Text>
                    <Text style={[styles.statValue, { color: Colors.success }]}>
                      {formatCurrency(vault.balance)}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Add transaction button */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.addTxButton}
        >
          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: "/transaction/add",
                params: { vaultId: vault.id },
              });
            }}
          >
            <LinearGradient
              colors={[Colors.accent, Colors.accentLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addTxGradient}
            >
              <Feather name="plus" size={20} color={Colors.primary} />
              <Text style={styles.addTxText}>Add Transaction</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Tabs */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(150)}
          style={styles.tabsContainer}
        >
          <View style={styles.tabs}>
            {tabs.map((tab) => (
              <Pressable
                key={tab.key}
                style={[
                  styles.tab,
                  activeTab === tab.key && styles.activeTab,
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.key && styles.activeTabText,
                  ]}
                >
                  {tab.label}
                  {tab.count > 0 ? ` (${tab.count})` : ""}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Tab content */}
        {activeTab === "transactions" && (
          <Animated.View entering={FadeInDown.duration(300)}>
            {vault.transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="activity" size={32} color={Colors.muted} />
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptySubtitle}>
                  Add your first credit or debit to get started
                </Text>
              </View>
            ) : (
              <View style={styles.txList}>
                {vault.transactions.map((tx, i) => (
                  <React.Fragment key={tx.id}>
                    <TransactionItem
                      transaction={tx}
                      onLongPress={
                        isAdmin
                          ? () => handleDeleteTx(tx.id, tx.description)
                          : undefined
                      }
                    />
                    {i < vault.transactions.length - 1 && (
                      <View style={styles.txSeparator} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {activeTab === "sub-vaults" && vault.isMain && (
          <Animated.View entering={FadeInDown.duration(300)}>
            {/* Add sub-vault button */}
            <Pressable
              style={styles.addChildBtn}
              onPress={() =>
                router.push({
                  pathname: "/vault/create",
                  params: { parentId: vault.id },
                })
              }
            >
              <Feather name="plus-circle" size={16} color={Colors.accent} />
              <Text style={styles.addChildText}>Add Sub-Vault</Text>
            </Pressable>

            {childVaults.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="git-branch" size={32} color={Colors.muted} />
                <Text style={styles.emptyTitle}>No sub-vaults yet</Text>
                <Text style={styles.emptySubtitle}>
                  Create sub-vaults like Home Expenses, Construction, or Marriage to organise your spending
                </Text>
              </View>
            ) : (
              <View style={styles.childList}>
                {childVaults.map((child) => {
                  const childStats = getVaultStats(child);
                  const spentPct =
                    childStats.budget > 0
                      ? Math.min(100, (childStats.spent / childStats.budget) * 100)
                      : 0;

                  return (
                    <Pressable
                      key={child.id}
                      style={({ pressed }) => [
                        styles.childCard,
                        { opacity: pressed ? 0.88 : 1 },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push({
                          pathname: "/vault/[id]",
                          params: { id: child.id },
                        });
                      }}
                    >
                      <View
                        style={[
                          styles.childCardIcon,
                          { backgroundColor: `${child.color}22` },
                        ]}
                      >
                        <Text style={styles.childCardIconText}>{child.icon}</Text>
                      </View>
                      <View style={styles.childCardInfo}>
                        <Text style={styles.childCardName}>{child.name}</Text>
                        <View style={styles.childCardStats}>
                          <Text style={[styles.childStatText, { color: "#A78BFA" }]}>
                            Budget {formatCurrency(childStats.budget)}
                          </Text>
                          <Text style={styles.childStatSep}>·</Text>
                          <Feather name="arrow-up-right" size={10} color={Colors.danger} />
                          <Text style={[styles.childStatText, { color: Colors.danger }]}>
                            {formatCurrency(childStats.spent)}
                          </Text>
                        </View>
                        {childStats.budget > 0 && (
                          <View style={styles.miniProgressTrack}>
                            <View
                              style={[
                                styles.miniProgressFill,
                                {
                                  width: `${spentPct}%` as any,
                                  backgroundColor:
                                    spentPct >= 100 ? Colors.danger : child.color || Colors.success,
                                },
                              ]}
                            />
                          </View>
                        )}
                      </View>
                      <View style={styles.childCardRight}>
                        <Text style={[styles.childBalance, { color: child.color || Colors.accent }]}>
                          {formatCurrency(child.balance)}
                        </Text>
                        <Text style={styles.childBalanceLabel}>remaining</Text>
                        <Feather name="chevron-right" size={14} color={Colors.muted} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Animated.View>
        )}

        {activeTab === "members" && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.membersList}>
            {vault.members.map((m, i) => (
              <View key={m.id}>
                <View style={styles.memberRow}>
                  <LinearGradient
                    colors={[Colors.accent, Colors.accentLight]}
                    style={styles.memberAvatar}
                  >
                    <Text style={styles.memberAvatarText}>
                      {m.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </Text>
                  </LinearGradient>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{m.name}</Text>
                    {(m.email || m.phone) && (
                      <Text style={styles.memberContact}>{m.email || m.phone}</Text>
                    )}
                  </View>
                  <View style={[styles.roleBadge, m.role === "admin" && styles.adminBadge]}>
                    <Text style={[styles.roleText, m.role === "admin" && styles.adminText]}>
                      {m.role}
                    </Text>
                  </View>
                </View>
                {i < vault.members.length - 1 && <View style={styles.memberDivider} />}
              </View>
            ))}
            <Pressable
              style={styles.addMemberBtn}
              onPress={() =>
                router.push({
                  pathname: "/members/[vaultId]",
                  params: { vaultId: vault.id },
                })
              }
            >
              <Feather name="user-plus" size={18} color={Colors.accent} />
              <Text style={styles.addMemberText}>Add Member</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.textSecondary,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderRadius: 10,
  },
  backBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.accent,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "flex-start",
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  headerBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.accent,
    letterSpacing: 0.8,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerActionDanger: {
    backgroundColor: `${Colors.danger}15`,
    borderColor: `${Colors.danger}30`,
  },
  scroll: { flex: 1 },
  content: { paddingTop: 4 },

  balanceCard: {
    marginHorizontal: 20,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  balanceGradient: { padding: 22 },
  balanceIconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  vaultIconBadge: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  vaultIcon: { fontSize: 26 },
  childBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  childBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  balanceLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  balance: {
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    letterSpacing: -1,
    marginBottom: 4,
  },
  availableRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
    marginBottom: 14,
  },
  availablePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: `${Colors.success}12`,
    borderWidth: 1,
    borderColor: `${Colors.success}30`,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  availablePillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.success,
  },
  childSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  childSummaryText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressContainer: {
    marginTop: 6,
    marginBottom: 12,
    gap: 5,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  statBox: { flex: 1, alignItems: "center", gap: 4 },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `${Colors.success}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 15 },
  statDivider: { width: 1, backgroundColor: Colors.border },

  addTxButton: {
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 16,
    overflow: "hidden",
  },
  addTxGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
  },
  addTxText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.primary,
  },

  tabsContainer: { marginHorizontal: 20, marginBottom: 14 },
  tabs: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: { backgroundColor: Colors.surfaceLight },
  tabText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.accent,
    fontFamily: "Inter_600SemiBold",
  },

  emptyState: { alignItems: "center", padding: 40, gap: 10 },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  txList: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  txSeparator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 20 + 42 + 14,
  },

  /* Sub-vaults tab */
  addChildBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${Colors.accent}18`,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: "flex-start",
  },
  addChildText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.accent,
  },
  childList: {
    marginHorizontal: 20,
    gap: 10,
  },
  childCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 12,
  },
  miniProgressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    marginTop: 6,
    width: "100%",
  },
  miniProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  childBalanceLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  childCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  childCardIconText: { fontSize: 22 },
  childCardInfo: { flex: 1 },
  childCardName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  childCardStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  childStatText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  childStatSep: { color: Colors.muted, fontSize: 11 },
  childCardRight: { alignItems: "flex-end", gap: 4 },
  childBalance: { fontFamily: "Inter_700Bold", fontSize: 15 },

  /* Members tab */
  membersList: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.primary,
  },
  memberInfo: { flex: 1 },
  memberName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  memberContact: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  adminBadge: {
    backgroundColor: `${Colors.accent}20`,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: "capitalize",
  },
  adminText: { color: Colors.accent },
  memberDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 68,
  },
  addMemberBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    justifyContent: "center",
  },
  addMemberText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.accent,
  },
});
