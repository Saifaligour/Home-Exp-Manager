import { router } from "expo-router";
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";

import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace("/(tabs)");
    } else {
      router.replace("/(auth)");
    }
  }, [isAuthenticated, isLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
