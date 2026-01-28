import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { usePlan } from "../../../context/PlanContext";
import { FontAwesome5, MaterialIcons, Entypo } from "@expo/vector-icons";

export default function BudgetScreen() {
  const router = useRouter();
  const { province } = useLocalSearchParams<{ province?: string }>();
  const { plan, setPlan } = usePlan();

  const [budgetType, setBudgetType] = useState<string>(plan.budgetType || "");
  const [amounts, setAmounts] = useState<{ [key: string]: string }>({
    ประหยัด: plan.budgetType === "ประหยัด" ? String(plan.budgetAmount) : "",
    สมดุล: plan.budgetType === "สมดุล" ? String(plan.budgetAmount) : "",
    หรูหรา: plan.budgetType === "หรูหรา" ? String(plan.budgetAmount) : "",
    ยืดหยุ่น: plan.budgetType === "ยืดหยุ่น" ? String(plan.budgetAmount) : "",
  });

  useEffect(() => {
    if (plan.budgetType) {
      setBudgetType(plan.budgetType);
    }
    if (plan.budgetAmount) {
      setAmounts((prev) => ({
        ...prev,
        [plan.budgetType]: String(plan.budgetAmount),
      }));
    }
  }, []);

  const onNext = () => {
    setPlan((prev) => ({
      ...prev,
      budgetType,
      budgetAmount: Number(amounts[budgetType]) || 0,
    }));
    router.push({
      pathname: "/plan/summary",
      params: { province },
    });
  };

  const budgetOptions = [
    {
      label: "ประหยัด",
      icon: <FontAwesome5 name="piggy-bank" size={20} color="#3262AB" />,
      description: "เดินทางแบบคุ้มค่า ประหยัดงบ",
    },
    {
      label: "สมดุล",
      icon: <MaterialIcons name="balance" size={22} color="#3262AB" />,
      description: "ปรับงบให้พอดี ไม่มากไม่น้อยเกินไป",
    },
    {
      label: "หรูหรา",
      icon: <FontAwesome5 name="crown" size={20} color="#3262AB" />,
      description: "ใช้งบแบบจัดเต็ม พร้อมประสบการณ์คุณภาพสูง",
    },
    {
      label: "ยืดหยุ่น",
      icon: <Entypo name="adjust" size={22} color="#3262AB" />,
      description: "จัดการงบเองได้ตามต้องการ ไม่จำกัดงบ",
    },
  ];

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} className="px-5 pt-4">
        <Text className="text-gray-500 text-base font-sans font-medium">
          STEP 5
        </Text>
        <Text className="text-2xl font-semibold text-[#3262AB] mb-6 font-sans">
          กำหนดงบประมาณ
        </Text>

        {budgetOptions.map((opt) => (
          <View
            key={opt.label}
            className={`rounded-2xl border p-4 mb-4 ${
              budgetType === opt.label
                ? "border-[#3262AB] bg-[#eaf1fb]"
                : "border-gray-300"
            }`}
          >
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => setBudgetType(opt.label)}
            >
              <View className="mr-3">{opt.icon}</View>
              <View>
                <Text className="text-lg font-sans font-semibold text-[#3262AB]">
                  {opt.label}
                </Text>
                <Text className="text-sm font-sans text-gray-700 mt-1">
                  {opt.description}
                </Text>
              </View>
            </TouchableOpacity>

            {budgetType === opt.label && (
              <View className="mt-4">
                <Text className="text-gray-700 font-sans mb-1">
                  ระบุจำนวนเงิน
                </Text>
                <TextInput
                  value={amounts[opt.label]}
                  onChangeText={(value) =>
                    setAmounts((prev) => ({ ...prev, [opt.label]: value }))
                  }
                  keyboardType="numeric"
                  placeholder="เช่น 10000"
                  className="border rounded-xl p-3 font-sans bg-white"
                />
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View className="absolute bottom-4 left-4 right-4">
        <TouchableOpacity
          onPress={onNext}
          disabled={!budgetType || !amounts[budgetType]}
          className={`py-4 rounded-xl ${
            budgetType && amounts[budgetType]
              ? "bg-orange-500"
              : "bg-gray-300"
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
