import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Switch } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { usePlan } from "../../../context/PlanContext";
import { Ionicons } from "@expo/vector-icons";

const ACTIVITIES = [
  { key: "เดินป่า", icon: "md-walk-outline" },
  { key: "ตั้งแคมป์", icon: "md-telescope-outline" },
  { key: "ดำน้ำ", icon: "water-outline" },
  { key: "ชมธรรมชาติ", icon: "leaf-outline" },
  { key: "ถ่ายภาพ", icon: "camera-outline" },
  { key: "เที่ยวคาเฟ่", icon: "cafe-outline" },
  { key: "สายชอบปิ้ง", icon: "bonfire-outline" },
  { key: "ชมพระอาทิตย์", icon: "sunny-outline" },
  { key: "เดินตลาด", icon: "basket-outline" },
  { key: "สายกิน", icon: "restaurant-outline" },
  { key: "สปาและผ่อนคลาย", icon: "spa-outline" },
  { key: "วาดภาพ", icon: "brush-outline" },
  { key: "พายเรือ", icon: "boat-outline" },
  { key: "ชมหมอก", icon: "cloud-outline" },
  { key: "ทำงานฝีมือ", icon: "hand-left-outline" },
  { key: "ทำบุญ", icon: "flower-outline" },
  { key: "นวดแผนไทย", icon: "body-outline" },
  { key: "ช้อปของฝาก", icon: "gift-outline" },
  { key: "กิจกรรมผจญภัย", icon: "thunderstorm-outline" },
];

export default function ActivitiesScreen() {
  const router = useRouter();
  const { province } = useLocalSearchParams<{ province?: string }>();
  const { plan, setPlan } = usePlan();

  const [useProfile, setUseProfile] = useState<boolean>(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(plan.activities ?? []));

  const toggleActivity = (key: string) => {
    const s = new Set(selected);
    if (s.has(key)) {
      s.delete(key);
    } else {
      s.add(key);
    }
    setSelected(s);
  };

  const onNext = () => {
    setPlan({ ...plan, activities: Array.from(selected) });
    router.push({ pathname: "/plan/budget", params: { province } });
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} className="px-5 pt-4">
        <Text className="text-gray-500 text-base font-medium font-sans">STEP 4</Text>
        <Text className="text-2xl font-semibold font-sans text-[#3262AB] mb-6">
          เลือกกิจกรรมที่คุณสนใจ
        </Text>

        <View className="flex-row items-center mb-6">
          <Text className="text-base font-medium font-sans text-gray-700">ความชอบจากโปรไฟล์?</Text>
          <Switch
            value={useProfile}
            onValueChange={setUseProfile}
            thumbColor={useProfile ? "#3262AB" : "#FFFFFF"}
            trackColor={{ false: "#ccc", true: "#cde1f5" }}
            className="ml-3"
          />
        </View>

        <View className="flex-row flex-wrap">
          {ACTIVITIES.map((item) => {
            const isSel = selected.has(item.key);
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => toggleActivity(item.key)}
                className={`flex-row items-center m-1 px-3 py-2 rounded-full border ${
                  isSel ? "bg-[#e2f0ff] border-[#3262AB]" : "bg-white border-gray-300"
                }`}
              >
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={isSel ? "#3262AB" : "#555"}
                />
                <Text
                  className={`ml-2 text-base font-medium font-sans ${
                    isSel ? "text-[#3262AB]" : "text-gray-800"
                  }`}
                >
                  {item.key}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-5 pb-6 bg-white">
        <TouchableOpacity
          onPress={onNext}
          disabled={selected.size === 0}
          className={`w-full py-4 rounded-2xl ${
            selected.size > 0 ? "bg-orange-500" : "bg-gray-300"
          }`}
        >
          <Text className="text-white text-center text-lg font-semibold font-sans">
            ถัดไป
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
