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
import { mockLoginResponse, buildSeedData } from "@/constants/mockData";
import { useAuth } from "@/context/AuthContext";
import { useVaults } from "@/context/VaultContext";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { seedVaults, vaults } = useVaults();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError("Please enter your email/phone and password");
      return;
    }

    setIsLoading(true);
    setError("");

    // Simulate network delay (fake API call)
    await new Promise((r) => setTimeout(r, 700));

    // Mock API response — replace with real fetch() when backend is ready
    const response = mockLoginResponse(identifier.trim());
    await login(response.user, response.token);

    // If this user has no vaults yet, seed demo data
    if (vaults.length === 0) {
      const seedData = buildSeedData(response.user.id, response.user.name);
      await seedVaults(seedData);
    }

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
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoArea}>
            <View style={styles.logoIcon}>
              <Feather name="shield" size={36} color={Colors.accent} />
            </View>
            <Text style={styles.logoText}>HomeVault</Text>
            <Text style={styles.tagline}>Your financial sanctuary</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.formTitle}>Welcome back</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputWrapper}>
              <Feather name="mail" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email or phone number"
                placeholderTextColor={Colors.textTertiary}
                value={identifier}
                onChangeText={setIdentifier}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Feather name="lock" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputFlex]}
                placeholder="Password"
                placeholderTextColor={Colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={18}
                  color={Colors.textSecondary}
                />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [styles.loginButton, { opacity: pressed ? 0.85 : 1 }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[Colors.accent, Colors.accentLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={({ pressed }) => [styles.registerButton, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push("/(auth)/register")}
            >
              <Text style={styles.registerButtonText}>Create new account</Text>
            </Pressable>
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
    justifyContent: "center",
  },
  logoArea: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
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
  formTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 20,
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
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textPrimary,
    height: "100%",
  },
  inputFlex: { flex: 1 },
  eyeButton: { padding: 4 },
  loginButton: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  loginGradient: { paddingVertical: 16, alignItems: "center" },
  loginButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textTertiary,
  },
  registerButton: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  registerButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textSecondary,
  },
});
