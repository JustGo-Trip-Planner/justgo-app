import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ScrollView,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  plan: any;
};

export default function BudgetTab({ plan }: Props) {
  const [activeDay, setActiveDay] = useState(0);

  const categories = [
    {
      key: "transportation",
      label: "การเดินทาง",
      icon: "navigate-circle-outline",
    },
    {
      key: "accommodation",
      label: "โรงแรมที่พัก",
      icon: "bed-outline",
    },
    {
      key: "food",
      label: "อาหารและเครื่องดื่ม",
      icon: "restaurant-outline",
    },
    {
      key: "others",
      label: "อื่นๆ",
      icon: "add-circle-outline",
    },
  ];

  const animatedWidths = useRef(
    categories.map(() => new Animated.Value(0))
  ).current;

  const dailyBudget = plan?.daily_budget || [];
  const totalBreakdown = dailyBudget.reduce(
    (acc: any, day: any) => {
      acc.transportation += Number(day?.transportation || 0);
      acc.accommodation += Number(day?.accommodation || 0);
      acc.food += Number(day?.food || 0);
      acc.others += Number(day?.others || 0);
      acc.total =
        acc.transportation + acc.accommodation + acc.food + acc.others;
      return acc;
    },
    {
      transportation: 0,
      accommodation: 0,
      food: 0,
      others: 0,
      total: 0,
    }
  );

  const currentDay = dailyBudget?.[activeDay] || {
    transportation: 0,
    accommodation: 0,
    food: 0,
    others: 0,
    total: 0,
  };

  const formatTHB = (amount: number) =>
    `฿${Number(amount || 0).toLocaleString("th-TH")}`;

  useEffect(() => {
    const total = Number(totalBreakdown?.total || 0);
    if (!total) {
      animatedWidths.forEach((anim) => anim.setValue(0));
      return;
    }

    categories.forEach((cat, i) => {
      const value = Number(totalBreakdown?.[cat.key] || 0);
      const percent = (value / total) * 100;

      Animated.timing(animatedWidths[i], {
        toValue: percent,
        duration: 650,
        useNativeDriver: false,
      }).start();
    });
  }, [plan]);

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 80,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Summary */}
      <View className="overflow-hidden rounded-3xl border border-gray-200 bg-white px-5 py-5 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-sans text-gray-500">
              ภาพรวมการใช้งบประมาณทั้งทริป
            </Text>
            <Text className="mt-2 text-3xl font-semibold text-gray-900">
              {formatTHB(totalBreakdown?.total || 0)}
            </Text>
          </View>

          <View className="h-14 w-14 items-center justify-center rounded-full border border-sky-100 bg-sky-50/70">
            <Ionicons name="wallet" size={26} color="#0369A1" />
          </View>
        </View>
      </View>

      {/* Bars */}
      <View className="mt-5 rounded-3xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
        <Text className="mb-4 text-lg font-semibold text-gray-900">
          สัดส่วนค่าใช้จ่ายทั้งทริป
        </Text>

        {categories.map((cat, i) => (
          <View key={cat.key} className="mb-4 last:mb-0">
            <View className="mb-2 flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center pr-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-100/80">
                  <Ionicons name={cat.icon as any} size={24} color="#4B5563" />
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-lg font-medium text-gray-800">
                    {cat.label}
                  </Text>
                </View>
              </View>

              <Text className="text-lg font-semibold text-gray-900">
                {formatTHB(totalBreakdown?.[cat.key] || 0)}
              </Text>
            </View>

            <View className="mb-2 h-3 overflow-hidden rounded-full bg-gray-200/80">
              <Animated.View
                style={{
                  width: animatedWidths[i].interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                  height: "100%",
                  backgroundColor: "#f97316",
                  borderRadius: 999,
                  opacity: 0.95,
                }}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Day Tabs */}
      {!!dailyBudget.length && (
        <View className="mt-5">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 2,
              flexGrow: 1,
              justifyContent: "center",
            }}
          >
            {dailyBudget.map((_: any, idx: number) => {
              const active = activeDay === idx;

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setActiveDay(idx)}
                  className={`mr-2 rounded-full border px-4 py-2 ${
                    active
                      ? "border-sky-700 bg-sky-700"
                      : "border-gray-200 bg-gray-50/70"
                  }`}
                >
                  <Text
                    className={`text-base ${
                      active
                        ? "font-semibold text-white"
                        : "font-medium text-gray-700"
                    }`}
                  >
                    วันที่ {idx + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Daily Breakdown */}
      <View className="mt-5 rounded-3xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-gray-900">
            งบประมาณรายวัน
          </Text>
          <View className="rounded-full border border-sky-100 bg-sky-50/70 px-3 py-1.5">
            <Text className="text-sm font-medium text-sky-700">
              วันที่ {activeDay + 1}
            </Text>
          </View>
        </View>

        {categories.map((cat) => (
          <View
            key={cat.key}
            className="mb-3 flex-row items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/75 px-4 py-3"
          >
            <View className="flex-row items-center">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-white/95">
                <Ionicons name={cat.icon as any} size={24} color="#4B5563" />
              </View>
              <Text className="ml-3 text-lg font-medium text-gray-700">
                {cat.label}
              </Text>
            </View>

            <Text className="text-lg font-semibold text-gray-900">
              {formatTHB(currentDay?.[cat.key] || 0)}
            </Text>
          </View>
        ))}

        <View className="mt-2 rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-4">
          <Text className="text-sm font-sans text-orange-600">รวมของวัน</Text>
          <Text className="mt-1 text-xl font-semibold text-orange-700">
            {formatTHB(currentDay?.total || 0)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
