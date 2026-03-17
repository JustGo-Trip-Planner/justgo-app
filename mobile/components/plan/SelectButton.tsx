import { View, Text, Pressable, Animated, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { use, useEffect, useRef } from "react";
import Constants from "expo-constants";
import axios from "axios";
import { useRouter } from "expo-router";
import { usePlan, useSelectedPlan } from "@/context/PlanContext";
import { useAuth } from "@/context/AuthContext";

export default function SelectButton({ planId }: { planId: string }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
  const API_URL = Constants.expoConfig?.extra?.API_URL;
  const router = useRouter();
  const { user } = useAuth();
  const { plan } = usePlan();
  const fullPlan = useSelectedPlan(planId);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePlan = async () => {
    try {
      if (!user) {
        return null;
      }
      
      const res = await axios.post(`${API_URL}/api/plan/save`, {
        userId: user.id,
        ...plan,
        ...fullPlan
      });
      console.log("✅ Plan saved:", res.data);
      router.push("/(home)/mytrip");
    } catch (error) {
      console.error("❌ Save plan failed:", error);
    }
  };

  return (
    <Animated.View
      style={[
        styles.fabWrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Pressable onPress={handlePlan} style={styles.fab}>
        <Ionicons name="location-outline" size={22} color="#fff" />
        <Text style={styles.fabText}>เลือกแผนการเดินทางนี้</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fabWrapper: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 50,
  },
  fab: {
    backgroundColor: "#f97316",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  fabText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
