import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type Member = {
  userId: string;
  name: string;
  avatar?: string;
};

export type FinalPlan = {
  _id: string;
  trip_title: string;
  previewImage?: string;
  total_budget: number;
  start_date?: string;
  end_date?: string;
  provinceName?: string;
  total_places?: number;
  hotel_level?: number;
};

type Props = {
  plan: FinalPlan;
  groupName?: string;
  members?: Member[];
  onPress?: (plan: FinalPlan) => void;
};

export default function PlanCard({
  plan,
  groupName,
  members = [],
  onPress,
}: Props) {

  const imageSource =
    plan.previewImage && plan.previewImage.length > 5
      ? { uri: plan.previewImage }
      : require("@/assets/images/default.png");

  const formatThaiDateRange = (start?: string, end?: string) => {
    if (!start || !end) return "-";

    const s = new Date(start);
    const e = new Date(end);

    const months = [
      "ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.",
      "ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."
    ];

    const days =
      Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return `${s.getDate()}–${e.getDate()} ${
      months[e.getMonth()]
    } ${e.getFullYear() + 543} • ${days} วัน`;
  };

  const dateText = formatThaiDateRange(plan.start_date, plan.end_date);

  const places = plan.total_places ?? 0;
  const hotel = plan.hotel_level ?? 3;

  const avatars = members.slice(0, 3);
  const extra = members.length - 3;

  return (
    <Pressable
      onPress={() => onPress?.(plan)}
      className="bg-white rounded-3xl overflow-hidden shadow mb-5"
    >

      <Image
        source={imageSource}
        resizeMode="cover"
        className="w-full h-40"
      />

      {/* CONTENT */}
      <View className="p-4">
        <Text className="text-lg font-semibold text-gray-900 mb-1">
          {plan.trip_title}
        </Text>

        <View className="mb-2">
          <View className="flex-row items-center mb-1">
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text className="font-medium text-gray-500 ml-2">
              จังหวัด{plan.provinceName ?? "-"}
            </Text>
          </View>

          {/* Places + Hotel */}
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center">
              <Ionicons name="map-outline" size={14} color="#6B7280" />
              <Text className="font-medium text-gray-500 ml-2">
                สถานที่ท่องเที่ยว {places} แห่ง
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons name="bed-outline" size={14} color="#6B7280" />
              <Text className="font-medium text-gray-500 ml-2">
                โรงแรม {hotel} ดาว
              </Text>
            </View>
          </View>
        </View>

        {/* DATE */}
        <View className="flex-row items-center mb-3">
          <Ionicons name="calendar-clear-outline" size={14} color="#6B7280" />
          <Text className="font-medium text-gray-500 ml-2">
            วันที่เดินทาง {dateText}
          </Text>
        </View>

        {/* DIVIDER */}
        <View className="h-[1px] bg-gray-200 mb-3" />

        {/* FOOTER */}
        <View className="flex-row items-end justify-between">
          <Text className="text-lg font-semibold text-gray-900">
            ค่าใช้จ่ายทั้งทริป ~฿{plan.total_budget?.toLocaleString()}
          </Text>

          <View className="items-end">
            <View className="flex-row mb-1">

              {avatars.map((m, i) => {
                const id =
                  typeof m.userId === "string"
                    ? m.userId
                    : m.userId?._id;

                return (
                  <Image
                    key={id || `avatar-${i}`}  // ✅ FIX
                    source={
                      m.avatar
                        ? { uri: m.avatar }
                        : require("@/assets/images/avatar.png")
                    }
                    className="w-10 h-10 rounded-full border border-white"
                  />
                );
              })}

              {extra > 0 && (
                <View
                  className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center border border-white"
                >
                  <Text className="text-[12px] font-medium text-gray-700">
                    +{extra}
                  </Text>
                </View>
              )}
            </View>

            {groupName && (
              <Text
                numberOfLines={1}
                className="text-xs font-medium text-gray-600 max-w-[140px]"
              >
                {groupName}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}