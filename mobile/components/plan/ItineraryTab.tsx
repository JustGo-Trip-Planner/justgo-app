import { View, Text, Image, ScrollView, Pressable } from "react-native";
import { useState } from "react";
import { FontAwesome5, MaterialIcons, Feather } from "@expo/vector-icons";

export default function ItineraryTab({ plan }: { plan: any }) {
  const [day, setDay] = useState(0);
  const days = plan.daily_itinerary || [];

  return (
    <ScrollView className="space-y-4 px-4 pb-20 bg-white">
      {/* Tabs วันที่ */}
      <View className="flex-row justify-center mt-4 space-x-2">
        {days.map((_: any, idx: number) => (
          <Pressable
            key={idx}
            onPress={() => setDay(idx)}
            className={`px-4 py-1.5 rounded-full ${
              idx === day ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-sm font-sans ${
                idx === day ? "text-white font-semibold" : "text-black font-medium"
              }`}
            >
              วันที่ {idx + 1}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Map Image */}
      <Image
        source={{ uri: days[day]?.map_image }}
        className="w-full h-52 rounded-xl my-4"
        resizeMode="cover"
      />

      {/* กิจกรรมในแต่ละวัน */}
      {days[day]?.activities?.map((activity: any, idx: number) => (
        <View
          key={idx}
          className="flex-row items-start space-x-3 bg-white rounded-xl mb-4 shadow p-3"
        >
          {/* เวลา */}
          <View className="items-center">
            <FontAwesome5 name="map-marker-alt" size={16} color="#F97316" />
            <Text className="text-orange-500 font-sans font-semibold mt-1">
              {activity.time}
            </Text>
          </View>

          {/* Card ข้อมูลสถานที่ */}
          <View className="flex-1">
            <Image
              source={{ uri: activity.image }}
              className="w-full h-36 rounded-md"
              resizeMode="cover"
            />
            <Text className="mt-2 text-base font-sans font-semibold">
              {activity.place_name}
            </Text>

            {activity.open_time && (
              <View className="flex-row items-center space-x-1 mt-1">
                <MaterialIcons name="access-time" size={16} color="#6B7280" />
                <Text className="text-sm font-sans font-medium text-gray-600">
                  {activity.open_time}
                </Text>
              </View>
            )}

            {activity.entry_fee && typeof activity.entry_fee === "object" && (
            <View className="flex-row items-center space-x-1 mt-1">
                <Feather name="credit-card" size={16} color="#6B7280" />
                <Text className="text-sm font-sans font-medium text-gray-600">
                {`ค่าเข้า: คนไทย ${activity.entry_fee.thai ?? 0} บาท | ต่างชาติ ${activity.entry_fee.foreigner ?? 0} บาท`}
                </Text>
            </View>
            )}

            <Pressable className="mt-3 self-start bg-orange-500 px-3 py-1.5 rounded-full">
              <Text className="text-white font-sans font-semibold text-sm">
                ดูบนแผนที่
              </Text>
            </Pressable>
          </View>
        </View>
      ))}

      {/* ปุ่มเลือกแผน */}
      <View className="mt-6 mb-10">
        <Pressable className="bg-orange-500 rounded-xl py-3 items-center">
          <Text className="text-white font-sans font-semibold text-base">
            เลือกแผนการเดินทางนี้
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
