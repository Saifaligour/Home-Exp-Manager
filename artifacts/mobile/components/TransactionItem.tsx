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

function getTransactionStyle(tx: Transaction): {
  color: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  prefix: string;
  label: string;
} {
  if (tx.type === "transfer") {
    const isOut = !!tx.transferToVaultId;
    return {
      color: "#A78BFA",
      icon: isOut ? "arrow-right-circle" : "arrow-left-circle",
      prefix: isOut ? "→" : "←",
      label: isOut ? "Allocated" : "Received",
    };
  }
  if (tx.type === "credit") {
    return {
      color: Colors.success,
      icon: "arrow-down-left",
      prefix: "+",
      label: "Credit",
    };
  }
  return {
    color: Colors.danger,
    icon: "arrow-up-right",
    prefix: "-",
    label: "Debit",
  };
}

export function TransactionItem({
  transaction,
  onLongPress,
  showVaultName,
}: TransactionItemProps) {
  const { color, icon, prefix, label } = getTransactionStyle(transaction);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, { opacity: pressed ? 0.7 : 1 }]}
      onLongPress={onLongPress}
      delayLongPress={400}
    >
      <View style={[styles.typeIcon, { backgroundColor: `${color}18` }]}>
        <Feather name={icon} size={18} color={color} />
      </View>

      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description}
        </Text>
        <View style={styles.meta}>
          <View style={[styles.typePill, { backgroundColor: `${color}18` }]}>
            <Text style={[styles.typeLabel, { color }]}>{label}</Text>
          </View>
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
          {prefix}
          {formatAmount(transaction.amount)}
        </Text>
        <Text style={styles.balance}>
          Bal: ₹{transaction.balanceAfter.toLocaleString("en-IN")}
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
    marginBottom: 5,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },
  typePill: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 0.4,
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
