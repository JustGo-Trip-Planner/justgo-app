import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";

type Props = {
  plan: any;
};


export default function OverviewTab({ plan }: Props) {
  const formatDateRange = (start: string, end: string) => {
    try {
      const startDate = parseISO(start);
      const endDate = parseISO(end);

      const startStr = format(startDate, "d", { locale: th });
      const endStr = format(endDate, "d MMMM yyyy", { locale: th });

      return `${startStr} - ${endStr}`;
    } catch {
      return `${start} - ${end}`;
    }
  };

  return (
    <View className="space-y-6 px-4 pt-4 pb-10">
      {/* 🧭 Trip Summary Card */}
      <View className="bg-white rounded-2xl shadow px-5 py-6 space-y-5 border border-gray-200">
        <View className="space-y-4">
          {/* วันที่เดินทาง + งบประมาณ */}
          <View className="flex-row justify-between">
            <View className="flex-row items-center gap-2 flex-1">
              <Ionicons name="calendar-outline" size={20} color="#4B5563" />
              <View>
                <Text className="font-sans font-semibold text-base text-black">
                  {formatDateRange(plan.start_date, plan.end_date)}
                </Text>
                <Text className="text-xs text-gray-500 font-sans">วันที่เดินทาง</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2 flex-1 justify-end">
              <Ionicons name="cash-outline" size={22} color="#4B5563" />
              <View className="items-end">
                <Text className="font-sans font-semibold text-base text-black">
                  ฿{plan.total_budget?.toLocaleString()}
                </Text>
                <Text className="text-xs text-gray-500 font-sans">งบประมาณ</Text>
              </View>
            </View>
          </View>

          {/* โรงแรม + สถานที่ */}
          <View className="flex-row justify-between">
            <View className="flex-row items-center gap-2 flex-1">
              <Ionicons name="bed-outline" size={20} color="#4B5563" />
              <View>
                <Text className="font-medium text-base text-black">
                  โรงแรม {plan.recommended_hotels?.[0]?.stars || "-"} ดาว
                </Text>
                <Text className="text-xs text-gray-500 font-sans">สถานที่พัก</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2 flex-1 justify-end">
              <Ionicons name="location-outline" size={20} color="#4B5563" />
              <View className="items-end">
                <Text className="font-sans font-semibold text-base text-black">
                  {plan.total_places} สถานที่
                </Text>
                <Text className="text-xs text-gray-500 font-sans">สถานที่ท่องเที่ยว</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 🏨 Hotel Recommendations */}
      <View className="space-y-3 mt-6">
        <View className="flex-row items-center gap-2 mb-2">
          <Ionicons name="business-outline" size={26} color="#4B5563" />
          <Text className="text-base font-semibold font-sans text-gray-800">
            แนะนำโรงแรม
          </Text>
        </View>

        <View className="flex-row gap-4">
          {plan.recommended_hotels?.map(
            (
              hotel: {
                image?: string;
                name: string;
                stars?: number;
                price_per_night?: number;
              },
              idx: number
            ) => (
              <View
                key={idx}
                className="w-[150px] bg-white rounded-xl shadow border border-gray-200 overflow-hidden"
              >
                <Image
                  source={{
                    uri: hotel.image || "https://via.placeholder.com/150",
                  }}
                  className="w-full h-28"
                  resizeMode="cover"
                />
                <View className="p-2">
                  <Text
                    className="font-sans font-semibold text-sm text-black"
                    numberOfLines={2}
                  >
                    {hotel.name}
                  </Text>

                  <View className="flex-row items-center gap-1 mt-1">
                    <Ionicons name="star" size={14} color="#FBBF24" />
                    <Text className="text-xs font-sans text-gray-600">
                      {hotel.stars || 3}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-1 mt-1">
                    <Ionicons name="pricetag-outline" size={14} color="#4B5563" />
                    <Text className="text-xs font-sans text-gray-600">
                      ฿{hotel.price_per_night?.toLocaleString() || 0}/คืน
                    </Text>
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
