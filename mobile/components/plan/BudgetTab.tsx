import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function BudgetTab({ plan }: { plan: any }) {
  const [activeDay, setActiveDay] = useState(0);
  const animatedWidths = useRef(
    plan ? plan.total_expense_breakdown &&
      Object.keys(plan.total_expense_breakdown).map(() => new Animated.Value(0)) : []
  ).current;

  const categories = [
    { key: "transportation", label: "การเดินทาง", icon: "navigate-circle-outline" },
    { key: "accommodation", label: "โรงแรมที่พัก", icon: "bed-outline" },
    { key: "food", label: "อาหารและเครื่องดื่ม", icon: "restaurant-outline" },
    { key: "others", label: "อื่นๆ", icon: "add-outline" },
  ];

  const formatTHB = (amount: number) => `฿${amount.toLocaleString()}`;

  useEffect(() => {
    if (!plan?.total_expense_breakdown?.total) return;

    categories.forEach((cat, i) => {
      const value = plan.total_expense_breakdown[cat.key];
      const percent = (value / plan.total_expense_breakdown.total) * 100;
      Animated.timing(animatedWidths[i], {
        toValue: percent,
        duration: 600,
        useNativeDriver: false,
      }).start();
    });
  }, [plan]);

  return (
    <View className="px-8 py-4 space-y-6">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-xl font-semibold mb-1">
          ภาพรวมการใช้งบประมาณทั้งทริป
        </Text>
        <Text className="text-3xl font-medium">
          {formatTHB(plan.total_expense_breakdown.total)}
        </Text>
      </View>

      {/* Budget bars */}
      <View className="space-y-5">
        {categories.map((cat, i) => (
          <View key={cat.key} className="space-y-1">
            <View className="flex-row justify-between items-center py-2">
              <View className="flex-row items-center space-x-2">
                <Ionicons name={cat.icon as any} size={24} color="#6b7280" />
                <Text className="text-gray-800 text-lg ml-1 font-medium">{cat.label}</Text>
              </View>
              <Text className="text-lg font-medium text-gray-700">
                {formatTHB(plan.total_expense_breakdown[cat.key])}
              </Text>
            </View>

            <View className="h-6 bg-gray-200 rounded-full overflow-hidden">
              <Animated.View
                style={{
                  width: animatedWidths[i].interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                  height: 21,
                  borderRadius: 999,
                  backgroundColor: "#f97316",
                }}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Daily budget toggle */}
      <View className="flex-row justify-center space-x-2 mt-6">
        {plan.daily_budget?.map((_: any, idx: number) => (
          <TouchableOpacity
            key={idx}
            onPress={() => setActiveDay(idx)}
            className={`px-4 py-1.5 rounded-full border ${
              activeDay === idx ? "bg-white border-blue-600" : "bg-white border-gray-200"
            }`}
          >
            <Text
              className={`font-semibold text-sm ${
                activeDay === idx ? "text-blue-600" : "text-black"
              }`}
            >
              วันที่ {idx + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Daily breakdown */}
      <View className="rounded-xl border border-gray-200 px-4 py-3 space-y-1 bg-white mt-2">
        {categories.map((cat) => (
          <View key={cat.key} className="flex-row justify-between">
            <View className="flex-row items-center space-x-2">
              <Ionicons name={cat.icon as any} size={24} color="#6b7280" />
              <Text className="font-medium ml-4 text-gray-700">{cat.label}</Text>
            </View>
            <Text className="font-medium text-gray-900">
              {formatTHB(plan.daily_budget[activeDay][cat.key])}
            </Text>
          </View>
        ))}
        <View className="border-t border-gray-100 mt-2 pt-2">
          <Text className="text-right text-lg font-medium">
            วันที่ {activeDay + 1} รวมทั้งหมด{" "}
            {formatTHB(plan.daily_budget[activeDay].total)}
          </Text>
        </View>
      </View>
    </View>
  );
}
