import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatThaiDateRange, getImageSource } from "@/lib/formatDate";

type Hotel = {
  _id?: string;
  name?: string;
  stars?: number;
};

type Plan = {
  _id: string;
  trip_title: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  previewImage?: string;
  total_places?: number;
  recommended_hotels?: Hotel[];
};

type Props = {
  plan: Plan;
  active: boolean;
  onPress: () => void;
};

export default function PlanSelectCard({
  plan,
  active,
  onPress,
}: Props) {

  return (

    <Pressable
      onPress={onPress}
      className={`mb-4 flex-row items-center rounded-2xl border px-3 py-3 ${
        active
          ? "border-sky-700 bg-blue-50"
          : "border-gray-200 bg-white"
      }`}
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
    >

      {/* IMAGE */}
      <Image
        source={getImageSource(plan.previewImage)}
        resizeMode="cover"
        className="h-20 w-28 rounded-xl"
      />


      {/* INFO */}
      <View className="ml-3 flex-1">
        <Text
          numberOfLines={1}
          className="font-semibold font-sans text-base text-gray-900"
        >
          {plan.trip_title}
        </Text>

        <Text className="mt-1 font-medium font-sans text-sm text-gray-500">
          {formatThaiDateRange(plan.start_date, plan.end_date)}
        </Text>

        <Text className="mt-1 font-medium font-sans text-sm text-gray-600">
          งบประมาณ <Text className="font-semibold text-gray-900">
            ฿{plan.total_budget?.toLocaleString("th-TH")}
          </Text>
        </Text>
      </View>


      {/* SELECT BUTTON */}
      <View className="ml-2">
        <Ionicons
          name={active ? "checkmark-circle" : "ellipse-outline"}
          size={26}
          color={active ? "#3262AB" : "#9CA3AF"}
        />
      </View>
    </Pressable>
  );
}