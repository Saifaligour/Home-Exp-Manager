import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useVaults, type VaultMember } from "@/context/VaultContext";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export default function MembersScreen() {
  const insets = useSafeAreaInsets();
  const { vaultId } = useLocalSearchParams<{ vaultId: string }>();
  const { user } = useAuth();
  const { vaults, addMember, removeMember } = useVaults();

  const vault = vaults.find((v) => v.id === vaultId);
  const isAdmin = vault?.members.some(
    (m) => m.userId === user?.id && m.role === "admin"
  ) ?? false;
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  if (!vault) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop:
              Platform.OS === "web" ? insets.top + 67 : insets.top + 16,
          },
        ]}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="x" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>
    );
  }

  const handleAddMember = async () => {
    if (!identifier.trim()) {
      setError("Please enter email or phone number");
      return;
    }

    setIsAdding(true);
    setError("");

    await new Promise((r) => setTimeout(r, 400));

    const name = identifier.includes("@")
      ? identifier.split("@")[0]
      : `User ${identifier.slice(-4)}`;

    const member: VaultMember = {
      id: generateId(),
      userId: generateId(),
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email: identifier.includes("@") ? identifier : undefined,
      phone: !identifier.includes("@") ? identifier : undefined,
      role,
      joinedAt: new Date().toISOString(),
    };

    await addMember(vaultId!, member);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIdentifier("");
    setShowAddForm(false);
    setIsAdding(false);
  };

  const handleRemoveMember = (m: VaultMember) => {
    if (m.userId === user?.id) {
      Alert.alert("Cannot remove", "You cannot remove yourself from the vault");
      return;
    }
    Alert.alert(
      "Remove Member",
      `Remove ${m.name} from this vault?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await removeMember(vaultId!, m.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop:
            Platform.OS === "web" ? insets.top + 67 : insets.top + 16,
        },
      ]}
    >
      <View style={styles.headerBar}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={20} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Vault Members</Text>
        {isAdmin ? (
          <Pressable
            style={styles.addBtn}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Feather name={showAddForm ? "minus" : "plus"} size={18} color={Colors.accent} />
          </Pressable>
        ) : (
          <View style={styles.addBtn} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isAdmin && showAddForm && (
          <View style={styles.addForm}>
            <Text style={styles.addFormTitle}>Add New Member</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>Email or Phone</Text>
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={16} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="email@example.com or phone"
                placeholderTextColor={Colors.textTertiary}
                value={identifier}
                onChangeText={setIdentifier}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.fieldLabel}>Role</Text>
            <View style={styles.roleToggle}>
              <Pressable
                style={[
                  styles.roleBtn,
                  role === "member" && styles.roleBtnActive,
                ]}
                onPress={() => setRole("member")}
              >
                <Feather
                  name="user"
                  size={16}
                  color={role === "member" ? Colors.accent : Colors.muted}
                />
                <Text
                  style={[
                    styles.roleBtnText,
                    role === "member" && styles.roleBtnTextActive,
                  ]}
                >
                  Member
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.roleBtn,
                  role === "admin" && styles.roleBtnActive,
                ]}
                onPress={() => setRole("admin")}
              >
                <Feather
                  name="shield"
                  size={16}
                  color={role === "admin" ? Colors.accent : Colors.muted}
                />
                <Text
                  style={[
                    styles.roleBtnText,
                    role === "admin" && styles.roleBtnTextActive,
                  ]}
                >
                  Admin
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.addMemberBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleAddMember}
              disabled={isAdding}
            >
              <LinearGradient
                colors={[Colors.accent, Colors.accentLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addMemberGradient}
              >
                {isAdding ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={styles.addMemberText}>Add Member</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Members ({vault.members.length})
          </Text>
          <View style={styles.membersList}>
            {vault.members.map((m, i) => (
              <View key={m.id}>
                <View style={styles.memberRow}>
                  <LinearGradient
                    colors={[Colors.accent, Colors.accentLight]}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarText}>
                      {m.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </Text>
                  </LinearGradient>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {m.name}
                      {m.userId === user?.id ? " (you)" : ""}
                    </Text>
                    <Text style={styles.memberContact}>
                      {m.email || m.phone || "No contact info"}
                    </Text>
                  </View>
                  <View style={styles.memberRight}>
                    <View
                      style={[
                        styles.roleBadge,
                        m.role === "admin" && styles.adminBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleLabel,
                          m.role === "admin" && styles.adminLabel,
                        ]}
                      >
                        {m.role}
                      </Text>
                    </View>
                    {isAdmin && m.userId !== user?.id && (
                      <Pressable
                        onPress={() => handleRemoveMember(m)}
                        style={styles.removeBtn}
                      >
                        <Feather
                          name="user-minus"
                          size={16}
                          color={Colors.danger}
                        />
                      </Pressable>
                    )}
                  </View>
                </View>
                {i < vault.members.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
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
  backBtn: {
    margin: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  closeBtn: {
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
    textAlign: "center",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${Colors.accent}18`,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  addForm: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 20,
  },
  addFormTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(232, 92, 92, 0.15)",
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.danger,
    flex: 1,
  },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    marginBottom: 14,
    height: 52,
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textPrimary,
    height: "100%",
  },
  roleToggle: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  roleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  roleBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: `${Colors.accent}14`,
  },
  roleBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.muted,
  },
  roleBtnTextActive: {
    color: Colors.accent,
    fontFamily: "Inter_600SemiBold",
  },
  addMemberBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  addMemberGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  addMemberText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.primary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  membersList: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
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
  memberRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roleBadge: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  adminBadge: {
    backgroundColor: `${Colors.accent}20`,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: "capitalize",
  },
  adminLabel: {
    color: Colors.accent,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: `${Colors.danger}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 72,
  },
});
