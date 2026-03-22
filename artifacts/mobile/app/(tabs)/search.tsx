import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useVaults } from "@/context/VaultContext";
import { TransactionItem } from "@/components/TransactionItem";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { searchTransactions, vaults } = useVaults();
  const [query, setQuery] = useState("");

  const results = searchTransactions(query);

  const getVaultName = (vaultId: string) =>
    vaults.find((v) => v.id === vaultId)?.name || "";

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <Text style={styles.subtitle}>Find any transaction</Text>
      </View>

      <View style={styles.searchWrapper}>
        <Feather name="search" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Amount, description, vault..."
          placeholderTextColor={Colors.textTertiary}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Feather
            name="x"
            size={18}
            color={Colors.textSecondary}
            onPress={() => setQuery("")}
          />
        )}
      </View>

      {query.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="search" size={32} color={Colors.muted} />
          </View>
          <Text style={styles.emptyTitle}>Search Transactions</Text>
          <Text style={styles.emptySubtitle}>
            Search by amount, description, vault name, or member name
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="inbox" size={32} color={Colors.muted} />
          </View>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtitle}>
            Try searching with different keywords
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom:
                Platform.OS === "web" ? 100 : insets.bottom + 80,
            },
          ]}
          ListHeaderComponent={
            <Text style={styles.resultsCount}>
              {results.length} result{results.length !== 1 ? "s" : ""}
            </Text>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <View style={styles.txWrapper}>
              <TransactionItem
                transaction={item}
                showVaultName={getVaultName(item.vaultId)}
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    height: 52,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textPrimary,
    height: "100%",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
    marginBottom: 80,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  resultsCount: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  listContent: {
    paddingTop: 4,
  },
  txWrapper: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  separator: {
    height: 8,
  },
});
