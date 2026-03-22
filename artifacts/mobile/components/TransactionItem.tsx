import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";
import type { Transaction } from "@/context/VaultContext";

interface TransactionItemProps {
  transaction: Transaction;
  onLongPress?: () => void;
  showVaultName?: string;
}

function formatAmount(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function TransactionItem({
  transaction,
  onLongPress,
  showVaultName,
}: TransactionItemProps) {
  const isCredit = transaction.type === "credit";
  const color = isCredit ? Colors.success : Colors.danger;

  return (
    <Pressable
      style={({ pressed }) => [styles.container, { opacity: pressed ? 0.7 : 1 }]}
      onLongPress={onLongPress}
      delayLongPress={400}
    >
      <View style={[styles.typeIcon, { backgroundColor: `${color}18` }]}>
        <Feather
          name={isCredit ? "arrow-down-left" : "arrow-up-right"}
          size={18}
          color={color}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.date}>{formatDate(transaction.createdAt)}</Text>
          {showVaultName ? (
            <>
              <View style={styles.dot} />
              <Text style={styles.vaultName} numberOfLines={1}>
                {showVaultName}
              </Text>
            </>
          ) : null}
          <View style={styles.dot} />
          <Text style={styles.byName} numberOfLines={1}>
            {transaction.createdByName}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={[styles.amount, { color }]}>
          {isCredit ? "+" : "-"}
          {formatAmount(transaction.amount)}
        </Text>
        <Text style={styles.balance}>
          ₹{transaction.balanceAfter.toLocaleString("en-IN")}
        </Text>
        {transaction.imageUrl ? (
          <Feather name="image" size={12} color={Colors.muted} style={{ marginTop: 2 }} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  typeIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  description: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  date: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textTertiary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textTertiary,
  },
  vaultName: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.accent,
    maxWidth: 80,
  },
  byName: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textTertiary,
    maxWidth: 80,
  },
  right: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  amount: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    letterSpacing: -0.3,
  },
  balance: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});
