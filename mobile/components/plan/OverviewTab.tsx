import { View, Text, Image } from "react-native";
import { Ionicons, FontAwesome, FontAwesome5 } from "@expo/vector-icons";

export default function OverviewTab({ plan }: { plan: any }) {
  return (
    <View className="space-y-4 px-4 pt-2">
      {/* ✅ สรุปข้อมูลทริป */}
      <View className="bg-white rounded-2xl shadow p-5 space-y-4">
        <View className="flex-row justify-between">
          <View className="flex-row items-center gap-2">
            <Ionicons name="calendar" size={18} />
            <View>
              <Text className="text-base font-sans font-semibold">
                {plan.start_date} - {plan.end_date}
              </Text>
              <Text className="text-xs font-sans font-medium text-gray-500">
                วันที่เดินทาง
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <FontAwesome name="money" size={18} />
            <View>
              <Text className="text-base font-sans font-semibold">฿{plan.total_budget}</Text>
              <Text className="text-xs font-sans font-medium text-gray-500">งบประมาณ</Text>
            </View>
          </View>
        </View>

        <View className="flex-row justify-between">
          <View className="flex-row items-center gap-2">
            <Ionicons name="bed" size={18} />
            <View>
              <Text className="text-base font-sans font-semibold">
                โรงแรม {plan.recommended_hotels?.[0]?.stars ?? "–"} ดาว
              </Text>
              <Text className="text-xs font-sans font-medium text-gray-500">สถานที่พัก</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <Ionicons name="location" size={18} />
            <View>
              <Text className="text-base font-sans font-semibold">{plan.total_places} สถานที่</Text>
              <Text className="text-xs font-sans font-medium text-gray-500">สถานที่ท่องเที่ยว</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ✅ โรงแรมที่แนะนำ */}
      <View className="mt-1">
        <View className="flex-row items-center gap-2 mb-2">
          <Ionicons name="bed" size={18} />
          <Text className="text-base font-sans font-semibold">แนะนำโรงแรม</Text>
        </View>

        <View className="flex-row gap-3">
          {plan.recommended_hotels?.map(
            (
              hotel: { image: string; name: string; stars: number; price: number },
              idx: number
            ) => (
              <View
                key={idx}
                className="w-[140px] bg-white rounded-xl shadow overflow-hidden"
              >
                <Image
                  source={{ uri: hotel.image }}
                  className="w-full h-28"
                  resizeMode="cover"
                />
                <View className="p-2 space-y-1">
                  <Text className="text-sm font-sans font-semibold" numberOfLines={2}>
                    {hotel.name}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <FontAwesome name="star" size={12} color="orange" />
                    <Text className="text-sm font-sans font-medium">{hotel.stars}</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <FontAwesome5 name="coins" size={12} />
                    <Text className="text-sm font-sans font-medium">฿{hotel.price}/คืน</Text>
                  </View>
                </View>
              </View>
            )
          )}
        </View>
      </View>
    </View>
  );
}
