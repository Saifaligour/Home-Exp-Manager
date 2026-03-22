import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  FlatList,
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
import { VaultCard } from "@/components/VaultCard";
import { TransactionItem } from "@/components/TransactionItem";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { vaults, mainVault, isLoading, refreshVaults } = useVaults();

  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
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

  const childVaults = vaults.filter((v) => !v.isMain);
  const recentTransactions = vaults
    .flatMap((v) =>
      v.transactions.map((t) => ({ ...t, vaultName: v.name }))
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 10);

  const totalBalance = vaults.reduce((sum, v) => sum + v.balance, 0);
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[Colors.primary, Colors.primary, "transparent"]}
        style={styles.headerGradient}
        pointerEvents="none"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              Platform.OS === "web" ? 100 : insets.bottom + 80,
          },
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

        {isLoading ? (
          <Animated.View style={[styles.skeleton, pulseStyle]} />
        ) : mainVault ? (
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <VaultCard
              vault={mainVault}
              isMain
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: "/vault/[id]", params: { id: mainVault.id } });
              }}
            />
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            style={styles.emptyMain}
          >
            <View style={styles.emptyMainInner}>
              <Feather name="inbox" size={32} color={Colors.muted} />
              <Text style={styles.emptyMainTitle}>No Main Vault</Text>
              <Text style={styles.emptyMainSub}>
                Create your main vault to get started
              </Text>
              <Pressable
                style={styles.createMainBtn}
                onPress={() =>
                  router.push({
                    pathname: "/vault/create",
                    params: { isMain: "true" },
                  })
                }
              >
                <LinearGradient
                  colors={[Colors.accent, Colors.accentLight]}
                  style={styles.createMainGradient}
                >
                  <Text style={styles.createMainText}>Create Main Vault</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Vaults</Text>
            <Pressable
              style={styles.addButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/vault/create");
              }}
            >
              <Feather name="plus" size={18} color={Colors.accent} />
              <Text style={styles.addButtonText}>New Vault</Text>
            </Pressable>
          </View>

          {childVaults.length === 0 ? (
            <View style={styles.emptyVaults}>
              <Feather name="folder" size={28} color={Colors.muted} />
              <Text style={styles.emptyVaultsText}>
                No child vaults yet. Create one to track specific expenses.
              </Text>
            </View>
          ) : (
            childVaults.map((vault, i) => (
              <Animated.View
                key={vault.id}
                entering={FadeInDown.duration(300).delay(i * 60)}
              >
                <VaultCard
                  vault={vault}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({
                      pathname: "/vault/[id]",
                      params: { id: vault.id },
                    });
                  }}
                />
              </Animated.View>
            ))
          )}
        </Animated.View>

        {recentTransactions.length > 0 ? (
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
        ) : null}
      </ScrollView>
    </View>
  );
}

import { Platform } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 0,
  },
  scroll: {
    flex: 1,
    zIndex: 1,
  },
  content: {
    paddingTop: 16,
  },
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
    height: 180,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  emptyMain: {
    marginHorizontal: 20,
    marginBottom: 8,
  },
  emptyMainInner: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyMainTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.textPrimary,
  },
  emptyMainSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  createMainBtn: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
  },
  createMainGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  createMainText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.primary,
  },
  section: {
    marginTop: 12,
  },
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
  addButton: {
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
  addButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.accent,
  },
  emptyVaults: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyVaultsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
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
