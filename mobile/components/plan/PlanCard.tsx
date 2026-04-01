import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { usePlan, useSelectedPlan } from "@/context/PlanContext";

interface PlanCardProps {
  plan: {
    id: string;
    trip_title: string;
    total_places: number;
    recommended_hotels: { stars: number }[];
    group: string;
    start_date: string;
    end_date: string;
    total_budget: number;
    previewImage?: string;
  };
  index: number;
  onPress: () => void;
}

export default function PlanCard({ plan, index, onPress }: PlanCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { plan: basePlan } = usePlan();
  const fullPlan = useSelectedPlan(index.toString());

  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const {
    trip_title,
    total_places,
    recommended_hotels,
    group,
    start_date,
    end_date,
    total_budget,
    previewImage,
  } = plan;

  const hotelStars = recommended_hotels?.[0]?.stars || 3;

  const handleSelect = async () => {
    try {
      if (!user) {
        Alert.alert("กรุณาเข้าสู่ระบบก่อน");
        return;
      }

      const res = await axios.post(`${API_URL}/api/plan/save`, {
        userId: user.id,
        ...basePlan,
        ...fullPlan,
      });

      console.log("✅ Plan saved:", res.data);
      router.push("/(home)/mytrip");
    } catch (error) {
      console.error("❌ Save plan failed:", error);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกแผนได้");
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="mb-5 rounded-t-3xl overflow-hidden"
    >
      {/* IMAGE */}
      <View className="h-52">
        <Image
          source={{ uri: previewImage }}
          className="absolute w-full h-full"
          resizeMode="cover"
        />

        {/* OVERLAY */}
        <View className="absolute inset-0 bg-black/40" />

        {/* CONTENT */}
        <View className="flex-1 justify-end px-4 py-2">
          <Text className="text-white text-xl font-semibold">
            {trip_title}
          </Text>

          <Text className="text-white font-medium mt-1">
            {format(new Date(start_date), "dd MMM", { locale: th })} –{" "}
            {format(new Date(end_date), "dd MMM yyyy", { locale: th })}
          </Text>

          <View className="flex-row flex-wrap mt-2 gap-3">
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={18} color="#fff" />
              <Text className="text-white font-medium ml-1">
                {total_places} สถานที่
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons name="bed-outline" size={18} color="#fff" />
              <Text className="text-white font-medium ml-1">
                ระดับ {hotelStars} ดาว
              </Text>
            </View>

            <View className="flex-row items-center">
              {/* <Ionicons name="people-outline" size={18} color="#fff" /> */}
              <Text className="text-white font-medium ml-1">
                {group}
              </Text>
            </View>
          </View>
        </View>

        {/* PRICE */}
        <View className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full">
          <Text className="text-gray-900 text-lg font-semibold">
            ฿{total_budget.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* ACTIONS */}
      <View className="flex-row mt-3 gap-2 px-1">
        <TouchableOpacity
          onPress={handleSelect}
          className="flex-1 py-3 rounded-xl bg-orange-500 items-center"
        >
          <Text className="text-white text-sm font-medium">
            เลือกแผนนี้
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPress}
          className="flex-1 py-3 rounded-xl bg-gray-100 items-center"
        >
          <Text className="text-gray-700 text-sm font-medium">
            รายละเอียด
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}