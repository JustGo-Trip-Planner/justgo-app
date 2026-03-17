import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Plan = {
  _id: string;
  trip_title: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  previewImage?: string;
};

type User = {
  _id: string;
  first_name?: string;
  avatar?: string;
};

type Props = {
  plan: Plan;
  user: User;
  voted?: boolean;
  onPressVote?: () => void;
  onPressView?: () => void;
};

export default function SubmittedPlanCard({
  plan,
  user,
  voted,
  onPressVote,
  onPressView,
}: Props) {

  const avatarSource = (uri?: string) =>
    uri?.trim()
      ? { uri }
      : require("@/assets/images/default.png");

  const formatDate = (start: string, end: string) => {
    const months = [
      "ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.",
      "ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."
    ];

    const s = new Date(start);
    const e = new Date(end);

    return `${s.getDate()} – ${e.getDate()} ${months[e.getMonth()]} ${e.getFullYear()+543}`;
  };

  return (
    <View className="bg-white rounded-3xl overflow-hidden mb-5 shadow-sm">

      {/* IMAGE */}

      <View className="w-full h-44">

        <Image
          source={avatarSource(plan.previewImage)}
          className="w-full h-full"
          resizeMode="cover"
        />

        {/* OWNER BADGE */}

        <View className="absolute bottom-2 left-3 flex-row items-center bg-white/90 px-2 py-1 rounded-full">

          <Image
            source={avatarSource(user.avatar)}
            className="w-5 h-5 rounded-full"
          />

          <Text className="ml-1 text-xs text-gray-700 font-sans font-medium">
            {user.first_name ?? "Unknown"}
          </Text>

        </View>

      </View>

      {/* CONTENT */}

      <View className="px-4 py-4">

        <Text
          className="text-base text-gray-900 font-sans font-semibold"
          numberOfLines={1}
        >
          {plan.trip_title}
        </Text>

        {/* DATE */}

        <View className="flex-row items-center mt-2">

          <Ionicons name="calendar-outline" size={15} color="#6B7280" />

          <Text className="ml-1 text-sm text-gray-500 font-sans font-medium">
            {formatDate(plan.start_date, plan.end_date)}
          </Text>

        </View>

        {/* BUDGET */}

        <View className="flex-row items-center mt-1">

          <Ionicons name="wallet-outline" size={15} color="#6B7280" />

          <Text className="ml-1 text-sm text-gray-500 font-sans font-medium">
            ประมาณ ฿{plan.total_budget.toLocaleString()}
          </Text>

        </View>

      </View>

      {/* ACTIONS */}

      <View className="flex-row items-center justify-between px-4 pb-4">

        {voted ? (
          <View className="flex-row items-center">

            <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
            <Text className="ml-1 text-sm text-green-600 font-sans font-medium">
              โหวตแล้ว
            </Text>

          </View>
        ) : (
          <Pressable
            onPress={onPressVote}
            className="bg-sky-700 px-4 py-2 rounded-full"
          >
            <Text className="text-white text-sm font-sans font-medium">
              ให้คะแนนแผน
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={onPressView}
          className="flex-row items-center"
        >
          <Text className="text-sm text-gray-700 font-sans font-medium mr-1">
            ดูรายละเอียด
          </Text>

          <Ionicons name="chevron-forward" size={16} color="#6B7280" />
        </Pressable>

      </View>
    </View>
  );
}