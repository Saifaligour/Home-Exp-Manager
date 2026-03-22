import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { createVault } = useVaults();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!name.trim() || !password.trim()) {
      setError("Name and password are required");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError("Please provide email or phone number");
      return;
    }

    setIsLoading(true);
    setError("");

    await new Promise((r) => setTimeout(r, 600));

    const userId =
      Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const user = {
      id: userId,
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    };

    await login(user, `token_${userId}`);

    await createVault({
      name: "Main Vault",
      description: "Your primary financial vault",
      icon: "🏦",
      color: "#D4A843",
      initialBalance: 0,
      isMain: true,
      ownerId: userId,
      ownerName: name.trim(),
    });

    setIsLoading(false);
    router.replace("/(tabs)");
  };

  return (
    <LinearGradient
      colors={[Colors.primary, "#0F1220", Colors.primary]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            {
              paddingTop: insets.top + 24,
              paddingBottom: insets.bottom + 40,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            style={[styles.backButton]}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Start managing your finances securely
            </Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Feather
                name="user"
                size={18}
                color={Colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={Colors.textTertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Feather
                name="mail"
                size={18}
                color={Colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.label}>Phone (optional)</Text>
            <View style={styles.inputWrapper}>
              <Feather
                name="phone"
                size={18}
                color={Colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="+91 9876543210"
                placeholderTextColor={Colors.textTertiary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Feather
                name="lock"
                size={18}
                color={Colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Create a strong password"
                placeholderTextColor={Colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.registerButton,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[Colors.accent, Colors.accentLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.loginHint}>
              <Text style={styles.loginHintText}>Already have an account? </Text>
              <Pressable onPress={() => router.back()}>
                <Text style={styles.loginHintLink}>Sign in</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  container: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
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
  label: {
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
    marginBottom: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textPrimary,
    height: "100%",
  },
  registerButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  loginHint: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginHintText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textTertiary,
  },
  loginHintLink: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.accent,
  },
});
