import { View, Text, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import Constants from "expo-constants";
import axios from "axios";
import { useRouter } from "expo-router";
import { usePlan, useSelectedPlan } from "@/context/PlanContext";
import { useAuth } from "@/context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

export default function SelectButton({ planId }: { planId: string }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
      if (!user) return;

      const res = await axios.post(`${API_URL}/api/plan/save`, {
        userId: user.id,
        ...plan,
        ...fullPlan,
      });

      console.log("✅ Plan saved:", res.data);
      router.push("/(home)/mytrip");
    } catch (error) {
      console.error("❌ Save plan failed:", error);
    }
  };

  return (
    <Animated.View
      className="absolute bottom-0 left-0 right-0 z-50"
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <LinearGradient
        colors={[
          "transparent",
          "rgba(255,255,255,0.7)",
          "rgba(255,255,255,0.95)",
        ]}
        locations={[0, 0.5, 1]}
        className="pt-16 pb-6 px-5"
      >
        <View className="bg-white/60 backdrop-blur-xl rounded-2xl p-2">

          {/* CTA BUTTON */}
          <Pressable
            onPress={handlePlan}
            className="flex-row items-center justify-center gap-2 py-3 rounded-xl bg-orange-500"
          >
            <Ionicons name="location-outline" size={22} color="#fff" />
            <Text className="text-white text-base font-semibold">
              เลือกแผนการเดินทางนี้
            </Text>
          </Pressable>

        </View>
      </LinearGradient>
    </Animated.View>
  );
}