import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useVaults } from "@/context/VaultContext";

function SettingRow({
  icon,
  label,
  value,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
      onPress={onPress}
    >
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor: danger
              ? `${Colors.danger}18`
              : `${Colors.accent}18`,
          },
        ]}
      >
        <Feather
          name={icon as any}
          size={18}
          color={danger ? Colors.danger : Colors.accent}
        />
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowLabel, danger && { color: Colors.danger }]}>
          {label}
        </Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      </View>
      <Feather name="chevron-right" size={16} color={Colors.muted} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { vaults } = useVaults();

  if (!user) {
    router.replace("/(auth)");
    return null;
  }

  const totalVaults = vaults.length;
  const totalTransactions = vaults.reduce(
    (sum, v) => sum + v.transactions.length,
    0
  );
  const totalBalance = vaults.reduce((sum, v) => sum + v.balance, 0);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)");
        },
      },
    ]);
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.profileCard}>
          <LinearGradient
            colors={[Colors.accent, Colors.accentLight]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <Text style={styles.profileName}>{user.name}</Text>
          {user.email ? (
            <Text style={styles.profileEmail}>{user.email}</Text>
          ) : null}
          {user.phone ? (
            <Text style={styles.profileEmail}>{user.phone}</Text>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalVaults}</Text>
              <Text style={styles.statLabel}>Vaults</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalTransactions}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                ₹{(totalBalance / 1000).toFixed(0)}K
              </Text>
              <Text style={styles.statLabel}>Balance</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              icon="user"
              label="Edit Profile"
              onPress={() => {}}
            />
            <View style={styles.rowDivider} />
            <SettingRow
              icon="bell"
              label="Notifications"
              value="On"
              onPress={() => {}}
            />
            <View style={styles.rowDivider} />
            <SettingRow
              icon="lock"
              label="Security"
              value="Fingerprint"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Data</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              icon="download"
              label="Export All Data"
              value="Excel format"
              onPress={() =>
                Alert.alert(
                  "Export",
                  "Export feature will download all vault data as Excel"
                )
              }
            />
            <View style={styles.rowDivider} />
            <SettingRow
              icon="share-2"
              label="Share Vault Summary"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About</Text>
          <View style={styles.sectionCard}>
            <SettingRow icon="info" label="Version" value="1.0.0" />
            <View style={styles.rowDivider} />
            <SettingRow icon="shield" label="Privacy Policy" onPress={() => {}} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <SettingRow
              icon="log-out"
              label="Sign Out"
              onPress={handleLogout}
              danger
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  content: {
    paddingTop: 16,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  profileName: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    width: "100%",
    justifyContent: "space-around",
  },
  stat: {
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.accent,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  section: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowInfo: {
    flex: 1,
  },
  rowLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  rowValue: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 66,
  },
});
