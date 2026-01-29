import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { Plan } from "@/types/response";

type Props = {
  plan: Plan;
  editable?: boolean;
};

function formatThaiDateRange(start: string, end: string) {
  const monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const startDate = new Date(start);
  const endDate = new Date(end);

  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const startMonth = monthNames[startDate.getMonth()];
  const endMonth = monthNames[endDate.getMonth()];
  const startYear = startDate.getFullYear() + 543;
  const endYear = endDate.getFullYear() + 543;

  if (startMonth === endMonth && startYear === endYear) {
    return `${startDay} - ${endDay} ${endMonth} ${endYear}`;
  }

  return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
}

export default function PlanCard({ plan }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/trip/${plan._id}`)}
      className="bg-white/90 rounded-2xl overflow-hidden mb-4 w-full"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      {/* Cover Image */}
      <Image
        source={{ uri: plan.previewImage }}
        className="h-40 w-full"
        resizeMode="cover"
      />

      {/* Content */}
      <View className="p-4 space-y-2">
        <Text className="text-[17px] font-semibold text-gray-900 font-sans">
          {plan.trip_title}
        </Text>

        {/* Place & Hotel */}
        <View className="flex-row items-center flex-wrap gap-x-3">
          <Ionicons name="location-outline" size={20} color="#111" />
          <Text className="text-sm text-gray-700 font-sans">
            สถานที่ท่องเที่ยว {plan.total_places} แห่ง
          </Text>
          <Ionicons name="bed-outline" size={20} color="#111" className="ml-4" />
          <Text className="text-sm text-gray-700 font-sans">
            โรงแรมระดับ {plan.recommended_hotels?.[0]?.stars || "-"} ดาว
          </Text>
        </View>

        {/* Dates */}
        <View className="flex-row items-center gap-x-2">
          <Text className="text-xs text-gray-500 font-sans">ผู้ร่วมเดินทาง</Text>
          <Text className="text-xs text-gray-500 font-sans">วันที่เดินทาง</Text>
          <View className="flex-1 items-end">
            <Text className="text-sm text-gray-800 font-sans">
              {formatThaiDateRange(plan.start_date, plan.end_date)}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Bar */}
      <View className="bg-[#e0f2fe] px-4 py-3 rounded-b-2xl">
        <Text className="text-center text-gray-700 font-sans">
          ค่าใช้จ่ายทั้งทริปโดยประมาณ{" "}
          <Text className="font-semibold text-lg text-gray-900">
            ~฿{plan.total_budget?.toLocaleString()}
          </Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}
