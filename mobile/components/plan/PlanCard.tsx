import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { th } from "date-fns/locale";

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
  onPress: () => void;
  onSelect: () => void;
}

export default function PlanCard({ plan, onPress, onSelect }: PlanCardProps) {
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

  return (
    <View className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden border border-gray-300">
      <Image
        source={{ uri: previewImage }}
        className="w-full h-40"
        resizeMode="cover"
      />

      <View className="p-4">
        <Text className="text-2xl font-semibold text-black mb-2">{trip_title}</Text>

        <View className="flex-row items-center flex-wrap gap-3 mb-2">
          <View className="flex-row items-center space-x-1">
            <Ionicons name="location-outline" size={18} color="#6b7280" />
            <Text className="text-gray-600 text-sm">
              สถานที่ท่องเที่ยว {total_places} แห่ง
            </Text>
          </View>

          <View className="flex-row items-center space-x-1">
            <Ionicons name="bed-outline" size={18} color="#6b7280" />
            <Text className="text-gray-600 text-sm">
              โรงแรมระดับ {hotelStars} ดาว
            </Text>
          </View>
        </View>

        <View className="flex-row items-center space-x-1 mb-1">
          <Ionicons name="people-outline" size={18} color="#6b7280" />
          <Text className="text-gray-600 text-sm">{group}</Text>
        </View>

        <View className="flex-row items-center space-x-1 mb-4">
          <Ionicons name="calendar-outline" size={18} color="#6b7280" />
          <Text className="text-gray-600 text-sm font-medium ml-1">วันที่เดินทาง</Text>
          <Text className="text-gray-800 text-sm font-medium ml-2">
            {format(new Date(start_date), "dd MMM", { locale: th })} –{" "}
            {format(new Date(end_date), "dd MMM yyyy", { locale: th })}
          </Text>
        </View>

        <Text className="text-lg text-gray-600 font-sans mb-2">ค่าใช้จ่ายทั้งทริปโดยประมาณ</Text>
        <Text className="text-xl font-medium text-black mb-4">
          ฿{total_budget.toLocaleString()}
        </Text>

        <View className="flex-row justify-between space-x-2">
          <TouchableOpacity
            onPress={onSelect}
            className="flex-1 bg-orange-500 rounded-full py-2 flex-row items-center justify-center"
          >
            <Ionicons name="location-outline" size={18} color="#fff" />
            <Text className="text-white font-medium ml-1">เลือกแผนนี้</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onPress}
            className="flex-1 bg-blue-600 rounded-full py-2 flex-row items-center justify-center"
          >
            <Ionicons name="information-circle-outline" size={18} color="#fff" />
            <Text className="text-white font-medium ml-1">ดูรายละเอียดเพิ่มเติม</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
