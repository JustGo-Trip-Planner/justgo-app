import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { usePlan, useSelectedPlan } from "@/context/PlanContext";

interface DailyBudgetItem {
  transportation?: number;
  accommodation?: number;
  food?: number;
  others?: number;
  total?: number;
}

interface ExpenseBreakdown {
  transportation?: number;
  accommodation?: number;
  food?: number;
  others?: number;
  total?: number;
}

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
    total_expense_breakdown?: ExpenseBreakdown;
    daily_budget?: DailyBudgetItem[];
    previewImage?: string;
    daily_itinerary?: any[];
  };
  index: number;
  onPress: () => void;
}

const toNumber = (value: any) => {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
};

const calculateBudgetFromDailyBudget = (dailyBudget: DailyBudgetItem[] = []) => {
  return (dailyBudget || []).reduce((sum, day) => {
    const total = toNumber(day?.total);
    if (total > 0) return sum + total;

    return (
      sum +
      toNumber(day?.transportation) +
      toNumber(day?.accommodation) +
      toNumber(day?.food) +
      toNumber(day?.others)
    );
  }, 0);
};

const resolveDisplayBudget = (sourcePlan?: any) => {
  const dailyBudgetTotal = calculateBudgetFromDailyBudget(
    sourcePlan?.daily_budget || []
  );
  if (dailyBudgetTotal > 0) return dailyBudgetTotal;

  const breakdownTotal = toNumber(sourcePlan?.total_expense_breakdown?.total);
  if (breakdownTotal > 0) return breakdownTotal;

  return toNumber(sourcePlan?.total_budget);
};

const resolveDisplayTotalPlaces = (sourcePlan?: any) => {
  const dailyItinerary = sourcePlan?.daily_itinerary || [];
  if (Array.isArray(dailyItinerary) && dailyItinerary.length > 0) {
    return dailyItinerary.reduce((sum: number, day: any) => {
      return sum + ((day?.activities || []).length);
    }, 0);
  }

  return toNumber(sourcePlan?.total_places);
};

export default function PlanCard({ plan, index, onPress }: PlanCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { plan: basePlan } = usePlan();
  const fullPlan = useSelectedPlan(index.toString());

  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const {
    trip_title,
    recommended_hotels,
    group,
    start_date,
    end_date,
    previewImage,
  } = plan;

  const hotelStars = recommended_hotels?.[0]?.stars || 3;

  // ใช้ fullPlan ก่อน เพราะข้อมูลมักครบกว่า plan prop
  const displayBudget = resolveDisplayBudget(fullPlan || plan);
  const displayTotalPlaces = resolveDisplayTotalPlaces(fullPlan || plan);

  const handleSelect = async () => {
    try {
      if (!user) {
        Alert.alert("กรุณาเข้าสู่ระบบก่อน");
        return;
      }

      const mergedPlan = {
        ...basePlan,
        ...fullPlan,
        total_budget: resolveDisplayBudget(fullPlan || plan),
        total_places: resolveDisplayTotalPlaces(fullPlan || plan),
      };

      const res = await axios.post(`${API_URL}/api/plan/save`, {
        userId: user.id,
        ...mergedPlan,
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
      <View className="h-52">
        <Image
          source={{ uri: previewImage }}
          className="absolute w-full h-full"
          resizeMode="cover"
        />

        <View className="absolute inset-0 bg-black/40" />

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
              <Ionicons name="location" size={18} color="#fff" />
              <Text className="text-white font-medium ml-1">
                {displayTotalPlaces} สถานที่
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons name="bed" size={18} color="#fff" />
              <Text className="text-white font-medium ml-1">
                ระดับ {hotelStars} ดาว
              </Text>
            </View>

            <View className="flex-row items-center">
              <Text className="text-white font-medium ml-1">
                {group}
              </Text>
            </View>
          </View>
        </View>

        <View className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full">
          <Text className="text-gray-900 text-lg font-semibold">
            ฿{displayBudget.toLocaleString("th-TH")}
          </Text>
        </View>
      </View>

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