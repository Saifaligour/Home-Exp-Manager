import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

type MainMode = "credit" | "allocate";
type ChildMode = "debit" | "credit";
type TxMode = MainMode | ChildMode;

function formatCurrency(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const { vaultId } = useLocalSearchParams<{ vaultId: string }>();
  const { user } = useAuth();
  const { vaults, addTransaction, transferToChild } = useVaults();

  const vault = vaults.find((v) => v.id === vaultId);
  const isMain = vault?.isMain ?? false;

  // For main vaults: find the parent to get its id (for allocate prompt)
  const parentVault = !isMain && vault?.parentId
    ? vaults.find((v) => v.id === vault.parentId)
    : null;

  const childVaults = isMain && vault
    ? vaults.filter((v) => !v.isMain && v.parentId === vault.id)
    : [];

  // Default mode: main vault → credit; child vault → debit
  const [mode, setMode] = useState<TxMode>(isMain ? "credit" : "debit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>(
    childVaults[0]?.id ?? ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [insufficientFunds, setInsufficientFunds] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError("Camera roll permission is required");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount.replace(/,/g, ""));
    if (!amount.trim() || isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (!user || !vaultId) return;

    if (mode === "allocate") {
      if (!selectedChildId) {
        setError("Please select a sub-vault to allocate to");
        return;
      }
      if (vault && amountNum > vault.balance) {
        setError(
          `Available balance is only ${formatCurrency(vault.balance)}. You cannot allocate more than what is available.`
        );
        return;
      }
    } else {
      if (!description.trim()) {
        setError("Please enter a description");
        return;
      }
    }

    setIsLoading(true);
    setError("");
    setInsufficientFunds(false);

    try {
      if (mode === "allocate") {
        const childVault = vaults.find((v) => v.id === selectedChildId);
        await transferToChild({
          fromVaultId: vaultId,
          toVaultId: selectedChildId,
          amount: amountNum,
          description: description.trim() || `Allocated to ${childVault?.name}`,
          userId: user.id,
          userName: user.name,
        });
      } else {
        await addTransaction(vaultId, {
          type: mode as "credit" | "debit",
          amount: amountNum,
          description: description.trim(),
          imageUrl: imageUri || undefined,
          userId: user.id,
          userName: user.name,
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      const msg: string = e?.message ?? "";
      if (msg.startsWith("INSUFFICIENT_BALANCE:")) {
        setInsufficientFunds(true);
        setError(msg.replace("INSUFFICIENT_BALANCE: ", ""));
      } else if (msg.startsWith("MAIN_VAULT_NO_DEBIT:")) {
        setError(msg.replace("MAIN_VAULT_NO_DEBIT: ", ""));
      } else {
        setError(msg || "Failed to add transaction. Try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Colors & gradients by mode ────────────────────────────────────────────
  const modeColor =
    mode === "credit"
      ? Colors.success
      : mode === "allocate"
      ? "#A78BFA"
      : Colors.danger;

  const gradientColors: [string, string] =
    mode === "credit"
      ? [Colors.success, "#40E09A"]
      : mode === "allocate"
      ? ["#A78BFA", "#C4B5FD"]
      : [Colors.danger, "#F07070"];

  // ─── Main vault stat: total deposited vs available ─────────────────────────
  const mainTotalIn = isMain && vault
    ? vault.transactions
        .filter((t) => t.type === "credit")
        .reduce((s, t) => s + t.amount, 0)
    : 0;

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
      {/* Header */}
      <View style={styles.headerBar}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={20} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isMain
            ? mode === "allocate"
              ? "Allocate Funds"
              : "Add Funds"
            : "Record Expense"}
        </Text>
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
        {/* Vault chip */}
        {vault && (
          <View style={styles.vaultChip}>
            <Text style={styles.vaultChipIcon}>{vault.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.vaultChipName}>{vault.name}</Text>
              {isMain ? (
                <Text style={styles.vaultChipSub}>
                  Total: {formatCurrency(mainTotalIn)} · Available: {formatCurrency(vault.balance)}
                </Text>
              ) : (
                <Text style={styles.vaultChipSub}>
                  Balance: {formatCurrency(vault.balance)}
                </Text>
              )}
            </View>
            <Text style={[styles.vaultChipBalance, { color: vault.color }]}>
              {formatCurrency(isMain ? mainTotalIn : vault.balance)}
            </Text>
          </View>
        )}

        {/* Mode tabs */}
        {isMain ? (
          /* MAIN VAULT: Credit or Allocate */
          <View style={styles.typeToggle}>
            <Pressable
              style={[
                styles.typeBtn,
                mode === "credit" && styles.typeBtnActive,
                mode === "credit" && { borderColor: Colors.success },
              ]}
              onPress={() => {
                setMode("credit");
                setError("");
                setInsufficientFunds(false);
                Haptics.selectionAsync();
              }}
            >
              <Feather
                name="arrow-down-left"
                size={16}
                color={mode === "credit" ? Colors.success : Colors.muted}
              />
              <Text style={[styles.typeBtnText, mode === "credit" && { color: Colors.success }]}>
                Add Funds
              </Text>
            </Pressable>

            {childVaults.length > 0 && (
              <Pressable
                style={[
                  styles.typeBtn,
                  mode === "allocate" && styles.typeBtnActive,
                  mode === "allocate" && { borderColor: "#A78BFA" },
                ]}
                onPress={() => {
                  setMode("allocate");
                  setError("");
                  setInsufficientFunds(false);
                  Haptics.selectionAsync();
                }}
              >
                <Feather
                  name="send"
                  size={16}
                  color={mode === "allocate" ? "#A78BFA" : Colors.muted}
                />
                <Text style={[styles.typeBtnText, mode === "allocate" && { color: "#A78BFA" }]}>
                  Allocate
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          /* CHILD VAULT: Debit (spend) or Credit (manual top-up) */
          <View style={styles.typeToggle}>
            <Pressable
              style={[
                styles.typeBtn,
                mode === "debit" && styles.typeBtnActive,
                mode === "debit" && { borderColor: Colors.danger },
              ]}
              onPress={() => {
                setMode("debit");
                setError("");
                setInsufficientFunds(false);
                Haptics.selectionAsync();
              }}
            >
              <Feather
                name="arrow-up-right"
                size={16}
                color={mode === "debit" ? Colors.danger : Colors.muted}
              />
              <Text style={[styles.typeBtnText, mode === "debit" && { color: Colors.danger }]}>
                Spend
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.typeBtn,
                mode === "credit" && styles.typeBtnActive,
                mode === "credit" && { borderColor: Colors.success },
              ]}
              onPress={() => {
                setMode("credit");
                setError("");
                setInsufficientFunds(false);
                Haptics.selectionAsync();
              }}
            >
              <Feather
                name="arrow-down-left"
                size={16}
                color={mode === "credit" ? Colors.success : Colors.muted}
              />
              <Text style={[styles.typeBtnText, mode === "credit" && { color: Colors.success }]}>
                Refund
              </Text>
            </Pressable>
          </View>
        )}

        {/* Info banners */}
        {mode === "allocate" && (
          <View style={styles.infoBanner}>
            <Feather name="info" size={14} color="#A78BFA" />
            <Text style={styles.infoBannerText}>
              Moves funds from this vault into a sub-vault's budget.
              Main Vault total stays the same — only available balance changes.
            </Text>
          </View>
        )}

        {/* Insufficient funds error with action */}
        {insufficientFunds ? (
          <View style={styles.insufficientBox}>
            <View style={styles.insufficientHeader}>
              <Feather name="alert-triangle" size={16} color={Colors.danger} />
              <Text style={styles.insufficientTitle}>Insufficient Funds</Text>
            </View>
            <Text style={styles.insufficientText}>{error}</Text>
            {parentVault && (
              <Pressable
                style={styles.allocateNowBtn}
                onPress={() => {
                  router.replace({
                    pathname: "/transaction/add",
                    params: { vaultId: parentVault.id },
                  });
                }}
              >
                <Feather name="send" size={14} color="#A78BFA" />
                <Text style={styles.allocateNowText}>
                  Go to {parentVault.name} → Allocate
                </Text>
              </Pressable>
            )}
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={14} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Amount input */}
        <View style={styles.amountContainer}>
          <Text style={[styles.amountSymbol, { color: modeColor }]}>₹</Text>
          <TextInput
            style={[styles.amountInput, { color: modeColor }]}
            placeholder="0"
            placeholderTextColor={Colors.muted}
            value={amount}
            onChangeText={(v) => {
              setAmount(v);
              if (insufficientFunds) setInsufficientFunds(false);
              if (error) setError("");
            }}
            keyboardType="numeric"
            autoFocus
          />
        </View>

        {/* Child vault picker for allocate mode */}
        {mode === "allocate" && childVaults.length > 0 && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Allocate To</Text>
            <View style={styles.childPickerList}>
              {childVaults.map((child) => {
                const selected = selectedChildId === child.id;
                return (
                  <Pressable
                    key={child.id}
                    style={[
                      styles.childPickerItem,
                      selected && {
                        borderColor: "#A78BFA",
                        backgroundColor: "rgba(167,139,250,0.1)",
                      },
                    ]}
                    onPress={() => {
                      setSelectedChildId(child.id);
                      Haptics.selectionAsync();
                    }}
                  >
                    <Text style={styles.childPickerIcon}>{child.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.childPickerName}>{child.name}</Text>
                      <Text style={styles.childPickerBalance}>
                        Current budget: {formatCurrency(child.balance)}
                      </Text>
                    </View>
                    {selected && (
                      <Feather name="check-circle" size={18} color="#A78BFA" />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            {mode === "allocate" ? "Note (optional)" : "Description"}
          </Text>
          <View style={styles.inputWrapper}>
            <Feather name="edit-2" size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder={
                mode === "allocate"
                  ? "e.g. Monthly house budget"
                  : mode === "credit"
                  ? "e.g. Salary, Income..."
                  : "e.g. Groceries, Electricity..."
              }
              placeholderTextColor={Colors.textTertiary}
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        {/* Receipt image — only for spend/refund */}
        {mode !== "allocate" && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Receipt Image (Optional)</Text>
            {imageUri ? (
              <View style={styles.imagePreviewWrapper}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <Pressable
                  style={styles.removeImageBtn}
                  onPress={() => setImageUri(null)}
                >
                  <Feather name="x" size={16} color="white" />
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.imagePickerBtn} onPress={handlePickImage}>
                <Feather name="image" size={22} color={Colors.textSecondary} />
                <Text style={styles.imagePickerText}>Attach receipt photo</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Feather
                  name={
                    mode === "credit"
                      ? "arrow-down-left"
                      : mode === "allocate"
                      ? "send"
                      : "arrow-up-right"
                  }
                  size={20}
                  color="white"
                />
                <Text style={styles.submitText}>
                  {mode === "credit"
                    ? isMain
                      ? "Add Funds to Vault"
                      : "Record Refund"
                    : mode === "allocate"
                    ? "Allocate Funds"
                    : "Record Expense"}
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
  content: { paddingHorizontal: 20 },

  vaultChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  vaultChipIcon: { fontSize: 20 },
  vaultChipName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  vaultChipSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  vaultChipBalance: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },

  typeToggle: { flexDirection: "row", gap: 8, marginBottom: 14 },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  typeBtnActive: { backgroundColor: Colors.surfaceLight },
  typeBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.muted,
  },

  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(167,139,250,0.08)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  infoBannerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#C4B5FD",
    flex: 1,
    lineHeight: 18,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(232, 92, 92, 0.15)",
    borderRadius: 12,
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

  insufficientBox: {
    backgroundColor: "rgba(232, 92, 92, 0.1)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${Colors.danger}40`,
    gap: 8,
  },
  insufficientHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  insufficientTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.danger,
  },
  insufficientText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  allocateNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(167,139,250,0.12)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
    alignSelf: "flex-start",
  },
  allocateNowText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#A78BFA",
  },

  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 8,
    marginBottom: 8,
  },
  amountSymbol: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
  },
  amountInput: {
    fontFamily: "Inter_700Bold",
    fontSize: 52,
    letterSpacing: -2,
    minWidth: 100,
    textAlign: "center",
  },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },

  childPickerList: { gap: 8 },
  childPickerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  childPickerIcon: { fontSize: 22 },
  childPickerName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  childPickerBalance: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
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

  imagePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
    paddingVertical: 20,
  },
  imagePickerText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  imagePreviewWrapper: {
    position: "relative",
    borderRadius: 14,
    overflow: "hidden",
  },
  imagePreview: { width: "100%", height: 180, borderRadius: 14 },
  removeImageBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },

  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 16,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  submitText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "white",
  },
});
