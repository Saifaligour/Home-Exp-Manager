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
import { useVaults } from "@/context/VaultContext";
import { TransactionItem } from "@/components/TransactionItem";

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { vaults, mainVault, isLoading, refreshVaults } = useVaults();

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

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  if (!user) {
    router.replace("/(auth)");
    return null;
  }

  const childVaults = mainVault
    ? vaults.filter((v) => !v.isMain && v.parentId === mainVault.id)
    : [];

  const recentTransactions = vaults
    .flatMap((v) => v.transactions.map((t) => ({ ...t, vaultName: v.name })))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 8);

  const totalChildBalance = childVaults.reduce((s, v) => s + v.balance, 0);
  const totalBalance = (mainVault?.balance ?? 0) + totalChildBalance;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? 67 : insets.top },
      ]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshVaults}
            tintColor={Colors.accent}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <Pressable
            style={styles.notifButton}
            onPress={() => Haptics.selectionAsync()}
          >
            <Feather name="bell" size={20} color={Colors.textSecondary} />
          </Pressable>
        </Animated.View>

        {/* Loading skeleton */}
        {isLoading ? (
          <Animated.View style={[styles.skeleton, pulseStyle]} />
        ) : !mainVault ? (
          /* No main vault — prompt to create one */
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <View style={styles.emptyMainCard}>
              <LinearGradient
                colors={["#2A2050", "#1A1F3A"]}
                style={styles.emptyMainGradient}
              >
                <View style={styles.emptyMainIcon}>
                  <Feather name="shield" size={28} color={Colors.muted} />
                </View>
                <Text style={styles.emptyMainTitle}>No Main Vault</Text>
                <Text style={styles.emptyMainSub}>
                  Create your main vault first. All sub-vaults will be organized under it.
                </Text>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/vault/create",
                      params: { isMain: "true" },
                    })
                  }
                >
                  <LinearGradient
                    colors={[Colors.accent, Colors.accentLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.createMainBtn}
                  >
                    <Feather name="plus" size={16} color={Colors.primary} />
                    <Text style={styles.createMainText}>Create Main Vault</Text>
                  </LinearGradient>
                </Pressable>
              </LinearGradient>
            </View>
          </Animated.View>
        ) : (
          /* Main Vault + Children hierarchy */
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            {/* Main Vault Card */}
            <Pressable
              style={({ pressed }) => [
                styles.mainVaultCard,
                { opacity: pressed ? 0.93 : 1 },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: "/vault/[id]",
                  params: { id: mainVault.id },
                });
              }}
            >
              <LinearGradient
                colors={["#2A2050", "#1A1F3A"]}
                style={styles.mainVaultGradient}
              >
                <View style={styles.mainVaultTop}>
                  <View
                    style={[
                      styles.mainVaultIcon,
                      { backgroundColor: `${mainVault.color}25` },
                    ]}
                  >
                    <Text style={styles.mainVaultIconText}>
                      {mainVault.icon}
                    </Text>
                  </View>
                  <View style={styles.mainVaultMeta}>
                    <Text style={styles.mainVaultName}>{mainVault.name}</Text>
                    <View style={styles.mainBadge}>
                      <Feather name="shield" size={9} color={Colors.accent} />
                      <Text style={styles.mainBadgeText}>MAIN VAULT</Text>
                    </View>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={Colors.textSecondary}
                  />
                </View>

                <View style={styles.mainVaultBalanceRow}>
                  <View>
                    <Text style={styles.balanceLabel}>Total Balance</Text>
                    <Text
                      style={[
                        styles.mainVaultBalance,
                        { color: mainVault.color || Colors.accent },
                      ]}
                    >
                      {formatCurrency(totalBalance)}
                    </Text>
                  </View>
                  <View style={styles.subBalanceBox}>
                    <Text style={styles.subBalanceLabel}>
                      {childVaults.length} Sub-vault
                      {childVaults.length !== 1 ? "s" : ""}
                    </Text>
                    <Text style={styles.subBalanceValue}>
                      {formatCurrency(totalChildBalance)}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>

            {/* Sub-Vaults Section */}
            <View style={styles.childSection}>
              {/* Connector line from main vault */}
              <View style={styles.connectorWrap}>
                <View style={styles.connectorLine} />
              </View>

              <View style={styles.childHeader}>
                <View style={styles.childHeaderLeft}>
                  <View style={styles.childDot} />
                  <Text style={styles.childTitle}>Sub-Vaults</Text>
                  {childVaults.length > 0 && (
                    <View style={styles.childCount}>
                      <Text style={styles.childCountText}>
                        {childVaults.length}
                      </Text>
                    </View>
                  )}
                </View>
                <Pressable
                  style={styles.addChildBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({
                      pathname: "/vault/create",
                      params: { parentId: mainVault.id },
                    });
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
                    router.push({
                      pathname: "/vault/create",
                      params: { parentId: mainVault.id },
                    })
                  }
                >
                  <Feather name="plus-circle" size={22} color={Colors.muted} />
                  <Text style={styles.emptyChildText}>
                    Add a sub-vault to track specific expenses
                  </Text>
                  <Text style={styles.emptyChildHint}>
                    e.g. Home Expenses, Construction, Marriage
                  </Text>
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
                        entering={FadeInDown.duration(300).delay(i * 60)}
                        style={styles.childRowWrap}
                      >
                        {/* Tree branch lines */}
                        <View style={styles.branchWrap}>
                          <View
                            style={[
                              styles.branchVert,
                              isLast && { height: 28 },
                            ]}
                          />
                          <View style={styles.branchHoriz} />
                        </View>

                        <Pressable
                          style={({ pressed }) => [
                            styles.childCard,
                            { opacity: pressed ? 0.88 : 1 },
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light
                            );
                            router.push({
                              pathname: "/vault/[id]",
                              params: { id: vault.id },
                            });
                          }}
                        >
                          <View
                            style={[
                              styles.childVaultIcon,
                              { backgroundColor: `${vault.color}22` },
                            ]}
                          >
                            <Text style={styles.childVaultIconText}>
                              {vault.icon}
                            </Text>
                          </View>
                          <View style={styles.childCardInfo}>
                            <Text style={styles.childCardName}>
                              {vault.name}
                            </Text>
                            <View style={styles.childCardStats}>
                              <Feather
                                name="arrow-down-left"
                                size={10}
                                color={Colors.success}
                              />
                              <Text style={styles.childStatText}>
                                {formatCurrency(credit)}
                              </Text>
                              <Text style={styles.childStatDivider}>·</Text>
                              <Feather
                                name="arrow-up-right"
                                size={10}
                                color={Colors.danger}
                              />
                              <Text style={styles.childStatText}>
                                {formatCurrency(debit)}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.childCardRight}>
                            <Text
                              style={[
                                styles.childBalance,
                                { color: vault.color || Colors.accent },
                              ]}
                            >
                              {formatCurrency(vault.balance)}
                            </Text>
                            <Feather
                              name="chevron-right"
                              size={14}
                              color={Colors.muted}
                            />
                          </View>
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Recent Activity */}
        {recentTransactions.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(300)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </View>
            <View style={styles.txCard}>
              {recentTransactions.map((tx, i) => (
                <React.Fragment key={tx.id}>
                  <TransactionItem
                    transaction={tx}
                    showVaultName={(tx as any).vaultName}
                  />
                  {i < recentTransactions.length - 1 && (
                    <View style={styles.separator} />
                  )}
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
    marginBottom: 20,
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

  skeleton: {
    height: 190,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    marginHorizontal: 20,
    marginBottom: 8,
  },

  /* Empty main vault */
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
    width: 56,
    height: 56,
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
    marginBottom: 8,
  },
  createMainBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createMainText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.primary,
  },

  /* Main vault card */
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
    marginBottom: 20,
  },
  mainVaultIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  mainVaultIconText: { fontSize: 24 },
  mainVaultMeta: { flex: 1 },
  mainVaultName: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  mainBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
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
    marginBottom: 4,
  },
  mainVaultBalance: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    letterSpacing: -1,
  },
  subBalanceBox: {
    alignItems: "flex-end",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subBalanceLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  subBalanceValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
  },

  /* Child vaults section */
  childSection: {
    marginHorizontal: 20,
    marginTop: 0,
  },
  connectorWrap: {
    alignItems: "center",
    paddingLeft: 24,
    height: 18,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginLeft: 0,
  },
  childHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingLeft: 4,
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
    marginLeft: 20,
  },
  childTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.textPrimary,
  },
  childCount: {
    backgroundColor: `${Colors.accent}22`,
    borderRadius: 8,
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
    backgroundColor: `${Colors.accent}18`,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addChildText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.accent,
  },

  emptyChildCard: {
    marginLeft: 32,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
    padding: 20,
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
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

  childList: {
    marginLeft: 24,
    marginBottom: 4,
  },
  childRowWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  branchWrap: {
    width: 20,
    alignItems: "flex-start",
    marginTop: 0,
  },
  branchVert: {
    width: 2,
    height: "100%",
    backgroundColor: Colors.border,
    position: "absolute",
    left: 0,
    top: 0,
  },
  branchHoriz: {
    width: 18,
    height: 2,
    backgroundColor: Colors.border,
    marginTop: 26,
    marginLeft: 0,
  },
  childCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 12,
  },
  childVaultIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  childVaultIconText: { fontSize: 20 },
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
  },
  childStatText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  childStatDivider: {
    color: Colors.muted,
    fontSize: 11,
  },
  childCardRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  childBalance: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },

  /* Recent activity */
  section: { marginTop: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
