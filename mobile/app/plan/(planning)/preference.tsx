// app/plan/interests.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Switch } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { usePlan } from "../../../context/PlanContext";
import { Ionicons } from "@expo/vector-icons";

const INTERESTS = [
  { key: "ทะเล", icon: "water-outline" },
  { key: "ภูเขา", icon: "trail-sign-outline" },
  { key: "น้ำตก", icon: "waterfall-outline" },
  { key: "ตลาดน้ำ", icon: "cart-outline" },
  { key: "เมืองโบราณ", icon: "business-outline" },
  { key: "ถ้ำ", icon: "cave-outline" },
  { key: "พิพิธภัณฑ์", icon: "albums-outline" },
  { key: "อุทยาน", icon: "leaf-outline" },
  { key: "ฟาร์ม", icon: "egg-outline" },
  { key: "จุดชมวิว", icon: "eye-outline" },
  { key: "วัด", icon: "bonfire-outline" },
  { key: "หมู่บ้านพื้นเมือง", icon: "people-outline" },
  { key: "ดอยสูง", icon: "mountain-outline" },
  { key: "สวนดอกไม้", icon: "flower-outline" },
  { key: "แหล่งประวัติศาสตร์", icon: "library-outline" },
  { key: "แหล่งธรรมชาติ", icon: "nature-outline" },
  { key: "เมืองเก่า", icon: "time-outline" },
  { key: "เมืองใหญ่", icon: "business-outline" },
  { key: "ชนบท", icon: "locate-outline" },
  { key: "ทะเลสาบ", icon: "water-outline" },
  { key: "จุดเช็คอินยอดนิยม", icon: "pricetags-outline" },
];

export default function InterestsScreen() {
  const router = useRouter();
  const { province } = useLocalSearchParams<{ province?: string }>();
  const { plan, setPlan } = usePlan();

  const [useProfile, setUseProfile] = useState<boolean>(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(plan.interests ?? []));

  const toggleInterest = (key: string) => {
    const s = new Set(selected);
    if (s.has(key)) {
      s.delete(key);
    } else {
      s.add(key);
    }
    setSelected(s);
  };

  const onNext = () => {
    setPlan({ ...plan, interests: Array.from(selected) });
    router.push({ pathname: "/plan/activity", params: { province } });
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} className="px-5 pt-4">
        <Text className="text-gray-500 text-base font-medium font-sans">STEP 3</Text>
        <Text className="text-2xl font-semibold font-sans text-[#3262AB] mb-6">
          เลือกประเภทท่องเที่ยวที่คุณชอบ
        </Text>

        {/* Toggle from profile */}
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
          {INTERESTS.map((item) => {
            const isSel = selected.has(item.key);
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => toggleInterest(item.key)}
                className={`flex-row items-center m-1 px-3 py-2 rounded-full border ${
                  isSel
                    ? "bg-[#e2f0ff] border-[#3262AB]"
                    : "bg-white border-gray-300"
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
