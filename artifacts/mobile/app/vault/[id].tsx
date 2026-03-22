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
  const { vaults, deleteTransaction } = useVaults();
  const [activeTab, setActiveTab] = useState<Tab>("transactions");

  const vault = vaults.find((v) => v.id === id);
  const childVaults = vault?.isMain
    ? vaults.filter((v) => !v.isMain && v.parentId === vault.id)
    : [];

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

  const totalCredit = vault.transactions
    .filter((t) => t.type === "credit")
    .reduce((s, t) => s + t.amount, 0);
  const totalDebit = vault.transactions
    .filter((t) => t.type === "debit")
    .reduce((s, t) => s + t.amount, 0);

  const totalChildBalance = childVaults.reduce((s, v) => s + v.balance, 0);
  const combinedBalance = vault.isMain ? vault.balance + totalChildBalance : vault.balance;

  const handleDeleteTx = (txId: string, desc: string) => {
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

            <Text style={styles.balanceLabel}>
              {vault.isMain ? "Total Balance (incl. sub-vaults)" : "Current Balance"}
            </Text>
            <Text style={[styles.balance, { color: vault.color || Colors.accent }]}>
              {formatCurrency(combinedBalance)}
            </Text>

            {vault.isMain && childVaults.length > 0 && (
              <View style={styles.ownBalanceRow}>
                <Text style={styles.ownBalanceLabel}>Own balance:</Text>
                <Text style={styles.ownBalanceValue}>
                  {formatCurrency(vault.balance)}
                </Text>
                <Text style={styles.ownBalanceLabel}>  Sub-vaults:</Text>
                <Text style={styles.ownBalanceValue}>
                  {formatCurrency(totalChildBalance)}
                </Text>
              </View>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={styles.statIcon}>
                  <Feather name="arrow-down-left" size={14} color={Colors.success} />
                </View>
                <Text style={styles.statLabel}>Total In</Text>
                <Text style={[styles.statValue, { color: Colors.success }]}>
                  {formatCurrency(totalCredit)}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <View
                  style={[styles.statIcon, { backgroundColor: `${Colors.danger}18` }]}
                >
                  <Feather name="arrow-up-right" size={14} color={Colors.danger} />
                </View>
                <Text style={styles.statLabel}>Total Out</Text>
                <Text style={[styles.statValue, { color: Colors.danger }]}>
                  {formatCurrency(totalDebit)}
                </Text>
              </View>
            </View>
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
                      onLongPress={() => handleDeleteTx(tx.id, tx.description)}
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
                  const childCredit = child.transactions
                    .filter((t) => t.type === "credit")
                    .reduce((s, t) => s + t.amount, 0);
                  const childDebit = child.transactions
                    .filter((t) => t.type === "debit")
                    .reduce((s, t) => s + t.amount, 0);

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
                          <Feather name="arrow-down-left" size={10} color={Colors.success} />
                          <Text style={styles.childStatText}>{formatCurrency(childCredit)}</Text>
                          <Text style={styles.childStatSep}>·</Text>
                          <Feather name="arrow-up-right" size={10} color={Colors.danger} />
                          <Text style={styles.childStatText}>{formatCurrency(childDebit)}</Text>
                          <Text style={styles.childStatSep}>·</Text>
                          <Text style={styles.childStatText}>
                            {child.transactions.length} txn{child.transactions.length !== 1 ? "s" : ""}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.childCardRight}>
                        <Text style={[styles.childBalance, { color: child.color || Colors.accent }]}>
                          {formatCurrency(child.balance)}
                        </Text>
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
  ownBalanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  ownBalanceLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  ownBalanceValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.textPrimary,
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
