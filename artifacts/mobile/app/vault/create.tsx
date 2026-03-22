import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
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
import { useVaults } from "@/context/VaultContext";

const ICONS = [
  "🏠","🏗️","💒","🚗","🎓","🏥","✈️","🛒","💰","🏦","📦","🎯",
  "🍔","⚡","🌿","💎","🎮","🎸","🏋️","🧳",
];
const COLORS = [
  "#D4A843","#2ECC8A","#5B8EF0","#E85C5C","#9B59B6",
  "#E67E22","#1ABC9C","#E91E63","#F39C12","#16A085",
];

export default function CreateVaultScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { createVault, mainVault } = useVaults();
  const params = useLocalSearchParams<{ isMain?: string; parentId?: string }>();

  const isMain = params.isMain === "true";
  const parentId = params.parentId;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(isMain ? "🏠" : "📦");
  const [selectedColor, setSelectedColor] = useState(Colors.accent);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Vault name is required");
      return;
    }
    if (!user) return;

    setIsLoading(true);
    setError("");

    try {
      const balance = parseFloat(initialBalance.replace(/,/g, "")) || 0;
      await createVault({
        name: name.trim(),
        description: description.trim(),
        icon: selectedIcon,
        color: selectedColor,
        initialBalance: balance,
        isMain,
        parentId: isMain ? undefined : (parentId || mainVault?.id),
        ownerId: user.id,
        ownerName: user.name,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setError("Failed to create vault. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const screenTitle = isMain ? "Create Main Vault" : "Create Sub-Vault";

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
        <Text style={styles.headerTitle}>{screenTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Live preview */}
        <View style={styles.preview}>
          <View
            style={[
              styles.previewIcon,
              { backgroundColor: `${selectedColor}22` },
            ]}
          >
            <Text style={styles.previewIconText}>{selectedIcon}</Text>
          </View>
          <Text style={styles.previewName}>{name || "Vault Name"}</Text>
          <View
            style={[
              styles.typeBadge,
              isMain
                ? { backgroundColor: `${Colors.accent}20`, borderColor: Colors.accent }
                : { backgroundColor: Colors.surface, borderColor: Colors.border },
            ]}
          >
            {isMain ? (
              <Feather name="shield" size={10} color={Colors.accent} />
            ) : (
              <Feather name="git-branch" size={10} color={Colors.textSecondary} />
            )}
            <Text
              style={[
                styles.typeBadgeText,
                isMain
                  ? { color: Colors.accent }
                  : { color: Colors.textSecondary },
              ]}
            >
              {isMain ? "MAIN VAULT" : "SUB-VAULT"}
            </Text>
          </View>
          {!isMain && mainVault && (
            <View style={styles.parentChip}>
              <Text style={styles.parentChipIcon}>{mainVault.icon}</Text>
              <Text style={styles.parentChipText}>Under {mainVault.name}</Text>
            </View>
          )}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={14} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.formSection}>
          <Text style={styles.fieldLabel}>Vault Name *</Text>
          <View style={styles.inputWrapper}>
            <Feather name="edit-2" size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder={isMain ? "e.g. My Home Vault" : "e.g. Home Expenses"}
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={setName}
            />
          </View>

          <Text style={styles.fieldLabel}>Description (optional)</Text>
          <View style={styles.inputWrapper}>
            <Feather name="align-left" size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="What is this vault for?"
              placeholderTextColor={Colors.textTertiary}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <Text style={styles.fieldLabel}>Opening Balance (₹)</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={Colors.textTertiary}
              value={initialBalance}
              onChangeText={setInitialBalance}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.fieldLabel}>Choose Icon</Text>
          <View style={styles.iconGrid}>
            {ICONS.map((icon) => (
              <Pressable
                key={icon}
                style={[
                  styles.iconOption,
                  icon === selectedIcon && [
                    styles.iconSelected,
                    { borderColor: selectedColor },
                  ],
                ]}
                onPress={() => {
                  setSelectedIcon(icon);
                  Haptics.selectionAsync();
                }}
              >
                <Text style={styles.iconOptionText}>{icon}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.fieldLabel}>Choose Color</Text>
          <View style={styles.colorGrid}>
            {COLORS.map((color) => (
              <Pressable
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  color === selectedColor && styles.colorSelected,
                ]}
                onPress={() => {
                  setSelectedColor(color);
                  Haptics.selectionAsync();
                }}
              >
                {color === selectedColor && (
                  <Feather name="check" size={16} color="white" />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleCreate}
          disabled={isLoading}
        >
          <LinearGradient
            colors={[Colors.accent, Colors.accentLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createGradient}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <>
                <Feather
                  name={isMain ? "shield" : "git-branch"}
                  size={18}
                  color={Colors.primary}
                />
                <Text style={styles.createText}>
                  {isMain ? "Create Main Vault" : "Create Sub-Vault"}
                </Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
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
  content: { paddingHorizontal: 20, paddingTop: 4 },
  preview: {
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 16,
    gap: 8,
  },
  previewIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  previewIconText: { fontSize: 34 },
  previewName: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1,
  },
  parentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  parentChipIcon: { fontSize: 14 },
  parentChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textSecondary,
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
  formSection: { marginBottom: 20 },
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
    backgroundColor: Colors.surface,
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
  currencySymbol: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.accent,
  },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  iconOption: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSelected: { borderWidth: 2 },
  iconOptionText: { fontSize: 24 },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSelected: { borderWidth: 3, borderColor: "white" },
  createButton: { borderRadius: 16, overflow: "hidden", marginTop: 8 },
  createGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  createText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.primary,
  },
});
