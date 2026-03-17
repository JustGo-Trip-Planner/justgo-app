import { View, Text, Image, TouchableOpacity, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Plan } from "@/types/response";

type Props = {
  plan: Plan;
  onPress?: () => void;
  onDelete?: (plan: Plan) => void;
  showReuseButton?: boolean;
  onReuse?: (plan: Plan) => void;
};

function formatThaiDateRange(start: string, end: string) {
  const monthNames = [
    "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
    "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"
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
    return `${startDay} - ${endDay} ${startMonth} ${startYear}`;
  }

  return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
}

export default function PlanCard({
  plan,
  onPress,
  onDelete,
  showReuseButton = false,
  onReuse
}: Props) {

  return (
    <View
      className="bg-white rounded-2xl mb-5 overflow-hidden"
      style={{
        shadowColor:"#000",
        shadowOffset:{width:0,height:4},
        shadowOpacity:0.08,
        shadowRadius:10,
        elevation:4
      }}
    >

      {/* HERO IMAGE */}
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <View>

          <Image
            source={{ uri: plan.previewImage }}
            className="h-44 w-full"
            resizeMode="cover"
          />

          {/* DELETE BUTTON */}
          {onDelete && (
            <Pressable
              onPress={() => onDelete(plan)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 items-center justify-center"
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
            </Pressable>
          )}

          {/* OVERLAY */}
          <View className="absolute bottom-0 left-0 right-0 p-4 bg-black/30">

            <Text className="text-white text-lg font-semibold font-sans">
              {plan.trip_title}
            </Text>

            <View className="flex-row items-center mt-1">
              <Ionicons name="calendar-outline" size={14} color="#fff"/>
              <Text className="ml-1 text-white font-medium font-sans">
                {formatThaiDateRange(plan.start_date, plan.end_date)}
              </Text>
            </View>

          </View>

        </View>
      </TouchableOpacity>


      {/* INFO */}
      <View className="px-4 py-3">

        <View className="flex-row items-center justify-between">

          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={18} color="#374151"/>
            <Text className="ml-1 text-sm text-gray-700 font-medium font-sans">
              สถานที่ท่องเที่ยว {plan.total_places} จุด
            </Text>
          </View>

          <View className="flex-row items-center">
            <Ionicons name="bed-outline" size={18} color="#374151"/>
            <Text className="ml-1 text-sm text-gray-700 font-medium font-sans">
              โรงแรมระดับ {plan.recommended_hotels?.[0]?.stars || "-"} ดาว
            </Text>
          </View>

        </View>

      </View>


      {/* BOTTOM */}
      <View className="flex-row items-center justify-between px-4 py-3 border-t border-gray-100">

        <View>
          <Text className="text-xs text-gray-500 font-medium font-sans">
            ค่าใช้จ่ายประมาณ
          </Text>

          <Text className="text-lg font-semibold text-gray-900 font-sans">
            ฿{plan.total_budget?.toLocaleString()}
          </Text>
        </View>

        <View className="flex-row items-center space-x-4">

          <Pressable
            onPress={onPress}
            className="flex-row items-center px-3 py-1.5 bg-gray-100 rounded-full"
          >
            <Ionicons name="eye-outline" size={16} color="#374151"/>
            <Text className="ml-1 text-gray-700 text-sm font-medium font-sans">
              ดูแผน
            </Text>
          </Pressable>

          {showReuseButton && (
            <Pressable
              onPress={() => onReuse?.(plan)}
              className="flex-row items-center px-3 py-1.5 bg-sky-100 rounded-lg"
            >
              <Ionicons name="refresh-outline" size={16} color="#3262AB"/>
              <Text className="ml-1 text-sky-700 text-sm font-medium font-sans">
                นำกลับ
              </Text>
            </Pressable>
          )}

        </View>

      </View>

    </View>
  );
}