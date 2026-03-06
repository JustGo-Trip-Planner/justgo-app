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
    uri ? { uri } : require("@/assets/images/default.png");

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
    <View className="bg-white rounded-2xl mb-4 shadow-sm overflow-hidden">

      <View className="flex-row">

        {/* IMAGE */}
        <Image
          source={avatarSource(plan.previewImage)}
          className="w-28 h-24"
          resizeMode="cover"
        />

        {/* INFO */}
        <View className="flex-1 p-3 justify-between">

          <View>

            <Text className="font-semibold text-gray-800 text-base">
              {plan.trip_title}
            </Text>

            <View className="flex-row items-center mt-1">
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text className="text-xs text-gray-500 ml-1">
                {formatDate(plan.start_date, plan.end_date)}
              </Text>
            </View>

            <Text className="text-xs text-gray-500 mt-1">
              ประมาณ ~฿{plan.total_budget.toLocaleString()}
            </Text>

          </View>

          {/* SUBMIT USER */}
          <View className="flex-row items-center mt-1">

            <Text className="text-xs text-gray-500 mr-2">
              เจ้าของแผน
            </Text>

            <Image
              source={avatarSource(user.avatar)}
              className="w-5 h-5 rounded-full"
            />

            <Text className="text-xs text-gray-600 ml-1">
              {user.first_name ?? "Unknown"}
            </Text>

          </View>

        </View>

      </View>

      {/* ACTIONS */}
      <View className="flex-row justify-end px-3 pb-3">

        {!voted && (
          <Pressable
            onPress={onPressVote}
            className="bg-blue-500 px-3 py-1 rounded-full mr-2"
          >
            <Text className="text-white text-xs font-medium">
              โหวต
            </Text>
          </Pressable>
        )}

        {voted && (
          <Text className="text-green-600 text-xs font-medium mr-3">
            ✔ โหวตแล้ว
          </Text>
        )}

        <Pressable
          onPress={onPressView}
          className="bg-gray-200 px-3 py-1 rounded-full"
        >
          <Text className="text-xs font-medium">
            ดูแผน
          </Text>
        </Pressable>

      </View>

    </View>
  );
}