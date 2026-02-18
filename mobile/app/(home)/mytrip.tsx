import { View, Text, ScrollView, TouchableOpacity, Image, ImageBackground } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import axios from "axios";
import type { Plan } from "@/types/response";
import PlanCard from "@/components/home/PlanCard";

export default function MyTrip() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const router = useRouter();
  const API_URL = Constants.expoConfig?.extra?.API_URL;

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/plan`);
        setPlans(res.data || []);
      } catch (err) {
        console.error("❌ Fetch failed:", err);
      }
    };
    fetchPlans();
  }, []);

  const EmptyState = () => (
    <View className="bg-white/80 rounded-2xl shadow-md p-12 items-center justify-center px-6 h-full">
      <Ionicons name="map-outline" size={72} color="#cbd5e1" />
      <Text className="text-xl font-semibold text-gray-700 mt-4 mb-2">
        ยังไม่มีแผนของคุณ
      </Text>
      <Text className="text-gray-500 text-center font-sans mb-6">
        เริ่มสร้างแผนการเดินทางเพื่อบันทึกทริปแรกของคุณ
      </Text>
      <TouchableOpacity
        onPress={() => router.push("/")}
        className="bg-orange-500 px-6 py-3 rounded-full flex-row items-center"
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text className="text-white text-base font-medium ml-2">
          สร้างแผนการเดินทางของคุณ
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ImageBackground
      source={require("@/assets/backgrounds/bg.png")}
      resizeMode="cover"
      className="flex-1"
    >
      <View className="flex-1 bg-white/20 backdrop-blur-md">
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} className="pt-14">

          {/* Header */}
          <View className="items-center mb-6">
            <Image
              source={require("@/assets/icons/logo.png")}
              className="h-10 w-32"
              resizeMode="contain"
            />
            <TouchableOpacity className="absolute top-1 right-0">
              <Ionicons name="notifications-outline" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text className="text-2xl text-blue-800 font-semibold text-center mb-1">
            แผนการเดินทางของฉัน
          </Text>
          <Text className="text-base text-blue-800 font-sans text-center mb-6">
            รวมทุกการเดินทางของคุณไว้ในที่เดียว
          </Text>

          {/* Tabs */}
          <View className="flex-row justify-center mb-6">
            <TouchableOpacity className="px-4 py-2 bg-orange-400 rounded-full mr-2">
              <Text className="text-sm text-white font-sans">แผนเดินทางของคุณ</Text>
            </TouchableOpacity>
            <TouchableOpacity className="px-4 py-2 bg-white rounded-full border border-gray-300">
              <Text className="text-sm text-gray-700 font-sans">ประวัติแผนการเดินทาง</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {plans.length === 0 ? (
            <EmptyState />
          ) : (
            plans.map((plan) => (
              <PlanCard
                key={plan._id}
                plan={plan}
                onPress={() => router.push(`/trip/${plan._id}`)}
                editable={false}
              />
            ))
          )}
        </ScrollView>
      </View>
    </ImageBackground>
  );
}
