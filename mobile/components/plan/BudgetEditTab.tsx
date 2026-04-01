import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  plan: any;
  setPlan: React.Dispatch<React.SetStateAction<any>>;
};

const categories = [
  {
    key: "transportation",
    label: "การเดินทาง",
    icon: "navigate-circle-outline",
  },
  {
    key: "accommodation",
    label: "ที่พัก",
    icon: "bed-outline",
  },
  {
    key: "food",
    label: "อาหารและเครื่องดื่ม",
    icon: "restaurant-outline",
  },
  {
    key: "others",
    label: "อื่น ๆ",
    icon: "add-circle-outline",
  },
] as const;

const formatTHB = (amount: number) => {
  const safe = Number(amount || 0);
  return `฿${safe.toLocaleString("th-TH")}`;
};

const toNumber = (value: any) => {
  if (value === null || value === undefined || value === "") return 0;
  const cleaned = String(value).replace(/[^0-9]/g, "");
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export default function BudgetEditTab({ plan, setPlan }: Props) {
  const [activeDay, setActiveDay] = useState(0);

  const dailyBudget = useMemo(() => {
    return plan?.daily_budget || [];
  }, [plan]);

  const totalBreakdown = useMemo(() => {
    return (
      plan?.total_expense_breakdown || {
        transportation: 0,
        accommodation: 0,
        food: 0,
        others: 0,
        total: 0,
      }
    );
  }, [plan]);

  const updateBudgetField = (
    dayIndex: number,
    field: string,
    rawValue: string
  ) => {
    const value = toNumber(rawValue);

    setPlan((prev: any) => {
      if (!prev) return prev;

      const nextDaily = [...(prev.daily_budget || [])];

      while (nextDaily.length < (prev.daily_itinerary?.length || 0)) {
        nextDaily.push({
          date:
            prev.daily_itinerary?.[nextDaily.length]?.date ||
            prev.start_date ||
            "",
          transportation: 0,
          accommodation: 0,
          food: 0,
          others: 0,
          total: 0,
        });
      }

      const currentDay = {
        transportation: 0,
        accommodation: 0,
        food: 0,
        others: 0,
        total: 0,
        ...(nextDaily[dayIndex] || {}),
      };

      currentDay[field] = value;
      currentDay.total =
        toNumber(currentDay.transportation) +
        toNumber(currentDay.accommodation) +
        toNumber(currentDay.food) +
        toNumber(currentDay.others);

      nextDaily[dayIndex] = currentDay;

      const nextBreakdown = {
        transportation: 0,
        accommodation: 0,
        food: 0,
        others: 0,
        total: 0,
      };

      nextDaily.forEach((day: any) => {
        nextBreakdown.transportation += toNumber(day.transportation);
        nextBreakdown.accommodation += toNumber(day.accommodation);
        nextBreakdown.food += toNumber(day.food);
        nextBreakdown.others += toNumber(day.others);
      });

      nextBreakdown.total =
        nextBreakdown.transportation +
        nextBreakdown.accommodation +
        nextBreakdown.food +
        nextBreakdown.others;

      return {
        ...prev,
        daily_budget: nextDaily,
        total_expense_breakdown: nextBreakdown,
        total_budget: String(nextBreakdown.total),
      };
    });
  };

  const percentOfTotal = (value: number) => {
    const total = toNumber(totalBreakdown.total);
    if (!total) return 0;
    return Math.min(100, Math.round((toNumber(value) / total) * 100));
  };

  const currentDayBudget = dailyBudget[activeDay] || {
    transportation: 0,
    accommodation: 0,
    food: 0,
    others: 0,
    total: 0,
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      {/* ===== Section: show budget ===== */}
      <View className="mb-6">

        <View className="rounded-3xl border border-orange-100 bg-orange-50 px-5 py-5">
          <Text className="font-semibold text-xl text-orange-600">
            งบประมาณรวมทั้งทริป
          </Text>
          <Text className="mt-2 text-3xl font-semibold text-orange-500">
            {formatTHB(totalBreakdown.total)}
          </Text>
        </View>
      </View>

      <View className="mb-6 rounded-3xl border border-gray-200 bg-white p-4">
        <View className="mb-4">
          <Text className="font-sans text-sm text-gray-400">รายละเอียด</Text>
          <Text className="mt-1 text-xl font-semibold text-gray-900">
            สัดส่วนงบประมาณทั้งทริป
          </Text>
        </View>

        {categories.map((cat, idx) => {
          const value = toNumber(totalBreakdown[cat.key]);
          const percent = percentOfTotal(value);

          return (
            <View
              key={cat.key}
              className={`${idx !== categories.length - 1 ? "mb-5" : ""}`}
            >
              <View className="mb-2 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <Ionicons name={cat.icon as any} size={26} color="#4b5563" />
                  </View>
                  <View className="ml-3">
                    <Text className="font-medium text-lg text-gray-900">
                      {cat.label}
                    </Text>
                  </View>
                </View>

                <Text className="text-lg font-medium text-gray-900">
                  {formatTHB(value)}
                </Text>
              </View>

              <View className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <View
                  className="h-2.5 rounded-full bg-orange-500"
                  style={{ width: `${percent}%` }}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* ===== Section: edit budget ===== */}
      <View className="mb-6">
        <View className="mb-3 px-1 items-center">
          <Text className="mt-1 text-lg font-semibold text-gray-900">
            แก้ไขงบประมาณรายวัน
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 8,
            minWidth: "100%",
          }}
        >
          {(plan?.daily_itinerary || []).map((_: any, idx: number) => {
            const isActive = activeDay === idx;

            return (
              <Pressable
                key={idx}
                onPress={() => setActiveDay(idx)}
                className={`mx-1 rounded-full border px-5 py-2 ${
                  isActive
                    ? "border-sky-700 bg-sky-700"
                    : "border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={`font-medium ${
                    isActive ? "text-white" : "text-gray-700"
                  }`}
                >
                  วันที่ {idx + 1}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View className="rounded-3xl border border-gray-200 bg-white p-4">
        <View className="mb-5 flex-row items-center justify-between">
          <View>
            <Text className="font-sans text-sm text-gray-400">
              วันที่เลือกอยู่
            </Text>
            <Text className="mt-1 text-xl font-semibold text-gray-900">
              วันที่ {activeDay + 1}
            </Text>
          </View>

          <View className="items-end">
            <Text className="font-sans text-sm text-gray-400">รวมของวัน</Text>
            <Text className="mt-1 text-xl font-semibold text-sky-700">
              {formatTHB(currentDayBudget.total)}
            </Text>
          </View>
        </View>

        {categories.map((cat, idx) => (
          <View
            key={cat.key}
            className={`${idx !== categories.length - 1 ? "mb-4" : ""}`}
          >
            <View className="mb-2 flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <Ionicons name={cat.icon as any} size={26} color="#4b5563" />
              </View>
              <Text className="ml-3 text-lg font-medium text-gray-800">
                {cat.label}
              </Text>
            </View>

            <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-4">
              <TextInput
                value={String(toNumber(currentDayBudget?.[cat.key] || 0))}
                onChangeText={(text) =>
                  updateBudgetField(activeDay, cat.key, text)
                }
                keyboardType="numeric"
                placeholder="0"
                className="flex-1 py-3 text-lg font-medium text-gray-900"
                placeholderTextColor="#9ca3af"
              />
              <Text className="ml-3 font-sans text-gray-400">บาท</Text>
            </View>
          </View>
        ))}

      </View>
    </ScrollView>
  );
}