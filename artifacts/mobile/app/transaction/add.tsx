import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const { vaultId } = useLocalSearchParams<{ vaultId: string }>();
  const { user } = useAuth();
  const { vaults, addTransaction } = useVaults();

  const vault = vaults.find((v) => v.id === vaultId);

  const [type, setType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
    if (!amount.trim() || isNaN(parseFloat(amount))) {
      setError("Please enter a valid amount");
      return;
    }
    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }
    if (!user || !vaultId) return;

    const amountNum = parseFloat(amount.replace(/,/g, ""));
    if (amountNum <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await addTransaction(vaultId, {
        type,
        amount: amountNum,
        description: description.trim(),
        imageUrl: imageUri || undefined,
        userId: user.id,
        userName: user.name,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setError("Failed to add transaction. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isCredit = type === "credit";
  const amountColor = isCredit ? Colors.success : Colors.danger;

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
        <Text style={styles.headerTitle}>Add Transaction</Text>
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
        {vault && (
          <View style={styles.vaultChip}>
            <Text style={styles.vaultChipIcon}>{vault.icon}</Text>
            <Text style={styles.vaultChipName}>{vault.name}</Text>
            <Text style={[styles.vaultChipBalance, { color: vault.color }]}>
              ₹{vault.balance.toLocaleString("en-IN")}
            </Text>
          </View>
        )}

        <View style={styles.typeToggle}>
          <Pressable
            style={[
              styles.typeBtn,
              !isCredit && styles.typeBtnActive,
              !isCredit && { borderColor: Colors.danger },
            ]}
            onPress={() => {
              setType("debit");
              Haptics.selectionAsync();
            }}
          >
            <Feather
              name="arrow-up-right"
              size={18}
              color={!isCredit ? Colors.danger : Colors.muted}
            />
            <Text
              style={[styles.typeBtnText, !isCredit && { color: Colors.danger }]}
            >
              Debit (Used)
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.typeBtn,
              isCredit && styles.typeBtnActive,
              isCredit && { borderColor: Colors.success },
            ]}
            onPress={() => {
              setType("credit");
              Haptics.selectionAsync();
            }}
          >
            <Feather
              name="arrow-down-left"
              size={18}
              color={isCredit ? Colors.success : Colors.muted}
            />
            <Text
              style={[styles.typeBtnText, isCredit && { color: Colors.success }]}
            >
              Credit (Added)
            </Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={14} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.amountContainer}>
          <Text style={styles.amountSymbol}>₹</Text>
          <TextInput
            style={[styles.amountInput, { color: amountColor }]}
            placeholder="0"
            placeholderTextColor={Colors.muted}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            autoFocus
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Description</Text>
          <View style={styles.inputWrapper}>
            <Feather name="edit-2" size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="What is this for?"
              placeholderTextColor={Colors.textTertiary}
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

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
            <Pressable
              style={styles.imagePickerBtn}
              onPress={handlePickImage}
            >
              <Feather name="image" size={22} color={Colors.textSecondary} />
              <Text style={styles.imagePickerText}>Attach receipt photo</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <LinearGradient
            colors={
              isCredit
                ? [Colors.success, "#40E09A"]
                : [Colors.danger, "#F07070"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Feather
                  name={isCredit ? "arrow-down-left" : "arrow-up-right"}
                  size={20}
                  color="white"
                />
                <Text style={styles.submitText}>
                  {isCredit ? "Add Credit" : "Record Debit"}
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
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
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
  content: {
    paddingHorizontal: 20,
  },
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
  vaultChipIcon: {
    fontSize: 20,
  },
  vaultChipName: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  vaultChipBalance: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  typeToggle: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  typeBtnActive: {
    backgroundColor: Colors.surfaceLight,
  },
  typeBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.muted,
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
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
    marginBottom: 8,
  },
  amountSymbol: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    color: Colors.textSecondary,
  },
  amountInput: {
    fontFamily: "Inter_700Bold",
    fontSize: 52,
    letterSpacing: -2,
    minWidth: 100,
    textAlign: "center",
  },
  fieldGroup: {
    marginBottom: 16,
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
  imagePreview: {
    width: "100%",
    height: 180,
    borderRadius: 14,
  },
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
