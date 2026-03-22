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

export default function VaultDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { vaults, deleteTransaction } = useVaults();
  const [activeTab, setActiveTab] = useState<"transactions" | "members">(
    "transactions"
  );

  const vault = vaults.find((v) => v.id === id);

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View
        style={[styles.headerBar, { paddingTop: Platform.OS === "web" ? 67 : 0 }]}
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {vault.name}
        </Text>
        <View style={styles.headerActions}>
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
          {
            paddingBottom:
              Platform.OS === "web" ? 100 : insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.balanceCard}>
          <LinearGradient
            colors={["#2A2050", "#1A1F3A"]}
            style={styles.balanceGradient}
          >
            <View style={styles.balanceIconRow}>
              <View
                style={[
                  styles.vaultIconBadge,
                  { backgroundColor: `${vault.color}22` },
                ]}
              >
                <Text style={styles.vaultIcon}>{vault.icon}</Text>
              </View>
              {vault.isMain && (
                <View style={styles.mainBadge}>
                  <Text style={styles.mainBadgeText}>MAIN</Text>
                </View>
              )}
            </View>

            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={[styles.balance, { color: vault.color || Colors.accent }]}>
              {formatCurrency(vault.balance)}
            </Text>

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
                <View style={[styles.statIcon, { backgroundColor: `${Colors.danger}18` }]}>
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

        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.addTxButton}
        >
          <Pressable
            style={({ pressed }) => [
              styles.addTxPressable,
              { opacity: pressed ? 0.85 : 1 },
            ]}
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

        <Animated.View
          entering={FadeInDown.duration(400).delay(150)}
          style={styles.tabsContainer}
        >
          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, activeTab === "transactions" && styles.activeTab]}
              onPress={() => setActiveTab("transactions")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "transactions" && styles.activeTabText,
                ]}
              >
                Transactions ({vault.transactions.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === "members" && styles.activeTab]}
              onPress={() => setActiveTab("members")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "members" && styles.activeTabText,
                ]}
              >
                Members ({vault.members.length})
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {activeTab === "transactions" ? (
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
                      onLongPress={() =>
                        handleDeleteTx(tx.id, tx.description)
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
        ) : (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.membersList}>
            {vault.members.map((m, i) => (
              <View key={m.id} style={styles.memberRow}>
                <LinearGradient
                  colors={[Colors.accent, Colors.accentLight]}
                  style={styles.memberAvatar}
                >
                  <Text style={styles.memberAvatarText}>
                    {m.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </Text>
                </LinearGradient>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{m.name}</Text>
                  {m.email || m.phone ? (
                    <Text style={styles.memberContact}>
                      {m.email || m.phone}
                    </Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.roleBadge,
                    m.role === "admin" && styles.adminBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.roleText,
                      m.role === "admin" && styles.adminText,
                    ]}
                  >
                    {m.role}
                  </Text>
                </View>
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
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
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
  headerTitle: {
    flex: 1,
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: "row",
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
  balanceGradient: {
    padding: 22,
  },
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
  mainBadge: {
    backgroundColor: "rgba(212,168,67,0.2)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mainBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: Colors.accent,
    letterSpacing: 1.2,
  },
  balanceLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  balance: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    letterSpacing: -1,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
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
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  addTxButton: {
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 16,
    overflow: "hidden",
  },
  addTxPressable: {
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
  tabsContainer: {
    marginHorizontal: 20,
    marginBottom: 14,
  },
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
  activeTab: {
    backgroundColor: Colors.surfaceLight,
  },
  tabText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.accent,
    fontFamily: "Inter_600SemiBold",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    gap: 10,
  },
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
  membersList: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  memberInfo: {
    flex: 1,
  },
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
  adminText: {
    color: Colors.accent,
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
