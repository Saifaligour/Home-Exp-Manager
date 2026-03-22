import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import Colors from "@/constants/colors";
import type { Vault } from "@/context/VaultContext";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface VaultCardProps {
  vault: Vault;
  onPress: () => void;
  isMain?: boolean;
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function VaultCard({ vault, onPress, isMain }: VaultCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  if (isMain) {
    return (
      <AnimatedPressable
        style={[styles.mainCard, animStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          colors={["#2A2050", "#1A1F3A"]}
          style={styles.mainGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.mainTopRow}>
            <View style={styles.mainIconBadge}>
              <Text style={styles.mainIconText}>{vault.icon || "🏦"}</Text>
            </View>
            <View style={styles.mainBadge}>
              <Text style={styles.mainBadgeText}>MAIN</Text>
            </View>
          </View>

          <View style={styles.mainAmountRow}>
            <Text style={styles.mainBalanceLabel}>Total Balance</Text>
            <Text style={styles.mainBalance}>
              {formatCurrency(vault.balance)}
            </Text>
          </View>

          <View style={styles.mainFooter}>
            <View style={styles.mainStat}>
              <Feather name="layers" size={14} color={Colors.textSecondary} />
              <Text style={styles.mainStatText}>
                {vault.transactions.length} txns
              </Text>
            </View>
            <View style={styles.mainStat}>
              <Feather name="users" size={14} color={Colors.textSecondary} />
              <Text style={styles.mainStatText}>
                {vault.members.length} members
              </Text>
            </View>
          </View>

          <View style={styles.accentBar} />
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      style={[styles.childCard, animStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View
        style={[styles.colorAccent, { backgroundColor: vault.color || Colors.accent }]}
      />
      <View style={styles.childContent}>
        <View style={styles.childTopRow}>
          <View
            style={[
              styles.childIconBadge,
              { backgroundColor: `${vault.color || Colors.accent}22` },
            ]}
          >
            <Text style={styles.childIcon}>{vault.icon || "📁"}</Text>
          </View>
          <View style={styles.childInfo}>
            <Text style={styles.childName} numberOfLines={1}>
              {vault.name}
            </Text>
            {vault.description ? (
              <Text style={styles.childDesc} numberOfLines={1}>
                {vault.description}
              </Text>
            ) : null}
          </View>
          <Feather name="chevron-right" size={18} color={Colors.muted} />
        </View>
        <View style={styles.childBottom}>
          <Text style={[styles.childBalance, { color: vault.color || Colors.accent }]}>
            {formatCurrency(vault.balance)}
          </Text>
          <Text style={styles.childTxCount}>
            {vault.transactions.length} transactions
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mainGradient: {
    padding: 22,
    position: "relative",
  },
  mainTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  mainIconBadge: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(212,168,67,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  mainIconText: {
    fontSize: 24,
  },
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
  mainAmountRow: {
    marginBottom: 20,
  },
  mainBalanceLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  mainBalance: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  mainFooter: {
    flexDirection: "row",
    gap: 20,
  },
  mainStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mainStatText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  accentBar: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.accent,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
  },
  childCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 18,
    marginHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  colorAccent: {
    width: 4,
  },
  childContent: {
    flex: 1,
    padding: 16,
  },
  childTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  childIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  childIcon: {
    fontSize: 20,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  childDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  childBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  childBalance: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    letterSpacing: -0.5,
  },
  childTxCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textTertiary,
  },
});
