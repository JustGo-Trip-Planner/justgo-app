import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePlan } from "../../../context/PlanContext";

export default function WhoScreen() {
  const router = useRouter();
  const { province } = useLocalSearchParams<{ province?: string }>();
  const { plan, setPlan } = usePlan();
  const [mode, setMode] = useState(plan.mode ?? "คนเดียว");
  const [family, setFamily] = useState({ ผู้ใหญ่: 0, เด็กเล็ก: 0, ผู้สูงอายุ: 0 });
  const [friendCount, setFriendCount] = useState(1);

  const totalFamily = family.ผู้ใหญ่ + family.เด็กเล็ก + family.ผู้สูงอายุ;

  const onNext = () => {
    const mappedFamily = {
      adult: family.ผู้ใหญ่,
      kid: family.เด็กเล็ก,
      elderly: family.ผู้สูงอายุ,
    };

    setPlan({
      ...plan,
      groupType: mode,
      mode,
      friendCount,
      family: mode === "ครอบครัว" ? mappedFamily : undefined,
    });
    
    router.push({ pathname: "/plan/preference", params: { province } });
  };

  const Counter = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
  }) => (
    <View className="flex-row justify-between items-center mb-3">
      <Text className="text-base font-medium font-sans w-20">{label}</Text>
      <View className="flex-row items-center">
        <TouchableOpacity onPress={() => onChange(Math.max(0, value - 1))} className="p-2">
          <Ionicons name="remove-circle-outline" size={24} color={value > 0 ? "#333" : "#ccc"} />
        </TouchableOpacity>
        <Text className="mx-4 text-base font-semibold font-sans">{value}</Text>
        <TouchableOpacity onPress={() => onChange(value + 1)} className="p-2">
          <Ionicons name="add-circle-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} className="px-5 pt-4">
        <Text className="text-gray-500 text-base font-medium font-sans">STEP 2</Text>
        <Text className="text-2xl font-semibold font-sans text-[#3262AB] mb-6">
          คุณจะไปเที่ยวกับใคร
        </Text>

        {/* คนเดียว */}
        <TouchableOpacity
          onPress={() => {
            setMode("คนเดียว");
          }}
          className={`border rounded-2xl p-4 mb-4 ${
            mode === "คนเดียว" ? "border-[#3262AB] bg-blue-50" : "border-gray-300 bg-white"
          }`}
        >
          <Text className={`text-lg font-semibold font-sans ${mode === "คนเดียว" ? "text-[#3262AB]" : "text-gray-800"}`}>
            คนเดียว
          </Text>
          <Text className="text-sm font-medium font-sans text-gray-500 mt-1">
            เดินทางคนเดียวอย่างอิสระ เลือกเส้นทางและเวลาได้ตามใจคุณ
          </Text>
        </TouchableOpacity>

        {/* คู่รัก */}
        <TouchableOpacity
          onPress={() => {
            setMode("คู่รัก");
          }}
          className={`border rounded-2xl p-4 mb-4 ${
            mode === "คู่รัก" ? "border-[#3262AB] bg-blue-50" : "border-gray-300 bg-white"
          }`}
        >
          <Text className={`text-lg font-semibold font-sans ${mode === "คู่รัก" ? "text-[#3262AB]" : "text-gray-800"}`}>
            คู่รัก
          </Text>
          <Text className="text-sm font-medium font-sans text-gray-500 mt-1">
            ใช้เวลาคุณภาพกับคนพิเศษ ในบรรยากาศโรแมนติกและผ่อนคลาย
          </Text>
        </TouchableOpacity>

        {/* ครอบครัว */}
        <TouchableOpacity
          onPress={() => {
            setMode("ครอบครัว");
          }}
          className={`border rounded-2xl p-4 ${
            mode === "ครอบครัว" ? "border-[#3262AB] bg-blue-50" : "border-gray-300 bg-white"
          }`}
        >
          <Text className={`text-lg font-semibold font-sans ${mode === "ครอบครัว" ? "text-[#3262AB]" : "text-gray-800"}`}>
            ครอบครัว
          </Text>
          <Text className="text-sm font-medium font-sans text-gray-500 mt-1">
            เที่ยวพร้อมหน้าทั้งครอบครัว มีกิจกรรมที่เหมาะกับทั้งเด็กและผู้ใหญ่
          </Text>
        </TouchableOpacity>

        {mode === "ครอบครัว" && (
          <View className="border border-[#3262AB] rounded-2xl p-4 mt-3">
            <Counter label="ผู้ใหญ่" value={family.ผู้ใหญ่} onChange={(v) => setFamily({ ...family, ผู้ใหญ่: v })} />
            <Counter label="เด็กเล็ก" value={family.เด็กเล็ก} onChange={(v) => setFamily({ ...family, เด็กเล็ก: v })} />
            <Counter label="ผู้สูงอายุ" value={family.ผู้สูงอายุ} onChange={(v) => setFamily({ ...family, ผู้สูงอายุ: v })} />
            <Text className="text-right text-sm font-medium text-gray-700 mt-1">
              รวมทั้งหมด {totalFamily} คน
            </Text>
          </View>
        )}

        {/* เพื่อน */}
        <TouchableOpacity
          onPress={() => {
            setMode("เพื่อน");
          }}
          className={`border rounded-2xl p-4 mt-4 ${
            mode === "เพื่อน" ? "border-[#3262AB] bg-blue-50" : "border-gray-300 bg-white"
          }`}
        >
          <Text className={`text-lg font-semibold font-sans ${mode === "เพื่อน" ? "text-[#3262AB]" : "text-gray-800"}`}>
            กลุ่มเพื่อน
          </Text>
          <Text className="text-sm font-medium font-sans text-gray-500 mt-1">
            สนุกไปกับแก๊งเพื่อน วางแผนทริปให้ตรงสไตล์ของทุกคน
          </Text>
          {mode === "เพื่อน" && (
            <View className="flex-row items-center justify-end mt-3">
              <TouchableOpacity
                onPress={() => setFriendCount(Math.max(friendCount - 1, 1))}
                className="p-2"
              >
                <Ionicons name="remove-circle-outline" size={24} color={friendCount > 1 ? "#333" : "#ccc"} />
              </TouchableOpacity>
              <Text className="mx-4 text-lg font-semibold font-sans text-gray-900">{friendCount}</Text>
              <TouchableOpacity
                onPress={() => setFriendCount(friendCount + 1)}
                className="p-2"
              >
                <Ionicons name="add-circle-outline" size={24} color="#333" />
              </TouchableOpacity>
              <Text className="ml-2 text-base font-sans">คน</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-5 pb-6 bg-white">
        <TouchableOpacity
          onPress={onNext}
          disabled={!mode}
          className="w-full py-4 rounded-2xl bg-orange-500"
        >
          <Text className="text-white text-center text-lg font-semibold font-sans">ถัดไป</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
